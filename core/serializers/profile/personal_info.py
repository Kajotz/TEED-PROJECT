from django.contrib.auth import get_user_model
from rest_framework import serializers

from core.models import IdentityState, UserProfile

User = get_user_model()


class PersonalInfoSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(source="user.email", read_only=True)
    username = serializers.CharField(source="user.username", read_only=True)
    phone_verified = serializers.SerializerMethodField()
    email_verified = serializers.SerializerMethodField()
    profile_image = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = UserProfile
        fields = [
            "id",
            "email",
            "username",
            "phone_number",
            "phone_country_code",
            "country",
            "phone_verified",
            "email_verified",
            "profile_image",
            "completion_passed",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "email",
            "username",
            "phone_number",
            "phone_country_code",
            "phone_verified",
            "email_verified",
            "profile_image",
            "completion_passed",
            "created_at",
            "updated_at",
        ]

    def get_phone_verified(self, obj):
        identity_state = getattr(obj.user, "identity_state", None)
        return bool(identity_state.phone_verified) if identity_state else False

    def get_email_verified(self, obj):
        identity_state = getattr(obj.user, "identity_state", None)
        return bool(identity_state.email_verified) if identity_state else False

    def get_profile_image(self, obj):
        if obj.profile_image:
            request = self.context.get("request")
            if request:
                return request.build_absolute_uri(obj.profile_image.url)
            return obj.profile_image.url
        return None


class UsernameUpdateSerializer(serializers.Serializer):
    username = serializers.CharField(max_length=150)

    def validate_username(self, value):
        user = self.context["request"].user
        username = value.strip()

        if not username:
            raise serializers.ValidationError("Username is required.")

        exists = (
            User.objects
            .exclude(id=user.id)
            .filter(username=username)
            .exists()
        )
        if exists:
            raise serializers.ValidationError("This username is already taken.")

        return username


class CountryUpdateSerializer(serializers.Serializer):
    country = serializers.ChoiceField(choices=UserProfile.COUNTRY_CHOICES)


class PhoneChangeInitiateSerializer(serializers.Serializer):
    phone_number = serializers.CharField(max_length=20)


class PhoneChangeVerifySerializer(serializers.Serializer):
    session_id = serializers.CharField()
    otp = serializers.CharField(min_length=6, max_length=6)

    def validate_otp(self, value):
        otp = str(value).strip()
        if not otp.isdigit():
            raise serializers.ValidationError("OTP must contain only digits.")
        return otp