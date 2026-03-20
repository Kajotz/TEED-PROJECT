from django.db import transaction
from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.utils.decorators import method_decorator
from django.views import View
from rest_framework import status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser

from core.models import Business, BusinessProfile, BusinessMember
from core.serializers import BusinessCreateSerializer, BusinessSerializer
from core.forms import BusinessProfileForm

from django.contrib.messages import success, error as error_msg
from core.rbac.decorators import require_business_permission
from core.rbac.business_access import get_business_for_user_or_404
from core.rbac.permission_resolver import user_has_permission



class BusinessCreateView(APIView):

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = BusinessCreateSerializer(
            data=request.data,
            context={'request': request}
        )

        if not serializer.is_valid():
            return Response(
                {"error": serializer.errors},
                status=status.HTTP_400_BAD_REQUEST
            )

        business = serializer.save()

        return Response(
            {
                "message": "Business created successfully",
                "id": str(business.id),
                "name": business.name,
                "slug": business.slug,
                "business_type": business.business_type
            },
            status=status.HTTP_201_CREATED
        )

class BusinessListView(APIView):

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        business_ids = BusinessMember.objects.filter(
            user=request.user,
            is_active=True
        ).values_list("business_id", flat=True)

        businesses = Business.objects.filter(
            id__in=business_ids,
            is_active=True
        ).distinct()

        serializer = BusinessSerializer(businesses, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class BusinessDetailView(APIView):

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, business_id):
        try:
            business, membership = get_business_for_user_or_404(
                request.user,
                business_id
            )
        except Business.DoesNotExist:
            return Response(
                {"error": "Business not found or access denied"},
                status=status.HTTP_403_FORBIDDEN
            )

        business_serializer = BusinessSerializer(business)

        response_data = {
            "business": business_serializer.data,
            "membership": {
                "id": membership.id,
                "role": membership.primary_role(),
                "is_active": membership.is_active,
                "joined_at": membership.joined_at.isoformat() if membership.joined_at else None,
            }
        }

        return Response(response_data, status=status.HTTP_200_OK)


def get_user_businesses(user):
    business_ids = BusinessMember.objects.filter(
        user=user,
        is_active=True
    ).values_list("business_id", flat=True)

    return Business.objects.filter(
        id__in=business_ids,
        is_active=True
    ).distinct()


class BusinessProfileUpdateView(APIView):

    permission_classes = [permissions.IsAuthenticated]

    @require_business_permission("business_profile.update")
    def post(self, request, business_id):

        business = request.business

        profile, _ = BusinessProfile.objects.get_or_create(
            business=business
        )

        allowed_fields = [
            "logo", "primary_color", "secondary_color", "theme",
            "about", "contact_email", "contact_phone", "website",
            "instagram", "facebook", "tiktok", "whatsapp"
        ]

        for field in allowed_fields:
            if field in request.data:
                setattr(profile, field, request.data[field])

        profile.save()

        return Response(
            {"message": "Business profile updated successfully"},
            status=status.HTTP_200_OK
        )

class MembershipUpdateView(APIView):

    permission_classes = [permissions.IsAuthenticated]

    @require_business_permission("members.update")
    def post(self, request, business_id, user_id):
        business = request.business
        requester_membership = request.business_member

        try:
            member = BusinessMember.objects.get(
                user_id=user_id,
                business=business
            )
        except BusinessMember.DoesNotExist:
            return Response(
                {"error": "Member not found"},
                status=status.HTTP_404_NOT_FOUND
            )

        if member.has_role("owner") and not requester_membership.has_role("owner"):
            return Response(
                {"error": "Cannot modify the owner"},
                status=status.HTTP_403_FORBIDDEN
            )

        is_active = request.data.get("is_active")

        if isinstance(is_active, bool):
            member.is_active = is_active
            member.save()

        return Response(
            {"message": "Membership updated successfully"},
            status=status.HTTP_200_OK
        )


@method_decorator(login_required, name='dispatch')
class BusinessSettingsView(View):

    def get(self, request, business_id):
        try:
            business, membership = get_business_for_user_or_404(
                request.user,
                business_id
            )
        except Business.DoesNotExist:
            error_msg(request, "You don't have access to this business.")
            return redirect('home')

        profile, _ = BusinessProfile.objects.get_or_create(
            business=business
        )
        form = BusinessProfileForm(instance=profile)

        context = {
            'business': business,
            'profile': profile,
            'form': form,
            'membership': membership,
            'is_owner_or_admin': membership.has_any_role(["owner", "admin"]),
        }

        return render(
            request,
            'business/business_settings.html',
            context
        )

    def post(self, request, business_id):
        try:
            business, membership = get_business_for_user_or_404(
                request.user,
                business_id
            )
        except Business.DoesNotExist:
            error_msg(request, "You don't have access to this business.")
            return redirect('home')

        if not user_has_permission(request.user, business, "business_profile.update"):
            error_msg(request, "You don't have permission to edit business settings.")
            return redirect('business-detail', business_id=business_id)

        profile, _ = BusinessProfile.objects.get_or_create(
            business=business
        )
        form = BusinessProfileForm(
            request.POST,
            request.FILES,
            instance=profile
        )

        if form.is_valid():
            form.save()
            success(request, "Business profile updated successfully!")
            return redirect('business-settings', business_id=business_id)

        context = {
            'business': business,
            'profile': profile,
            'form': form,
            'membership': membership,
            'is_owner_or_admin': membership.has_any_role(["owner", "admin"]),
        }

        return render(
            request,
            'business/business_settings.html',
            context
        )

class BusinessProfileAPIView(APIView):

    permission_classes = [permissions.IsAuthenticated]
    parser_classes = (MultiPartParser, FormParser)

    def get(self, request, business_id):
        try:
            business = Business.objects.get(
                id=business_id,
                memberships__user=request.user,
                memberships__is_active=True,
                is_active=True
            )

            profile, _ = BusinessProfile.objects.get_or_create(business=business)

            return Response({
                'id': profile.id,
                'logo': profile.logo.url if profile.logo else None,
                'primary_color': profile.primary_color or '#1F75FE',
                'secondary_color': profile.secondary_color or '#f2a705',
                'about': profile.about or '',
                'contact_email': profile.contact_email or '',
                'contact_phone': profile.contact_phone or '',
                'website': profile.website or '',
            }, status=status.HTTP_200_OK)

        except Business.DoesNotExist:
            return Response(
                {'error': 'Business not found or access denied'},
                status=status.HTTP_403_FORBIDDEN
            )

    @require_business_permission("business_profile.update")
    def post(self, request, business_id):
        business = request.business

        profile, _ = BusinessProfile.objects.get_or_create(
            business=business
        )

        form = BusinessProfileForm(
            request.POST,
            request.FILES,
            instance=profile
        )

        if form.is_valid():
            form.save()
            return Response(
                {'message': 'Business profile updated successfully'},
                status=status.HTTP_200_OK
            )

        return Response(
            {'error': form.errors},
            status=status.HTTP_400_BAD_REQUEST
        )