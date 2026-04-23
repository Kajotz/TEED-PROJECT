DEFAULT_ROLE_TASKS = {
    "owner": [
        "*",
    ],

    "admin": [
        "manage_business",
        "manage_team",
        "manage_roles",
        "manage_content",
        "view_reports",
        "manage_inventory",
    ],

    "manager": [
        "manage_team",
        "manage_content",
        "view_reports",
        "manage_inventory",
    ],

    "staff": [
        "manage_content",
        "view_reports",
        "view_inventory",
    ],
}