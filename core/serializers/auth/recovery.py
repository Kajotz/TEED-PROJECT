from rest_framework import serializers

from core.models import RecoveryChallenge, RecoveryMethod
from core.services.recovery import (
    complete_account_recovery,
    create_recovery_method_challenge,
    get_available_recovery_methods,
    initiate_account_recovery,
    resolve_user_for_recovery,
    verify_account_recovery_challenge,
    verify_recovery_method_challenge,
)


class RecoveryMethodSerializer(serializers.ModelSerializer):
    masked_value = serializers.CharField(read_only=True)

    class Meta:
        model = RecoveryMethod
        fields = [
            "id",
            "method_type",
            "value",
            "masked_value",
            "is_verified",
            "is_default",
            "is_active",
            "verified_at",
            "created_at",
        ]
        read_only_fields = [
            "id",
            "masked_value",
            "is_verified",
            "is_default",
            "is_active",
            "verified_at",
            "created_at",
        ]


class AddRecoveryMethodSerializer(serializers.Serializer):
    method_type = serializers.ChoiceField(choices=RecoveryMethod.METHOD_CHOICES)
    value = serializers.CharField()

    def create(self, validated_data):
        user = self.context["request"].user
        recovery_method, challenge = create_recovery_method_challenge(
            user=user,
            method_type=validated_data["method_type"],
            value=validated_data["value"],
        )
        return {
            "recovery_method": recovery_method,
            "challenge": challenge,
        }

    def validate(self, attrs):
        if not attrs.get("value"):
            raise serializers.ValidationError({"value": "This field is required."})
        return attrs


class VerifyRecoveryMethodSerializer(serializers.Serializer):
    challenge_id = serializers.UUIDField()
    code = serializers.CharField(max_length=6)

    def validate(self, attrs):
        user = self.context["request"].user
        challenge = RecoveryChallenge.objects.filter(
            id=attrs["challenge_id"],
            user=user,
            purpose=RecoveryChallenge.PURPOSE_ADD_RECOVERY_METHOD,
        ).select_related("recovery_method").first()

        if not challenge:
            raise serializers.ValidationError({"challenge_id": "Challenge not found."})

        attrs["challenge"] = challenge
        return attrs

    def save(self, **kwargs):
        challenge = self.validated_data["challenge"]
        code = self.validated_data["code"]

        try:
            recovery_method = verify_recovery_method_challenge(challenge, code)
        except ValueError as exc:
            raise serializers.ValidationError({"code": str(exc)})

        return recovery_method


class SetDefaultRecoveryMethodSerializer(serializers.Serializer):
    recovery_method_id = serializers.UUIDField()

    def validate(self, attrs):
        user = self.context["request"].user
        recovery_method = RecoveryMethod.objects.filter(
            id=attrs["recovery_method_id"],
            user=user,
            is_verified=True,
            is_active=True,
        ).first()

        if not recovery_method:
            raise serializers.ValidationError(
                {"recovery_method_id": "Recovery method not found."}
            )

        attrs["recovery_method"] = recovery_method
        return attrs

    def save(self, **kwargs):
        user = self.context["request"].user
        recovery_method = self.validated_data["recovery_method"]

        RecoveryMethod.objects.filter(user=user, is_default=True).update(is_default=False)
        recovery_method.is_default = True
        recovery_method.save(update_fields=["is_default"])
        return recovery_method


class RecoveryLookupSerializer(serializers.Serializer):
    identifier = serializers.CharField()

    def validate_identifier(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError("Identifier is required.")
        return value.strip()

    def get_recovery_options(self):
        identifier = self.validated_data["identifier"]
        user = resolve_user_for_recovery(identifier)

        if not user:
            return []

        methods = get_available_recovery_methods(user)
        return [
            {
                "method_id": str(method.id),
                "type": method.method_type,
                "masked_value": method.masked_value,
                "is_default": method.is_default,
            }
            for method in methods
        ]


class InitiateAccountRecoverySerializer(serializers.Serializer):
    identifier = serializers.CharField()
    method_id = serializers.UUIDField()

    def save(self, **kwargs):
        identifier = self.validated_data["identifier"]
        method_id = self.validated_data["method_id"]

        try:
            user, challenge = initiate_account_recovery(identifier, method_id)
        except ValueError as exc:
            raise serializers.ValidationError({"method_id": str(exc)})

        return {
            "user": user,
            "challenge": challenge,
        }


class VerifyAccountRecoverySerializer(serializers.Serializer):
    challenge_id = serializers.UUIDField()
    code = serializers.CharField(max_length=6)

    def validate(self, attrs):
        challenge = RecoveryChallenge.objects.filter(
            id=attrs["challenge_id"],
            purpose=RecoveryChallenge.PURPOSE_ACCOUNT_RECOVERY,
        ).select_related("user", "recovery_method").first()

        if not challenge:
            raise serializers.ValidationError({"challenge_id": "Challenge not found."})

        attrs["challenge"] = challenge
        return attrs

    def save(self, **kwargs):
        try:
            return verify_account_recovery_challenge(
                self.validated_data["challenge"],
                self.validated_data["code"],
            )
        except ValueError as exc:
            raise serializers.ValidationError({"code": str(exc)})


class CompleteAccountRecoverySerializer(serializers.Serializer):
    challenge_id = serializers.UUIDField()
    new_password = serializers.CharField(min_length=8)

    def validate(self, attrs):
        challenge = RecoveryChallenge.objects.filter(
            id=attrs["challenge_id"],
            purpose=RecoveryChallenge.PURPOSE_ACCOUNT_RECOVERY,
        ).select_related("user").first()

        if not challenge:
            raise serializers.ValidationError({"challenge_id": "Challenge not found."})

        attrs["challenge"] = challenge
        return attrs

    def save(self, **kwargs):
        try:
            return complete_account_recovery(
                self.validated_data["challenge"],
                self.validated_data["new_password"],
            )
        except ValueError as exc:
            raise serializers.ValidationError({"new_password": str(exc)})