from core.rbac.permission_resolver import (
    get_member_roles,
    get_member_permissions,
)


def resolve_business_members_queryset(business):
    """
    Central queryset resolver for business members.
    Optimized for roles + permissions resolution.
    """
    return (
        business.memberships
        .select_related("user", "user__profile")
        .prefetch_related(
            "member_roles__role",
            "member_roles__role__role_permissions__permission",
        )
        .order_by("-joined_at")
    )


def build_business_member_payload(member, actor_member):
    profile = getattr(member.user, "profile", None)

    roles = get_member_roles(member)
    permissions = get_member_permissions(member)

    can_manage = (
        actor_member.has_permission("members.update")
        or actor_member.has_role("owner")
    )

    return {
        "id": member.id,
        "user_id": member.user.id,
        "username": member.user.username,
        "email": member.user.email,
        "phone_number": profile.phone_number if profile else None,
        "country": profile.country if profile else None,
        "is_active": member.is_active,
        "joined_at": member.joined_at,

        # roles
        "roles": roles,
        "primary_role": member.primary_role(),

        #  NEW → permissions exposed
        "permission_codes": permissions,

        # controls
        "can_edit": can_manage,
        "can_remove": can_manage,
        "can_deactivate": can_manage and member.is_active,
        "can_activate": can_manage and not member.is_active,
    }


def serialize_business_members(members, actor_member):
    return [
        build_business_member_payload(member, actor_member)
        for member in members
    ]