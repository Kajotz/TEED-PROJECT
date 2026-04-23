from django.urls import path

from core.views.rbac.business_access import BusinessAccessView
from core.views.rbac.business_members import BusinessMemberListView
from core.views.rbac.invites import (
    AcceptInviteView,
    ApproveRequestView,
    DeclineInviteView,
    InviteListCreateView,
    MyInvitesListView,
    RequestAccessView,
    RevokeInviteView,
)
from core.views.rbac.member_roles import AssignMemberRoleView
from core.views.rbac.member_status import ActivateMemberView, DeactivateMemberView
from core.views.rbac.permissions import (
    PermissionCatalogView,
    RolePermissionListAssignView,
    RolePermissionRemoveView,
)
from core.views.rbac.rbac_summary import RBACSummaryView
from core.views.rbac.remove_member import RemoveMemberView
from core.views.rbac.remove_member_role import RemoveMemberRoleView
from core.views.rbac.roles_list_create import RoleListCreateView

urlpatterns = [
    path("businesses/<uuid:business_id>/access/", BusinessAccessView.as_view(), name="business-access"),
    path("businesses/<uuid:business_id>/members/", BusinessMemberListView.as_view(), name="business-members"),
    path(
        "businesses/<uuid:business_id>/members/<uuid:member_id>/",
        RemoveMemberView.as_view(),
        name="remove-member",
    ),
    path(
        "businesses/<uuid:business_id>/members/<uuid:member_id>/roles/",
        AssignMemberRoleView.as_view(),
        name="assign-member-role",
    ),
    path(
        "businesses/<uuid:business_id>/members/<uuid:member_id>/roles/<uuid:role_id>/",
        RemoveMemberRoleView.as_view(),
        name="remove-member-role",
    ),
    path("businesses/<uuid:business_id>/roles/", RoleListCreateView.as_view(), name="role-list-create"),
    path("businesses/<uuid:business_id>/rbac-summary/", RBACSummaryView.as_view(), name="rbac-summary"),

    # invites
    path("businesses/<uuid:business_id>/invites/", InviteListCreateView.as_view(), name="business-invites"),
    path("invites/accept/", AcceptInviteView.as_view(), name="accept-invite"),
    path("invites/me/", MyInvitesListView.as_view(), name="my-invites"),
    path("invites/request/", RequestAccessView.as_view(), name="request-access"),
    path(
        "businesses/<uuid:business_id>/invites/approve/",
        ApproveRequestView.as_view(),
        name="approve-request",
    ),
    path(
        "businesses/<uuid:business_id>/invites/revoke/",
        RevokeInviteView.as_view(),
        name="revoke-invite",
    ),
    path("invites/decline/", DeclineInviteView.as_view(), name="decline-invite"),

    # permissions
    path(
        "businesses/<uuid:business_id>/permissions/",
        PermissionCatalogView.as_view(),
        name="permission-catalog",
    ),
    path(
        "businesses/<uuid:business_id>/roles/<uuid:role_id>/permissions/",
        RolePermissionListAssignView.as_view(),
        name="role-permission-list-assign",
    ),
    path(
        "businesses/<uuid:business_id>/roles/<uuid:role_id>/permissions/<int:permission_id>/",
        RolePermissionRemoveView.as_view(),
        name="role-permission-remove",
    ),

    # member status
    path(
        "businesses/<uuid:business_id>/members/<uuid:member_id>/deactivate/",
        DeactivateMemberView.as_view(),
        name="deactivate-member",
    ),
    path(
        "businesses/<uuid:business_id>/members/<uuid:member_id>/activate/",
        ActivateMemberView.as_view(),
        name="activate-member",
    ),
]