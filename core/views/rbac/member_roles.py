from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from core.rbac.decorators import require_business_permission
from core.serializers.rbac import AssignMemberRoleSerializer


class AssignMemberRoleView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    @require_business_permission("roles.assign")
    def post(self, request, business_id, member_id):
        serializer = AssignMemberRoleSerializer(
            data=request.data,
            context={
                "business": request.business,
                "actor_member": request.business_member,
                "target_member_id": member_id,
            },
        )
        serializer.is_valid(raise_exception=True)
        result = serializer.save()

        return Response(result, status=status.HTTP_200_OK)