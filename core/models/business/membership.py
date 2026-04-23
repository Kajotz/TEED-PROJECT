import uuid
from django.db import models
from django.conf import settings
from django.core.exceptions import ValidationError
from .business import Business


class BusinessMember(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="business_memberships",
    )

    business = models.ForeignKey(
        Business,
        on_delete=models.CASCADE,
        related_name="memberships",
    )

    is_active = models.BooleanField(default=True)

    joined_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("user", "business")
        indexes = [
            models.Index(fields=["user", "business"]),
        ]

    def __str__(self):
        return f"{self.user} @ {self.business}"

    def roles_qs(self):
        if not self.is_active:
            return Role.objects.none()
        return Role.objects.filter(
            role_members__member=self
        ).distinct()

    def role_names(self):
        return list(
            self.roles_qs().values_list("name", flat=True)
        )

    def primary_role(self):
        priority = ["owner", "admin", "manager", "staff", "analyst", "viewer"]
        names = self.role_names()

        for role_name in priority:
            if role_name in names:
                return role_name

        return names[0] if names else None

    def has_role(self, role_name):
        return self.roles_qs().filter(name=role_name).exists()

    def has_any_role(self, role_names):
        return self.roles_qs().filter(name__in=role_names).exists()

    def permissions_qs(self):
        if not self.is_active:
            return Permission.objects.none()
        return Permission.objects.filter(
            permission_roles__role__role_members__member=self
        ).distinct()

    def permission_codes(self):
        return list(
            self.permissions_qs().values_list("code", flat=True)
        )

    def has_permission(self, code):
        return self.permissions_qs().filter(code=code).exists()


class Role(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    name = models.CharField(max_length=100)

    business = models.ForeignKey(
        Business,
        on_delete=models.CASCADE,
        related_name="roles",
    )

    is_locked = models.BooleanField(
        default=False,
        help_text="Locked roles cannot be renamed or deleted easily."
    )

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("name", "business")
        indexes = [
            models.Index(fields=["business"]),
        ]

    def __str__(self):
        return f"{self.name} - {self.business.name}"


class Permission(models.Model):
    code = models.CharField(max_length=120, unique=True)
    description = models.TextField(blank=True)

    def __str__(self):
        return self.code


class RolePermission(models.Model):
    role = models.ForeignKey(
        Role,
        on_delete=models.CASCADE,
        related_name="role_permissions",
    )

    permission = models.ForeignKey(
        Permission,
        on_delete=models.CASCADE,
        related_name="permission_roles",
    )

    class Meta:
        unique_together = ("role", "permission")
        indexes = [
            models.Index(fields=["role"]),
        ]

    def __str__(self):
        return f"{self.role.name} -> {self.permission.code}"


class MemberRole(models.Model):
    member = models.ForeignKey(
        BusinessMember,
        on_delete=models.CASCADE,
        related_name="member_roles",
    )

    role = models.ForeignKey(
        Role,
        on_delete=models.CASCADE,
        related_name="role_members",
    )

    class Meta:
        unique_together = ("member", "role")
        indexes = [
            models.Index(fields=["member"]),
        ]

    def clean(self):
        if self.member.business_id != self.role.business_id:
            raise ValidationError("Role must belong to the same business as the member.")

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.member} -> {self.role.name}"