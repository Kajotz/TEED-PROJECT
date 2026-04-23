from rest_framework import serializers
from core.models import Permission


class PermissionListSerializer(serializers.ModelSerializer):
    """
    Used for listing permissions.
    Can optionally include 'is_assigned' when role context is provided.
    """

    is_assigned = serializers.SerializerMethodField()

    class Meta:
        model = Permission
        fields = [
            "id",
            "code",
            "description",
            "is_assigned",
        ]

    def get_is_assigned(self, obj):
        role = self.context.get("role")
        if not role:
            return None  # keeps it reusable

        return role.permissions.filter(id=obj.id).exists()
    
class RoleAssignedPermissionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Permission
        fields = ["id", "code", "description"]