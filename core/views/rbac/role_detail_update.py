from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from core.models import Role
from core.rbac.decorators import require_business_permission
from core.serializers.rbac import (
    RoleDetailSerializer,
    RoleUpdateSerializer,
)


class RoleDetailUpdateView(APIView):
    def get_object(self, business, role_id):
        return get_object_or_404(
            Role,
            id=role_id,
            business=business,
        )

    @require_business_permission("roles.view")
    def get(self, request, business_id, role_id, *args, **kwargs):
        role = self.get_object(request.business, role_id)
        serializer = RoleDetailSerializer(role)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @require_business_permission("roles.update")
    def patch(self, request, business_id, role_id, *args, **kwargs):
        role = self.get_object(request.business, role_id)

        serializer = RoleUpdateSerializer(
            data=request.data,
            context={
                "business": request.business,
                "role": role,
            },
        )
        serializer.is_valid(raise_exception=True)

        updated_role = serializer.save()
        output = RoleDetailSerializer(updated_role)

        return Response(output.data, status=status.HTTP_200_OK)