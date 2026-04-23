from django.contrib.auth.decorators import login_required
from django.contrib.messages import error as error_msg, success
from django.http import Http404
from django.shortcuts import redirect, render
from django.utils.decorators import method_decorator
from django.views import View

from rest_framework import permissions, status
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.response import Response
from rest_framework.views import APIView

from core.services.account_state import get_accessible_memberships


from core.forms import BusinessProfileForm
from core.models import Business, BusinessMember, BusinessProfile
from core.rbac.business_access import get_business_for_user_or_404
from core.rbac.decorators import require_business_permission
from core.rbac.permission_resolver import user_has_permission
from core.serializers.business.business import (
    BusinessCreateSerializer,
    BusinessProfileSerializer,
    BusinessProfileUpdateSerializer,
    BusinessSerializer,
    BusinessUpdateSerializer,
)


class BusinessCreateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = BusinessCreateSerializer(
            data=request.data,
            context={"request": request},
        )

        if not serializer.is_valid():
            return Response(
                {"error": serializer.errors},
                status=status.HTTP_400_BAD_REQUEST,
            )

        business = serializer.save()

        return Response(
            {
                "message": "Business created successfully",
                "id": str(business.id),
                "name": business.name,
                "slug": business.slug,
                "business_type": business.business_type,
            },
            status=status.HTTP_201_CREATED,
        )


class BusinessListView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        memberships = get_accessible_memberships(request.user)

        business_ids = [m.business_id for m in memberships]

        businesses = Business.objects.filter(
            id__in=business_ids,
            is_active=True,
        ).distinct()

        serializer = BusinessSerializer(
            businesses,
            many=True,
            context={"request": request},
        )
        return Response(serializer.data, status=status.HTTP_200_OK)


class BusinessDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def _build_business_payload(self, request, business, membership):
        profile, _ = BusinessProfile.objects.get_or_create(business=business)

        return {
            "business": BusinessSerializer(
                business,
                context={"request": request},
            ).data,
            "profile": BusinessProfileSerializer(
                profile,
                context={"request": request},
            ).data,
            "membership": {
                "id": str(membership.id),
                "role": membership.primary_role(),
                "is_active": membership.is_active,
                "joined_at": (
                    membership.joined_at.isoformat()
                    if membership.joined_at
                    else None
                ),
            },
        }

    def get(self, request, business_id):
        try:
            business, membership = get_business_for_user_or_404(
                request.user,
                business_id,
            )
        except Http404:
            return Response(
                {"error": "Business not found or access denied"},
                status=status.HTTP_403_FORBIDDEN,
            )

        return Response(
            self._build_business_payload(request, business, membership),
            status=status.HTTP_200_OK,
        )

    @require_business_permission("business.update")
    def patch(self, request, business_id):
        business = request.business
        membership = request.business_member

        serializer = BusinessUpdateSerializer(
            business,
            data=request.data,
            partial=True,
            context={"request": request},
        )

        if not serializer.is_valid():
            return Response(
                {"error": serializer.errors},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer.save()

        return Response(
            {
                "message": "Business updated successfully",
                **self._build_business_payload(request, business, membership),
            },
            status=status.HTTP_200_OK,
        )


def get_user_businesses(user):
    business_ids = BusinessMember.objects.filter(
        user=user,
        is_active=True,
    ).values_list("business_id", flat=True)

    return Business.objects.filter(
        id__in=business_ids,
        is_active=True,
    ).distinct()


class _BusinessProfileAPIMixin:
    parser_classes = (MultiPartParser, FormParser)

    def _get_profile_or_403(self, request, business_id):
        try:
            business, membership = get_business_for_user_or_404(
                request.user,
                business_id,
            )
        except Http404:
            return None

        profile, _ = BusinessProfile.objects.get_or_create(business=business)
        return business, profile, membership

    def _build_profile_payload(self, request, business, profile, membership):
        return {
            "business": BusinessSerializer(
                business,
                context={"request": request},
            ).data,
            "profile": BusinessProfileSerializer(
                profile,
                context={"request": request},
            ).data,
            "membership": {
                "id": str(membership.id),
                "role": membership.primary_role(),
                "is_active": membership.is_active,
                "joined_at": (
                    membership.joined_at.isoformat()
                    if membership.joined_at
                    else None
                ),
            },
        }

    def _save_profile(self, request):
        business = request.business
        membership = request.business_member

        profile, _ = BusinessProfile.objects.get_or_create(
            business=business,
        )

        serializer = BusinessProfileUpdateSerializer(
            profile,
            data=request.data,
            partial=True,
            context={"request": request},
        )

        if not serializer.is_valid():
            return Response(
                {"error": serializer.errors},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer.save()
        profile.refresh_from_db()

        return Response(
            {
                "message": "Business profile updated successfully",
                **self._build_profile_payload(
                    request=request,
                    business=business,
                    profile=profile,
                    membership=membership,
                ),
            },
            status=status.HTTP_200_OK,
        )


class BusinessProfileUpdateView(_BusinessProfileAPIMixin, APIView):
    permission_classes = [permissions.IsAuthenticated]

    @require_business_permission("business_profile.update")
    def post(self, request, business_id):
        return self._save_profile(request)

    @require_business_permission("business_profile.update")
    def patch(self, request, business_id):
        return self._save_profile(request)

class MembershipUpdateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    @require_business_permission("members.update")
    def patch(self, request, business_id, member_id):
        business = request.business
        actor = request.business_member

        try:
            target = BusinessMember.objects.get(
                id=member_id,
                business=business,
            )
        except BusinessMember.DoesNotExist:
            return Response(
                {"error": "Member not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        # =========================
        # HARD RULES (STRICT)
        # =========================

        # ❌ Cannot modify owner at all
        if target.has_role("owner"):
            return Response(
                {"error": "Owner cannot be modified"},
                status=status.HTTP_403_FORBIDDEN,
            )

        # ❌ Cannot modify yourself
        if target.id == actor.id:
            return Response(
                {"error": "You cannot modify yourself"},
                status=status.HTTP_403_FORBIDDEN,
            )

        # =========================
        # ACTION: ACTIVATE / DEACTIVATE
        # =========================
        is_active = request.data.get("is_active")

        if not isinstance(is_active, bool):
            return Response(
                {"error": "is_active must be true or false"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        target.is_active = is_active
        target.save(update_fields=["is_active"])

        return Response(
            {
                "message": (
                    "Member activated"
                    if is_active
                    else "Member deactivated"
                ),
                "member_id": str(target.id),
                "is_active": target.is_active,
            },
            status=status.HTTP_200_OK,
        )


@method_decorator(login_required, name="dispatch")
class BusinessSettingsView(View):
    def get(self, request, business_id):
        try:
            business, membership = get_business_for_user_or_404(
                request.user,
                business_id,
            )
        except Http404:
            error_msg(request, "You don't have access to this business.")
            return redirect("home")

        profile, _ = BusinessProfile.objects.get_or_create(
            business=business,
        )
        form = BusinessProfileForm(instance=profile)

        context = {
            "business": business,
            "profile": profile,
            "form": form,
            "membership": membership,
            "is_owner_or_admin": membership.has_any_role(["owner", "admin"]),
        }

        return render(
            request,
            "business/business_settings.html",
            context,
        )

    def post(self, request, business_id):
        try:
            business, membership = get_business_for_user_or_404(
                request.user,
                business_id,
            )
        except Http404:
            error_msg(request, "You don't have access to this business.")
            return redirect("home")

        if not user_has_permission(request.user, business, "business_profile.update"):
            error_msg(request, "You don't have permission to edit business settings.")
            return redirect("business-detail", business_id=business_id)

        profile, _ = BusinessProfile.objects.get_or_create(
            business=business,
        )
        form = BusinessProfileForm(
            request.POST,
            request.FILES,
            instance=profile,
        )

        if form.is_valid():
            form.save()
            success(request, "Business profile updated successfully!")
            return redirect("business-settings", business_id=business_id)

        context = {
            "business": business,
            "profile": profile,
            "form": form,
            "membership": membership,
            "is_owner_or_admin": membership.has_any_role(["owner", "admin"]),
        }

        return render(
            request,
            "business/business_settings.html",
            context,
        )


class BusinessProfileAPIView(_BusinessProfileAPIMixin, APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, business_id):
        result = self._get_profile_or_403(request, business_id)

        if result is None:
            return Response(
                {"error": "Business not found or access denied"},
                status=status.HTTP_403_FORBIDDEN,
            )

        business, profile, membership = result

        return Response(
            self._build_profile_payload(
                request=request,
                business=business,
                profile=profile,
                membership=membership,
            ),
            status=status.HTTP_200_OK,
        )

    @require_business_permission("business_profile.update")
    def post(self, request, business_id):
        return self._save_profile(request)

    @require_business_permission("business_profile.update")
    def patch(self, request, business_id):
        return self._save_profile(request)