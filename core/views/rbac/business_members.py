from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from core.rbac.decorators import require_business_permission
from core.serializers.rbac import BusinessMemberListSerializer
from core.views.resolvers.business_members import (
    resolve_business_members_queryset,
    serialize_business_members,
)


class BusinessMemberListView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    @require_business_permission("members.view")
    def get(self, request, business_id):
        members = resolve_business_members_queryset(request.business)
        data = serialize_business_members(members, request.business_member)

        serializer = BusinessMemberListSerializer(data=data, many=True)
        serializer.is_valid(raise_exception=True)

        return Response(serializer.data, status=status.HTTP_200_OK)