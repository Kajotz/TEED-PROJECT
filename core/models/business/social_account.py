"""
SocialAccount Model - Links social media accounts to businesses
Enables management of multiple social platforms per business
"""

from django.db import models
from django.contrib.auth.models import User
import uuid
from .business import Business


class SocialAccount(models.Model):
    """
    Social media account linked to a business
    Supports multiple platforms and accounts per business
    """
    
    PLATFORM_CHOICES = [
        ('instagram', 'Instagram'),
        ('facebook', 'Facebook'),
        ('tiktok', 'TikTok'),
        ('youtube', 'YouTube'),
        ('twitter', 'Twitter/X'),
        ('linkedin', 'LinkedIn'),
        ('pinterest', 'Pinterest'),
        ('snapchat', 'Snapchat'),
        ('whatsapp', 'WhatsApp'),
        ('telegram', 'Telegram'),
        ('discord', 'Discord'),
        ('twitch', 'Twitch'),
        ('reddit', 'Reddit'),
        ('tumblr', 'Tumblr'),
        ('threads', 'Threads'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    business = models.ForeignKey(
        Business,
        on_delete=models.CASCADE,
        related_name='social_accounts'
    )
    
    # Account Information
    platform = models.CharField(max_length=20, choices=PLATFORM_CHOICES)
    account_username = models.CharField(max_length=255)
    account_url = models.URLField(blank=True, null=True)
    
    # Authentication
    access_token = models.TextField(blank=True, null=True)
    refresh_token = models.TextField(blank=True, null=True)
    token_expires_at = models.DateTimeField(blank=True, null=True)
    
    # Account Status
    is_connected = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    connection_error = models.TextField(blank=True, null=True)
    
    # Metadata
    followers_count = models.IntegerField(default=0)
    profile_image = models.URLField(blank=True, null=True)
    bio = models.TextField(blank=True, null=True)
    
    # Tracking
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    last_synced_at = models.DateTimeField(blank=True, null=True)
    
    class Meta:
        db_table = 'social_accounts'
        verbose_name = 'Social Account'
        verbose_name_plural = 'Social Accounts'
        unique_together = ['business', 'platform', 'account_username']
        indexes = [
            models.Index(fields=['business', 'platform']),
            models.Index(fields=['is_connected', 'is_active']),
        ]
    
    def __str__(self):
        return f"{self.business.name} - {self.get_platform_display()} ({self.account_username})"
    
    def get_platform_icon_url(self):
        """Get icon URL for platform"""
        icons = {
            'instagram': 'https://cdn-icons-png.flaticon.com/512/174/174855.png',
            'facebook': 'https://cdn-icons-png.flaticon.com/512/733/733547.png',
            'tiktok': 'https://cdn-icons-png.flaticon.com/512/3046/3046121.png',
            'youtube': 'https://cdn-icons-png.flaticon.com/512/733/733877.png',
            'twitter': 'https://cdn-icons-png.flaticon.com/512/733/733579.png',
            'linkedin': 'https://cdn-icons-png.flaticon.com/512/733/733561.png',
            'pinterest': 'https://cdn-icons-png.flaticon.com/512/733/733558.png',
            'snapchat': 'https://cdn-icons-png.flaticon.com/512/733/733553.png',
        }
        return icons.get(self.platform, '')
    
    @property
    def status_display(self):
        """Get human-readable status"""
        if not self.is_active:
            return 'Inactive'
        if self.connection_error:
            return 'Error'
        return 'Connected' if self.is_connected else 'Disconnected'
