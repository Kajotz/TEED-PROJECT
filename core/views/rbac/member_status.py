from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from core.models import BusinessMember
from core.rbac.decorators import require_business_permission
from core.rbac.member_role_rules import member_is_owner


class DeactivateMemberView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    @require_business_permission("members.update")
    def patch(self, request, business_id, member_id):
        business = request.business
        actor = request.business_member

        try:
            target = BusinessMember.objects.get(
                id=member_id,
                business=business,
            )
        except BusinessMember.DoesNotExist:
            return Response(
                {"error": "Member not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        # ❌ cannot deactivate owner
        if member_is_owner(target):
            return Response(
                {"error": "Owner cannot be deactivated"},
                status=status.HTTP_403_FORBIDDEN,
            )

        # ❌ cannot deactivate yourself
        if target.id == actor.id:
            return Response(
                {"error": "You cannot deactivate yourself"},
                status=status.HTTP_403_FORBIDDEN,
            )

        if not target.is_active:
            return Response(
                {"error": "Member already inactive"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        target.is_active = False
        target.save(update_fields=["is_active"])

        return Response(
            {
                "message": "Member deactivated",
                "member_id": str(target.id),
                "is_active": target.is_active,
            },
            status=status.HTTP_200_OK,
        )


class ActivateMemberView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    @require_business_permission("members.update")
    def patch(self, request, business_id, member_id):
        business = request.business
        actor = request.business_member

        try:
            target = BusinessMember.objects.get(
                id=member_id,
                business=business,
            )
        except BusinessMember.DoesNotExist:
            return Response(
                {"error": "Member not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        # ❌ cannot activate yourself (keeps logic consistent)
        if target.id == actor.id:
            return Response(
                {"error": "You cannot activate yourself"},
                status=status.HTTP_403_FORBIDDEN,
            )

        if target.is_active:
            return Response(
                {"error": "Member already active"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        target.is_active = True
        target.save(update_fields=["is_active"])

        return Response(
            {
                "message": "Member activated",
                "member_id": str(target.id),
                "is_active": target.is_active,
            },
            status=status.HTTP_200_OK,
        )