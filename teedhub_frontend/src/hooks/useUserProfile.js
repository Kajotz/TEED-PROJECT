import { useState, useEffect } from 'react';
import userService from '../api/userService';
import { LOADING_STATES, ERROR_MESSAGES } from '../utils/constants';

/**
 * Hook to fetch user profile with all businesses
 * Returns: { profile, businesses, ownedBusinesses, loading, error, refetch }
 */
export const useUserProfile = () => {
  const [profile, setProfile] = useState(null);
  const [businesses, setBusinesses] = useState([]);
  const [ownedBusinesses, setOwnedBusinesses] = useState([]);
  const [loading, setLoading] = useState(LOADING_STATES.LOADING);
  const [error, setError] = useState(null);

  const fetchProfile = async () => {
    setLoading(LOADING_STATES.LOADING);
    setError(null);

    try {
      const data = await userService.getProfile();

      // Destructure businesses and owned_businesses from response
      const { businesses: userBusinesses, owned_businesses, ...userInfo } = data;

      setProfile(userInfo);
      setBusinesses(userBusinesses || []);
      setOwnedBusinesses(owned_businesses || []);
      setLoading(LOADING_STATES.SUCCESS);
    } catch (err) {
      const errorMsg = handleApiError(err);
      setError(errorMsg);
      setLoading(LOADING_STATES.ERROR);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  return {
    profile,
    businesses,
    ownedBusinesses,
    loading,
    error,
    refetch: fetchProfile,
  };
};

/**
 * Hook to fetch businesses organized by role
 * Returns: { businessesByRole, loading, error, refetch }
 */
export const useBusinessesByRole = () => {
  const [businessesByRole, setBusinessesByRole] = useState({});
  const [loading, setLoading] = useState(LOADING_STATES.LOADING);
  const [error, setError] = useState(null);

  const fetchBusinesses = async () => {
    setLoading(LOADING_STATES.LOADING);
    setError(null);

    try {
      const data = await userService.getBusinessesByRole();
      setBusinessesByRole(data);
      setLoading(LOADING_STATES.SUCCESS);
    } catch (err) {
      const errorMsg = handleApiError(err);
      setError(errorMsg);
      setLoading(LOADING_STATES.ERROR);
    }
  };

  useEffect(() => {
    fetchBusinesses();
  }, []);

  return {
    businessesByRole,
    loading,
    error,
    refetch: fetchBusinesses,
  };
};

/**
 * Hook to update user profile
 * Returns: { updateProfile, loading, error, success }
 */
export const useUpdateProfile = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const updateProfile = async (data) => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      await userService.updateProfile(data);
      setSuccess(true);
      return true;
    } catch (err) {
      const errorMsg = handleApiError(err);
      setError(errorMsg);
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    updateProfile,
    loading,
    error,
    success,
  };
};

/**
 * Helper function to handle API errors
 */
const handleApiError = (error) => {
  if (!error.response) {
    return ERROR_MESSAGES.NETWORK_ERROR;
  }

  const status = error.response.status;

  switch (status) {
    case 401:
      localStorage.removeItem('access_token');
      window.location.href = '/login';
      return ERROR_MESSAGES.UNAUTHORIZED;
    case 403:
      return ERROR_MESSAGES.FORBIDDEN;
    case 404:
      return ERROR_MESSAGES.NOT_FOUND;
    default:
      return error.response.data?.error || ERROR_MESSAGES.UNKNOWN_ERROR;
  }
};
