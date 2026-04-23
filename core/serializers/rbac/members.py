from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import serializers

from core.models import BusinessMember, MemberRole, Role
from core.rbac.member_role_rules import can_manage_target_member, is_owner_role
from core.rbac.ownership import would_leave_business_without_owner


class BusinessMemberListSerializer(serializers.Serializer):
    # membership identity
    id = serializers.UUIDField()

    # user identity
    user_id = serializers.UUIDField()
    username = serializers.CharField()
    email = serializers.EmailField()

    # profile
    phone_number = serializers.CharField(allow_null=True, required=False)
    country = serializers.CharField(allow_null=True, required=False)

    # membership state
    is_active = serializers.BooleanField()
    joined_at = serializers.DateTimeField()

    # roles
    roles = serializers.SerializerMethodField()
    primary_role = serializers.SerializerMethodField()

    # permissions
    permission_codes = serializers.SerializerMethodField()

    # control flags
    can_edit = serializers.BooleanField()
    can_remove = serializers.BooleanField()
    can_deactivate = serializers.BooleanField()
    can_activate = serializers.BooleanField()

    def get_roles(self, obj):
        return obj.get("roles", [])

    def get_primary_role(self, obj):
        return obj.get("primary_role")

    def get_permission_codes(self, obj):
        return obj.get("permission_codes", [])


class AssignMemberRoleSerializer(serializers.Serializer):
    role_id = serializers.UUIDField()

    def validate(self, attrs):
        business = self.context["business"]
        actor_member = self.context["actor_member"]
        target_member_id = self.context["target_member_id"]
        role_id = attrs["role_id"]

        try:
            target_member = BusinessMember.objects.get(
                id=target_member_id,
                business=business,
                is_active=True,
            )
        except BusinessMember.DoesNotExist:
            raise serializers.ValidationError({
                "member": "Member not found in this business."
            })

        try:
            role = Role.objects.get(
                id=role_id,
                business=business,
            )
        except Role.DoesNotExist:
            raise serializers.ValidationError({
                "role": "Role not found in this business."
            })

        if not can_manage_target_member(
            actor_member=actor_member,
            target_member=target_member,
        ):
            raise serializers.ValidationError(
                "Only an owner can modify another owner."
            )

        if is_owner_role(role) and not actor_member.has_role("owner"):
            raise serializers.ValidationError({
                "role": "Only an owner can assign the owner role."
            })

        attrs["target_member"] = target_member
        attrs["role"] = role
        attrs["actor_member"] = actor_member
        return attrs

    def save(self, **kwargs):
        target_member = self.validated_data["target_member"]
        new_role = self.validated_data["role"]

        existing_member_roles = (
            MemberRole.objects.select_related("role")
            .filter(member=target_member)
        )

        existing_roles = [member_role.role for member_role in existing_member_roles]
        has_same_role = any(role.id == new_role.id for role in existing_roles)
        removable_existing_roles = [
            role for role in existing_roles if not is_owner_role(role)
        ]

        if has_same_role and len(removable_existing_roles) == 1:
            return {
                "detail": "Member already has this role.",
                "member_id": target_member.id,
                "role_id": new_role.id,
                "created": False,
                "replaced": False,
            }

        removed_role_ids = []

        for member_role in existing_member_roles:
            current_role = member_role.role

            if is_owner_role(current_role):
                continue

            if current_role.id == new_role.id:
                continue

            member_role.delete()
            removed_role_ids.append(current_role.id)

        try:
            _, created = MemberRole.objects.get_or_create(
                member=target_member,
                role=new_role,
            )
        except DjangoValidationError as e:
            raise serializers.ValidationError(
                e.message_dict if hasattr(e, "message_dict") else e.messages
            )

        return {
            "detail": "Role updated successfully." if removed_role_ids else (
                "Role assigned successfully." if created else "Member already has this role."
            ),
            "member_id": target_member.id,
            "role_id": new_role.id,
            "created": created,
            "replaced": bool(removed_role_ids),
            "removed_role_ids": removed_role_ids,
        }


class RemoveMemberRoleSerializer(serializers.Serializer):
    def validate(self, attrs):
        business = self.context["business"]
        member_id = self.context["member_id"]
        role_id = self.context["role_id"]
        actor_member = self.context["actor_member"]

        try:
            member = BusinessMember.objects.get(
                id=member_id,
                business=business,
                is_active=True,
            )
        except BusinessMember.DoesNotExist:
            raise serializers.ValidationError({
                "member": "Member not found in this business."
            })

        try:
            role = Role.objects.get(
                id=role_id,
                business=business,
            )
        except Role.DoesNotExist:
            raise serializers.ValidationError({
                "role": "Role not found in this business."
            })

        try:
            member_role = MemberRole.objects.get(
                member=member,
                role=role,
            )
        except MemberRole.DoesNotExist:
            raise serializers.ValidationError({
                "role": "This member does not have that role."
            })

        if not can_manage_target_member(
            actor_member=actor_member,
            target_member=member,
        ):
            raise serializers.ValidationError(
                "Only an owner can modify another owner."
            )

        if is_owner_role(role):
            raise serializers.ValidationError(
                "Owner role cannot be removed directly."
            )

        if would_leave_business_without_owner(
            business=business,
            member=member,
            role=role,
        ):
            raise serializers.ValidationError(
                "Cannot remove the last owner from this business."
            )

        attrs["member"] = member
        attrs["role"] = role
        attrs["member_role"] = member_role
        return attrs

    def save(self, **kwargs):
        member_role = self.validated_data["member_role"]
        member_role.delete()

        return {
            "detail": "Role removed successfully.",
            "member_id": self.validated_data["member"].id,
            "role_id": self.validated_data["role"].id,
        }