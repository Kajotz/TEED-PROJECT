// API Configuration
// API Configuration
export const API_BASE_URL = "";

// API Endpoints
export const ENDPOINTS = {
  // User Profile
  USER_PROFILE: '/profile/',
  USER_BUSINESSES: '/profile/businesses/',
  BUSINESS_DETAIL: (id) => `/profile/businesses/${id}/`,

  // Business Management
  ACTIVATE_BUSINESS: (id) => `/businesses/${id}/activate/`,
  UPDATE_BUSINESS_PROFILE: (id) => `/businesses/${id}/profile/`,
};

// Business Types
export const BUSINESS_TYPES = {
  retail: 'Retail',
  service: 'Service',
  online: 'Online',
  creator: 'Creator',
};

// User Roles
export const USER_ROLES = {
  owner: { label: 'Owner', color: '#FF6B6B', priority: 1 },
  admin: { label: 'Admin', color: '#4ECDC4', priority: 2 },
  staff: { label: 'Staff', color: '#45B7D1', priority: 3 },
  analyst: { label: 'Analyst', color: '#96CEB4', priority: 4 },
};

// HTTP Status Codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_ERROR: 500,
};

// Error Messages
export const ERROR_MESSAGES = {
  UNAUTHORIZED: 'You are not authorized. Please log in again.',
  FORBIDDEN: 'You do not have permission to access this resource.',
  NOT_FOUND: 'The resource you are looking for was not found.',
  NETWORK_ERROR: 'Network error. Please check your connection.',
  UNKNOWN_ERROR: 'An unexpected error occurred. Please try again.',
  PROFILE_LOAD_FAILED: 'Failed to load profile. Please try again.',
  BUSINESS_LOAD_FAILED: 'Failed to load business details. Please try again.',
  UPDATE_FAILED: 'Failed to update. Please try again.',
};

// Success Messages
export const SUCCESS_MESSAGES = {
  PROFILE_UPDATED: 'Profile updated successfully!',
  BUSINESS_ACTIVATED: 'Business activated successfully!',
};

// Loading States
export const LOADING_STATES = {
  IDLE: 'idle',
  LOADING: 'loading',
  SUCCESS: 'success',
  ERROR: 'error',
};
