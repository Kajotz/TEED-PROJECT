from rest_framework import serializers

from core.models import MemberRole, Permission, Role, RolePermission
from core.rbac.tasks import TASKS, expand_tasks_to_permissions, infer_tasks_from_permissions


class RoleCreateSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=100)
    tasks = serializers.ListField(
        child=serializers.ChoiceField(choices=list(TASKS.keys()) + ["*"]),
        required=False,
        allow_empty=True,
    )
    permission_codes = serializers.ListField(
        child=serializers.CharField(),
        required=False,
        allow_empty=True,
    )

    def validate_name(self, value):
        normalized = value.strip()
        if not normalized:
            raise serializers.ValidationError("Role name cannot be empty.")

        business = self.context["business"]

        if Role.objects.filter(
            business=business,
            name__iexact=normalized,
        ).exists():
            raise serializers.ValidationError(
                "A role with this name already exists in this business."
            )

        return normalized

    def create(self, validated_data):
        business = self.context["business"]
        tasks = validated_data.get("tasks", [])
        legacy_permission_codes = set(validated_data.get("permission_codes", []))

        role = Role.objects.create(
            business=business,
            name=validated_data["name"],
            is_locked=False,
        )
        permission_codes = expand_tasks_to_permissions(tasks).union(legacy_permission_codes)
        if permission_codes:
            permissions = list(Permission.objects.filter(code__in=permission_codes))
            RolePermission.objects.bulk_create([
                RolePermission(role=role, permission=permission)
                for permission in permissions
            ])
        return role


class RoleDetailSerializer(serializers.ModelSerializer):
    member_count = serializers.SerializerMethodField()
    permission_count = serializers.SerializerMethodField()
    tasks = serializers.SerializerMethodField()
    task_labels = serializers.SerializerMethodField()
    has_unmapped_permissions = serializers.SerializerMethodField()

    class Meta:
        model = Role
        fields = [
            "id",
            "name",
            "is_locked",
            "created_at",
            "member_count",
            "permission_count",
            "tasks",
            "task_labels",
            "has_unmapped_permissions",
        ]

    def get_member_count(self, obj):
        return obj.role_members.count()

    def get_permission_count(self, obj):
        return obj.role_permissions.count()

    def _role_permission_codes(self, obj):
        return set(
            obj.role_permissions.select_related("permission")
            .values_list("permission__code", flat=True)
        )

    def get_tasks(self, obj):
        tasks, _ = infer_tasks_from_permissions(self._role_permission_codes(obj))
        return tasks

    def get_task_labels(self, obj):
        tasks = self.get_tasks(obj)
        return [
            {"key": task, "label": TASKS.get(task, task)}
            for task in tasks
        ]

    def get_has_unmapped_permissions(self, obj):
        _, unmapped = infer_tasks_from_permissions(self._role_permission_codes(obj))
        return bool(unmapped)


from core.rbac.member_role_rules import is_owner_role


class RoleUpdateSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=100, required=False)
    tasks = serializers.ListField(
        child=serializers.ChoiceField(choices=list(TASKS.keys()) + ["*"]),
        required=False,
        allow_empty=True,
    )
    permission_codes = serializers.ListField(
        child=serializers.CharField(),
        required=False,
        allow_empty=True,
    )

    def validate(self, attrs):
        role = self.context["role"]
        business = self.context["business"]

        if "name" not in attrs and "tasks" not in attrs and "permission_codes" not in attrs:
            raise serializers.ValidationError("No update fields provided.")

        new_name = attrs.get("name")

        if new_name is not None:
            normalized = new_name.strip()

            if not normalized:
                raise serializers.ValidationError({
                    "name": "Role name cannot be empty."
                })

            # 🔴 ONLY OWNER IS BLOCKED
            if is_owner_role(role):
                raise serializers.ValidationError(
                    "Owner role cannot be renamed."
                )

            # optional: block renaming system roles except admin
            # if role.is_locked and role.name.lower() != "admin":
            #     raise serializers.ValidationError(
            #         "This system role cannot be renamed."
            #     )

            exists = Role.objects.filter(
                business=business,
                name__iexact=normalized,
            ).exclude(id=role.id).exists()

            if exists:
                raise serializers.ValidationError({
                    "name": "A role with this name already exists in this business."
                })

            attrs["name"] = normalized

        return attrs

    def save(self, **kwargs):
        role = self.context["role"]

        if "name" in self.validated_data:
            role.name = self.validated_data["name"]
            role.save(update_fields=["name"])

        if "tasks" in self.validated_data or "permission_codes" in self.validated_data:
            permission_codes = expand_tasks_to_permissions(self.validated_data.get("tasks", []))
            permission_codes.update(self.validated_data.get("permission_codes", []))
            permissions = list(Permission.objects.filter(code__in=permission_codes))
            role.role_permissions.all().delete()
            RolePermission.objects.bulk_create([
                RolePermission(role=role, permission=permission)
                for permission in permissions
            ])

        return role


class RoleDeleteSerializer(serializers.Serializer):
    def validate(self, attrs):
        role = self.context["role"]

        if role.is_locked:
            raise serializers.ValidationError(
                "Locked roles cannot be deleted."
            )

        if MemberRole.objects.filter(role=role).exists():
            raise serializers.ValidationError(
                "Cannot delete a role that is still assigned to members."
            )

        if RolePermission.objects.filter(role=role).exists():
            raise serializers.ValidationError(
                "Cannot delete a role that still has permissions assigned."
            )

        return attrs

    def save(self, **kwargs):
        role = self.context["role"]
        role_id = role.id
        role_name = role.name

        role.delete()

        return {
            "detail": "Role deleted successfully.",
            "role_id": role_id,
            "role_name": role_name,
        }