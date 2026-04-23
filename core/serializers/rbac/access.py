from rest_framework import serializers


class BusinessAccessSerializer(serializers.Serializer):
    business_id = serializers.UUIDField()
    member_id = serializers.UUIDField()
    roles = serializers.ListField(
        child=serializers.CharField(),
        read_only=True
    )
    permissions = serializers.ListField(
        child=serializers.CharField(),
        read_only=True
    )