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

// User Profile API calls
export const userService = {
  // Get user profile with all businesses
  getProfile: async () => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}${ENDPOINTS.USER_PROFILE}`,
        getAuthHeader()
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Update user profile
  updateProfile: async (data) => {
    try {
      const response = await axios.put(
        `${API_BASE_URL}${ENDPOINTS.USER_PROFILE}`,
        data,
        getAuthHeader()
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get businesses organized by role
  getBusinessesByRole: async () => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}${ENDPOINTS.USER_BUSINESSES}`,
        getAuthHeader()
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

export default userService;
