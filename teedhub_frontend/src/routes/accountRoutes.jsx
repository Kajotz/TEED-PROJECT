import { Navigate } from "react-router-dom";

import AccountShellLayout from "@/components/layouts/AccountShellLayout";

import AccountHomePage from "../pages/account/AccountHomePage";
import CreateBusinessPage from "../pages/account/CreateBusinessPage";
import SwitchBusinessPage from "../pages/account/SwitchBusinessPage";
import UserProfile from "../pages/account/UserProfilePage";
import UserProfileSetting from "../pages/account/UserProfileSettingPage";
import Security from "../pages/account/SecurityPage";
import RecoveryPage from "../pages/account/RecoveryPage";
import InvitesPage from "../pages/workspace/rbac/InvitesPage";

import {
  RequireAccountShell,
  RequireBusinessShell,
} from "../routes/routeGuards";

/**
 * ACCOUNT ROUTES
 * Accessible when backend routes user to account shell.
 */
export const accountRoutes = [
  {
    element: <RequireBusinessShell />,
    children: [
      {
        path: "/account/switch-business",
        element: <SwitchBusinessPage />,
      },
    ],
  },

  {
    element: <RequireAccountShell />,
    children: [
      {
        path: "/account",
        element: <AccountShellLayout />,
        children: [
          { index: true, element: <Navigate to="home" replace /> },

          {
            path: "home",
            element: <AccountHomePage />,
          },

          {
            path: "invites",
            element: <InvitesPage />,
          },

          {
            path: "create-business",
            element: <CreateBusinessPage />,
          },

          {
            path: "profile",
            element: <UserProfile />,
          },

          {
            path: "settings",
            element: <UserProfileSetting />,
          },

          {
            path: "settings/security",
            element: <Security />,
          },

          {
            path: "settings/security/recovery",
            element: <RecoveryPage />,
          },
        ],
      },
    ],
  },
];