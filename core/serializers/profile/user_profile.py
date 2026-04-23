from django.contrib.auth import get_user_model
from rest_framework import serializers

from core.models import Business, BusinessMember
from core.serializers.business import BusinessListSerializer

User = get_user_model()


class UserProfileSerializer(serializers.ModelSerializer):
    businesses = serializers.SerializerMethodField()
    owned_businesses = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            "id",
            "email",
            "username",
            "first_name",
            "last_name",
            "businesses",
            "owned_businesses",
            "date_joined",
        ]
        read_only_fields = ["id", "email", "date_joined"]

    def get_businesses(self, obj):
        memberships = BusinessMember.objects.filter(
            user=obj,
            is_active=True
        ).select_related("business")

        businesses = [membership.business for membership in memberships]

        serializer = BusinessListSerializer(
            businesses,
            many=True,
            context=self.context
        )
        return serializer.data

    def get_owned_businesses(self, obj):
        owner_business_ids = BusinessMember.objects.filter(
            user=obj,
            is_active=True,
            member_roles__role__name="owner",
        ).values_list("business_id", flat=True)

        owned = Business.objects.filter(
            id__in=owner_business_ids,
            is_active=True
        ).distinct()

        serializer = BusinessListSerializer(
            owned,
            many=True,
            context=self.context
        )
        return serializer.data