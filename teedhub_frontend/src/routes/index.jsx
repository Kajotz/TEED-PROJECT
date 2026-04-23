import { createBrowserRouter } from "react-router-dom";
import { publicRoutes } from "./publicRoutes";
import { appGateRoutes } from "./appGateRoutes";
import { accountRoutes } from "./accountRoutes";
import { businessRoutes } from "./businessRoutes";

export const router = createBrowserRouter([
  ...publicRoutes,
  ...appGateRoutes,
  ...accountRoutes,
  ...businessRoutes,
]);