import { useState, useEffect } from 'react';
import businessService from '../api/businessService';
import { LOADING_STATES, ERROR_MESSAGES } from '../utils/constants';

/**
 * Hook to fetch business details
 * Returns: { business, loading, error, refetch }
 */
export const useBusiness = (businessId) => {
  const [business, setBusiness] = useState(null);
  const [loading, setLoading] = useState(LOADING_STATES.LOADING);
  const [error, setError] = useState(null);

  const fetchBusiness = async () => {
    if (!businessId) {
      setError('Business ID is required');
      return;
    }

    setLoading(LOADING_STATES.LOADING);
    setError(null);

    try {
      const data = await businessService.getBusinessDetail(businessId);
      setBusiness(data);
      setLoading(LOADING_STATES.SUCCESS);
    } catch (err) {
      const errorMsg = handleApiError(err);
      setError(errorMsg);
      setLoading(LOADING_STATES.ERROR);
    }
  };

  useEffect(() => {
    fetchBusiness();
  }, [businessId]);

  return {
    business,
    loading,
    error,
    refetch: fetchBusiness,
  };
};

/**
 * Hook to activate a business
 * Returns: { activateBusiness, loading, error, success }
 */
export const useActivateBusiness = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const activateBusiness = async (businessId) => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      await businessService.activateBusiness(businessId);
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
    activateBusiness,
    loading,
    error,
    success,
  };
};

/**
 * Hook to update business profile
 * Returns: { updateBusinessProfile, loading, error, success }
 */
export const useUpdateBusinessProfile = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const updateBusinessProfile = async (businessId, data) => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      await businessService.updateBusinessProfile(businessId, data);
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
    updateBusinessProfile,
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
