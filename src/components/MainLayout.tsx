"use client";

import React from "react";
import { Outlet } from "react-router-dom";
import BottomNavigationBar from "./BottomNavigationBar"; // Import the BottomNavigationBar

const MainLayout: React.FC = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex-1 pb-16"> {/* Add padding-bottom to account for the fixed bottom nav */}
        <Outlet />
      </div>
      <BottomNavigationBar />
    </div>
  );
};

export default MainLayout;