"""
UserProfile Model - Stores personal information separate from Django User model
Allows users to manage their profile, image, and personal details
"""

from django.db import models
from django.contrib.auth.models import User
from django.core.validators import URLValidator
import uuid


class UserProfile(models.Model):
    """
    Extended user profile with personal information
    Links to Django User model with OneToOneField
    """
    
    COUNTRY_CHOICES = [
        ('TZ', 'Tanzania'),
        ('KE', 'Kenya'),
        ('UG', 'Uganda'),
        ('BI', 'Burundi'),
        ('RW', 'Rwanda'),
        ('CD', 'DRC'),
        ('ZM', 'Zambia'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    
    # Personal Information
    username_display = models.CharField(
        max_length=100, 
        unique=True,
        help_text="Username for display and future authentication"
    )
    phone_number = models.CharField(max_length=20, blank=True, null=True)
    recovery_email = models.EmailField(
        blank=True,
        null=True,
        unique=True,
        help_text="Alternative email for account recovery if primary email is lost"
    )
    recovery_mobile = models.CharField(
        max_length=20,
        blank=True,
        null=True,
        unique=True,
        help_text="Alternative phone number for account recovery"
    )
    country = models.CharField(max_length=2, choices=COUNTRY_CHOICES, blank=True, null=True)
    
    # Profile Image
    profile_image = models.ImageField(
        upload_to='profile_images/',
        blank=True,
        null=True,
        help_text="User profile picture"
    )
    
    # Email Verification
    email_verified = models.BooleanField(
        default=False,
        help_text="Email address has been verified"
    )
    email_verified_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="Timestamp when email was verified"
    )
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'user_profiles'
        verbose_name = 'User Profile'
        verbose_name_plural = 'User Profiles'
        indexes = [
            models.Index(fields=['user']),
            models.Index(fields=['username_display']),
        ]
    
    def __str__(self):
        return f"{self.user.username} - Profile"
    
    def get_display_name(self):
        """Get user's display name"""
        if self.user.first_name and self.user.last_name:
            return f"{self.user.first_name} {self.user.last_name}"
        return self.username_display or self.user.username
    
    def get_profile_image_url(self):
        """Get profile image URL or placeholder"""
        if self.profile_image:
            return self.profile_image.url
        # Return placeholder based on first letter
        return f"https://ui-avatars.com/api/?name={self.get_display_name()}&background=1F75FE&color=fff"
