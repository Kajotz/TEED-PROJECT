/**
 * Router Configuration
 * Set up React Router for business profile navigation
 */

import { createBrowserRouter, Navigate } from 'react-router-dom';
import UserProfilePage from '../pages/UserProfilePage';
import CreateBusinessPage from '../pages/CreateBusinessPage';
import BusinessDetailPage from '../pages/BusinessDetailPage';
// import EditBusinessProfilePage from '../pages/EditBusinessProfilePage'; // Uncomment when you create this
// import ErrorPage from '../pages/ErrorPage'; // Uncomment when you create this

// Simple Error Page component (you can move this to its own file)
const ErrorPage = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#252526]">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
          404 - Page Not Found
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          The resource you are looking for was not found.
        </p>
        <a
          href="/profile"
          className="px-6 py-3 bg-[#1F75FE] text-white rounded-lg hover:bg-blue-700 transition"
        >
          Go to Profile
        </a>
      </div>
    </div>
  );
};

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/profile" replace />,
  },
  {
    path: '/profile',
    element: <UserProfilePage />,
    errorElement: <ErrorPage />,
  },
  {
    path: '/business/create',
    element: <CreateBusinessPage />,
    errorElement: <ErrorPage />,
  },
  {
    path: '/business/:businessId',
    element: <BusinessDetailPage />,
    errorElement: <ErrorPage />,
  },
  // Uncomment when you create the edit page
  // {
  //   path: '/business/:businessId/edit',
  //   element: <EditBusinessProfilePage />,
  //   errorElement: <ErrorPage />,
  // },
  {
    path: '*',
    element: <ErrorPage />,
  },
]);

/**
 * Navigation Helper Functions
 */
export const navigateTo = (navigate, path, options = {}) => {
  navigate(path, { replace: false, ...options });
};

export const goToProfile = (navigate) => {
  navigateTo(navigate, '/profile');
};

export const goToCreateBusiness = (navigate) => {
  navigateTo(navigate, '/business/create');
};

export const goToBusinessDetail = (navigate, businessId) => {
  if (!businessId) {
    console.error('Business ID is required');
    return;
  }
  navigateTo(navigate, `/business/${businessId}`);
};

export const goToEditBusiness = (navigate, businessId) => {
  if (!businessId) {
    console.error('Business ID is required');
    return;
  }
  navigateTo(navigate, `/business/${businessId}/edit`);
};