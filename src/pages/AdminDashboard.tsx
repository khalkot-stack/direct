"use client";

import React from "react";
import { Outlet } from "react-router-dom";
import AdminSidebar from "@/components/AdminSidebar";
import AppHeader from "@/components/AppHeader";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";

const AdminDashboard: React.FC = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <AppHeader />
      <ResizablePanelGroup
        direction="horizontal"
        className="flex-1"
      >
        <ResizablePanel defaultSize={20} minSize={15} maxSize={25} className="hidden md:block">
          <AdminSidebar />
        </ResizablePanel>
        <ResizableHandle className="hidden md:flex" />
        <ResizablePanel defaultSize={80}>
          <div className="flex-1 p-6">
            <Outlet />
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
};

export default AdminDashboard;