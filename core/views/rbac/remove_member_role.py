from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from core.rbac.decorators import require_business_permission
from core.serializers.rbac import RemoveMemberRoleSerializer


class RemoveMemberRoleView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    @require_business_permission("roles.assign")
    def delete(self, request, business_id, member_id, role_id, *args, **kwargs):
        serializer = RemoveMemberRoleSerializer(
            data={},
            context={
                "business": request.business,
                "member_id": member_id,
                "role_id": role_id,
                "actor_member": request.business_member,  # 🔥 important
            },
        )

        serializer.is_valid(raise_exception=True)
        result = serializer.save()

        return Response(result, status=status.HTTP_200_OK)