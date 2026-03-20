import axios from 'axios';
import { API_BASE_URL, ENDPOINTS } from '../utils/constants';

// Get token from localStorage
const getAuthHeader = () => {
  const token = localStorage.getItem('access_token');
  return {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  };
};

// Business API calls
export const businessService = {
  // Get specific business details
  getBusinessDetail: async (businessId) => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}${ENDPOINTS.BUSINESS_DETAIL(businessId)}`,
        getAuthHeader()
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Activate/set business as active
  activateBusiness: async (businessId) => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}${ENDPOINTS.ACTIVATE_BUSINESS(businessId)}`,
        {},
        getAuthHeader()
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Update business profile
  updateBusinessProfile: async (businessId, data) => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}${ENDPOINTS.UPDATE_BUSINESS_PROFILE(businessId)}`,
        data,
        getAuthHeader()
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

export default businessService;
