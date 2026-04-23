from core.models import BusinessMember, IdentityState, UserProfile


def ensure_account_baseline(user):
    profile, _ = UserProfile.objects.get_or_create(user=user)
    identity_state, _ = IdentityState.objects.get_or_create(user=user)
    return profile, identity_state


def is_placeholder_username(user) -> bool:
    """
    Treat auto-generated temporary usernames as incomplete.
    This mainly targets phone-created placeholder accounts.

    Examples treated as incomplete:
    - user_ab12cd34
    - user_1234567890
    """
    username = (user.username or "").strip()
    email = (user.email or "").strip().lower()

    if not username:
        return True

    if email.endswith("@phone.local") and username.startswith("user_"):
        return True

    return False


def needs_username_completion(user) -> bool:
    return is_placeholder_username(user)


def needs_phone_completion(profile, identity_state) -> bool:
    """
    If the phone has already been verified and stored, do not ask for it again.
    """
    if identity_state.phone_verified and (profile.phone_number or "").strip():
        return False

    return not (profile.phone_number or "").strip()


def needs_country_completion(profile) -> bool:
    """
    Country is considered complete if either:
    - profile.country is set
    - or phone_country_code exists and can be used to prefill country
    """
    if (profile.country or "").strip():
        return False

    if (profile.phone_country_code or "").strip():
        return False

    return True


def get_missing_completion_fields(user, profile=None, identity_state=None):
    if profile is None or identity_state is None:
        profile, identity_state = ensure_account_baseline(user)

    missing = []

    if needs_username_completion(user):
        missing.append("username")

    if needs_phone_completion(profile, identity_state):
        missing.append("phone_number")

    if needs_country_completion(profile):
        missing.append("country")

    return missing


def is_identity_verified(user):
    _, identity_state = ensure_account_baseline(user)
    return bool(identity_state.email_verified or identity_state.phone_verified)


def is_account_completed(user):
    profile, identity_state = ensure_account_baseline(user)
    missing_fields = get_missing_completion_fields(user, profile, identity_state)
    return len(missing_fields) == 0


def get_active_memberships(user):
    return (
        BusinessMember.objects
        .filter(user=user, is_active=True, business__is_active=True)
        .select_related("business")
        .prefetch_related("member_roles__role")
    )


def get_accessible_memberships(user):
    memberships = get_active_memberships(user)
    return [membership for membership in memberships if membership.roles_qs().exists()]


def has_business_access(user):
    return len(get_accessible_memberships(user)) > 0


def has_pending_membership(user):
    memberships = get_active_memberships(user)
    return any(not membership.roles_qs().exists() for membership in memberships)


def get_post_auth_state(user):
    profile, identity_state = ensure_account_baseline(user)

    identity_verified = bool(
        identity_state.email_verified or identity_state.phone_verified
    )

    missing_fields = get_missing_completion_fields(user, profile, identity_state)
    account_completed = len(missing_fields) == 0

    accessible_memberships = get_accessible_memberships(user)
    business_access = len(accessible_memberships) > 0
    pending_membership = has_pending_membership(user)

    if not identity_verified:
        next_step = "verify_identity"
        shell = None
    elif not account_completed:
        next_step = "completion_gate"
        shell = None
    elif business_access:
        next_step = "business_shell"
        shell = "business"
    elif pending_membership:
        next_step = "access_pending"
        shell = "account"
    else:
        next_step = "account_shell"
        shell = "account"

    return {
        "authenticated": True,
        "identity_verified": identity_verified,
        "account_completed": account_completed,
        "has_business_access": business_access,
        "has_pending_membership": pending_membership,
        "shell": shell,
        "next_step": next_step,
        "missing_fields": missing_fields,
        "accessible_business_ids": [
            str(membership.business_id) for membership in accessible_memberships
        ],
    }