from rest_framework import serializers

from core.models import Permission, RolePermission


class AssignRolePermissionSerializer(serializers.Serializer):
    permission_id = serializers.IntegerField(required=False)
    permission_ids = serializers.ListField(
        child=serializers.IntegerField(),
        required=False,
        allow_empty=False,
    )

    def validate(self, attrs):
        permission_id = attrs.get("permission_id")
        permission_ids = attrs.get("permission_ids")

        if permission_id and permission_ids:
            raise serializers.ValidationError({
                "detail": "Provide either permission_id or permission_ids, not both."
            })

        if not permission_id and not permission_ids:
            raise serializers.ValidationError({
                "detail": "permission_id or permission_ids is required."
            })

        ids = [permission_id] if permission_id is not None else permission_ids
        ids = list(dict.fromkeys(ids))

        permissions = Permission.objects.filter(id__in=ids)
        found_ids = set(permissions.values_list("id", flat=True))
        missing_ids = [str(pid) for pid in ids if pid not in found_ids]

        if missing_ids:
            raise serializers.ValidationError({
                "permission_ids": [f"Permission(s) not found: {missing_ids}"]
            })

        attrs["permissions"] = list(permissions)
        return attrs

    def save(self, **kwargs):
        role = self.context["role"]
        permissions = self.validated_data["permissions"]

        created_ids = []
        existing_ids = []

        for permission in permissions:
            _, created = RolePermission.objects.get_or_create(
                role=role,
                permission=permission,
            )
            if created:
                created_ids.append(str(permission.id))
            else:
                existing_ids.append(str(permission.id))

        if len(permissions) == 1:
            permission = permissions[0]
            created = str(permission.id) in created_ids
            return {
                "detail": (
                    "Permission assigned successfully."
                    if created else
                    "Permission already assigned."
                ),
                "role_id": str(role.id),
                "permission_id": str(permission.id),
                "created": created,
            }

        return {
            "detail": "Permission assignment processed.",
            "role_id": str(role.id),
            "assigned_permission_ids": created_ids,
            "already_assigned_permission_ids": existing_ids,
            "created_count": len(created_ids),
            "already_assigned_count": len(existing_ids),
        }