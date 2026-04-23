from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from core.models import BusinessMember, MemberRole
from core.rbac.decorators import require_business_permission
from core.rbac.member_role_rules import member_is_owner
from core.rbac.ownership import count_owner_assignments


class RemoveMemberView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    @require_business_permission("members.update")
    def delete(self, request, business_id, member_id, *args, **kwargs):
        business = request.business
        actor_member = request.business_member

        try:
            target_member = BusinessMember.objects.get(
                id=member_id,
                business=business,
            )
        except BusinessMember.DoesNotExist:
            return Response(
                {"error": "Member not found in this business."},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Hard rule: actor cannot remove self
        if target_member.id == actor_member.id:
            return Response(
                {"error": "You cannot remove yourself from this business."},
                status=status.HTTP_403_FORBIDDEN,
            )

        # Hard rule: owner is untouchable in membership actions
        if member_is_owner(target_member):
            return Response(
                {"error": "Owner cannot be removed."},
                status=status.HTTP_403_FORBIDDEN,
            )

        # Safety check: if your rules ever change later and owner removal becomes
        # conditionally allowed, this still blocks deleting the last owner path.
        if member_is_owner(target_member) and count_owner_assignments(business) <= 1:
            return Response(
                {"error": "Cannot remove the last owner from this business."},
                status=status.HTTP_403_FORBIDDEN,
            )

        MemberRole.objects.filter(member=target_member).delete()
        target_member.delete()

        return Response(
            {
                "detail": "Member removed successfully.",
                "member_id": str(target_member.id),
            },
            status=status.HTTP_200_OK,
        )