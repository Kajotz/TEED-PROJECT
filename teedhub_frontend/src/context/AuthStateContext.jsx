import React, {
  createContext,
  useContext,
  useMemo,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";

import { apiGet, AuthError } from "../utils/api";
import { clearAuthTokens, getAccessToken } from "../utils/auth";

const AuthStateContext = createContext(null);

const AUTH_STATE_CHANGED_EVENT = "teed:auth-state-changed";

export const defaultAuthState = {
  authenticated: false,
  identity_verified: false,
  account_completed: false,
  has_business_access: false,
  has_pending_membership: false,
  shell: null,
  next_step: null,
  missing_fields: [],
  accessible_business_ids: [],
  active_business_id: null,
  pending_invites_count: 0,
  profile_summary: {
    id: null,
    email: "",
    username: "",
    first_name: "",
    last_name: "",
    phone_number: "",
    country: "",
    avatar_url: "",
  },
};

const normalizeMissingFields = (fields) => {
  const rawFields = Array.isArray(fields) ? fields : [];

  return rawFields.map((field) =>
    field === "mobile_number" ? "phone_number" : field
  );
};

const normalizeProfileSummary = (profile = {}) => {
  return {
    id: profile?.id ?? null,
    email: profile?.email ?? "",
    username: profile?.username ?? "",
    first_name: profile?.first_name ?? "",
    last_name: profile?.last_name ?? "",
    phone_number: profile?.phone_number ?? "",
    country: profile?.country ?? "",
    avatar_url: profile?.avatar_url ?? "",
  };
};

const normalizeAccessibleBusinessIds = (ids) => {
  if (!Array.isArray(ids)) return [];
  return ids.filter(Boolean);
};

const normalizeActiveBusinessId = (backendState, accessibleBusinessIds) => {
  const activeBusinessId = backendState?.active_business_id ?? null;

  if (!activeBusinessId) return null;

  return accessibleBusinessIds.includes(activeBusinessId)
    ? activeBusinessId
    : null;
};

const normalizeAuthState = (backendState = {}, profileSummary = null) => {
  const missingFields = normalizeMissingFields(backendState?.missing_fields);
  const accessibleBusinessIds = normalizeAccessibleBusinessIds(
    backendState?.accessible_business_ids
  );
  const activeBusinessId = normalizeActiveBusinessId(
    backendState,
    accessibleBusinessIds
  );

  return {
    ...defaultAuthState,
    ...backendState,
    missing_fields: missingFields,
    account_completed: missingFields.length === 0,
    accessible_business_ids: accessibleBusinessIds,
    active_business_id: activeBusinessId,
    pending_invites_count: Number(backendState?.pending_invites_count || 0),
    profile_summary: normalizeProfileSummary(
      profileSummary ||
        backendState?.profile_summary ||
        backendState?.profile ||
        backendState?.user
    ),
  };
};

export const notifyAuthStateChanged = () => {
  window.dispatchEvent(new CustomEvent(AUTH_STATE_CHANGED_EVENT));
};

export const AuthStateProvider = ({ children }) => {
  const [authState, setAuthState] = useState(defaultAuthState);
  const [authStateLoading, setAuthStateLoading] = useState(true);
  const [authStateResolved, setAuthStateResolved] = useState(false);

  const refreshPromiseRef = useRef(null);

  const resetAuthState = useCallback(() => {
    setAuthState(defaultAuthState);
    setAuthStateLoading(false);
    setAuthStateResolved(true);
  }, []);

  const setAuthStateFromBackend = useCallback(
    (backendState, profileSummary = null) => {
      const normalizedState = normalizeAuthState(backendState, profileSummary);

      setAuthState(normalizedState);
      setAuthStateResolved(true);

      return normalizedState;
    },
    []
  );

  const fetchProfileSummary = useCallback(async () => {
    try {
      const response = await apiGet("/api/profile/");

      if (!response.ok) {
        return defaultAuthState.profile_summary;
      }

      const profile = await response.json();
      return normalizeProfileSummary(profile);
    } catch (error) {
      return defaultAuthState.profile_summary;
    }
  }, []);

  const refreshAuthState = useCallback(async () => {
    if (refreshPromiseRef.current) {
      return refreshPromiseRef.current;
    }

    const accessToken = getAccessToken();

    if (!accessToken) {
      resetAuthState();
      return defaultAuthState;
    }

    const refreshPromise = (async () => {
      setAuthStateLoading(true);

      try {
        const response = await apiGet("/api/auth/post-auth-state/");

        if (!response.ok) {
          throw new Error(`Auth state refresh failed: ${response.status}`);
        }

        const backendState = await response.json();

        let profileSummary = defaultAuthState.profile_summary;

        if (backendState?.authenticated) {
          profileSummary = await fetchProfileSummary();
        }

        return setAuthStateFromBackend(backendState, profileSummary);
      } catch (error) {
        console.error("Auth state refresh failed:", error);

        if (error instanceof AuthError) {
          clearAuthTokens();
          resetAuthState();
          return defaultAuthState;
        }

        setAuthStateResolved(true);
        throw error;
      } finally {
        setAuthStateLoading(false);
      }
    })();

    refreshPromiseRef.current = refreshPromise;

    try {
      return await refreshPromise;
    } finally {
      refreshPromiseRef.current = null;
    }
  }, [fetchProfileSummary, resetAuthState, setAuthStateFromBackend]);

  useEffect(() => {
    refreshAuthState().catch(() => {});
  }, [refreshAuthState]);

  useEffect(() => {
    const handleWindowFocus = () => {
      refreshAuthState().catch(() => {});
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        refreshAuthState().catch(() => {});
      }
    };

    const handleAuthStateChanged = () => {
      refreshAuthState().catch(() => {});
    };

    window.addEventListener("focus", handleWindowFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener(AUTH_STATE_CHANGED_EVENT, handleAuthStateChanged);

    return () => {
      window.removeEventListener("focus", handleWindowFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener(
        AUTH_STATE_CHANGED_EVENT,
        handleAuthStateChanged
      );
    };
  }, [refreshAuthState]);

  useEffect(() => {
    if (!authState?.authenticated) return;

    const interval = window.setInterval(() => {
      if (document.visibilityState !== "visible") return;
      refreshAuthState().catch(() => {});
    }, 15000);

    return () => window.clearInterval(interval);
  }, [authState?.authenticated, refreshAuthState]);

  const value = useMemo(
    () => ({
      authState,
      authStateLoading,
      authStateResolved,
      resetAuthState,
      refreshAuthState,
      setAuthStateFromBackend,
      notifyAuthStateChanged,
    }),
    [
      authState,
      authStateLoading,
      authStateResolved,
      resetAuthState,
      refreshAuthState,
      setAuthStateFromBackend,
    ]
  );

  return (
    <AuthStateContext.Provider value={value}>
      {children}
    </AuthStateContext.Provider>
  );
};

export const useAuthState = () => {
  const context = useContext(AuthStateContext);

  if (!context) {
    throw new Error("useAuthState must be used inside AuthStateProvider");
  }

  return context;
};