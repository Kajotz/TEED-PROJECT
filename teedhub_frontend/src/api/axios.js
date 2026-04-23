// src/api/axios.js
import axios from "axios";

const baseURL =
  import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "") ||
  import.meta.env.VITE_API_URL?.replace(/\/$/, "") ||
  "http://127.0.0.1:8000/api";

const api = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
  },
});

function getAccessToken() {
  return (
    localStorage.getItem("access_token") ||
    localStorage.getItem("access") ||
    sessionStorage.getItem("access_token") ||
    sessionStorage.getItem("access") ||
    null
  );
}

function getRefreshToken() {
  return (
    localStorage.getItem("refresh_token") ||
    localStorage.getItem("refresh") ||
    sessionStorage.getItem("refresh_token") ||
    sessionStorage.getItem("refresh") ||
    null
  );
}

function clearAuthStorage() {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
  localStorage.removeItem("access");
  localStorage.removeItem("refresh");
  sessionStorage.removeItem("access_token");
  sessionStorage.removeItem("refresh_token");
  sessionStorage.removeItem("access");
  sessionStorage.removeItem("refresh");
}

api.interceptors.request.use(
  (config) => {
    const token = getAccessToken();

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (
      error?.response?.status === 401 &&
      !originalRequest?._retry &&
      !String(originalRequest?.url || "").includes("/auth/token/refresh/")
    ) {
      originalRequest._retry = true;

      const refresh = getRefreshToken();

      if (!refresh) {
        clearAuthStorage();
        return Promise.reject(error);
      }

      try {
        const refreshResponse = await axios.post(
          `${baseURL}/auth/token/refresh/`,
          { refresh },
          {
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        const newAccess = refreshResponse?.data?.access;

        if (!newAccess) {
          throw new Error("Refresh succeeded but no access token was returned.");
        }

        if (localStorage.getItem("access_token") !== null) {
          localStorage.setItem("access_token", newAccess);
        } else if (localStorage.getItem("access") !== null) {
          localStorage.setItem("access", newAccess);
        } else if (sessionStorage.getItem("access_token") !== null) {
          sessionStorage.setItem("access_token", newAccess);
        } else {
          sessionStorage.setItem("access", newAccess);
        }

        originalRequest.headers.Authorization = `Bearer ${newAccess}`;
        return api(originalRequest);
      } catch (refreshError) {
        clearAuthStorage();
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;