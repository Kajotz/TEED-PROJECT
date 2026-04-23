from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from core.models import BusinessMember, Role, Permission
from core.rbac.decorators import require_business_permission
from core.rbac.permission_resolver import (
    get_member_roles,
    get_member_permissions,
)


class RBACSummaryView(APIView):
    @require_business_permission("members.view")
    def get(self, request, business_id, *args, **kwargs):
        business = request.business
        member = getattr(request, "business_member", None)

        members_count = BusinessMember.objects.filter(
            business=business,
            is_active=True,
        ).count()

        roles_count = Role.objects.filter(
            business=business,
        ).count()

        permissions_count = Permission.objects.count()

        # 🔥 FIX: real roles + permissions
        role_names = get_member_roles(member) if member else []
        permission_codes = get_member_permissions(member) if member else []

        return Response(
            {
                "members_count": members_count,
                "roles_count": roles_count,
                "permissions_count": permissions_count,

                # 🔥 CRITICAL
                "roles": role_names,
                "permission_codes": permission_codes,
            },
            status=status.HTTP_200_OK,
        )