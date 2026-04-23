from django.db import transaction
from django.utils.text import slugify
from rest_framework import serializers

from core.models import Business, BusinessMember, BusinessProfile, MemberRole, Role


class BusinessProfileSerializer(serializers.ModelSerializer):
    logo = serializers.SerializerMethodField()

    class Meta:
        model = BusinessProfile
        fields = [
            "id",
            "logo",
            "primary_color",
            "secondary_color",
            "theme",
            "about",
            "contact_email",
            "contact_phone",
            "website",
            "instagram",
            "facebook",
            "tiktok",
            "whatsapp",
        ]

    def get_logo(self, obj):
        request = self.context.get("request")
        if not obj.logo:
            return None

        try:
            url = obj.logo.url
        except Exception:
            return None

        if request is not None:
            return request.build_absolute_uri(url)
        return url


class BusinessProfileUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = BusinessProfile
        fields = [
            "logo",
            "primary_color",
            "secondary_color",
            "theme",
            "about",
            "contact_email",
            "contact_phone",
            "website",
            "instagram",
            "facebook",
            "tiktok",
            "whatsapp",
        ]

    def validate_primary_color(self, value):
        value = (value or "").strip()
        if value and (len(value) != 7 or not value.startswith("#")):
            raise serializers.ValidationError(
                "Primary color must be a valid hex color like #1F75FE."
            )
        return value

    def validate_secondary_color(self, value):
        value = (value or "").strip()
        if value and (len(value) != 7 or not value.startswith("#")):
            raise serializers.ValidationError(
                "Secondary color must be a valid hex color like #f2a705."
            )
        return value

    def validate_theme(self, value):
        return (value or "").strip()

    def validate_about(self, value):
        return (value or "").strip()

    def validate_contact_email(self, value):
        return (value or "").strip().lower()

    def validate_contact_phone(self, value):
        return (value or "").strip()

    def validate_website(self, value):
        return (value or "").strip()

    def validate_instagram(self, value):
        return (value or "").strip()

    def validate_facebook(self, value):
        return (value or "").strip()

    def validate_tiktok(self, value):
        return (value or "").strip()

    def validate_whatsapp(self, value):
        return (value or "").strip()

    def update(self, instance, validated_data):
        for field, value in validated_data.items():
            setattr(instance, field, value)
        instance.save()
        return instance


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
            member.member_roles.select_related("role").values_list(
                "role__name",
                flat=True,
            )
        )


class BusinessSerializer(serializers.ModelSerializer):
    class Meta:
        model = Business
        fields = [
            "id",
            "name",
            "slug",
            "business_type",
            "is_active",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "slug", "created_at", "updated_at"]


class BusinessUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Business
        fields = ["name", "business_type"]

    def validate_name(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError("Business name cannot be empty")
        return value.strip()


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
                business=business,
            )

            return business