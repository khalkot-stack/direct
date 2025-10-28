"use client";

import React from "react";
import { Outlet } from "react-router-dom";
import BottomNavigationBar from "./BottomNavigationBar"; // Import the BottomNavigationBar
import AppHeader from "./AppHeader"; // Import the new AppHeader

const MainLayout: React.FC = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <AppHeader /> {/* Global App Header */}
      <div className="flex-1 pb-16"> {/* Removed pt-4, keeping padding-bottom for bottom nav */}
        <Outlet />
      </div>
      <BottomNavigationBar />
    </div>
  );
};

export default MainLayout;