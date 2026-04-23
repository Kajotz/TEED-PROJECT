from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from core.models import Permission, Role
from core.rbac.decorators import require_business_permission
from core.rbac.tasks import TASKS
from core.serializers.rbac.permission import (
    PermissionListSerializer,
    RoleAssignedPermissionSerializer,
)
from core.serializers.rbac.assign_role_permission import AssignRolePermissionSerializer
from core.serializers.rbac.remove_role_permission import RemoveRolePermissionSerializer


class PermissionCatalogView(APIView):
    """
    GET: List all available permissions in the system.
    Requires: roles.view
    """

    @require_business_permission("roles.view")
    def get(self, request, business_id, *args, **kwargs):
        tasks = [
            {"key": key, "label": label}
            for key, label in TASKS.items()
        ]
        return Response(tasks, status=status.HTTP_200_OK)


class RolePermissionListAssignView(APIView):
    """
    GET: List permissions assigned to a role
         Requires: roles.view

    POST: Assign a permission to a role
          Requires: roles.update
    """

    def get_role(self, business, role_id):
        return get_object_or_404(
            Role,
            id=role_id,
            business=business,
        )

    @require_business_permission("roles.view")
    def get(self, request, business_id, role_id, *args, **kwargs):
        role = self.get_role(request.business, role_id)

        permissions = (
            Permission.objects
            .filter(permission_roles__role=role)
            .distinct()
            .order_by("code")
        )

        serializer = RoleAssignedPermissionSerializer(permissions, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @require_business_permission("roles.update")
    def post(self, request, business_id, role_id, *args, **kwargs):
        role = self.get_role(request.business, role_id)

        serializer = AssignRolePermissionSerializer(
            data=request.data,
            context={"role": role},
        )
        serializer.is_valid(raise_exception=True)
        result = serializer.save()

        return Response(result, status=status.HTTP_200_OK)


class RolePermissionRemoveView(APIView):
    """
    DELETE: Remove a permission from a role
            Requires: roles.update
    """

    def get_role(self, business, role_id):
        return get_object_or_404(
            Role,
            id=role_id,
            business=business,
        )

    @require_business_permission("roles.update")
    def delete(self, request, business_id, role_id, permission_id, *args, **kwargs):
        role = self.get_role(request.business, role_id)

        serializer = RemoveRolePermissionSerializer(
            data={},
            context={
                "role": role,
                "permission_id": permission_id,
            },
        )
        serializer.is_valid(raise_exception=True)
        result = serializer.save()

        return Response(result, status=status.HTTP_200_OK)