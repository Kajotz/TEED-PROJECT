import { AuthGate } from "./routeGuards";

export const appGateRoutes = [
  {
    path: "/app",
    element: <AuthGate />,
  },
];