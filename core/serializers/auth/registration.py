from django.contrib.auth import get_user_model
from dj_rest_auth.registration.serializers import RegisterSerializer
from rest_framework import serializers

from core.services.account_state import ensure_account_baseline

User = get_user_model()


def build_unique_username(base_value: str | None = None) -> str:
    cleaned = (base_value or "").strip().replace(" ", "_")
    cleaned = "".join(ch for ch in cleaned if ch.isalnum() or ch in {"_", "."})
    cleaned = cleaned[:50] if cleaned else ""

    base_username = cleaned or "user"
    username = base_username
    counter = 1

    while User.objects.filter(username=username).exists():
        username = f"{base_username}{counter}"
        counter += 1

    return username


class CustomRegisterSerializer(RegisterSerializer):
    """
    Minimal email registration serializer.

    Signup should only create the auth user.
    Missing username / phone / country will be handled later by
    the account completion flow.
    """

    email = serializers.EmailField(required=True)
    password1 = serializers.CharField(write_only=True, required=True)
    password2 = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = User
        fields = ("email", "password1", "password2")

    def validate_email(self, value):
        value = (value or "").strip().lower()

        if not value:
            raise serializers.ValidationError("Email is required.")

        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("This email is already registered.")

        return value

    def get_cleaned_data(self):
        return {
            "email": self.validated_data.get("email", "").strip().lower(),
            "password1": self.validated_data.get("password1", ""),
            "password2": self.validated_data.get("password2", ""),
        }

    def save(self, request=None):
        user = super().save(request)

        email = (self.validated_data.get("email") or "").strip().lower()
        username_seed = email.split("@")[0] if "@" in email else None

        updates = []

        if email and user.email != email:
            user.email = email
            updates.append("email")

        if not user.username:
            user.username = build_unique_username(username_seed)
            updates.append("username")

        if updates:
            user.save(update_fields=updates)

        ensure_account_baseline(user)
        return user