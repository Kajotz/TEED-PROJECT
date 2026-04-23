"""
Verification models
Handles email verification codes and other verification artifacts.
"""

import secrets
import uuid
from datetime import timedelta

from django.conf import settings
from django.db import models
from django.utils import timezone


class EmailVerification(models.Model):
    """
    Email verification codes
    - One active code per email
    - Short-lived (configurable)
    - Limited attempts
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    email = models.EmailField(db_index=True)

    # ❌ removed unique=True (critical fix)
    verification_code = models.CharField(max_length=6, db_index=True)

    is_verified = models.BooleanField(default=False)

    attempts = models.IntegerField(
        default=0,
        help_text="Number of failed verification attempts",
    )

    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    verified_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "email_verifications"
        verbose_name = "Email Verification"
        verbose_name_plural = "Email Verifications"
        indexes = [
            models.Index(fields=["email", "is_verified"]),
            models.Index(fields=["verification_code"]),
            models.Index(fields=["expires_at"]),
        ]

    def __str__(self):
        return f"{self.email} - {self.verification_code}"

    # =========================
    # STATE CHECKS
    # =========================

    def is_expired(self):
        return timezone.now() > self.expires_at

    def is_valid(self):
        return (
            not self.is_expired()
            and not self.is_verified
            and self.attempts < settings.MAX_VERIFICATION_ATTEMPTS
        )

    # =========================
    # CORE LOGIC
    # =========================

    def mark_verified(self):
        self.is_verified = True
        self.verified_at = timezone.now()
        self.save(update_fields=["is_verified", "verified_at"])

    def increment_attempts(self):
        self.attempts += 1
        self.save(update_fields=["attempts"])

    # =========================
    # FACTORY METHODS
    # =========================

    @staticmethod
    def generate_code():
        return str(secrets.randbelow(1000000)).zfill(
            settings.PHONE_OTP_LENGTH  # unified length
        )

    @classmethod
    def create_for_email(cls, email):
        """
        Create new verification:
        - invalidate previous ones
        - apply timeout from settings
        """

        # expire all previous active codes
        cls.objects.filter(email=email, is_verified=False).update(
            expires_at=timezone.now()
        )

        timeout_minutes = getattr(settings, "EMAIL_VERIFICATION_TIMEOUT", 10)

        code = cls.generate_code()

        return cls.objects.create(
            email=email,
            verification_code=code,
            expires_at=timezone.now() + timedelta(minutes=timeout_minutes),
        )

    @classmethod
    def get_active_verification(cls, email):
        return (
            cls.objects.filter(email=email, is_verified=False)
            .order_by("-created_at")
            .first()
        )