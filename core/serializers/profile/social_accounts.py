from rest_framework import serializers

from core.models import SocialAccount


class SocialAccountSerializer(serializers.ModelSerializer):
    platform_display = serializers.CharField(source="get_platform_display", read_only=True)
    status = serializers.CharField(source="status_display", read_only=True)

    class Meta:
        model = SocialAccount
        fields = [
            "id", "business", "platform", "platform_display", "account_username",
            "account_url", "is_connected", "is_active", "status", "connection_error",
            "followers_count", "profile_image", "bio", "created_at", "updated_at", "last_synced_at"
        ]
        read_only_fields = [
            "id", "platform_display", "status",
            "created_at", "updated_at", "last_synced_at",
            "followers_count", "profile_image", "bio"
        ]
        extra_kwargs = {
            "access_token": {"write_only": True},
            "refresh_token": {"write_only": True},
            "token_expires_at": {"write_only": True}
        }

    def validate_platform(self, value):
        if self.instance:
            return value
        business = self.context.get("business") or self.initial_data.get("business")
        if SocialAccount.objects.filter(business=business, platform=value).exists():
            raise serializers.ValidationError(f"This business already has {value} linked.")
        return value