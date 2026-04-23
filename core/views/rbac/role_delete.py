from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from core.models import Role
from core.rbac.decorators import require_business_permission
from core.serializers.rbac import RoleDeleteSerializer


class RoleDeleteView(APIView):
    def get_object(self, business, role_id):
        return get_object_or_404(
            Role,
            id=role_id,
            business=business,
        )

    @require_business_permission("roles.delete")
    def delete(self, request, business_id, role_id, *args, **kwargs):
        role = self.get_object(request.business, role_id)

        serializer = RoleDeleteSerializer(
            data={},
            context={"role": role},
        )
        serializer.is_valid(raise_exception=True)

        result = serializer.save()
        return Response(result, status=status.HTTP_200_OK)