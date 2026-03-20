# core/rbac/permission_resolver.py

from core.models import BusinessMember, Permission


def get_member(member_user, business):
    """
    Return the active BusinessMember record for a user in a business.
    """
    return BusinessMember.objects.filter(
        user=member_user,
        business=business,
        is_active=True,
    ).first()


def get_member_roles(member):
    """
    Return role names assigned to a member.
    """
    if not member:
        return []

    return list(
        member.member_roles.select_related("role").values_list("role__name", flat=True)
    )


def get_member_permissions(member):
    """
    Return permission codes resolved through the member's roles.
    """
    if not member:
        return []

    return list(
        Permission.objects.filter(
            permission_roles__role__role_members__member=member
        ).distinct().values_list("code", flat=True)
    )


def member_has_role(member, role_name):
    """
    Check whether a member has a specific role.
    """
    if not member:
        return False

    return member.member_roles.filter(role__name=role_name).exists()


def member_has_any_role(member, role_names):
    """
    Check whether a member has any role in the given list.
    """
    if not member:
        return False

    return member.member_roles.filter(role__name__in=role_names).exists()


def member_has_permission(member, permission_code):
    """
    Check whether a member resolves to a specific permission.
    """
    if not member:
        return False

    return Permission.objects.filter(
        permission_roles__role__role_members__member=member,
        code=permission_code,
    ).exists()


def user_has_permission(user, business, permission_code):
    """
    Convenience wrapper: resolve member from user + business, then check permission.
    """
    member = get_member(user, business)
    return member_has_permission(member, permission_code)


def user_has_any_role(user, business, role_names):
    """
    Convenience wrapper: resolve member from user + business, then check roles.
    """
    member = get_member(user, business)
    return member_has_any_role(member, role_names)