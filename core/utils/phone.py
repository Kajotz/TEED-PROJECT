import phonenumbers
from django.conf import settings
from phonenumbers import NumberParseException
from rest_framework import serializers

COUNTRY_REGION_MAP = {
    "TZ": "TZ",
    "KE": "KE",
    "UG": "UG",
    "BI": "BI",
    "RW": "RW",
    "CD": "CD",
    "ZM": "ZM",
}

SUPPORTED_COUNTRIES = set(COUNTRY_REGION_MAP.keys())


def get_default_phone_region() -> str:
    """
    Default region used when user enters a local number without +country code.

    You can override this in settings:
        DEFAULT_PHONE_REGION = "TZ"
    """
    region = getattr(settings, "DEFAULT_PHONE_REGION", "TZ")
    return str(region).upper()


def _resolve_region(country: str | None = None) -> str | None:
    if country:
        normalized = str(country).upper().strip()
        region = COUNTRY_REGION_MAP.get(normalized)
        if not region:
            raise serializers.ValidationError("Unsupported country.")
        return region

    return get_default_phone_region()


def parse_phone_identity(phone_number: str, country: str | None = None) -> tuple[str, str]:
    """
    Parse and validate a phone number.

    Returns:
        (normalized_digits_only, region_code)

    Example:
        input:  "+255712345678"
        return: ("255712345678", "TZ")

    If the number is local (e.g. 0712345678), a default region is used.
    """
    if not phone_number or not str(phone_number).strip():
        raise serializers.ValidationError("Phone number is required.")

    raw_value = str(phone_number).strip()
    region = None if raw_value.startswith("+") else _resolve_region(country)

    try:
        parsed = phonenumbers.parse(raw_value, region)
    except NumberParseException:
        raise serializers.ValidationError("Enter a valid phone number.")

    if not phonenumbers.is_valid_number(parsed):
        raise serializers.ValidationError("Enter a valid phone number.")

    detected_region = phonenumbers.region_code_for_number(parsed)
    if not detected_region:
        raise serializers.ValidationError("Could not determine phone number country.")

    if detected_region not in SUPPORTED_COUNTRIES:
        raise serializers.ValidationError("Phone number country is not supported.")

    international = phonenumbers.format_number(
        parsed,
        phonenumbers.PhoneNumberFormat.E164,
    )

    normalized = international.replace("+", "")
    return normalized, detected_region


def normalize_phone_number(phone_number: str, country: str | None = None) -> str:
    """
    Normalize and validate phone number.

    Returns:
        digits-only international format (no +), e.g. 255712345678
    """
    normalized, _ = parse_phone_identity(phone_number, country)
    return normalized


def infer_country_from_phone(phone_number: str, country: str | None = None) -> str:
    """
    Infer ISO country code from phone number.
    """
    _, detected_country = parse_phone_identity(phone_number, country)
    return detected_country