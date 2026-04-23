from django.utils import timezone
from django.db import transaction
from django.core.exceptions import ValidationError

from core.models import MemberInvite, BusinessMember, MemberRole


def _mark_expired_if_needed(invite: MemberInvite):
    if invite.status == MemberInvite.STATUS_PENDING and invite.is_expired():
        invite.status = MemberInvite.STATUS_EXPIRED
        invite.save(update_fields=["status", "updated_at"])


def _validate_target_not_existing_member(*, business, target_user=None, email=None):
    if target_user and BusinessMember.objects.filter(
        business=business,
        user=target_user,
        is_active=True,
    ).exists():
        raise ValidationError("User is already a member of this business.")

    if email and BusinessMember.objects.filter(
        business=business,
        user__email__iexact=email,
        is_active=True,
    ).exists():
        raise ValidationError("A member with this email already exists in this business.")


def _validate_no_duplicate_pending(*, business, target_user=None, email=None, invite_type=None):
    queryset = MemberInvite.objects.filter(
        business=business,
        status=MemberInvite.STATUS_PENDING,
    )

    if invite_type:
        queryset = queryset.filter(type=invite_type)

    if target_user and queryset.filter(target_user=target_user).exists():
        raise ValidationError("A pending invite or request already exists for this user and business.")

    if email and queryset.filter(email__iexact=email).exists():
        raise ValidationError("A pending invite already exists for this email and business.")


def create_invite(*, business, inviter=None, target_user=None, email=None, role=None, expires_days=7):
    if not role:
        raise ValidationError("Role is required for direct invites.")

    if not (target_user or email):
        raise ValidationError("target_user or email is required.")

    _validate_target_not_existing_member(
        business=business,
        target_user=target_user,
        email=email,
    )

    _validate_no_duplicate_pending(
        business=business,
        target_user=target_user,
        email=email,
        invite_type=MemberInvite.TYPE_INVITE,
    )

    resolved_email = email or (target_user.email if target_user else None)
    delivery = (
        MemberInvite.DELIVERY_LOCAL
        if target_user
        else MemberInvite.DELIVERY_EMAIL
    )

    expires_at = timezone.now() + timezone.timedelta(days=expires_days)

    invite = MemberInvite.objects.create(
        type=MemberInvite.TYPE_INVITE,
        delivery=delivery,
        business=business,
        invited_by=inviter,
        target_user=target_user,
        email=resolved_email,
        role=role,
        expires_at=expires_at,
    )
    return invite


def create_request(*, business, requester, expires_days=14):
    if BusinessMember.objects.filter(
        business=business,
        user=requester,
        is_active=True,
    ).exists():
        raise ValidationError("You are already a member of this business.")

    _validate_no_duplicate_pending(
        business=business,
        target_user=requester,
        email=requester.email,
        invite_type=MemberInvite.TYPE_REQUEST,
    )

    expires_at = timezone.now() + timezone.timedelta(days=expires_days)

    req = MemberInvite.objects.create(
        type=MemberInvite.TYPE_REQUEST,
        delivery=MemberInvite.DELIVERY_LOCAL,
        business=business,
        invited_by=None,
        target_user=requester,
        email=requester.email or None,
        role=None,
        expires_at=expires_at,
    )
    return req


@transaction.atomic
def accept_invitation(*, invite: MemberInvite, acting_user):
    _mark_expired_if_needed(invite)

    if invite.status != MemberInvite.STATUS_PENDING:
        raise ValidationError("Invitation is not pending.")

    if invite.type != MemberInvite.TYPE_INVITE:
        raise ValidationError("Only direct invites can be accepted here.")

    if not invite.role:
        raise ValidationError("This invite has no role assigned and cannot be accepted.")

    if invite.target_user and invite.target_user != acting_user:
        raise ValidationError("You are not the target of this invitation.")

    if not invite.target_user:
        invite_email = (invite.email or "").strip().lower()
        user_email = (acting_user.email or "").strip().lower()

        if not invite_email or invite_email != user_email:
            raise ValidationError("This invitation was sent to a different email.")

    member, _ = BusinessMember.objects.get_or_create(
        business=invite.business,
        user=acting_user,
        defaults={"is_active": True},
    )

    if not member.is_active:
        member.is_active = True
        member.save(update_fields=["is_active"])

    MemberRole.objects.get_or_create(
        member=member,
        role=invite.role,
    )

    invite.status = MemberInvite.STATUS_ACCEPTED
    if invite.target_user is None:
        invite.target_user = acting_user
    invite.save(update_fields=["status", "target_user", "updated_at"])

    return member


@transaction.atomic
def approve_request(*, invite: MemberInvite, approver, role):
    _mark_expired_if_needed(invite)

    if invite.type != MemberInvite.TYPE_REQUEST:
        raise ValidationError("Only requests can be approved.")

    if invite.status != MemberInvite.STATUS_PENDING:
        raise ValidationError("Request is not pending.")

    if not invite.target_user:
        raise ValidationError("Request has no target user.")

    if not role:
        raise ValidationError("Role is required to approve a request.")

    invite.invited_by = approver
    invite.role = role
    invite.save(update_fields=["invited_by", "role", "updated_at"])

    member, _ = BusinessMember.objects.get_or_create(
        business=invite.business,
        user=invite.target_user,
        defaults={"is_active": True},
    )

    if not member.is_active:
        member.is_active = True
        member.save(update_fields=["is_active"])

    MemberRole.objects.get_or_create(
        member=member,
        role=role,
    )

    invite.status = MemberInvite.STATUS_ACCEPTED
    invite.save(update_fields=["status", "updated_at"])

    return member


def revoke_invite(*, invite: MemberInvite, actor=None):
    _mark_expired_if_needed(invite)

    if invite.status != MemberInvite.STATUS_PENDING:
        raise ValidationError("Only pending invites can be revoked.")

    invite.status = MemberInvite.STATUS_REVOKED
    invite.save(update_fields=["status", "updated_at"])
    return invite


def decline_invite(*, invite: MemberInvite, actor=None):
    _mark_expired_if_needed(invite)

    if invite.status != MemberInvite.STATUS_PENDING:
        raise ValidationError("Only pending invites can be declined.")

    invite.status = MemberInvite.STATUS_DECLINED
    invite.save(update_fields=["status", "updated_at"])
    return invite