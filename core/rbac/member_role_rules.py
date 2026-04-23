# core/rbac/member_role_rules.py

OWNER_ROLE_NAME = "owner"


def normalize_role_name(value: str) -> str:
    return (value or "").strip().lower()


def is_owner_role(role) -> bool:
    return normalize_role_name(role.name) == OWNER_ROLE_NAME


def member_is_owner(member) -> bool:
    if not member:
        return False

    return member.roles_qs().filter(name__iexact=OWNER_ROLE_NAME).exists()


def can_manage_target_member(*, actor_member, target_member) -> bool:
    """
    Rule:
    Only an owner can modify another owner.
    """
    if not actor_member or not target_member:
        return False

    if member_is_owner(target_member) and not member_is_owner(actor_member):
        return False

    return True