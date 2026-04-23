from collections import OrderedDict
from functools import lru_cache


TASKS = OrderedDict({
    "manage_business": "Manage business settings and access context",
    "manage_team": "Invite, remove, and manage members",
    "manage_roles": "Create, edit, and assign roles",
    "manage_content": "Manage social accounts and related content operations",
    "view_reports": "View analytics and reporting",
    "manage_inventory": "Create and update inventory",
    "view_inventory": "View inventory data",
})


TASK_TO_PERMISSIONS = {
    "manage_business": {
        "business.view",
        "business.update",
        "business.delete",
        "business.switch",
        "business_profile.view",
        "business_profile.update",
    },
    "manage_team": {
        "members.view",
        "members.invite",
        "members.update",
        "members.remove",
    },
    "manage_roles": {
        "roles.view",
        "roles.create",
        "roles.update",
        "roles.delete",
        "roles.assign",
    },
    "manage_content": {
        "social_accounts.view",
        "social_accounts.manage",
    },
    "view_reports": {
        "analytics.view",
    },
    "manage_inventory": {
        "inventory.view",
        "inventory.create",
        "inventory.update",
    },
    "view_inventory": {
        "inventory.view",
    },
}


@lru_cache(maxsize=128)
def _expand_cached(tasks_key):
    expanded = set()
    selected = set(tasks_key)
    if "*" in selected:
        for permission_codes in TASK_TO_PERMISSIONS.values():
            expanded.update(permission_codes)
        return frozenset(expanded)

    for task in selected:
        expanded.update(TASK_TO_PERMISSIONS.get(task, set()))
    return frozenset(expanded)


def expand_tasks_to_permissions(tasks):
    tasks_key = tuple(sorted(set(tasks or [])))
    return set(_expand_cached(tasks_key))


def infer_tasks_from_permissions(permission_codes):
    """
    Maps raw permissions to the smallest known task set.
    Returns (tasks, unmapped_permissions).
    """
    remaining = set(permission_codes or [])
    matched_tasks = []

    # Greedy by most coverage first, to keep task list compact.
    ordered_tasks = sorted(
        TASK_TO_PERMISSIONS.items(),
        key=lambda item: len(item[1]),
        reverse=True,
    )

    while remaining:
        best_task = None
        best_coverage = set()

        for task, task_permissions in ordered_tasks:
            coverage = remaining.intersection(task_permissions)
            if len(coverage) > len(best_coverage):
                best_task = task
                best_coverage = coverage

        if not best_task or not best_coverage:
            break

        matched_tasks.append(best_task)
        remaining -= best_coverage

    return matched_tasks, sorted(remaining)

