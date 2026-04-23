from core.models import Role, Permission, RolePermission
from core.rbac.default_roles import DEFAULT_ROLE_TASKS
from core.rbac.tasks import expand_tasks_to_permissions


def bootstrap_business_roles(business):
    for role_name, role_tasks in DEFAULT_ROLE_TASKS.items():
        permission_codes = expand_tasks_to_permissions(role_tasks)
        role, _ = Role.objects.get_or_create(
            business=business,
            name=role_name,
            defaults={"is_locked": True},
        )

        permissions = Permission.objects.filter(code__in=permission_codes)

        found_codes = set(permissions.values_list("code", flat=True))
        expected_codes = set(permission_codes)
        missing_codes = expected_codes - found_codes

        if missing_codes:
            missing_list = ", ".join(sorted(missing_codes))
            raise ValueError(
                f"Missing permissions for role '{role_name}' in business "
                f"'{business.id}': {missing_list}"
            )

        # 🔥 CRITICAL FIX: RESET ROLE PERMISSIONS
        role.role_permissions.all().delete()

        RolePermission.objects.bulk_create([
            RolePermission(role=role, permission=permission)
            for permission in permissions
        ])