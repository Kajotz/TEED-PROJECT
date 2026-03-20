from django.db import models
from django.conf import settings
from .business import Business

User = settings.AUTH_USER_MODEL


class BusinessMember(models.Model):
    """
    Membership record for a user inside a business.

    Important:
    - This model does NOT store a direct `role` field.
    - Roles are attached through MemberRole.
    - This is the core bridge for BRAC/RBAC.
    """

    user = models.ForeignKey(
        User,
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

    # -----------------------------
    # Helper methods for gradual cleanup
    # -----------------------------

    def roles_qs(self):
        """
        Returns queryset of Role objects assigned to this member.
        """
        return Role.objects.filter(
            role_members__member=self
        ).distinct()

    def role_names(self):
        """
        Returns list of role names.
        Useful while refactoring old views/serializers.
        """
        return list(
            self.roles_qs().values_list("name", flat=True)
        )

    def primary_role(self):
        """
        Temporary convenience helper for old code paths
        that still expect one role.
        Priority is based on common business hierarchy.
        """
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
        """
        Returns queryset of Permission objects available to this member
        through assigned roles.
        """
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
    """
    Custom role scoped to a single business.
    Example:
    - owner
    - admin
    - manager
    - inventory_manager
    - analyst
    """

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
    """
    Global permission registry.

    Examples:
    - business.view
    - business.manage
    - members.view
    - members.invite
    - members.update
    - roles.manage
    - analytics.view
    - social_accounts.manage
    """

    code = models.CharField(max_length=120, unique=True)
    description = models.TextField(blank=True)

    def __str__(self):
        return self.code


class RolePermission(models.Model):
    """
    Bridge: Role -> Permission
    """

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
    """
    Bridge: BusinessMember -> Role
    Allows multiple roles per member.
    """

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

    def __str__(self):
        return f"{self.member} -> {self.role.name}"