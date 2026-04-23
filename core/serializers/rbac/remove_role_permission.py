from rest_framework import serializers
from rest_framework.exceptions import NotFound

from core.models import Permission, RolePermission


class RemoveRolePermissionSerializer(serializers.Serializer):
    def validate(self, attrs):
        role = self.context["role"]
        permission_id = self.context["permission_id"]

        try:
            permission = Permission.objects.get(id=permission_id)
        except Permission.DoesNotExist:
            raise NotFound("Permission not found.")

        try:
            role_permission = RolePermission.objects.get(
                role=role,
                permission=permission,
            )
        except RolePermission.DoesNotExist:
            raise serializers.ValidationError({
                "permission": ["This permission is not assigned to the role."]
            })

        attrs["permission"] = permission
        attrs["role_permission"] = role_permission
        return attrs

    def save(self, **kwargs):
        role = self.context["role"]
        permission = self.validated_data["permission"]
        role_permission = self.validated_data["role_permission"]

        role_permission.delete()

        return {
            "detail": "Permission removed successfully.",
            "role_id": str(role.id),
            "permission_id": permission.id,
        }