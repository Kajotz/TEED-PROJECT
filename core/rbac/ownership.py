from core.models import MemberRole


OWNER_ROLE_NAME = "owner"


def is_owner_role(role) -> bool:
    """
    Centralized owner-role detection.
    Keep owner identity logic here only.
    """
    return role.name.strip().lower() == OWNER_ROLE_NAME


def count_owner_assignments(business) -> int:
    """
    Counts how many owner role assignments exist in this business.
    """
    return MemberRole.objects.filter(
        member__business=business,
        role__business=business,
        role__name__iexact=OWNER_ROLE_NAME,
    ).count()


def would_leave_business_without_owner(*, business, member, role) -> bool:
    """
    True if removing this role assignment would leave the business
    with zero owner assignments.
    """
    if not is_owner_role(role):
        return False

    owner_assignments = MemberRole.objects.filter(
        member__business=business,
        role__business=business,
        role__name__iexact=OWNER_ROLE_NAME,
    )

    remaining = owner_assignments.exclude(
        member=member,
        role=role,
    )

    return not remaining.exists()