from django.contrib.auth import get_user_model
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from core.models import Business, BusinessMember
from core.serializers.business.business import BusinessListSerializer
from core.serializers.profile import UserProfileSerializer
from core.services.account_state import get_accessible_memberships
User = get_user_model()


class UserProfileView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        serializer = UserProfileSerializer(user, context={"request": request})
        return Response(serializer.data, status=status.HTTP_200_OK)

    def put(self, request):
        user = request.user
        allowed_fields = ["first_name", "last_name"]

        for field in allowed_fields:
            if field in request.data:
                setattr(user, field, request.data[field])

        user.save()

        serializer = UserProfileSerializer(user, context={"request": request})
        return Response(
            {"message": "Profile updated successfully", "data": serializer.data},
            status=status.HTTP_200_OK,
        )


class UserBusinessesListView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user

        memberships = get_accessible_memberships(user)

        businesses_by_role = {}

        for membership in memberships:
            role = membership.primary_role() or "member"

            if role not in businesses_by_role:
                businesses_by_role[role] = []

            businesses_by_role[role].append(membership.business)

        response_data = {}

        for role, businesses in businesses_by_role.items():
            serializer = BusinessListSerializer(
                businesses,
                many=True,
                context={"request": request},
            )
            response_data[role] = serializer.data

        return Response(response_data, status=status.HTTP_200_OK)


class BusinessDetailFromUserView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, business_id):
        user = request.user

        accessible_ids = [m.business_id for m in get_accessible_memberships(request.user)]
        if business_id not in accessible_ids:
            return Response(
                {"error": "Business not accessible"},
                status=status.HTTP_403_FORBIDDEN,
            )

        try:
            business = Business.objects.get(
                id=business_id,
                memberships__user=user,
                is_active=True,
            )
        except Business.DoesNotExist:
            return Response(
                {"error": "Business not found or access denied"},
                status=status.HTTP_404_NOT_FOUND,
            )

        membership = BusinessMember.objects.get(
            user=user,
            business=business,
            is_active=True,
        )

        serializer = BusinessListSerializer(
            business,
            context={"request": request},
        )

        data = serializer.data
        data["user_role"] = membership.primary_role()
        data["user_joined_at"] = membership.joined_at

        return Response(data, status=status.HTTP_200_OK)