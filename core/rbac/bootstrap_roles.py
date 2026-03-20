from core.models import Role, Permission, RolePermission
from core.rbac.default_roles import DEFAULT_ROLE_PERMISSIONS


def bootstrap_business_roles(business):
    """
    Create default roles for a business and attach their permissions.
    Safe to run multiple times.
    """
    for role_name, permission_codes in DEFAULT_ROLE_PERMISSIONS.items():
        role, _ = Role.objects.get_or_create(
            business=business,
            name=role_name,
            defaults={"is_locked": True},
        )

        permissions = Permission.objects.filter(code__in=permission_codes)

        for permission in permissions:
            RolePermission.objects.get_or_create(
                role=role,
                permission=permission,
            )