"use client";

import React from "react";
import { Outlet } from "react-router-dom";
import AdminSidebar from "@/components/AdminSidebar";
import AppHeader from "@/components/AppHeader";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import MobileSidebar from "@/components/MobileSidebar"; // Import MobileSidebar
import { useIsMobile } from "@/hooks/use-mobile"; // Import useIsMobile hook

const AdminDashboard: React.FC = () => {
  const isMobile = useIsMobile();

  return (
    <div className="flex flex-col min-h-screen">
      <AppHeader />
      {isMobile ? (
        <div className="flex-1 flex">
          <MobileSidebar />
          <div className="flex-1 p-4 sm:p-6"> {/* Adjusted padding for mobile */}
            <Outlet />
          </div>
        </div>
      ) : (
        <ResizablePanelGroup
          direction="horizontal"
          className="flex-1"
        >
          <ResizablePanel defaultSize={20} minSize={15} maxSize={25}>
            <AdminSidebar />
          </ResizablePanel>
          <ResizableHandle />
          <ResizablePanel defaultSize={80}>
            <div className="flex-1 p-6">
              <Outlet />
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      )}
    </div>
  );
};

export default AdminDashboard;