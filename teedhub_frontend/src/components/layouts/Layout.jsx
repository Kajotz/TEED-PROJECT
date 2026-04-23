import React from "react";
import { Outlet } from "react-router-dom";

export default function Layout() {
  return (
    <div className="min-h-screen bg-white text-gray-900 transition-colors duration-300 dark:bg-black dark:text-white">
      <Outlet />
    </div>
  );
}