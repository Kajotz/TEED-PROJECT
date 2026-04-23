import { Navigate, Outlet } from "react-router-dom";
import { useAuthState } from "../context/AuthStateContext";
import { resolvePostAuthRoute } from "./routeResolver";

const Loading = () => (
  <div className="min-h-screen flex items-center justify-center">
    <p>Checking access...</p>
  </div>
);

/**
 * ROOT GATE
 * Used at app entry (/app)
 * Always redirect based on backend truth
 */
export const AuthGate = () => {
  const { authStateResolved, authState } = useAuthState();

  if (!authStateResolved) return <Loading />;

  const target = resolvePostAuthRoute(authState);

  return <Navigate to={target} replace />;
};

/**
 * HARD PROTECTION
 * Ensures:
 * - user is authenticated
 * - user is not pushed away from valid account pages
 * - user is redirected to the correct flow step when needed
 */
export const RequireAuth = () => {
  const { authStateResolved, authState } = useAuthState();

  if (!authStateResolved) return <Loading />;

  if (!authState?.authenticated) {
    return <Navigate to="/login" replace />;
  }

  const target = resolvePostAuthRoute(authState);
  const currentPath = window.location.pathname;

  // Allow authenticated users to open account pages manually.
  // Account pages are user-level pages, not business-only pages.
  if (currentPath.startsWith("/account")) {
    return <Outlet />;
  }

  if (currentPath !== target) {
    return <Navigate to={target} replace />;
  }

  return <Outlet />;
};

/**
 * FLOW-SPECIFIC GUARDS
 * These prevent accessing wrong sections manually
 */

export const RequireCompletion = () => {
  const { authStateResolved, authState } = useAuthState();

  if (!authStateResolved) return <Loading />;

  if (!authState?.authenticated) {
    return <Navigate to="/login" replace />;
  }

  if (authState?.next_step !== "completion_gate") {
    return <Navigate to={resolvePostAuthRoute(authState)} replace />;
  }

  return <Outlet />;
};

export const RequireVerification = () => {
  const { authStateResolved, authState } = useAuthState();

  if (!authStateResolved) return <Loading />;

  if (!authState?.authenticated) {
    return <Navigate to="/login" replace />;
  }

  if (authState?.next_step !== "verify_identity") {
    return <Navigate to={resolvePostAuthRoute(authState)} replace />;
  }

  return <Outlet />;
};

export const RequireBusinessShell = () => {
  const { authStateResolved, authState } = useAuthState();

  if (!authStateResolved) return <Loading />;

  if (!authState?.authenticated) {
    return <Navigate to="/login" replace />;
  }

  if (authState?.next_step !== "business_shell") {
    return <Navigate to={resolvePostAuthRoute(authState)} replace />;
  }

  return <Outlet />;
};

export const RequireAccountShell = () => {
  const { authStateResolved, authState } = useAuthState();

  if (!authStateResolved) return <Loading />;

  if (!authState?.authenticated) {
    return <Navigate to="/login" replace />;
  }

  // Account pages must remain reachable for both:
  // - users still in account shell
  // - users already inside business shell
  const allowedNextSteps = ["account_shell", "business_shell"];

  if (!allowedNextSteps.includes(authState?.next_step)) {
    return <Navigate to={resolvePostAuthRoute(authState)} replace />;
  }

  return <Outlet />;
};

export const RequirePendingAccess = () => {
  const { authStateResolved, authState } = useAuthState();

  if (!authStateResolved) return <Loading />;

  if (!authState?.authenticated) {
    return <Navigate to="/login" replace />;
  }

  if (authState?.next_step !== "access_pending") {
    return <Navigate to={resolvePostAuthRoute(authState)} replace />;
  }

  return <Outlet />;
};