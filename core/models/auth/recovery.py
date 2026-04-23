import hashlib
import secrets
import uuid
from datetime import timedelta

from django.conf import settings
from django.db import models
from django.utils import timezone


class RecoveryMethod(models.Model):
    METHOD_EMAIL = "email"
    METHOD_PHONE = "phone"

    METHOD_CHOICES = [
        (METHOD_EMAIL, "Email"),
        (METHOD_PHONE, "Phone"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="recovery_methods",
    )
    method_type = models.CharField(max_length=10, choices=METHOD_CHOICES)
    value = models.CharField(max_length=255)
    normalized_value = models.CharField(max_length=255, unique=True, db_index=True)
    is_verified = models.BooleanField(default=False)
    is_default = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    verified_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "recovery_methods"
        verbose_name = "Recovery Method"
        verbose_name_plural = "Recovery Methods"
        indexes = [
            models.Index(fields=["user", "method_type"]),
            models.Index(fields=["user", "is_verified"]),
            models.Index(fields=["user", "is_active"]),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=["user", "method_type", "normalized_value"],
                name="unique_user_recovery_method_value",
            )
        ]

    def __str__(self):
        return f"{self.user_id} - {self.method_type} - {self.normalized_value}"

    @property
    def masked_value(self):
        if self.method_type == self.METHOD_EMAIL:
            local, _, domain = self.value.partition("@")
            masked_local = (
                local[0] + "***" if len(local) > 1 else "*"
            )
            domain_name, dot, suffix = domain.partition(".")
            masked_domain = (
                domain_name[0] + "***" if domain_name else "***"
            )
            return f"{masked_local}@{masked_domain}{dot}{suffix}" if domain else masked_local

        value = self.normalized_value
        if len(value) <= 6:
            return "*" * len(value)
        return f"{value[:4]}{'*' * max(len(value) - 7, 1)}{value[-3:]}"


class RecoveryChallenge(models.Model):
    PURPOSE_ACCOUNT_RECOVERY = "account_recovery"
    PURPOSE_ADD_RECOVERY_METHOD = "add_recovery_method"

    PURPOSE_CHOICES = [
        (PURPOSE_ACCOUNT_RECOVERY, "Account Recovery"),
        (PURPOSE_ADD_RECOVERY_METHOD, "Add Recovery Method"),
    ]

    STATUS_PENDING = "pending"
    STATUS_VERIFIED = "verified"
    STATUS_COMPLETED = "completed"
    STATUS_EXPIRED = "expired"
    STATUS_CANCELLED = "cancelled"

    STATUS_CHOICES = [
        (STATUS_PENDING, "Pending"),
        (STATUS_VERIFIED, "Verified"),
        (STATUS_COMPLETED, "Completed"),
        (STATUS_EXPIRED, "Expired"),
        (STATUS_CANCELLED, "Cancelled"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="recovery_challenges",
    )
    recovery_method = models.ForeignKey(
        RecoveryMethod,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="challenges",
    )
    purpose = models.CharField(max_length=40, choices=PURPOSE_CHOICES)
    channel = models.CharField(max_length=10, choices=RecoveryMethod.METHOD_CHOICES)
    target_value = models.CharField(max_length=255)
    target_display = models.CharField(max_length=255, blank=True)
    code_hash = models.CharField(max_length=128, db_index=True)
    code_last4 = models.CharField(max_length=4)
    attempts = models.PositiveSmallIntegerField(default=0)
    max_attempts = models.PositiveSmallIntegerField(default=5)
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default=STATUS_PENDING,
    )
    expires_at = models.DateTimeField()
    verified_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "recovery_challenges"
        verbose_name = "Recovery Challenge"
        verbose_name_plural = "Recovery Challenges"
        indexes = [
            models.Index(fields=["user", "purpose", "status"]),
            models.Index(fields=["channel", "target_value"]),
            models.Index(fields=["expires_at"]),
        ]

    def __str__(self):
        return f"{self.user_id} - {self.purpose} - {self.channel} - {self.status}"

    @staticmethod
    def generate_code():
        return str(secrets.randbelow(1000000)).zfill(6)

    @staticmethod
    def hash_code(code):
        return hashlib.sha256(code.encode()).hexdigest()

    @classmethod
    def create_challenge(
        cls,
        *,
        user,
        purpose,
        channel,
        target_value,
        target_display="",
        recovery_method=None,
        expires_in_minutes=15,
        max_attempts=5,
    ):
        cls.objects.filter(
            user=user,
            purpose=purpose,
            status=cls.STATUS_PENDING,
            channel=channel,
        ).update(status=cls.STATUS_CANCELLED)

        code = cls.generate_code()
        challenge = cls.objects.create(
            user=user,
            recovery_method=recovery_method,
            purpose=purpose,
            channel=channel,
            target_value=target_value,
            target_display=target_display,
            code_hash=cls.hash_code(code),
            code_last4=code[-4:],
            expires_at=timezone.now() + timedelta(minutes=expires_in_minutes),
            max_attempts=max_attempts,
        )
        challenge.plaintext_code = code
        return challenge

    def is_expired(self):
        return timezone.now() > self.expires_at

    def is_usable(self):
        return (
            self.status == self.STATUS_PENDING
            and not self.is_expired()
            and self.attempts < self.max_attempts
        )

    def verify_code(self, raw_code):
        return self.code_hash == self.hash_code(raw_code)

    def mark_expired_if_needed(self):
        if self.status == self.STATUS_PENDING and self.is_expired():
            self.status = self.STATUS_EXPIRED
            self.save(update_fields=["status"])


class BackupRecoveryCode(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="backup_recovery_codes",
    )
    code_hash = models.CharField(max_length=128, unique=True, db_index=True)
    code_last4 = models.CharField(max_length=4)
    is_used = models.BooleanField(default=False)
    used_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "backup_recovery_codes"
        verbose_name = "Backup Recovery Code"
        verbose_name_plural = "Backup Recovery Codes"
        indexes = [
            models.Index(fields=["user", "is_used"]),
        ]

    def __str__(self):
        return f"{self.user_id} - ****{self.code_last4}"

    @staticmethod
    def generate_code():
        return str(secrets.randbelow(10**12)).zfill(12)

    @staticmethod
    def hash_code(code):
        return hashlib.sha256(code.encode()).hexdigest()

    @classmethod
    def regenerate_for_user(cls, user, count=10):
        user.backup_recovery_codes.filter(is_used=False).delete()

        generated = []
        for _ in range(count):
            raw_code = cls.generate_code()
            instance = cls.objects.create(
                user=user,
                code_hash=cls.hash_code(raw_code),
                code_last4=raw_code[-4:],
            )
            generated.append(
                {
                    "id": str(instance.id),
                    "code": raw_code,
                    "last4": raw_code[-4:],
                }
            )
        return generated

    def verify_code(self, raw_code):
        return self.code_hash == self.hash_code(raw_code)