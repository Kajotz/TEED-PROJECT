from django.contrib.auth import get_user_model
from rest_framework import serializers

from core.models import UserProfile
from core.services.account_state import (
    ensure_account_baseline,
    get_post_auth_state,
    needs_country_completion,
    needs_phone_completion,
    needs_username_completion,
)
from core.utils.phone import parse_phone_identity

User = get_user_model()


class AccountCompletionSerializer(serializers.Serializer):
    username = serializers.CharField(max_length=150, required=False, allow_blank=False)
    phone_number = serializers.CharField(max_length=20, required=False, allow_blank=False)
    country = serializers.ChoiceField(
        choices=UserProfile.COUNTRY_CHOICES,
        required=False,
    )

    def validate_username(self, value):
        user = self.context["request"].user
        value = value.strip()

        if not value:
            raise serializers.ValidationError("Username is required.")

        exists = User.objects.exclude(id=user.id).filter(username=value).exists()
        if exists:
            raise serializers.ValidationError("This username is already taken.")

        return value

    def validate(self, attrs):
        user = self.context["request"].user
        profile, identity_state = ensure_account_baseline(user)

        require_username = needs_username_completion(user)
        require_phone = needs_phone_completion(profile, identity_state)
        require_country = needs_country_completion(profile)

        username = attrs.get("username")
        raw_phone = attrs.get("phone_number")
        country = attrs.get("country")

        errors = {}

        if require_username and not username:
            errors["username"] = "Username is required."

        if require_phone and not raw_phone:
            errors["phone_number"] = "Phone number is required."

        # Country is only required if it is still missing and cannot be derived/stored already
        if require_country and not country and not raw_phone:
            errors["country"] = "Country is required."

        if errors:
            raise serializers.ValidationError(errors)

        # If a phone number is submitted, normalize it and derive phone country automatically.
        if raw_phone:
            normalized_phone, detected_country = parse_phone_identity(raw_phone, country)

            exists = UserProfile.objects.exclude(user=user).filter(
                phone_number=normalized_phone
            ).exists()

            if exists:
                raise serializers.ValidationError(
                    {"phone_number": "This phone number is already in use."}
                )

            attrs["phone_number"] = normalized_phone
            attrs["phone_country_code"] = detected_country

            # If country wasn't explicitly submitted, use derived phone country
            if not country:
                attrs["country"] = detected_country

        # If no country was submitted, but phone country already exists, use that
        if not attrs.get("country") and profile.phone_country_code:
            attrs["country"] = profile.phone_country_code

        return attrs

    def save(self, **kwargs):
        user = self.context["request"].user
        profile, _ = ensure_account_baseline(user)

        username = self.validated_data.get("username")
        phone_number = self.validated_data.get("phone_number")
        phone_country_code = self.validated_data.get("phone_country_code")
        country = self.validated_data.get("country")

        update_user_fields = []
        update_profile_fields = []

        if username:
            user.username = username
            update_user_fields.append("username")

        if update_user_fields:
            user.save(update_fields=update_user_fields)

        if phone_number:
            profile.phone_number = phone_number
            update_profile_fields.append("phone_number")

        if phone_country_code:
            profile.phone_country_code = phone_country_code
            update_profile_fields.append("phone_country_code")

        if country:
            profile.country = country
            update_profile_fields.append("country")

        profile.completion_passed = len(get_post_auth_state(user)["missing_fields"]) == 0

        # recompute completion_passed after staged changes
        if "phone_number" not in update_profile_fields and profile.phone_number:
            pass
        if "country" not in update_profile_fields and profile.country:
            pass

        # save profile first, then recompute final state properly
        if "completion_passed" not in update_profile_fields:
            update_profile_fields.append("completion_passed")

        profile.save(
            update_fields=list(set(update_profile_fields + ["updated_at"]))
        )

        # final recompute after actual save
        final_state = get_post_auth_state(user)

        profile.completion_passed = final_state["account_completed"]
        profile.save(update_fields=["completion_passed", "updated_at"])

        return final_state