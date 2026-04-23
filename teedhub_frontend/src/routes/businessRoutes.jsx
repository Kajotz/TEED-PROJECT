import WorkspaceLayout from "@/components/layouts/WorkspaceLayout";
import { RequireBusinessShell } from "./routeGuards";

import BusinessOverview from "../pages/workspace/wokspacehome/BusinessOverview";

import { profileRoutes } from "./workspace/profileRoutes";
import { rbacRoutes } from "./workspace/rbacRoutes";
import { salesRoutes } from "./workspace/salesRoutes";

export const businessRoutes = [
  {
    element: <RequireBusinessShell />,
    children: [
      {
        path: "/business/:businessId",
        element: <WorkspaceLayout />,
        handle: { title: "Business Overview" },
        children: [
          {
            index: true,
            element: <BusinessOverview />,
            handle: { title: "Business Overview" },
          },

          ...profileRoutes,
          ...rbacRoutes,
          ...salesRoutes,
        ],
      },
    ],
  },
];