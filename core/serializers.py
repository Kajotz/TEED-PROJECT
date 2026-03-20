from dj_rest_auth.registration.serializers import RegisterSerializer
from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.db import transaction
from django.utils.text import slugify

from core.models import (
    BusinessMember,
    Business,
    BusinessProfile,
    UserProfile,
    SocialAccount,
    Role,
    MemberRole,
)

User = get_user_model()


class CustomRegisterSerializer(RegisterSerializer):
    """
    Custom registration serializer that accepts email and profile info.
    Requires: email, password, username_display, phone_number, country
    """
    email = serializers.EmailField(required=True)
    password1 = serializers.CharField(write_only=True, required=True)
    password2 = serializers.CharField(write_only=True, required=True)
    username_display = serializers.CharField(required=True, max_length=100)
    phone_number = serializers.CharField(required=True, max_length=20)
    country = serializers.CharField(required=True, max_length=2)

    class Meta:
        model = User
        fields = ("email", "password1", "password2", "username_display", "phone_number", "country")

    def get_cleaned_data(self):
        return {
            "email": self.validated_data.get("email", ""),
            "password1": self.validated_data.get("password1", ""),
            "password2": self.validated_data.get("password2", ""),
            "username_display": self.validated_data.get("username_display", ""),
            "phone_number": self.validated_data.get("phone_number", ""),
            "country": self.validated_data.get("country", ""),
        }

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("This email is already registered.")
        return value

    def validate_username_display(self, value):
        """Validate that username_display is unique"""
        if UserProfile.objects.filter(username_display=value).exists():
            raise serializers.ValidationError("This username is already taken.")
        return value

    def validate_phone_number(self, value):
        """Validate that phone number is not empty"""
        if not value or not value.strip():
            raise serializers.ValidationError("Phone number is required.")
        return value

    def validate_country(self, value):
        """Validate that country is one of the allowed choices"""
        allowed_countries = ["TZ", "KE", "UG", "BI", "RW", "CD", "ZM"]
        if value not in allowed_countries:
            raise serializers.ValidationError(
                f"Invalid country code. Choose from: {', '.join(allowed_countries)}"
            )
        return value

    def save(self, request=None):
        super().save(request)
        user = User.objects.get(email=self.validated_data["email"])

        # Set username from email if needed
        if not user.username or user.username.startswith("user"):
            user.username = self.validated_data["email"].split("@")[0]
            user.save()

        # Create or update UserProfile with required fields
        profile, created = UserProfile.objects.get_or_create(
            user=user,
            defaults={
                "username_display": self.validated_data["username_display"],
                "phone_number": self.validated_data["phone_number"],
                "country": self.validated_data["country"],
            },
        )

        # If profile already exists, update fields
        if not created:
            profile.username_display = self.validated_data["username_display"]
            profile.phone_number = self.validated_data["phone_number"]
            profile.country = self.validated_data["country"]
            profile.save()

        return user


class BusinessListSerializer(serializers.ModelSerializer):
    roles = serializers.SerializerMethodField()

    class Meta:
        model = Business
        fields = ["id", "name", "slug", "business_type", "is_active", "roles"]

    def get_roles(self, obj):
        request = self.context.get("request")
        if not request:
            return []

        member = BusinessMember.objects.filter(
            user=request.user,
            business=obj,
            is_active=True,
        ).first()

        if not member:
            return []

        return list(
            member.member_roles.select_related("role").values_list("role__name", flat=True)
        )


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


class PersonalInfoSerializer(serializers.ModelSerializer):
    user_email = serializers.EmailField(source="user.email", read_only=True)
    username = serializers.CharField(source="user.username", read_only=True)
    profile_image = serializers.SerializerMethodField(read_only=True)

    def get_profile_image(self, obj):
        """Return full URL for profile image"""
        if obj.profile_image:
            request = self.context.get("request")
            if request:
                image_url = obj.profile_image.url
                return request.build_absolute_uri(image_url)
            return obj.profile_image.url if obj.profile_image.url else None
        return None

    def validate_recovery_email(self, value):
        """Validate that recovery_email is unique across users"""
        if value:
            existing = UserProfile.objects.filter(recovery_email=value).exclude(
                id=self.instance.id if self.instance else None
            )
            if existing.exists():
                raise serializers.ValidationError(
                    "This email is already registered as a recovery email for another account."
                )
        return value

    def validate_recovery_mobile(self, value):
        """Validate that recovery_mobile is unique across users"""
        if value:
            existing = UserProfile.objects.filter(recovery_mobile=value).exclude(
                id=self.instance.id if self.instance else None
            )
            if existing.exists():
                raise serializers.ValidationError(
                    "This mobile number is already registered as a recovery number for another account."
                )
        return value

    class Meta:
        model = UserProfile
        fields = [
            "id", "user_email", "username", "username_display",
            "phone_number", "recovery_email", "recovery_mobile", "country",
            "profile_image", "created_at", "updated_at"
        ]
        read_only_fields = ["id", "user_email", "username", "created_at", "updated_at", "profile_image"]


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


class BusinessSerializer(serializers.ModelSerializer):
    class Meta:
        model = Business
        fields = ["id", "name", "slug", "business_type", "is_active", "created_at", "updated_at"]
        read_only_fields = ["id", "slug", "created_at", "updated_at"]


class BusinessCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Business
        fields = ["name", "business_type"]

    def validate_name(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError("Business name cannot be empty")
        return value.strip()

    def create(self, validated_data):
        user = self.context["request"].user
        base_slug = slugify(validated_data["name"])
        slug = base_slug
        counter = 1

        while Business.objects.filter(slug=slug).exists():
            slug = f"{base_slug}-{counter}"
            counter += 1

        with transaction.atomic():
            business = Business.objects.create(
                name=validated_data["name"],
                business_type=validated_data["business_type"],
                slug=slug,
                is_active=True,
            )

            member = BusinessMember.objects.create(
                user=user,
                business=business,
                is_active=True,
            )

            from core.rbac.bootstrap_roles import bootstrap_business_roles
            bootstrap_business_roles(business)

            owner_role = Role.objects.get(
                business=business,
                name="owner",
            )

            MemberRole.objects.get_or_create(
                member=member,
                role=owner_role,
            )

            BusinessProfile.objects.get_or_create(
                business=business
            )

            return business


# ============================================================
# EMAIL VERIFICATION & ACCOUNT RECOVERY SERIALIZERS
# ============================================================

class EmailVerificationSerializer(serializers.Serializer):
    """Serializer for email verification code request"""
    email = serializers.EmailField(required=True)

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("This email is already registered. Try logging in instead.")
        return value


class EmailVerificationConfirmSerializer(serializers.Serializer):
    """Serializer for confirming email verification code"""
    email = serializers.EmailField(required=True)
    verification_code = serializers.CharField(max_length=6, min_length=6, required=True)

    def validate_verification_code(self, value):
        if not value.isdigit():
            raise serializers.ValidationError("Verification code must contain only digits.")
        return value


class AccountRecoveryCodeSerializer(serializers.Serializer):
    """Serializer for displaying recovery codes to user"""
    code = serializers.CharField(max_length=12)
    display = serializers.CharField(max_length=4)
    id = serializers.CharField()


class RecoveryContactSerializer(serializers.Serializer):
    """Serializer for adding/updating recovery contact"""
    contact_type = serializers.ChoiceField(choices=["email", "phone"], required=True)
    contact_value = serializers.CharField(max_length=255, required=True)

    def validate_contact_value(self, value):
        contact_type = self.initial_data.get("contact_type")

        if contact_type == "email":
            email_serializer = serializers.EmailField()
            try:
                return email_serializer.to_internal_value(value)
            except serializers.ValidationError:
                raise serializers.ValidationError("Invalid email format.")

        elif contact_type == "phone":
            import re
            if not re.match(r"^\+?1?\d{9,14}$", value.replace(" ", "").replace("-", "")):
                raise serializers.ValidationError("Invalid phone number format.")

        return value


class AccountRecoverySerializer(serializers.Serializer):
    """Serializer for account recovery using recovery code"""
    recovery_code = serializers.CharField(max_length=12, min_length=12, required=True)
    new_password = serializers.CharField(
        write_only=True,
        min_length=8,
        required=True,
        help_text="At least 8 characters"
    )
    confirm_password = serializers.CharField(
        write_only=True,
        min_length=8,
        required=True
    )

    def validate_recovery_code(self, value):
        if not value.isdigit():
            raise serializers.ValidationError("Recovery code must contain only digits.")
        return value

    def validate(self, attrs):
        if attrs.get("new_password") != attrs.get("confirm_password"):
            raise serializers.ValidationError({"confirm_password": "Passwords do not match."})
        return attrs


 # ============================================
 # RBAC SERIALIZERS
 # ============================================ 

class BusinessAccessSerializer(serializers.Serializer):
    business_id = serializers.UUIDField()
    member_id = serializers.IntegerField()
    roles = serializers.ListField(
        child=serializers.CharField(),
        read_only=True
    )
    permissions = serializers.ListField(
        child=serializers.CharField(),
        read_only=True
    )

    