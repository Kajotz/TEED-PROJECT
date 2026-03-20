from django.db import models
from .business import Business


class BusinessProfile(models.Model):
    """
    Presentation & public identity for a Business.
    One business → one profile.
    """

    business = models.OneToOneField(
        Business,
        on_delete=models.CASCADE,
        related_name="profile"
    )

    # Branding
    logo = models.ImageField(upload_to="business/logos/", null=True, blank=True)
    primary_color = models.CharField(max_length=7, blank=True)
    secondary_color = models.CharField(max_length=7, blank=True)
    theme = models.CharField(max_length=50, default="default")

    # Public identity
    about = models.TextField(blank=True)

    contact_email = models.EmailField(blank=True)
    contact_phone = models.CharField(max_length=20, blank=True)
    website = models.URLField(blank=True)

    instagram = models.CharField(max_length=100, blank=True)
    facebook = models.CharField(max_length=100, blank=True)
    tiktok = models.CharField(max_length=100, blank=True)
    whatsapp = models.CharField(max_length=20, blank=True)

    def __str__(self):
        return f"Profile for {self.business.name}"
