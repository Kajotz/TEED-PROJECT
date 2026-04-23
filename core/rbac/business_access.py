# core/rbac/business_access.py

from django.http import Http404
from django.shortcuts import get_object_or_404

from core.models import Business
from core.rbac.permission_resolver import get_member


def get_active_member_or_none(user, business):
    """
    Return active BusinessMember only if it has at least one role.
    Otherwise return None.
    """
    member = get_member(user, business)

    if not member or not member.is_active or not member.roles_qs().exists():
        return None

    return member


def get_business_for_user_or_404(user, business_id):
    """
    Return (business, member) only if:
    - business exists and is active
    - user is an active member
    - member has at least one role

    Otherwise raise Http404.
    """
    business = get_object_or_404(Business, id=business_id, is_active=True)

    member = get_member(user, business)

    if not member or not member.is_active or not member.roles_qs().exists():
        raise Http404("Business not found")

    return business, member