from django.contrib.auth import get_user_model
from rest_framework import serializers

from core.models import MemberInvite, Business, BusinessMember, Role

User = get_user_model()


class MemberInviteSerializer(serializers.ModelSerializer):
    business_id = serializers.UUIDField(source="business.id", read_only=True)
    business_name = serializers.CharField(source="business.name", read_only=True)
    business_slug = serializers.CharField(source="business.slug", read_only=True)

    invited_by_id = serializers.UUIDField(source="invited_by.id", read_only=True)
    invited_by_username = serializers.CharField(source="invited_by.username", read_only=True)

    target_user_id = serializers.UUIDField(source="target_user.id", read_only=True)
    target_username = serializers.CharField(source="target_user.username", read_only=True)

    role_id = serializers.UUIDField(source="role.id", read_only=True)
    role_name = serializers.CharField(source="role.name", read_only=True)

    class Meta:
        model = MemberInvite
        fields = (
            "id",
            "type",
            "delivery",
            "business",
            "business_id",
            "business_name",
            "business_slug",
            "invited_by",
            "invited_by_id",
            "invited_by_username",
            "target_user",
            "target_user_id",
            "target_username",
            "email",
            "role",
            "role_id",
            "role_name",
            "status",
            "token",
            "created_at",
            "updated_at",
            "expires_at",
        )


class CreateMemberInviteSerializer(serializers.Serializer):
    email = serializers.EmailField(required=False, allow_blank=True)
    user_id = serializers.UUIDField(required=False)
    username = serializers.CharField(required=False, allow_blank=True)
    role_id = serializers.UUIDField(required=True)

    def validate(self, attrs):
        business = self.context.get("business")
        if business is None:
            raise serializers.ValidationError("Business context missing.")

        email = (attrs.get("email") or "").strip()
        username = (attrs.get("username") or "").strip()
        user_id = attrs.get("user_id")
        role_id = attrs.get("role_id")

        provided_targets = [bool(email), bool(username), user_id is not None]
        if sum(provided_targets) != 1:
            raise serializers.ValidationError(
                "Provide exactly one target: email, username, or user_id."
            )

        try:
            role = Role.objects.get(id=role_id, business=business)
        except Role.DoesNotExist:
            raise serializers.ValidationError(
                {"role_id": "Role not found in this business."}
            )

        target_user = None

        if user_id is not None:
            try:
                target_user = User.objects.get(id=user_id)
            except User.DoesNotExist:
                raise serializers.ValidationError({"user_id": "User not found."})

        elif username:
            try:
                target_user = User.objects.get(username=username)
            except User.DoesNotExist:
                raise serializers.ValidationError({"username": "User not found."})

        if target_user and BusinessMember.objects.filter(
            business=business,
            user=target_user,
            is_active=True,
        ).exists():
            raise serializers.ValidationError(
                "User is already a member of this business."
            )

        attrs["email"] = email or None
        attrs["target_user"] = target_user
        attrs["role"] = role
        return attrs


class AccessRequestSerializer(serializers.Serializer):
    business_id = serializers.UUIDField(required=False)
    business_name = serializers.CharField(required=False, allow_blank=True)

    def validate(self, attrs):
        business_id = attrs.get("business_id")
        business_name = (attrs.get("business_name") or "").strip()

        if not business_id and not business_name:
            raise serializers.ValidationError(
                "business_id or business_name is required."
            )

        business = None

        if business_id:
            try:
                business = Business.objects.get(id=business_id, is_active=True)
            except Business.DoesNotExist:
                raise serializers.ValidationError(
                    {"business_id": "Business not found."}
                )

        if business is None and business_name:
            try:
                business = Business.objects.get(slug=business_name, is_active=True)
            except Business.DoesNotExist:
                raise serializers.ValidationError(
                    {"business_name": "Business not found."}
                )

        attrs["business"] = business
        return attrs


class ApproveAccessRequestSerializer(serializers.Serializer):
    invite_id = serializers.UUIDField(required=True)
    role_id = serializers.UUIDField(required=True)

    def validate(self, attrs):
        business = self.context.get("business")
        invite_id = attrs.get("invite_id")
        role_id = attrs.get("role_id")

        try:
            invite = MemberInvite.objects.get(
                id=invite_id,
                business=business,
                type=MemberInvite.TYPE_REQUEST,
            )
        except MemberInvite.DoesNotExist:
            raise serializers.ValidationError(
                {"invite_id": "Pending request not found."}
            )

        try:
            role = Role.objects.get(id=role_id, business=business)
        except Role.DoesNotExist:
            raise serializers.ValidationError(
                {"role_id": "Role not found in this business."}
            )

        attrs["invite"] = invite
        attrs["role"] = role
        return attrs