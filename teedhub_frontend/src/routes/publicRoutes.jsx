import React from "react";
import Layout from "../components/layouts/Layout";
import Home from "../pages/home/Home";
import Login from "../pages/auth/Login";
import Signup from "../pages/auth/Signup";

import CompleteAccountPage from "../pages/account/CompleteAccountPage";

const ErrorPage = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#252526] px-6">
    <div className="text-center max-w-md">
      <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
        404 - Page Not Found
      </h1>
      <p className="text-gray-600 dark:text-gray-400 mb-6">
        The page you are looking for does not exist.
      </p>
      <a
        href="/"
        className="inline-block px-6 py-3 bg-[#1F75FE] text-white rounded-lg hover:bg-blue-700 transition"
      >
        Go Home
      </a>
    </div>
  </div>
);

export const publicRoutes = [
  {
    element: <Layout />,
    errorElement: <ErrorPage />,
    children: [
      { path: "/", element: <Home /> },
      { path: "/login", element: <Login /> },
      { path: "/signup", element: <Signup /> },
      
      { path: "/complete-account", element: <CompleteAccountPage /> },
    ],
  },
  {
    path: "*",
    element: <ErrorPage />,
  },
];