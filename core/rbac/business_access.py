# core/rbac/business_access.py

from django.shortcuts import get_object_or_404
from core.models import Business
from core.rbac.permission_resolver import get_member


def get_active_member_or_none(user, business):
    """
    Return active BusinessMember or None.
    """
    return get_member(user, business)


def get_business_for_user_or_404(user, business_id):
    """
    Return a business only if the user is an active member.
    """
    business = get_object_or_404(Business, id=business_id, is_active=True)

    member = get_member(user, business)
    if not member:
        raise Business.DoesNotExist("Business not found or access denied")

    return business, member