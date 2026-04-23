import logging
import re

from django.conf import settings
from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from core.models import (
    BackupRecoveryCode,
    EmailVerification,
    RecoveryChallenge,
    RecoveryMethod,
)
from core.services.account_state import ensure_account_baseline, get_post_auth_state
from core.utils.email_service import EmailService

User = get_user_model()
logger = logging.getLogger(__name__)


def normalize_email(value):
    return (value or "").strip().lower()


def normalize_phone(value):
    return re.sub(r"\D", "", value or "")


class EmailVerificationView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        action = request.data.get("action")

        if action == "send":
            return self._send_verification_code(request)
        if action == "verify":
            return self._verify_email(request)

        return Response(
            {"error": 'Invalid action. Use "send" or "verify".'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    def _send_verification_code(self, request):
        email = normalize_email(request.data.get("email"))

        if not email:
            return Response(
                {"error": "Email is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            verification = EmailVerification.create_for_email(email)

            email_sent = EmailService.send_verification_code(
                email,
                verification.verification_code,
            )

            if not email_sent:
                return Response(
                    {"error": "Failed to send verification email. Try again later."},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                )

            response_data = {
                "message": f"Verification code sent to {email}",
                "email": email,
                "expires_in": 24 * 60 * 60,
            }

            if settings.DEBUG:
                response_data["dev_code"] = verification.verification_code

            return Response(response_data, status=status.HTTP_200_OK)

        except Exception as e:
            logger.error("Error sending verification code: %s", str(e))
            return Response(
                {"error": "Failed to process request."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    def _verify_email(self, request):
        email = normalize_email(request.data.get("email"))
        code = (request.data.get("verification_code") or "").strip()

        if not email or not code:
            return Response(
                {"error": "Email and verification_code are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        verification = (
            EmailVerification.objects.filter(
                email=email,
                verification_code=code,
                is_verified=False,
            )
            .order_by("-created_at")
            .first()
        )

        if not verification:
            return Response(
                {"error": "Invalid verification code."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if verification.is_expired():
            return Response(
                {"error": "Verification code has expired. Request a new code."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if verification.attempts >= 5:
            return Response(
                {"error": "Too many failed attempts. Request a new code."},
                status=status.HTTP_429_TOO_MANY_REQUESTS,
            )

        try:
            verification.is_verified = True
            verification.verified_at = timezone.now()
            verification.save(update_fields=["is_verified", "verified_at"])

            user = User.objects.filter(email=email).first()
            if not user:
                return Response(
                    {"error": "No account found for this email."},
                    status=status.HTTP_404_NOT_FOUND,
                )

            _, identity_state = ensure_account_baseline(user)

            if not identity_state.email_verified:
                identity_state.email_verified = True
                identity_state.email_verified_at = timezone.now()
                identity_state.save(
                    update_fields=["email_verified", "email_verified_at", "updated_at"]
                )

            refresh = RefreshToken.for_user(user)

            return Response(
                {
                    "message": "Email verified successfully.",
                    "email": email,
                    "verified_at": verification.verified_at,
                    "access": str(refresh.access_token),
                    "refresh": str(refresh),
                    "post_auth": get_post_auth_state(user),
                },
                status=status.HTTP_200_OK,
            )

        except Exception as e:
            logger.error("Error verifying email: %s", str(e))
            verification.attempts += 1
            verification.save(update_fields=["attempts"])

            return Response(
                {"error": "Failed to verify email."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class AccountRecoveryView(APIView):
    """
    Backup code based account recovery.
    Replaces old AccountRecoveryCode flow.
    """

    permission_classes = [permissions.AllowAny]

    def post(self, request):
        recovery_code = (request.data.get("recovery_code") or "").strip()
        new_password = request.data.get("new_password") or ""

        if not recovery_code or not new_password:
            return Response(
                {"error": "recovery_code and new_password are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if len(new_password) < 8:
            return Response(
                {"error": "Password must be at least 8 characters long."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            code_hash = BackupRecoveryCode.hash_code(recovery_code)

            recovery = BackupRecoveryCode.objects.filter(
                code_hash=code_hash,
                is_used=False,
            ).select_related("user").first()

            if not recovery:
                logger.warning(
                    "Invalid backup recovery code attempt: %s***",
                    recovery_code[:4],
                )
                return Response(
                    {"error": "Invalid recovery code."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            user = recovery.user
            ensure_account_baseline(user)

            user.set_password(new_password)
            user.save()

            recovery.is_used = True
            recovery.used_at = timezone.now()
            recovery.save(update_fields=["is_used", "used_at"])

            EmailService.send_account_recovery_notification(user)

            refresh = RefreshToken.for_user(user)

            logger.info("Backup recovery used for user: %s", user.username)

            return Response(
                {
                    "message": "Account recovered successfully.",
                    "access": str(refresh.access_token),
                    "refresh": str(refresh),
                    "post_auth": get_post_auth_state(user),
                },
                status=status.HTTP_200_OK,
            )

        except Exception as e:
            logger.error("Error during account recovery: %s", str(e))
            return Response(
                {"error": "Failed to recover account."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class RecoveryContactView(APIView):
    """
    Compatibility class name kept to avoid breaking urls/imports.
    Internally this now uses RecoveryMethod + RecoveryChallenge.
    """

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        try:
            methods = RecoveryMethod.objects.filter(
                user=request.user,
                is_active=True,
            ).order_by("-created_at")

            data = [
                {
                    "id": str(method.id),
                    "method_type": method.method_type,
                    "value": method.masked_value,
                    "is_verified": method.is_verified,
                    "is_default": method.is_default,
                    "created_at": method.created_at,
                }
                for method in methods
            ]

            return Response(data, status=status.HTTP_200_OK)

        except Exception as e:
            logger.error("Error fetching recovery methods: %s", str(e))
            return Response(
                {"error": "Failed to fetch recovery methods."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    def post(self, request):
        method_type = (request.data.get("method_type") or request.data.get("contact_type") or "").strip().lower()
        raw_value = (request.data.get("value") or request.data.get("contact_value") or "").strip()

        if method_type not in {RecoveryMethod.METHOD_EMAIL, RecoveryMethod.METHOD_PHONE}:
            return Response(
                {"error": "method_type must be email or phone."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not raw_value:
            return Response(
                {"error": "value is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        normalized_value = (
            normalize_email(raw_value)
            if method_type == RecoveryMethod.METHOD_EMAIL
            else normalize_phone(raw_value)
        )

        if not normalized_value:
            return Response(
                {"error": "Invalid recovery method value."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            method, created = RecoveryMethod.objects.get_or_create(
                user=request.user,
                method_type=method_type,
                normalized_value=normalized_value,
                defaults={
                    "value": raw_value,
                    "is_verified": False,
                    "is_default": False,
                    "is_active": True,
                },
            )

            if not created and method.is_verified:
                return Response(
                    {"error": f"This {method_type} recovery method already exists and is verified."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            if not created:
                method.value = raw_value
                method.is_active = True
                method.save(update_fields=["value", "is_active", "updated_at"])

            challenge = RecoveryChallenge.create_challenge(
                user=request.user,
                purpose=RecoveryChallenge.PURPOSE_ADD_RECOVERY_METHOD,
                channel=method_type,
                target_value=normalized_value,
                target_display=method.masked_value,
                recovery_method=method,
            )

            response_data = {
                "message": f"Verification code sent to {method_type}.",
                "id": str(method.id),
                "method_type": method_type,
                "requires_verification": True,
            }

            if method_type == RecoveryMethod.METHOD_EMAIL:
                email_sent = EmailService.send_verification_code(
                    normalized_value,
                    challenge.plaintext_code,
                )
                if not email_sent:
                    return Response(
                        {"error": "Failed to send verification email."},
                        status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    )
            else:
                if settings.DEBUG:
                    response_data["dev_code"] = challenge.plaintext_code
                else:
                    return Response(
                        {"error": "Phone verification provider is not configured yet."},
                        status=status.HTTP_501_NOT_IMPLEMENTED,
                    )

            return Response(response_data, status=status.HTTP_201_CREATED)

        except Exception as e:
            logger.error("Error adding recovery method: %s", str(e))
            return Response(
                {"error": "Failed to add recovery method."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    def patch(self, request, contact_id=None):
        action = request.data.get("action")

        if action == "verify":
            return self._verify_method(request, contact_id)
        if action == "set_primary":
            return self._set_primary(request, contact_id)

        return Response(
            {"error": "Invalid action."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    def _verify_method(self, request, contact_id):
        code = (request.data.get("code") or "").strip()
        if not code:
            return Response(
                {"error": "Verification code is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            method = RecoveryMethod.objects.get(id=contact_id, user=request.user, is_active=True)

            if method.is_verified:
                return Response(
                    {"error": "Recovery method already verified."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            challenge = (
                RecoveryChallenge.objects.filter(
                    user=request.user,
                    recovery_method=method,
                    purpose=RecoveryChallenge.PURPOSE_ADD_RECOVERY_METHOD,
                )
                .order_by("-created_at")
                .first()
            )

            if not challenge:
                return Response(
                    {"error": "No verification challenge found for this method."},
                    status=status.HTTP_404_NOT_FOUND,
                )

            challenge.mark_expired_if_needed()

            if challenge.status != RecoveryChallenge.STATUS_PENDING:
                return Response(
                    {"error": "Verification challenge is no longer active."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            if challenge.is_expired():
                challenge.status = RecoveryChallenge.STATUS_EXPIRED
                challenge.save(update_fields=["status"])
                return Response(
                    {"error": "Verification code has expired. Request a new one."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            if challenge.attempts >= challenge.max_attempts:
                return Response(
                    {"error": "Too many failed attempts."},
                    status=status.HTTP_429_TOO_MANY_REQUESTS,
                )

            if not challenge.verify_code(code):
                challenge.attempts += 1
                challenge.save(update_fields=["attempts"])
                return Response(
                    {"error": "Invalid verification code."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            now = timezone.now()

            challenge.status = RecoveryChallenge.STATUS_VERIFIED
            challenge.verified_at = now
            challenge.completed_at = now
            challenge.status = RecoveryChallenge.STATUS_COMPLETED
            challenge.save(
                update_fields=["status", "verified_at", "completed_at"]
            )

            method.is_verified = True
            method.verified_at = now
            method.save(update_fields=["is_verified", "verified_at", "updated_at"])

            return Response(
                {"message": "Recovery method verified successfully."},
                status=status.HTTP_200_OK,
            )

        except RecoveryMethod.DoesNotExist:
            return Response(
                {"error": "Recovery method not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

    def _set_primary(self, request, contact_id):
        try:
            method = RecoveryMethod.objects.get(id=contact_id, user=request.user, is_active=True)

            if not method.is_verified:
                return Response(
                    {"error": "Recovery method must be verified first."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            RecoveryMethod.objects.filter(
                user=request.user,
                is_default=True,
            ).update(is_default=False)

            method.is_default = True
            method.save(update_fields=["is_default", "updated_at"])

            return Response(
                {"message": "Default recovery method updated."},
                status=status.HTTP_200_OK,
            )

        except RecoveryMethod.DoesNotExist:
            return Response(
                {"error": "Recovery method not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

    def delete(self, request, contact_id=None):
        try:
            method = RecoveryMethod.objects.get(id=contact_id, user=request.user)
            method.is_active = False
            method.is_default = False
            method.save(update_fields=["is_active", "is_default", "updated_at"])

            return Response(
                {"message": "Recovery method removed."},
                status=status.HTTP_200_OK,
            )

        except RecoveryMethod.DoesNotExist:
            return Response(
                {"error": "Recovery method not found."},
                status=status.HTTP_404_NOT_FOUND,
            )


class DebugVerificationView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        if not settings.DEBUG:
            return Response(
                {"error": "This endpoint is only available in development"},
                status=status.HTTP_403_FORBIDDEN,
            )

        email = normalize_email(request.query_params.get("email"))
        if not email:
            return Response(
                {"error": "Please provide email parameter: ?email=test@example.com"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            verification = (
                EmailVerification.objects
                .filter(email=email)
                .order_by("-created_at")
                .first()
            )

            if not verification:
                return Response(
                    {"error": f"No verification code found for {email}"},
                    status=status.HTTP_404_NOT_FOUND,
                )

            return Response(
                {
                    "email": verification.email,
                    "code": verification.verification_code,
                    "is_verified": verification.is_verified,
                    "is_expired": verification.is_expired(),
                    "created_at": verification.created_at,
                    "expires_at": verification.expires_at,
                    "attempts": verification.attempts,
                },
                status=status.HTTP_200_OK,
            )

        except Exception as e:
            logger.error("Error in debug view: %s", str(e))
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )