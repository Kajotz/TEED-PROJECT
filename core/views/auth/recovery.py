import logging
import re

from django.conf import settings
from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from core.models import BackupRecoveryCode, RecoveryChallenge, RecoveryMethod
from core.services.account_state import ensure_account_baseline, get_post_auth_state
from core.utils.email_service import EmailService
from rest_framework import serializers
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken

from core.serializers.auth.recovery import (
    RecoveryMethodSerializer,
    AddRecoveryMethodSerializer,
    VerifyRecoveryMethodSerializer,
    SetDefaultRecoveryMethodSerializer,
    RecoveryLookupSerializer,
    InitiateAccountRecoverySerializer,
    VerifyAccountRecoverySerializer,
    CompleteAccountRecoverySerializer,
)
from core.services.recovery import (
    get_available_recovery_methods,
)

logger = logging.getLogger(__name__)
User = get_user_model()


def normalize_email(value):
    return (value or "").strip().lower()


def normalize_phone(value):
    return re.sub(r"\D", "", value or "")


def get_user_from_identity(email=None, mobile=None):
    email = normalize_email(email)
    mobile = normalize_phone(mobile)

    if email:
        user = User.objects.filter(email=email).first()
        if user:
            return user, RecoveryMethod.METHOD_EMAIL, email

    if mobile:
        method = (
            RecoveryMethod.objects.filter(
                method_type=RecoveryMethod.METHOD_PHONE,
                normalized_value=mobile,
                is_verified=True,
                is_active=True,
                user__is_active=True,
            )
            .select_related("user")
            .first()
        )
        if method:
            return method.user, RecoveryMethod.METHOD_PHONE, mobile

    return None, None, None


class RecoveryCodeLoginView(APIView):
    """
    Backup code login + password reset.
    Replaces old RecoveryCodeLoginSerializer flow.
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

        recovery = (
            BackupRecoveryCode.objects.filter(
                code_hash=BackupRecoveryCode.hash_code(recovery_code),
                is_used=False,
            )
            .select_related("user")
            .first()
        )

        if not recovery:
            return Response(
                {"error": "Invalid recovery code."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user = recovery.user
        ensure_account_baseline(user)

        recovery.is_used = True
        recovery.used_at = timezone.now()
        recovery.save(update_fields=["is_used", "used_at"])

        user.set_password(new_password)
        user.save()

        refresh = RefreshToken.for_user(user)

        return Response(
            {
                "access": str(refresh.access_token),
                "refresh": str(refresh),
                "user_id": str(user.id),
                "message": "Account recovered successfully. Password has been updated.",
                "post_auth": get_post_auth_state(user),
            },
            status=status.HTTP_200_OK,
        )


class PasswordRecoveryInitiateView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        email = normalize_email(request.data.get("email"))
        mobile = normalize_phone(request.data.get("mobile"))

        if not email and not mobile:
            return Response(
                {"error": "Email or mobile number is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user, channel, target_value = get_user_from_identity(email=email, mobile=mobile)

        if not user:
            return Response(
                {
                    "message": "If an account with this email/mobile exists, recovery instructions have been sent."
                },
                status=status.HTTP_200_OK,
            )

        ensure_account_baseline(user)

        recent_count = RecoveryChallenge.objects.filter(
            user=user,
            purpose=RecoveryChallenge.PURPOSE_ACCOUNT_RECOVERY,
            created_at__gte=timezone.now() - timezone.timedelta(hours=24),
        ).count()

        if recent_count >= 5:
            return Response(
                {"error": "Too many recovery attempts. Please try again in 24 hours."},
                status=status.HTTP_429_TOO_MANY_REQUESTS,
            )

        try:
            challenge = RecoveryChallenge.create_challenge(
                user=user,
                purpose=RecoveryChallenge.PURPOSE_ACCOUNT_RECOVERY,
                channel=channel,
                target_value=target_value,
                target_display=target_value,
            )

            response_data = {
                "message": "Recovery code generated successfully.",
                "expires_in_minutes": 15,
                "recovery_method": channel,
            }

            if channel == RecoveryMethod.METHOD_EMAIL:
                success = EmailService.send_password_reset_code(
                    user.email,
                    challenge.plaintext_code,
                    user.username,
                )
                if not success:
                    return Response(
                        {"error": "Failed to send recovery email. Please try again."},
                        status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    )
            else:
                if settings.DEBUG:
                    response_data["dev_code"] = challenge.plaintext_code
                else:
                    return Response(
                        {"error": "Phone recovery provider is not configured yet."},
                        status=status.HTTP_501_NOT_IMPLEMENTED,
                    )

            return Response(response_data, status=status.HTTP_200_OK)

        except Exception as e:
            logger.error("Password recovery initiation error: %s", str(e))
            return Response(
                {"error": "An error occurred. Please try again."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class PasswordRecoveryVerifyIdentityView(APIView):
    """
    Universal identity check for password recovery.

    Accepts:
    - email + mobile
    OR
    - email + recovery_email
    """

    permission_classes = [permissions.AllowAny]

    def post(self, request):
        email = normalize_email(request.data.get("email"))
        mobile = normalize_phone(request.data.get("mobile"))
        recovery_email = normalize_email(request.data.get("recovery_email"))

        if not email:
            return Response(
                {"error": "Email is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not mobile and not recovery_email:
            return Response(
                {"error": "Provide mobile or recovery_email."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user = User.objects.filter(email=email).first()
        if not user:
            return Response(
                {"error": "User not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        ensure_account_baseline(user)

        verified = False

        if mobile:
            verified = RecoveryMethod.objects.filter(
                user=user,
                method_type=RecoveryMethod.METHOD_PHONE,
                normalized_value=mobile,
                is_verified=True,
                is_active=True,
            ).exists()

        if not verified and recovery_email:
            verified = RecoveryMethod.objects.filter(
                user=user,
                method_type=RecoveryMethod.METHOD_EMAIL,
                normalized_value=recovery_email,
                is_verified=True,
                is_active=True,
            ).exists()

        if not verified:
            return Response(
                {"error": "Verification information does not match. Please try again."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response(
            {
                "message": "Identity verified successfully.",
                "can_proceed": True,
            },
            status=status.HTTP_200_OK,
        )


class PasswordRecoveryResetView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        email = normalize_email(request.data.get("email"))
        mobile = normalize_phone(request.data.get("mobile"))
        code = (request.data.get("code") or "").strip()
        new_password = request.data.get("new_password") or ""

        if not code or not new_password:
            return Response(
                {"error": "Recovery code and new password are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if len(new_password) < 8:
            return Response(
                {"error": "Password must be at least 8 characters long."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user, channel, target_value = get_user_from_identity(email=email, mobile=mobile)

        if not user:
            return Response(
                {"error": "User not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        challenge = (
            RecoveryChallenge.objects.filter(
                user=user,
                purpose=RecoveryChallenge.PURPOSE_ACCOUNT_RECOVERY,
                channel=channel,
                target_value=target_value,
                status=RecoveryChallenge.STATUS_PENDING,
            )
            .order_by("-created_at")
            .first()
        )

        if not challenge:
            return Response(
                {"error": "No active recovery challenge found. Request a new code."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        challenge.mark_expired_if_needed()

        if challenge.status != RecoveryChallenge.STATUS_PENDING:
            return Response(
                {"error": "Recovery code is no longer active. Request a new one."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if challenge.is_expired():
            challenge.status = RecoveryChallenge.STATUS_EXPIRED
            challenge.save(update_fields=["status"])
            return Response(
                {"error": "Recovery code has expired. Please request a new one."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if challenge.attempts >= challenge.max_attempts:
            return Response(
                {"error": "Too many failed attempts. Please request a new code."},
                status=status.HTTP_429_TOO_MANY_REQUESTS,
            )

        if not challenge.verify_code(code):
            challenge.attempts += 1
            challenge.save(update_fields=["attempts"])
            return Response(
                {"error": "Invalid recovery code."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user.set_password(new_password)
        user.save()
        ensure_account_baseline(user)

        now = timezone.now()
        challenge.verified_at = now
        challenge.completed_at = now
        challenge.status = RecoveryChallenge.STATUS_COMPLETED
        challenge.save(update_fields=["verified_at", "completed_at", "status"])

        refresh = RefreshToken.for_user(user)

        recovery_methods = RecoveryMethod.objects.filter(
            user=user,
            is_verified=True,
            is_active=True,
        )

        method_summary = {
            "emails": list(
                recovery_methods.filter(
                    method_type=RecoveryMethod.METHOD_EMAIL
                ).values_list("normalized_value", flat=True)
            ),
            "mobiles": list(
                recovery_methods.filter(
                    method_type=RecoveryMethod.METHOD_PHONE
                ).values_list("normalized_value", flat=True)
            ),
        }

        return Response(
            {
                "message": "Password reset successfully. You can now login with your new password.",
                "access": str(refresh.access_token),
                "refresh": str(refresh),
                "recovery_methods": method_summary,
                "post_auth": get_post_auth_state(user),
            },
            status=status.HTTP_200_OK,
        )


class RecoveryMethodListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        methods = get_available_recovery_methods(request.user)
        serializer = RecoveryMethodSerializer(methods, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class AddRecoveryMethodView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = AddRecoveryMethodSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        result = serializer.save()
        method = result.get("recovery_method")
        challenge = result.get("challenge")
        return Response({"recovery_method": RecoveryMethodSerializer(method).data, "challenge_id": str(challenge.id)}, status=status.HTTP_201_CREATED)


class VerifyRecoveryMethodView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = VerifyRecoveryMethodSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        recovery_method = serializer.save()
        return Response(RecoveryMethodSerializer(recovery_method).data, status=status.HTTP_200_OK)


class SetDefaultRecoveryMethodView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = SetDefaultRecoveryMethodSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        recovery_method = serializer.save()
        return Response(RecoveryMethodSerializer(recovery_method).data, status=status.HTTP_200_OK)


class DeactivateRecoveryMethodView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, method_id=None):
        method = RecoveryMethod.objects.filter(id=method_id, user=request.user, is_active=True).first()
        if not method:
            return Response({"error": "Recovery method not found."}, status=status.HTTP_404_NOT_FOUND)
        method.is_active = False
        if method.is_default:
            method.is_default = False
        method.save(update_fields=["is_active", "is_default"]) if method.is_default else method.save(update_fields=["is_active"])
        return Response({"message": "Recovery method deactivated."}, status=status.HTTP_200_OK)


class RecoveryLookupView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = RecoveryLookupSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        options = serializer.get_recovery_options()
        return Response({"options": options}, status=status.HTTP_200_OK)


class InitiateAccountRecoveryView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = InitiateAccountRecoverySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        result = serializer.save()
        user = result.get("user")
        challenge = result.get("challenge")
        data = {"challenge_id": str(challenge.id)}
        if settings.DEBUG:
            data["dev_code"] = getattr(challenge, "plaintext_code", None)
        return Response(data, status=status.HTTP_200_OK)


class VerifyAccountRecoveryView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = VerifyAccountRecoverySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        challenge = serializer.save()
        return Response({"challenge_id": str(challenge.id)}, status=status.HTTP_200_OK)


class CompleteAccountRecoveryView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = CompleteAccountRecoverySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        ensure_account_baseline(user)
        refresh = RefreshToken.for_user(user)
        return Response({
            "access": str(refresh.access_token),
            "refresh": str(refresh),
            "user_id": str(user.id),
            "post_auth": get_post_auth_state(user),
        }, status=status.HTTP_200_OK)