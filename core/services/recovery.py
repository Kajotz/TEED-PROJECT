from django.contrib.auth import get_user_model
from django.db import transaction
from django.utils import timezone

from core.models import RecoveryChallenge, RecoveryMethod
from core.models.profile import UserProfile
from core.utils.email_service import EmailService
from core.utils.phone import parse_phone_identity

User = get_user_model()


def normalize_recovery_value(method_type, value):
    value = (value or "").strip()

    if method_type == RecoveryMethod.METHOD_EMAIL:
        if not value:
            raise ValueError("Email is required.")
        return value.lower()

    if method_type == RecoveryMethod.METHOD_PHONE:
        normalized_phone, _ = parse_phone_identity(value)
        if not normalized_phone:
            raise ValueError("Invalid phone number.")
        return normalized_phone

    raise ValueError("Invalid recovery method type.")


def mask_recovery_value(method_type, value):
    if method_type == RecoveryMethod.METHOD_EMAIL:
        local, _, domain = value.partition("@")
        masked_local = local[0] + "***" if local else "***"
        domain_name, dot, suffix = domain.partition(".")
        masked_domain = domain_name[0] + "***" if domain_name else "***"
        return f"{masked_local}@{masked_domain}{dot}{suffix}" if domain else masked_local

    if len(value) <= 6:
        return "*" * len(value)
    return f"{value[:4]}{'*' * max(len(value) - 7, 1)}{value[-3:]}"


def get_user_primary_phone(user):
    profile = getattr(user, "profile", None)
    if not profile:
        return None
    return getattr(profile, "phone_number", None)


def validate_recovery_value_availability(user, method_type, normalized_value):
    if method_type == RecoveryMethod.METHOD_EMAIL:
        user_email = (getattr(user, "email", "") or "").strip().lower()

        if user_email and normalized_value == user_email:
            raise ValueError("Recovery email cannot match primary email.")

        primary_email_exists = (
            User.objects
            .filter(email__iexact=normalized_value)
            .exclude(id=user.id)
            .exists()
        )
        if primary_email_exists:
            raise ValueError("This email is already used as a primary identity.")

    elif method_type == RecoveryMethod.METHOD_PHONE:
        primary_phone = get_user_primary_phone(user)

        if primary_phone and normalized_value == primary_phone:
            raise ValueError("Recovery phone cannot match primary phone.")

        primary_phone_exists = (
            UserProfile.objects
            .filter(phone_number=normalized_value)
            .exclude(user=user)
            .exists()
        )
        if primary_phone_exists:
            raise ValueError("This phone is already used as a primary identity.")

    method_exists = (
        RecoveryMethod.objects
        .filter(normalized_value=normalized_value)
        .exclude(user=user)
        .exists()
    )
    if method_exists:
        raise ValueError("This recovery method is already used by another account.")


def send_recovery_code(challenge):
    code = getattr(challenge, "plaintext_code", None)
    if not code:
        raise ValueError("Challenge code not available for sending.")

    if challenge.channel == RecoveryMethod.METHOD_EMAIL:
        success = EmailService.send_password_reset_code(
            challenge.target_value,
            code,
            challenge.user.username,
        )
        if not success:
            raise ValueError("Failed to send recovery email.")
        return

    if challenge.channel == RecoveryMethod.METHOD_PHONE:
        # Real SMS sender later
        return

    raise ValueError("Unsupported recovery channel.")


@transaction.atomic
def create_recovery_method_challenge(user, method_type, value):
    normalized_value = normalize_recovery_value(method_type, value)
    validate_recovery_value_availability(user, method_type, normalized_value)

    recovery_method, _ = RecoveryMethod.objects.update_or_create(
        user=user,
        method_type=method_type,
        normalized_value=normalized_value,
        defaults={
            "value": value.strip().lower()
            if method_type == RecoveryMethod.METHOD_EMAIL
            else normalized_value,
            "is_verified": False,
            "is_active": True,
            "verified_at": None,
        },
    )

    challenge = RecoveryChallenge.create_challenge(
        user=user,
        purpose=RecoveryChallenge.PURPOSE_ADD_RECOVERY_METHOD,
        channel=method_type,
        target_value=normalized_value,
        target_display=mask_recovery_value(method_type, normalized_value),
        recovery_method=recovery_method,
    )

    send_recovery_code(challenge)
    return recovery_method, challenge


@transaction.atomic
def verify_recovery_method_challenge(challenge, raw_code):
    challenge.mark_expired_if_needed()

    if not challenge.is_usable():
        raise ValueError("Challenge is no longer valid.")

    if not challenge.verify_code(raw_code):
        challenge.attempts += 1
        if challenge.attempts >= challenge.max_attempts:
            challenge.status = RecoveryChallenge.STATUS_CANCELLED
            challenge.save(update_fields=["attempts", "status"])
        else:
            challenge.save(update_fields=["attempts"])
        raise ValueError("Invalid verification code.")

    challenge.status = RecoveryChallenge.STATUS_VERIFIED
    challenge.verified_at = timezone.now()
    challenge.save(update_fields=["status", "verified_at"])

    recovery_method = challenge.recovery_method
    if recovery_method:
        recovery_method.is_verified = True
        recovery_method.verified_at = timezone.now()
        recovery_method.is_active = True

        has_default = (
            RecoveryMethod.objects
            .filter(
                user=recovery_method.user,
                is_verified=True,
                is_default=True,
                is_active=True,
            )
            .exclude(id=recovery_method.id)
            .exists()
        )

        if not has_default:
            recovery_method.is_default = True

        recovery_method.save(
            update_fields=["is_verified", "verified_at", "is_active", "is_default"]
        )

    challenge.status = RecoveryChallenge.STATUS_COMPLETED
    challenge.completed_at = timezone.now()
    challenge.save(update_fields=["status", "completed_at"])

    return recovery_method


def resolve_user_for_recovery(identifier):
    identifier = (identifier or "").strip()
    if not identifier:
        return None

    email_candidate = identifier.lower()

    user = User.objects.filter(email__iexact=email_candidate, is_active=True).first()
    if user:
        return user

    try:
        normalized_phone, _ = parse_phone_identity(identifier)
    except Exception:
        normalized_phone = None

    if normalized_phone:
        profile = (
            UserProfile.objects
            .select_related("user")
            .filter(
                phone_number=normalized_phone,
                user__is_active=True,
            )
            .first()
        )
        if profile:
            return profile.user

    recovery_method = (
        RecoveryMethod.objects
        .select_related("user")
        .filter(
            normalized_value=email_candidate,
            method_type=RecoveryMethod.METHOD_EMAIL,
            is_verified=True,
            is_active=True,
            user__is_active=True,
        )
        .first()
    )
    if recovery_method:
        return recovery_method.user

    if normalized_phone:
        recovery_method = (
            RecoveryMethod.objects
            .select_related("user")
            .filter(
                normalized_value=normalized_phone,
                method_type=RecoveryMethod.METHOD_PHONE,
                is_verified=True,
                is_active=True,
                user__is_active=True,
            )
            .first()
        )
        if recovery_method:
            return recovery_method.user

    return None


def get_available_recovery_methods(user):
    return RecoveryMethod.objects.filter(
        user=user,
        is_verified=True,
        is_active=True,
    ).order_by("-is_default", "-verified_at", "-created_at")


@transaction.atomic
def initiate_account_recovery(identifier, method_id):
    user = resolve_user_for_recovery(identifier)
    if not user:
        return None, None

    recovery_method = get_available_recovery_methods(user).filter(id=method_id).first()
    if not recovery_method:
        raise ValueError("Selected recovery method is invalid.")

    challenge = RecoveryChallenge.create_challenge(
        user=user,
        purpose=RecoveryChallenge.PURPOSE_ACCOUNT_RECOVERY,
        channel=recovery_method.method_type,
        target_value=recovery_method.normalized_value,
        target_display=recovery_method.masked_value,
        recovery_method=recovery_method,
    )

    send_recovery_code(challenge)
    return user, challenge


@transaction.atomic
def verify_account_recovery_challenge(challenge, raw_code):
    challenge.mark_expired_if_needed()

    if not challenge.is_usable():
        raise ValueError("Recovery challenge is no longer valid.")

    if not challenge.verify_code(raw_code):
        challenge.attempts += 1
        if challenge.attempts >= challenge.max_attempts:
            challenge.status = RecoveryChallenge.STATUS_CANCELLED
            challenge.save(update_fields=["attempts", "status"])
        else:
            challenge.save(update_fields=["attempts"])
        raise ValueError("Invalid recovery code.")

    challenge.status = RecoveryChallenge.STATUS_VERIFIED
    challenge.verified_at = timezone.now()
    challenge.save(update_fields=["status", "verified_at"])
    return challenge


@transaction.atomic
def complete_account_recovery(challenge, new_password):
    if challenge.status != RecoveryChallenge.STATUS_VERIFIED:
        raise ValueError("Recovery challenge is not verified.")

    if challenge.is_expired():
        challenge.status = RecoveryChallenge.STATUS_EXPIRED
        challenge.save(update_fields=["status"])
        raise ValueError("Recovery challenge has expired.")

    user = challenge.user
    user.set_password(new_password)
    user.save(update_fields=["password"])

    challenge.status = RecoveryChallenge.STATUS_COMPLETED
    challenge.completed_at = timezone.now()
    challenge.save(update_fields=["status", "completed_at"])

    return user