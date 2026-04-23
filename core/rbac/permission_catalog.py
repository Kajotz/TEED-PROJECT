# core/rbac/permission_catalog.py

PERMISSION_CATALOG = {
    "business": [
        ("business.view", "View business details"),
        ("business.update", "Update business settings"),
        ("business.delete", "Delete business"),
        ("business.switch", "Switch active business"),
    ],
    "members": [
        ("members.view", "View business members"),
        ("members.invite", "Invite new members"),
        ("members.update", "Update member roles and status"),
        ("members.remove", "Remove members from business"),
    ],
    "roles": [
        ("roles.view", "View business roles"),
        ("roles.create", "Create custom roles"),
        ("roles.update", "Update roles"),
        ("roles.delete", "Delete roles"),
        ("roles.assign", "Assign roles to members"),
    ],
    "analytics": [
        ("analytics.view", "View analytics"),
    ],
    "social_accounts": [
        ("social_accounts.view", "View linked social accounts"),
        ("social_accounts.manage", "Manage linked social accounts"),
    ],
    "business_profile": [
        ("business_profile.view", "View business profile"),
        ("business_profile.update", "Update business profile"),
    ],
    "inventory": [
        ("inventory.view", "View inventory"),
        ("inventory.create", "Create inventory items"),
        ("inventory.update", "Update inventory items"),
    ],
}