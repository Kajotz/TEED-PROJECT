from django.contrib.auth import authenticate, get_user_model
from rest_framework import serializers
from rest_framework_simplejwt.tokens import RefreshToken

from core.services.account_state import ensure_account_baseline, get_post_auth_state

User = get_user_model()


class EmailVerificationSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError(
                "This email is already registered. Try logging in instead."
            )
        return value


class EmailVerificationConfirmSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)
    verification_code = serializers.CharField(max_length=6, min_length=6, required=True)

    def validate_verification_code(self, value):
        if not value.isdigit():
            raise serializers.ValidationError("Verification code must contain only digits.")
        return value


class EmailTokenObtainPairSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        email = attrs.get("email")
        password = attrs.get("password")

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            raise serializers.ValidationError("Invalid email or password")

        _, identity_state = ensure_account_baseline(user)

        if not identity_state.email_verified:
            raise serializers.ValidationError({
                "error": "Email not verified",
                "email": email,
                "message": "Please verify your email address first. Check your inbox for the verification code.",
                "next_step": "verify_email",
            })

        user = authenticate(username=user.username, password=password)
        if user is None:
            raise serializers.ValidationError("Invalid email or password")

        refresh = RefreshToken.for_user(user)

        return {
            "refresh": str(refresh),
            "access": str(refresh.access_token),
            "post_auth": get_post_auth_state(user),
        }