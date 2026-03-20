from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

from core.models import Business, ActiveBusiness, BusinessMember


class SwitchActiveBusinessView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, business_id):

        user = request.user

        # 1. Check membership using RBAC BusinessMember
        membership = BusinessMember.objects.filter(
            user=user,
            business_id=business_id,
            is_active=True
        ).select_related("business").first()

        if not membership:

            return Response(
                {"detail": "You are not a member of this business."},
                status=status.HTTP_403_FORBIDDEN
            )

        # 2. Switch active business
        ActiveBusiness.objects.update_or_create(
            user=user,
            defaults={"business": membership.business}
        )

        return Response(
            {
                "status": "success",
                "active_business": {
                    "id": membership.business.id,
                    "name": membership.business.name,
                }
            },
            status=status.HTTP_200_OK
        )