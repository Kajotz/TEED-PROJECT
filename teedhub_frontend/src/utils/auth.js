const ACCESS_TOKEN_KEY = "access";
const REFRESH_TOKEN_KEY = "refresh";

export const getAccessToken = () => {
  return sessionStorage.getItem(ACCESS_TOKEN_KEY);
};

export const getRefreshToken = () => {
  return sessionStorage.getItem(REFRESH_TOKEN_KEY);
};

export const setAuthTokens = ({ access, refresh }) => {
  if (access) {
    sessionStorage.setItem(ACCESS_TOKEN_KEY, access);
  }

  if (refresh) {
    sessionStorage.setItem(REFRESH_TOKEN_KEY, refresh);
  }
};

export const clearAuthTokens = () => {
  sessionStorage.removeItem(ACCESS_TOKEN_KEY);
  sessionStorage.removeItem(REFRESH_TOKEN_KEY);
};

export const logout = async () => {
  try {
    const token = getAccessToken();

    if (token) {
      try {
        await fetch("http://localhost:8000/dj-rest-auth/logout/", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
      } catch (err) {
        console.error("Backend logout failed:", err);
      }
    }

    clearAuthTokens();

    window.dispatchEvent(new CustomEvent("logout"));

    window.location.href = "/";
  } catch (err) {
    console.error("Logout error:", err);
    window.location.href = "/";
  }
};