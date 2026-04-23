from django.conf import settings
from django.core.mail import send_mail
from django.db.models import Q
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from core.models import MemberInvite
from core.rbac.decorators import require_business_permission
from core.serializers.rbac.invites import (
    MemberInviteSerializer,
    CreateMemberInviteSerializer,
    AccessRequestSerializer,
    ApproveAccessRequestSerializer,
)
from core.services.account_state import is_identity_verified
from core.services.invitations import (
    create_invite,
    create_request,
    accept_invitation,
    approve_request,
    revoke_invite,
    decline_invite,
)


def _send_invite_email(request, invite: MemberInvite):
    if invite.delivery != MemberInvite.DELIVERY_EMAIL or not invite.email:
        return

    try:
        accept_url = request.build_absolute_uri("/account/home")
        subject = f"You're invited to join {invite.business.name} on TEED Hub"
        role_part = f" as {invite.role.name}" if invite.role else ""
        message = (
            f"You have been invited{role_part} to join {invite.business.name}.\n\n"
            f"Log in to TEED Hub and accept the invite from your account.\n"
            f"Account home: {accept_url}\n\n"
            "If you did not expect this email, ignore it."
        )
        from_email = getattr(settings, "DEFAULT_FROM_EMAIL", "no-reply@example.com")
        send_mail(subject, message, from_email, [invite.email], fail_silently=True)
    except Exception:
        pass


class InviteListCreateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    @require_business_permission("members.view")
    def get(self, request, business_id, *args, **kwargs):
        invites = MemberInvite.objects.filter(
            business=request.business
        ).select_related(
            "business",
            "invited_by",
            "target_user",
            "role",
        ).order_by("-created_at")

        return Response(
            MemberInviteSerializer(invites, many=True).data,
            status=status.HTTP_200_OK,
        )

    @require_business_permission("members.invite")
    def post(self, request, business_id, *args, **kwargs):
        serializer = CreateMemberInviteSerializer(
            data=request.data,
            context={
                "business": request.business,
                "inviter": request.user,
            },
        )
        serializer.is_valid(raise_exception=True)

        invite = create_invite(
            business=request.business,
            inviter=request.user,
            target_user=serializer.validated_data.get("target_user"),
            email=serializer.validated_data.get("email"),
            role=serializer.validated_data.get("role"),
        )

        _send_invite_email(request, invite)

        return Response(
            MemberInviteSerializer(invite).data,
            status=status.HTTP_201_CREATED,
        )


class MyInvitesListView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, *args, **kwargs):
        user = request.user
        invites = MemberInvite.objects.filter(
            Q(target_user=user) | Q(email__iexact=(user.email or ""))
        ).select_related(
            "business",
            "invited_by",
            "target_user",
            "role",
        ).order_by("-created_at")

        return Response(
            MemberInviteSerializer(invites, many=True).data,
            status=status.HTTP_200_OK,
        )


class RequestAccessView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, *args, **kwargs):
        if not is_identity_verified(request.user):
            return Response(
                {"error": "Identity verification required."},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = AccessRequestSerializer(
            data=request.data,
            context={"requester": request.user},
        )
        serializer.is_valid(raise_exception=True)

        req = create_request(
            business=serializer.validated_data["business"],
            requester=request.user,
        )

        return Response(
            MemberInviteSerializer(req).data,
            status=status.HTTP_201_CREATED,
        )


class AcceptInviteView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, *args, **kwargs):
        if not is_identity_verified(request.user):
            return Response(
                {"error": "Identity verification required."},
                status=status.HTTP_403_FORBIDDEN,
            )

        invite_id = request.data.get("invite_id")
        token = request.data.get("token")

        if not invite_id and not token:
            return Response(
                {"error": "invite_id or token required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            if invite_id:
                invite = MemberInvite.objects.select_related(
                    "business",
                    "target_user",
                    "role",
                ).get(id=invite_id)
            else:
                invite = MemberInvite.objects.select_related(
                    "business",
                    "target_user",
                    "role",
                ).get(token=token)
        except MemberInvite.DoesNotExist:
            return Response(
                {"error": "Invitation not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        try:
            member = accept_invitation(invite=invite, acting_user=request.user)
        except Exception as exc:
            return Response(
                {"error": str(exc)},
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response(
            {
                "message": "Invite accepted.",
                "member_id": str(member.id),
                "business_id": str(invite.business_id),
                "role": invite.role.name if invite.role else None,
            },
            status=status.HTTP_200_OK,
        )


class ApproveRequestView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    @require_business_permission("members.invite")
    def post(self, request, business_id, *args, **kwargs):
        serializer = ApproveAccessRequestSerializer(
            data=request.data,
            context={"business": request.business},
        )
        serializer.is_valid(raise_exception=True)

        invite = serializer.validated_data["invite"]
        role = serializer.validated_data["role"]

        try:
            member = approve_request(
                invite=invite,
                approver=request.user,
                role=role,
            )
        except Exception as exc:
            return Response(
                {"error": str(exc)},
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response(
            {
                "message": "Request approved.",
                "member_id": str(member.id),
                "business_id": str(invite.business_id),
                "role": role.name,
            },
            status=status.HTTP_200_OK,
        )


class RevokeInviteView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    @require_business_permission("members.invite")
    def post(self, request, business_id, *args, **kwargs):
        invite_id = request.data.get("invite_id")

        if not invite_id:
            return Response(
                {"error": "invite_id is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            invite = MemberInvite.objects.get(
                id=invite_id,
                business=request.business,
            )
        except MemberInvite.DoesNotExist:
            return Response(
                {"error": "Invitation not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        try:
            revoke_invite(invite=invite, actor=request.user)
        except Exception as exc:
            return Response(
                {"error": str(exc)},
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response(
            {"message": "Invite revoked."},
            status=status.HTTP_200_OK,
        )


class DeclineInviteView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, *args, **kwargs):
        invite_id = request.data.get("invite_id")

        if not invite_id:
            return Response(
                {"error": "invite_id is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            invite = MemberInvite.objects.get(id=invite_id)
        except MemberInvite.DoesNotExist:
            return Response(
                {"error": "Invitation not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        if invite.target_user and invite.target_user != request.user:
            return Response(
                {"error": "Permission denied."},
                status=status.HTTP_403_FORBIDDEN,
            )

        if not invite.target_user:
            invite_email = (invite.email or "").strip().lower()
            user_email = (request.user.email or "").strip().lower()
            if invite_email != user_email:
                return Response(
                    {"error": "Permission denied."},
                    status=status.HTTP_403_FORBIDDEN,
                )

        try:
            decline_invite(invite=invite, actor=request.user)
        except Exception as exc:
            return Response(
                {"error": str(exc)},
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response(
            {"message": "Invite declined."},
            status=status.HTTP_200_OK,
        )