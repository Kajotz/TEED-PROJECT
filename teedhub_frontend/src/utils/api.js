import { API_BASE_URL } from './constants';

/**
 * Utility for making authenticated API calls with automatic token refresh
 */

/**
 * Get the base URL without /api suffix
 */
const getBaseUrl = () => {
  return API_BASE_URL.endsWith('/api') ? API_BASE_URL.slice(0, -4) : API_BASE_URL;
};

/**
 * Refresh the access token using the refresh token
 */
const refreshAccessToken = async () => {
  try {
    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const baseUrl = getBaseUrl();
    const response = await fetch(`${baseUrl}/api/auth/token/refresh/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        refresh: refreshToken,
      }),
    });

    if (!response.ok) {
      throw new Error('Token refresh failed');
    }

    const data = await response.json();
    
    if (data.access) {
      localStorage.setItem('access_token', data.access);
      return data.access;
    }
    
    throw new Error('No access token in refresh response');
  } catch (err) {
    console.error('Token refresh error:', err);
    // Clear auth and redirect to login
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    window.location.href = '/login';
    throw err;
  }
};

/**
 * Make an authenticated API call with automatic token refresh on 401
 */
export const fetchWithAuth = async (url, options = {}) => {
  let token = localStorage.getItem('access_token');
  
  if (!token) {
    console.error('No authentication token found in localStorage');
    console.log('Available localStorage keys:', Object.keys(localStorage));
    window.location.href = '/login';
    throw new Error('No authentication token available');
  }

  console.log('Using token:', token.substring(0, 20) + '...');

  const headers = {
    ...options.headers,
  };

  // Only set Content-Type if body is not FormData
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  // Make initial request with current token
  let response = await fetch(url, {
    ...options,
    headers: {
      ...headers,
      Authorization: `Bearer ${token}`,
    },
  });

  console.log(`Request to ${url} returned status: ${response.status}`);

  // If 401 Unauthorized, try to refresh token and retry once
  if (response.status === 401) {
    console.log('Received 401, attempting to refresh token...');
    try {
      token = await refreshAccessToken();
      response = await fetch(url, {
        ...options,
        headers: {
          ...headers,
          Authorization: `Bearer ${token}`,
        },
      });
      console.log(`Retry request to ${url} returned status: ${response.status}`);
    } catch (err) {
      throw err;
    }
  }

  return response;
};

/**
 * Make a simple authenticated GET request
 */
export const apiGet = (url) => {
  return fetchWithAuth(url, {
    method: 'GET',
  });
};

/**
 * Make a simple authenticated POST request
 */
export const apiPost = (url, data) => {
  return fetchWithAuth(url, {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

/**
 * Make a simple authenticated PATCH request
 */
export const apiPatch = (url, data) => {
  return fetchWithAuth(url, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
};

/**
 * Make a simple authenticated DELETE request
 */
export const apiDelete = (url) => {
  return fetchWithAuth(url, {
    method: 'DELETE',
  });
};
