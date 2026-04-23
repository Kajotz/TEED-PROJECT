# core/rbac/sync_permissions.py

from core.models import Permission
from core.rbac.permission_catalog import PERMISSION_CATALOG


def sync_permissions():
    """
    Ensure all permission codes in the catalog exist in the database.

    Strict behavior:
    - Creates missing permissions
    - Updates description if it has changed
    - Returns summary of changes
    """

    created = 0
    updated = 0

    for group, permissions in PERMISSION_CATALOG.items():
        for code, description in permissions:
            permission, was_created = Permission.objects.get_or_create(
                code=code,
                defaults={"description": description},
            )

            if was_created:
                created += 1
                continue

            # Enforce description consistency
            if permission.description != description:
                permission.description = description
                permission.save(update_fields=["description"])
                updated += 1

    return {
        "created": created,
        "updated": updated,
    }