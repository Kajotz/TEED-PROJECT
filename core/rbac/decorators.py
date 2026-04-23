# core/rbac/decorators.py

from functools import wraps

from django.http import Http404
from rest_framework import status
from rest_framework.response import Response

from core.rbac.business_access import get_business_for_user_or_404
from core.rbac.permission_resolver import user_has_permission


def require_business_permission(permission_code):
    """
    DRF view-method decorator.

    Expects the wrapped method to receive `business_id` in kwargs.
    If the business is missing or the user is not an active member,
    respond with 403 to avoid leaking business existence.
    """

    def decorator(view_method):
        @wraps(view_method)
        def _wrapped_view(self, request, *args, **kwargs):
            business_id = kwargs.get("business_id")

            if not business_id:
                return Response(
                    {"error": "business_id is required"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            try:
                business, member = get_business_for_user_or_404(
                    request.user,
                    business_id,
                )
            except Http404:
                return Response(
                    {"error": "Business not found or access denied"},
                    status=status.HTTP_403_FORBIDDEN,
                )

            if not member.has_permission(permission_code):
                return Response(
                    {"error": "Permission denied"},
                    status=status.HTTP_403_FORBIDDEN,
                )

            request.business = business
            request.business_member = member

            return view_method(self, request, *args, **kwargs)

        return _wrapped_view

    return decorator