import uuid
from django.db import models
from django.conf import settings
from django.utils import timezone

from .business import Business
from .membership import Role


class MemberInvite(models.Model):
    TYPE_INVITE = "invite"
    TYPE_REQUEST = "request"

    DELIVERY_EMAIL = "email"
    DELIVERY_LOCAL = "local"

    STATUS_PENDING = "pending"
    STATUS_ACCEPTED = "accepted"
    STATUS_DECLINED = "declined"
    STATUS_REVOKED = "revoked"
    STATUS_EXPIRED = "expired"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    type = models.CharField(
        max_length=20,
        choices=(
            (TYPE_INVITE, "Invite"),
            (TYPE_REQUEST, "Request"),
        ),
        default=TYPE_INVITE,
    )

    delivery = models.CharField(
        max_length=20,
        choices=(
            (DELIVERY_EMAIL, "Email"),
            (DELIVERY_LOCAL, "Local"),
        ),
        default=DELIVERY_LOCAL,
    )

    business = models.ForeignKey(
        Business,
        on_delete=models.CASCADE,
        related_name="invites",
    )

    invited_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="sent_invitations",
    )

    target_user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="received_invitations",
    )

    email = models.EmailField(null=True, blank=True)

    role = models.ForeignKey(
        Role,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="invitations",
    )

    status = models.CharField(
        max_length=20,
        choices=(
            (STATUS_PENDING, "Pending"),
            (STATUS_ACCEPTED, "Accepted"),
            (STATUS_DECLINED, "Declined"),
            (STATUS_REVOKED, "Revoked"),
            (STATUS_EXPIRED, "Expired"),
        ),
        default=STATUS_PENDING,
    )

    token = models.UUIDField(default=uuid.uuid4, editable=False)
    expires_at = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(fields=["business", "email"]),
            models.Index(fields=["business", "target_user"]),
            models.Index(fields=["business", "status"]),
            models.Index(fields=["type", "status"]),
        ]

    def is_expired(self):
        return bool(self.expires_at and timezone.now() > self.expires_at)

    def __str__(self):
        target = self.email or (self.target_user.email if self.target_user else "<unspecified>")
        return f"{self.type.title()} {target} -> {self.business} [{self.status}]"