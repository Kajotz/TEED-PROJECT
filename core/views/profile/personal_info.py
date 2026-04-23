"""
Views for managing user personal information (UserProfile) and social accounts.
Refactored to support clean user edit flows:
- read profile
- update username
- update country
- change phone through OTP
- change password
- upload profile image
"""

from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.response import Response

from core.models import Business, BusinessMember, SocialAccount, UserProfile
from core.serializers.profile import (
    CountryUpdateSerializer,
    PersonalInfoSerializer,
    PhoneChangeInitiateSerializer,
    PhoneChangeVerifySerializer,
    SocialAccountSerializer,
    UsernameUpdateSerializer,
)
from core.services.account_state import ensure_account_baseline, get_post_auth_state
from core.services.phone_otp import create_otp_session, verify_otp_session
from core.utils.phone import parse_phone_identity

User = get_user_model()

PHONE_CHANGE_PREFIX = "phone_change_otp"


class PersonalInfoViewSet(viewsets.ViewSet):
    """
    ViewSet for managing user personal information.
    """

    permission_classes = [permissions.IsAuthenticated]
    parser_classes = (JSONParser, MultiPartParser, FormParser)
    http_method_names = ["get", "put", "patch", "post", "head", "options"]

    def _get_profile(self, request):
        profile, _ = UserProfile.objects.get_or_create(user=request.user)
        return profile

    def _get_identity_state(self, request):
        _, identity_state = ensure_account_baseline(request.user)
        return identity_state

    def _serialize_profile(self, request):
        profile = self._get_profile(request)
        serializer = PersonalInfoSerializer(profile, context={"request": request})
        return serializer.data

    @action(detail=False, methods=["get"])
    def get_personal_info(self, request):
        return Response(
            {
                "data": self._serialize_profile(request),
                "post_auth": get_post_auth_state(request.user),
            },
            status=status.HTTP_200_OK,
        )

    @action(detail=False, methods=["patch"])
    def update_username(self, request):
        serializer = UsernameUpdateSerializer(
            data=request.data,
            context={"request": request},
        )
        serializer.is_valid(raise_exception=True)

        request.user.username = serializer.validated_data["username"]
        request.user.save(update_fields=["username"])

        return Response(
            {
                "message": "Username updated successfully.",
                "data": self._serialize_profile(request),
                "post_auth": get_post_auth_state(request.user),
            },
            status=status.HTTP_200_OK,
        )

    @action(detail=False, methods=["patch"])
    def update_country(self, request):
        serializer = CountryUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        profile = self._get_profile(request)
        profile.country = serializer.validated_data["country"]
        profile.save(update_fields=["country", "updated_at"])

        return Response(
            {
                "message": "Country updated successfully.",
                "data": self._serialize_profile(request),
                "post_auth": get_post_auth_state(request.user),
            },
            status=status.HTTP_200_OK,
        )

    @action(detail=False, methods=["post"])
    def initiate_phone_change(self, request):
        serializer = PhoneChangeInitiateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        raw_phone = serializer.validated_data["phone_number"]
        normalized_phone, detected_country = parse_phone_identity(raw_phone)

        exists = (
            UserProfile.objects
            .exclude(user=request.user)
            .filter(phone_number=normalized_phone)
            .exists()
        )
        if exists:
            return Response(
                {"error": "This phone number is already in use."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        result = create_otp_session(PHONE_CHANGE_PREFIX, raw_phone)

        return Response(
            {
                "message": "OTP sent successfully.",
                "session_id": result.session_id,
                "debug_otp": result.debug_otp,
                "preview": {
                    "phone_number": normalized_phone,
                    "phone_country_code": detected_country,
                },
            },
            status=status.HTTP_200_OK,
        )

    @action(detail=False, methods=["post"])
    def verify_phone_change(self, request):
        serializer = PhoneChangeVerifySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        session_id = serializer.validated_data["session_id"]
        otp = serializer.validated_data["otp"]

        try:
            verification = verify_otp_session(PHONE_CHANGE_PREFIX, session_id, otp)
        except Exception as exc:
            return Response(
                {"error": str(exc)},
                status=status.HTTP_400_BAD_REQUEST,
            )

        normalized_phone, detected_country = parse_phone_identity(verification.phone)

        exists = (
            UserProfile.objects
            .exclude(user=request.user)
            .filter(phone_number=normalized_phone)
            .exists()
        )
        if exists:
            return Response(
                {"error": "This phone number is already in use."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        profile = self._get_profile(request)
        identity_state = self._get_identity_state(request)

        profile.phone_number = normalized_phone
        profile.phone_country_code = detected_country

        # keep country editable, but prefill if empty
        if not profile.country:
            profile.country = detected_country

        profile.save(
            update_fields=[
                "phone_number",
                "phone_country_code",
                "country",
                "updated_at",
            ]
        )

        if not identity_state.phone_verified:
            identity_state.phone_verified = True
            identity_state.phone_verified_at = timezone.now()
            identity_state.save(
                update_fields=["phone_verified", "phone_verified_at", "updated_at"]
            )

        return Response(
            {
                "message": "Phone number updated successfully.",
                "data": self._serialize_profile(request),
                "post_auth": get_post_auth_state(request.user),
            },
            status=status.HTTP_200_OK,
        )

    @action(detail=False, methods=["post"])
    def change_password(self, request):
        user = request.user
        old_password = request.data.get("old_password")
        new_password = request.data.get("new_password")
        confirm_password = request.data.get("confirm_password")

        if not all([old_password, new_password, confirm_password]):
            return Response(
                {"error": "All password fields are required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if new_password != confirm_password:
            return Response(
                {"error": "New passwords do not match"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if len(new_password) < 8:
            return Response(
                {"error": "Password must be at least 8 characters long"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not user.check_password(old_password):
            return Response(
                {"error": "Old password is incorrect"},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        user.set_password(new_password)
        user.save()

        return Response(
            {"message": "Password changed successfully"},
            status=status.HTTP_200_OK,
        )

    @action(detail=False, methods=["post"])
    def upload_profile_image(self, request):
        profile = self._get_profile(request)

        if "profile_image" not in request.FILES:
            return Response(
                {"error": "No image file provided"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        profile_image = request.FILES["profile_image"]

        if profile_image.size > 5 * 1024 * 1024:
            return Response(
                {"error": "Image size must be less than 5MB"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        allowed_types = ["image/jpeg", "image/png", "image/gif", "image/webp"]
        if profile_image.content_type not in allowed_types:
            return Response(
                {"error": "Only JPEG, PNG, GIF, and WebP images are allowed"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        profile.profile_image = profile_image
        profile.save(update_fields=["profile_image", "updated_at"])

        return Response(
            {
                "message": "Profile image uploaded successfully",
                "data": self._serialize_profile(request),
            },
            status=status.HTTP_200_OK,
        )


class SocialAccountViewSet(viewsets.ModelViewSet):
    serializer_class = SocialAccountSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = (MultiPartParser, FormParser)

    def get_queryset(self):
        user = self.request.user

        business_ids = BusinessMember.objects.filter(
            user=user,
            is_active=True,
            member_roles__role__name__in=["owner", "manager"],
        ).values_list("business_id", flat=True)

        return SocialAccount.objects.filter(
            business_id__in=business_ids,
        ).select_related("business").distinct()

    def _has_manage_permission(self, user, business):
        return BusinessMember.objects.filter(
            business=business,
            user=user,
            is_active=True,
            member_roles__role__name__in=["owner", "manager"],
        ).exists()

    def create(self, request, *args, **kwargs):
        business_id = request.data.get("business")

        if not business_id:
            return Response(
                {"error": "Business ID is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            business = Business.objects.get(id=business_id)
        except Business.DoesNotExist:
            return Response(
                {"error": "Business not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        if not self._has_manage_permission(request.user, business):
            return Response(
                {"error": "You do not have permission to manage this business"},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = self.get_serializer(
            data=request.data,
            context={"business": business, "request": request},
        )

        if serializer.is_valid():
            serializer.save()
            return Response(
                {
                    "message": "Social account linked successfully",
                    "data": serializer.data,
                },
                status=status.HTTP_201_CREATED,
            )

        return Response(
            {"errors": serializer.errors},
            status=status.HTTP_400_BAD_REQUEST,
        )

    def update(self, request, *args, **kwargs):
        social_account = self.get_object()

        if not self._has_manage_permission(request.user, social_account.business):
            return Response(
                {"error": "You do not have permission to manage this account"},
                status=status.HTTP_403_FORBIDDEN,
            )

        partial = kwargs.pop("partial", False)

        serializer = self.get_serializer(
            social_account,
            data=request.data,
            partial=partial,
            context={"business": social_account.business, "request": request},
        )

        if serializer.is_valid():
            serializer.save()
            return Response(
                {
                    "message": "Social account updated successfully",
                    "data": serializer.data,
                },
                status=status.HTTP_200_OK,
            )

        return Response(
            {"errors": serializer.errors},
            status=status.HTTP_400_BAD_REQUEST,
        )

    def destroy(self, request, *args, **kwargs):
        social_account = self.get_object()

        if not self._has_manage_permission(request.user, social_account.business):
            return Response(
                {"error": "You do not have permission to manage this account"},
                status=status.HTTP_403_FORBIDDEN,
            )

        social_account.delete()

        return Response(
            {"message": "Social account disconnected successfully"},
            status=status.HTTP_204_NO_CONTENT,
        )