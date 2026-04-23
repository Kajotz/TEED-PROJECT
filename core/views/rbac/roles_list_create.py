from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from core.models import Role
from core.rbac.decorators import require_business_permission
from core.serializers.rbac.roles import RoleCreateSerializer, RoleDetailSerializer


class RoleListCreateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    @require_business_permission("roles.view")
    def get(self, request, business_id):
        roles = Role.objects.filter(business=request.business).order_by("name")
        serializer = RoleDetailSerializer(roles, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @require_business_permission("roles.create")
    def post(self, request, business_id):
        serializer = RoleCreateSerializer(
            data=request.data,
            context={"business": request.business},
        )
        serializer.is_valid(raise_exception=True)
        role = serializer.save()

        response_serializer = RoleDetailSerializer(role)
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)