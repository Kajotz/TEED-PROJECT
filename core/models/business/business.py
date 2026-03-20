import uuid
from django.db import models


class Business(models.Model):
    """
    Core business entity.
    Authority is handled by RBAC:
    BusinessMember -> MemberRole -> Role
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    name = models.CharField(max_length=255)
    slug = models.SlugField(unique=True)

    BUSINESS_TYPES = (
        ("retail", "Retail"),
        ("service", "Service"),
        ("online", "Online"),
        ("creator", "Creator"),
    )

    business_type = models.CharField(
        max_length=20,
        choices=BUSINESS_TYPES
    )

    is_active = models.BooleanField(default=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.name
