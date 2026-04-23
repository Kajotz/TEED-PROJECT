from django.http import Http404
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from core.rbac.business_access import get_business_for_user_or_404
from core.rbac.permission_resolver import get_member_permissions, get_member_roles
from core.serializers.rbac import BusinessAccessSerializer


class BusinessAccessView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, business_id):
        try:
            business, member = get_business_for_user_or_404(
                request.user,
                business_id,
            )
        except Http404:
            return Response(
                {"error": "Business not found or access denied"},
                status=status.HTTP_403_FORBIDDEN,
            )

        data = {
            "business_id": business.id,
            "member_id": member.id,
            "roles": get_member_roles(member),
            "permissions": get_member_permissions(member),
        }

        serializer = BusinessAccessSerializer(data)
        return Response(serializer.data, status=status.HTTP_200_OK)