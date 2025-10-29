"use client";

import React from "react";
import { Outlet } from "react-router-dom";
import BottomNavigationBar from "./BottomNavigationBar";
import AppHeader from "./AppHeader";

const MainLayout: React.FC = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <AppHeader />
      <div className="flex-1 pb-16">
        <Outlet />
      </div>
      <BottomNavigationBar />
    </div>
  );
};

export default MainLayout;