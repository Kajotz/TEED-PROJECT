import logging

from django.conf import settings
from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from core.models import BackupRecoveryCode, EmailVerification
from core.services.account_state import ensure_account_baseline, get_post_auth_state
from core.utils.email_service import EmailService

logger = logging.getLogger(__name__)
User = get_user_model()


def normalize_email(value):
    return (value or "").strip().lower()


def build_unique_username_from_email(email):
    base = email.split("@")[0].strip() or "user"
    candidate = base
    counter = 1

    while User.objects.filter(username=candidate).exists():
        counter += 1
        candidate = f"{base}{counter}"

    return candidate


class CustomRegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        email = normalize_email(request.data.get("email"))
        password1 = request.data.get("password1")
        password2 = request.data.get("password2")
        code = (request.data.get("verification_code") or "").strip()

        if not email or not password1 or not password2:
            return Response(
                {"error": "email, password1 and password2 are required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if password1 != password2:
            return Response(
                {"error": "Passwords do not match"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if len(password1) < 8:
            return Response(
                {"error": "Password must be at least 8 characters long"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if code:
            return self._complete_registration(email, password1, code)

        return self._send_verification_code(email)

    # =========================
    # STEP 1: SEND CODE
    # =========================

    def _send_verification_code(self, email):
        if User.objects.filter(email=email).exists():
            return Response(
                {"error": "Email already registered"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            verification = EmailVerification.create_for_email(email)

            sent = EmailService.send_verification_code(
                email,
                verification.verification_code,
            )

            if not sent:
                return Response(
                    {"error": "Failed to send verification email"},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                )

            return Response(
                {
                    "message": f"Verification code sent to {email}",
                    "email": email,
                    "next_step": "verify_email",
                    "expires_in": settings.EMAIL_VERIFICATION_TIMEOUT * 60,
                    **(
                        {"dev_code": verification.verification_code}
                        if settings.DEBUG
                        else {}
                    ),
                },
                status=status.HTTP_200_OK,
            )

        except Exception as e:
            logger.error("Registration step 1 error: %s", str(e))
            return Response(
                {"error": "Failed to process registration"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    # =========================
    # STEP 2: VERIFY + CREATE USER
    # =========================

    def _complete_registration(self, email, password, code):
        try:
            verification = EmailVerification.get_active_verification(email)

            if not verification:
                return Response(
                    {"error": "No active verification found"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            if verification.is_expired():
                return Response(
                    {"error": "Verification code expired"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            if verification.attempts >= settings.MAX_VERIFICATION_ATTEMPTS:
                return Response(
                    {"error": "Too many failed attempts"},
                    status=status.HTTP_429_TOO_MANY_REQUESTS,
                )

            if verification.verification_code != code:
                verification.increment_attempts()
                return Response(
                    {"error": "Invalid verification code"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # ✅ mark verified
            verification.mark_verified()

            if User.objects.filter(email=email).exists():
                return Response(
                    {"error": "Email already registered"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            username = build_unique_username_from_email(email)

            user = User.objects.create_user(
                email=email,
                username=username,
                password=password,
            )

            _, identity_state = ensure_account_baseline(user)

            identity_state.email_verified = True
            identity_state.email_verified_at = timezone.now()
            identity_state.save(
                update_fields=["email_verified", "email_verified_at", "updated_at"]
            )

            recovery_codes = BackupRecoveryCode.regenerate_for_user(user)
            EmailService.send_recovery_codes(user, recovery_codes)

            refresh = RefreshToken.for_user(user)

            return Response(
                {
                    "message": "Registration successful",
                    "access": str(refresh.access_token),
                    "refresh": str(refresh),
                    "post_auth": get_post_auth_state(user),
                },
                status=status.HTTP_201_CREATED,
            )

        except Exception as e:
            logger.error("Registration step 2 error: %s", str(e))
            return Response(
                {"error": "Failed to complete registration"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )