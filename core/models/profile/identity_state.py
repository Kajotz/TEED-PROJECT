"""
IdentityState Model - Stores canonical account identity verification state.
"""

import uuid

from django.conf import settings
from django.db import models


class IdentityState(models.Model):
    """
    Canonical identity/account verification state for a user.

    This is the stable source of truth for whether a user's primary
    identity channels have been verified, separate from profile data
    and separate from verification request/code records.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="identity_state",
    )

    email_verified = models.BooleanField(
        default=False,
        help_text="Primary email address has been verified.",
    )
    email_verified_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="Timestamp when the primary email was verified.",
    )

    phone_verified = models.BooleanField(
        default=False,
        help_text="Primary phone number has been verified.",
    )
    phone_verified_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="Timestamp when the primary phone number was verified.",
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "identity_states"
        verbose_name = "Identity State"
        verbose_name_plural = "Identity States"
        indexes = [
            models.Index(fields=["user"]),
            models.Index(fields=["email_verified"]),
            models.Index(fields=["phone_verified"]),
        ]

    def __str__(self):
        return f"{self.user.username} - Identity State"