import logging
import uuid

import requests
from django.conf import settings
from django.contrib.auth import get_user_model
from django.utils import timezone
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token
from rest_framework import permissions, status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView

from core.serializers.auth.verification import EmailTokenObtainPairSerializer
from core.services.account_state import ensure_account_baseline, get_post_auth_state
from core.services.phone_otp import (
    LOGIN_PREFIX,
    SIGNUP_PREFIX,
    PhoneOTPExpiredError,
    PhoneOTPInvalidError,
    create_otp_session,
    verify_otp_session,
)
from core.utils.phone import parse_phone_identity, normalize_phone_number

logger = logging.getLogger(__name__)
User = get_user_model()


def build_unique_username(base_value: str | None = None) -> str:
    cleaned = (base_value or "").strip().replace(" ", "_")
    cleaned = "".join(ch for ch in cleaned if ch.isalnum() or ch in {"_", "."})
    cleaned = cleaned[:50] if cleaned else ""

    base_username = cleaned or f"user_{uuid.uuid4().hex[:8]}"
    username = base_username
    counter = 1

    while User.objects.filter(username=username).exists():
        username = f"{base_username}{counter}"
        counter += 1

    return username


def social_auth_response(user, created=False, status_code=status.HTTP_200_OK):
    refresh = RefreshToken.for_user(user)
    return Response(
        {
            "access": str(refresh.access_token),
            "refresh": str(refresh),
            "user_id": str(user.id),
            "created": created,
            "post_auth": get_post_auth_state(user),
        },
        status=status_code,
    )


def verify_captcha_or_return_error(captcha: str | None):
    recaptcha_secret = getattr(settings, "RECAPTCHA_SECRET_KEY", None)

    if not recaptcha_secret:
        return None

    if not captcha:
        return Response(
            {"error": "Captcha missing"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        resp = requests.post(
            "https://www.google.com/recaptcha/api/siteverify",
            data={"secret": recaptcha_secret, "response": captcha},
            timeout=5,
        )
        result = resp.json()
    except requests.RequestException:
        return Response(
            {"error": "Captcha verification failed"},
            status=status.HTTP_502_BAD_GATEWAY,
        )

    if not result.get("success") or result.get("score", 0) < 0.3:
        return Response(
            {"error": "Captcha verification failed"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    return None


def get_or_create_phone_user(phone: str):
    user = User.objects.filter(profile__phone_number=phone).first()
    created = False

    if not user:
        created = True
        user = User.objects.create(
            username=build_unique_username(f"user_{uuid.uuid4().hex[:10]}"),
            email=f"{uuid.uuid4().hex[:12]}@phone.local",
        )

    return user, created


def mark_phone_verified(user, phone: str):
    normalized_phone, detected_country = parse_phone_identity(phone)

    profile, identity_state = ensure_account_baseline(user)

    profile_changed = False

    if profile.phone_number != normalized_phone:
        profile.phone_number = normalized_phone
        profile_changed = True

    if profile.phone_country_code != detected_country:
        profile.phone_country_code = detected_country
        profile_changed = True

    # Prefill profile country if not already set
    if not profile.country:
        profile.country = detected_country
        profile_changed = True

    if profile_changed:
        profile.save(
            update_fields=[
                "phone_number",
                "phone_country_code",
                "country",
                "updated_at",
            ]
        )

    if not identity_state.phone_verified:
        identity_state.phone_verified = True
        identity_state.phone_verified_at = timezone.now()
        identity_state.save(
            update_fields=["phone_verified", "phone_verified_at", "updated_at"]
        )


class EmailTokenObtainPairView(TokenObtainPairView):
    serializer_class = EmailTokenObtainPairSerializer


class GoogleAuthView(APIView):
    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    def post(self, request):
        token = request.data.get("token")
        captcha = request.data.get("captcha")

        if not token:
            return Response(
                {"error": "No token provided"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        captcha_error = verify_captcha_or_return_error(captcha)
        if captcha_error:
            return captcha_error

        try:
            idinfo = id_token.verify_oauth2_token(
                token,
                google_requests.Request(),
                settings.GOOGLE_CLIENT_ID,
            )
        except ValueError as e:
            logger.warning("Google token verification error: %s", str(e))
            return Response(
                {"error": "Invalid Google token", "details": str(e)},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if idinfo.get("aud") != settings.GOOGLE_CLIENT_ID:
            return Response(
                {"error": "Token audience mismatch"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        email = idinfo.get("email")
        name = (idinfo.get("name") or "").strip()

        if not email:
            return Response(
                {"error": "No email in token"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user = User.objects.filter(email=email).first()
        created = False

        if not user:
            created = True
            username_seed = email.split("@")[0]
            user = User.objects.create(
                email=email,
                username=build_unique_username(username_seed),
                first_name=name[:150] if name else "",
            )

        _, identity_state = ensure_account_baseline(user)

        if name and not user.first_name:
            user.first_name = name[:150]
            user.save(update_fields=["first_name"])

        if not identity_state.email_verified:
            identity_state.email_verified = True
            identity_state.email_verified_at = timezone.now()
            identity_state.save(
                update_fields=["email_verified", "email_verified_at", "updated_at"]
            )

        return social_auth_response(user, created=created)


class FacebookAuthView(APIView):
    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    GRAPH_ME_URL = "https://graph.facebook.com/me"

    def post(self, request):
        access_token = request.data.get("access_token")
        captcha = request.data.get("captcha")

        if not access_token:
            return Response(
                {"error": "No access token provided"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        captcha_error = verify_captcha_or_return_error(captcha)
        if captcha_error:
            return captcha_error

        try:
            graph_resp = requests.get(
                self.GRAPH_ME_URL,
                params={
                    "fields": "id,name,email",
                    "access_token": access_token,
                },
                timeout=10,
            )
            graph_data = graph_resp.json()
        except requests.RequestException as e:
            logger.error("Facebook Graph request failed: %s", str(e))
            return Response(
                {"error": "Failed to reach Facebook"},
                status=status.HTTP_502_BAD_GATEWAY,
            )

        if not graph_resp.ok or graph_data.get("error"):
            logger.warning("Facebook token verification failed: %s", graph_data)
            return Response(
                {
                    "error": "Invalid Facebook token",
                    "details": graph_data.get("error", {}).get("message", "Facebook auth failed"),
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        facebook_id = str(graph_data.get("id", "")).strip()
        name = (graph_data.get("name") or "").strip()
        email = (graph_data.get("email") or "").strip().lower()

        if not facebook_id:
            return Response(
                {"error": "Facebook user id not returned"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        created = False
        email_is_real = bool(email)

        if email:
            user = User.objects.filter(email=email).first()
            if not user:
                created = True
                username_seed = email.split("@")[0]
                user = User.objects.create(
                    email=email,
                    username=build_unique_username(username_seed),
                    first_name=name[:150] if name else "",
                )
        else:
            placeholder_email = f"facebook_{facebook_id}@facebook.local"
            user = User.objects.filter(email=placeholder_email).first()

            if not user:
                created = True
                username_seed = name or f"facebook_{facebook_id}"
                user = User.objects.create(
                    email=placeholder_email,
                    username=build_unique_username(username_seed),
                    first_name=name[:150] if name else "",
                )

        _, identity_state = ensure_account_baseline(user)

        if name and not user.first_name:
            user.first_name = name[:150]
            user.save(update_fields=["first_name"])

        if email_is_real and not identity_state.email_verified:
            identity_state.email_verified = True
            identity_state.email_verified_at = timezone.now()
            identity_state.save(
                update_fields=["email_verified", "email_verified_at", "updated_at"]
            )

        return social_auth_response(user, created=created)


@api_view(["GET"])
def hello(request):
    return Response({"message": "Welcome to TEED Hub API"})


@api_view(["GET"])
def test_api(request):
    return Response({"status": "success", "message": "Django API is working!"})


class PhoneSignupView(APIView):
    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    def post(self, request):
        raw_phone = request.data.get("phone", "")

        try:
            phone = normalize_phone_number(raw_phone)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

        if not phone:
            return Response(
                {"error": "Phone number is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if User.objects.filter(profile__phone_number=phone).exists():
            return Response(
                {"error": "Phone already registered"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        result = create_otp_session(SIGNUP_PREFIX, raw_phone)

        return Response(
            {
                "message": "OTP sent",
                "session_id": result.session_id,
                **({"debug_otp": result.debug_otp} if settings.DEBUG else {}),
            },
            status=status.HTTP_200_OK,
        )


class PhoneSignupVerifyView(APIView):
    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    def post(self, request):
        session_id = request.data.get("session_id")
        otp = (request.data.get("otp") or "").strip()

        if not session_id or not otp:
            return Response(
                {"error": "session_id and otp required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            verification = verify_otp_session(SIGNUP_PREFIX, session_id, otp)

        except PhoneOTPExpiredError:
            return Response(
                {"error": "OTP expired"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        except PhoneOTPInvalidError:
            return Response(
                {"error": "Invalid OTP"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        except ValueError as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST,
            )

        phone = verification.phone

        if User.objects.filter(profile__phone_number=phone).exists():
            return Response(
                {"error": "Phone already registered"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user, created = get_or_create_phone_user(phone)
        mark_phone_verified(user, phone)

        return social_auth_response(
            user,
            created=created,
            status_code=status.HTTP_201_CREATED,
        )
    
class PhoneOTPLoginView(APIView):
    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    def post(self, request):
        raw_phone = request.data.get("phone", "")

        try:
            phone = normalize_phone_number(raw_phone)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

        if not phone:
            return Response(
                {"error": "Phone number required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not User.objects.filter(profile__phone_number=phone).exists():
            return Response(
                {"error": "No account with this phone"},
                status=status.HTTP_404_NOT_FOUND,
            )

        result = create_otp_session(LOGIN_PREFIX, raw_phone)

        return Response(
            {
                "message": "OTP sent",
                "session_id": result.session_id,
                **({"debug_otp": result.debug_otp} if settings.DEBUG else {}),
            },
            status=status.HTTP_200_OK,
        )


class PhoneOTPVerifyView(APIView):
    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    def post(self, request):
        session_id = request.data.get("session_id")
        otp = (request.data.get("otp") or "").strip()

        if not session_id or not otp:
            return Response(
                {"error": "session_id and otp required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            verification = verify_otp_session(LOGIN_PREFIX, session_id, otp)

        except PhoneOTPExpiredError:
            return Response({"error": "OTP expired"}, status=400)

        except PhoneOTPInvalidError:
            return Response({"error": "Invalid OTP"}, status=400)

        except ValueError as e:
            return Response({"error": str(e)}, status=400)

        user = User.objects.filter(
            profile__phone_number=verification.phone
        ).first()

        if not user:
            return Response(
                {"error": "Account not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        mark_phone_verified(user, verification.phone)

        return social_auth_response(user, created=False)