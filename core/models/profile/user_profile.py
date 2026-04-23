"""
UserProfile Model - Stores personal profile information separate from the auth user model.
"""

import uuid

from django.conf import settings
from django.db import models


class UserProfile(models.Model):
    """
    Extended user profile with personal information.
    This model should only contain profile-related data, not auth/recovery state.
    """

    COUNTRY_CHOICES = [
        ("TZ", "Tanzania"),
        ("KE", "Kenya"),
        ("UG", "Uganda"),
        ("BI", "Burundi"),
        ("RW", "Rwanda"),
        ("CD", "DRC"),
        ("ZM", "Zambia"),
    ]

    COUNTRY_VALUES = {code for code, _ in COUNTRY_CHOICES}

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="profile",
    )

    # =========================
    # Profile / completion data
    # =========================
    # Canonical international digits-only format, e.g. 255712345678
    phone_number = models.CharField(
        max_length=20,
        unique=True,
        blank=True,
        null=True,
        db_index=True,
        help_text="Primary verified phone number in canonical international format.",
    )

    # Country derived from the verified phone number
    phone_country_code = models.CharField(
        max_length=2,
        choices=COUNTRY_CHOICES,
        blank=True,
        null=True,
        help_text="Country code derived from the verified primary phone number.",
    )

    # User profile country. Can be prefilled from phone country and later edited if needed.
    country = models.CharField(
        max_length=2,
        choices=COUNTRY_CHOICES,
        blank=True,
        null=True,
    )

    completion_passed = models.BooleanField(
        default=False,
        help_text="Indicates whether the user has completed required profile fields.",
    )

    # =========================
    # Profile image
    # =========================
    profile_image = models.ImageField(
        upload_to="profile_images/",
        blank=True,
        null=True,
        help_text="User profile picture",
    )

    # =========================
    # Metadata
    # =========================
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "user_profiles"
        verbose_name = "User Profile"
        verbose_name_plural = "User Profiles"
        indexes = [
            models.Index(fields=["user"]),
            models.Index(fields=["phone_number"]),
            models.Index(fields=["country"]),
            models.Index(fields=["phone_country_code"]),
        ]

    def __str__(self):
        return f"{self.user.username} - Profile"

    def get_display_name(self):
        """Get user's display name."""
        if self.user.first_name and self.user.last_name:
            return f"{self.user.first_name} {self.user.last_name}"
        return self.user.username

    def get_profile_image_url(self):
        """Get profile image URL or fallback avatar URL."""
        if self.profile_image:
            return self.profile_image.url
        return (
            f"https://ui-avatars.com/api/?name={self.get_display_name()}"
            f"&background=1F75FE&color=fff"
        )