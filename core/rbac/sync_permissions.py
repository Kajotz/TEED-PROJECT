# core/rbac/sync_permissions.py

from core.models import Permission
from core.rbac.permission_catalog import PERMISSION_CATALOG


def sync_permissions():
    """
    Ensure all permission codes in the catalog exist in the database.
    Safe to run multiple times.
    """
    created = 0

    for group, permissions in PERMISSION_CATALOG.items():
        for code, description in permissions:
            _, was_created = Permission.objects.get_or_create(
                code=code,
                defaults={"description": description},
            )

            if was_created:
                created += 1

    return created