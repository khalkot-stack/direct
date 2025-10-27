"use client";

import React from "react";
import { Outlet } from "react-router-dom";

const UserLayout: React.FC = () => {
  // ProtectedRoute already ensures the user is authenticated and authorized.
  // This layout simply provides a wrapper for the nested user-specific routes.
  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex-1">
        <Outlet />
      </div>
    </div>
  );
};

export default UserLayout;