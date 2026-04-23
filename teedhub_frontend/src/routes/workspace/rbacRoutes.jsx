import MembersOverview from "@/pages/workspace/rbac/MembersOverview";
import MembersList from "@/pages/workspace/rbac/MembersList";
import RolesPage from "@/pages/workspace/rbac/RolesPage";
import PermissionsPage from "@/pages/workspace/rbac/PermissionsPage";
import InvitesPage from "@/pages/workspace/rbac/InvitesPage";

export const rbacRoutes = [
  {
    path: "members",
    handle: { title: "Members Overview" },
    children: [
      {
        index: true,
        element: <MembersOverview />,
        handle: { title: "Members Overview" },
      },
      {
        path: "list",
        element: <MembersList />,
        handle: { title: "Members" },
      },
      {
        path: "roles",
        element: <RolesPage />,
        handle: { title: "Roles" },
      },
      {
        path: "permissions",
        element: <PermissionsPage />,
        handle: { title: "Permissions" },
      },
      {
        path: "invites",
        element: <InvitesPage />,
        handle: { title: "Invites" },
      },
    ],
  },
];