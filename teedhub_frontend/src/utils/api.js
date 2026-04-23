import { API_BASE_URL } from "./constants";
import {
  getAccessToken,
  getRefreshToken,
  setAuthTokens,
  clearAuthTokens,
} from "./auth";

const normalizeBaseUrl = () => {
  return API_BASE_URL.endsWith("/")
    ? API_BASE_URL.slice(0, -1)
    : API_BASE_URL;
};

const buildApiUrl = (path) => {
  const baseUrl = normalizeBaseUrl();

  if (!path) {
    throw new Error("API path is required");
  }

  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }

  if (!path.startsWith("/")) {
    throw new Error(`API path must start with "/": received "${path}"`);
  }

  return `${baseUrl}${path}`;
};

export class AuthError extends Error {
  constructor(message = "Authentication failed") {
    super(message);
    this.name = "AuthError";
  }
}

const handleAuthFailure = (message) => {
  clearAuthTokens();
  throw new AuthError(message);
};

const parseJsonSafely = async (response) => {
  const contentType = response.headers.get("content-type") || "";

  if (!contentType.includes("application/json")) {
    const rawText = await response.text();
    throw new Error(
      `Expected JSON response, got "${contentType}". Response starts with: ${rawText.slice(0, 200)}`
    );
  }

  return response.json();
};

const refreshAccessToken = async () => {
  const refreshToken = getRefreshToken();

  if (!refreshToken) {
    handleAuthFailure("No refresh token available");
  }

  const response = await fetch(buildApiUrl("/api/auth/token/refresh/"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ refresh: refreshToken }),
  });

  if (!response.ok) {
    handleAuthFailure(`Token refresh failed: ${response.status}`);
  }

  const data = await parseJsonSafely(response);

  if (!data.access) {
    handleAuthFailure("No access token in refresh response");
  }

  setAuthTokens({ access: data.access, refresh: refreshToken });
  return data.access;
};

const prepareBody = (data) => {
  if (data === undefined || data === null) {
    return undefined;
  }

  if (data instanceof FormData) {
    return data;
  }

  return JSON.stringify(data);
};

export const fetchWithAuth = async (path, options = {}) => {
  let token = getAccessToken();

  if (!token) {
    handleAuthFailure("No authentication token available");
  }

  const url = buildApiUrl(path);

  const headers = {
    ...(options.headers || {}),
  };

  if (!(options.body instanceof FormData) && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  let response = await fetch(url, {
    ...options,
    headers: {
      ...headers,
      Authorization: `Bearer ${token}`,
    },
  });

  if (response.status === 401) {
    token = await refreshAccessToken();

    response = await fetch(url, {
      ...options,
      headers: {
        ...headers,
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.status === 401) {
      handleAuthFailure("Authentication failed after token refresh");
    }
  }

  return response;
};

export const apiGet = (path, options = {}) =>
  fetchWithAuth(path, {
    method: "GET",
    ...options,
  });

export const apiPost = (path, data, options = {}) =>
  fetchWithAuth(path, {
    method: "POST",
    body: prepareBody(data),
    ...options,
  });

export const apiPatch = (path, data, options = {}) =>
  fetchWithAuth(path, {
    method: "PATCH",
    body: prepareBody(data),
    ...options,
  });

export const apiDelete = (path, options = {}) =>
  fetchWithAuth(path, {
    method: "DELETE",
    ...options,
  });