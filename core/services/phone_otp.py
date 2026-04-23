import logging
import random
import uuid
from dataclasses import dataclass

import requests
from django.conf import settings
from django.core.cache import cache

from core.utils.phone import normalize_phone_number

logger = logging.getLogger(__name__)


OTP_TIMEOUT_SECONDS = 600  # 10 minutes
OTP_LENGTH = 6

LOGIN_PREFIX = "phone_otp"
SIGNUP_PREFIX = "phone_signup_otp"


class PhoneOTPError(Exception):
    pass


class PhoneOTPExpiredError(PhoneOTPError):
    pass


class PhoneOTPInvalidError(PhoneOTPError):
    pass


class PhoneOTPAlreadyExistsError(PhoneOTPError):
    pass


@dataclass
class OTPRequestResult:
    session_id: str
    phone: str
    debug_otp: str | None = None


@dataclass
class OTPVerificationResult:
    phone: str
    session_id: str


# ================================
# PROVIDERS
# ================================

class PhoneOTPProvider:
    def send_otp(self, phone: str, otp: str) -> None:
        raise NotImplementedError


class ConsolePhoneOTPProvider(PhoneOTPProvider):
    """
    Dev provider: prints OTP only
    """

    def send_otp(self, phone: str, otp: str) -> None:
        logger.info("[DEV OTP] phone=%s otp=%s", phone, otp)
        print(f"[DEV OTP] phone={phone} otp={otp}")


class BrevoPhoneOTPProvider(PhoneOTPProvider):
    """
    Production provider using Brevo SMS API
    """

    def send_otp(self, phone: str, otp: str) -> None:
        url = "https://api.brevo.com/v3/transactionalSMS/sms"

        headers = {
            "accept": "application/json",
            "api-key": settings.BREVO_API_KEY,
            "content-type": "application/json",
        }

        payload = {
            "sender": getattr(settings, "BREVO_SMS_SENDER", "TEED"),
            "recipient": phone,
            "content": f"Your TEED verification code is {otp}",
            "type": "transactional",
        }

        try:
            response = requests.post(url, json=payload, headers=headers, timeout=10)

            if response.status_code >= 400:
                logger.error(
                    "Brevo SMS failed | status=%s | body=%s",
                    response.status_code,
                    response.text,
                )
                raise PhoneOTPError("Failed to send SMS")

        except requests.RequestException as e:
            logger.error("Brevo SMS exception: %s", str(e))
            raise PhoneOTPError("SMS provider error")


def get_phone_otp_provider() -> PhoneOTPProvider:
    """
    Switch provider via settings
    """
    if getattr(settings, "USE_BREVO_SMS", False):
        return BrevoPhoneOTPProvider()
    return ConsolePhoneOTPProvider()


# ================================
# CORE LOGIC
# ================================

def normalize_phone(phone: str) -> str:
    if not phone:
        return ""
    return normalize_phone_number(phone)


def generate_otp(length: int = OTP_LENGTH) -> str:
    start = 10 ** (length - 1)
    end = (10 ** length) - 1
    return str(random.randint(start, end))


def build_cache_key(prefix: str, session_id: str) -> str:
    return f"{prefix}:{session_id}"


def create_otp_session(prefix: str, phone: str) -> OTPRequestResult:
    phone = normalize_phone(phone)

    if not phone:
        raise ValueError("Phone number is required")

    otp = generate_otp()
    session_id = str(uuid.uuid4())

    cache.set(
        build_cache_key(prefix, session_id),
        {
            "phone": phone,
            "otp": otp,
        },
        timeout=OTP_TIMEOUT_SECONDS,
    )

    provider = get_phone_otp_provider()
    provider.send_otp(phone, otp)

    debug_otp = otp if settings.DEBUG else None

    return OTPRequestResult(
        session_id=session_id,
        phone=phone,
        debug_otp=debug_otp,
    )


def verify_otp_session(prefix: str, session_id: str, otp: str) -> OTPVerificationResult:
    if not session_id or not otp:
        raise ValueError("session_id and otp are required")

    cached_data = cache.get(build_cache_key(prefix, session_id))

    if not cached_data:
        raise PhoneOTPExpiredError("OTP expired or session not found")

    expected_otp = str(cached_data.get("otp", "")).strip()
    provided_otp = str(otp).strip()

    if expected_otp != provided_otp:
        raise PhoneOTPInvalidError("Invalid OTP")

    cache.delete(build_cache_key(prefix, session_id))

    return OTPVerificationResult(
        phone=str(cached_data["phone"]).strip(),
        session_id=session_id,
    )