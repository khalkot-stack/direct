"use client";

import React from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react"; // Changed ChevronLeft to Menu for hamburger icon
import AdminSidebar from "@/components/AdminSidebar";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { useIsMobile } from "@/hooks/use-mobile";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import AppHeader from "@/components/AppHeader"; // Import AppHeader

const AdminDashboard = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-100 dark:bg-gray-950">
        <AppHeader /> {/* Global App Header */}
        <div className="flex items-center p-4 border-b dark:border-gray-700 bg-white dark:bg-gray-900">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="mr-2">
                <Menu className="h-6 w-6" /> {/* Hamburger icon */}
                <span className="sr-only">فتح القائمة</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-64"> {/* Changed side to 'left' */}
              <AdminSidebar />
            </SheetContent>
          </Sheet>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">لوحة تحكم المدير</h1>
        </div>
        <div className="flex-1 p-4 overflow-auto"> {/* Removed pt-16 */}
          <Outlet /> {/* This is where nested routes will render */}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-100 dark:bg-gray-950">
      <AppHeader /> {/* Global App Header */}
      <div className="flex-1 flex"> {/* Flex container for sidebar and content */}
        <ResizablePanelGroup direction="horizontal" className="w-full max-w-screen-2xl mx-auto">
          <ResizablePanel defaultSize={20} minSize={15} maxSize={25}>
            <AdminSidebar />
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize={80}>
            <div className="flex flex-col h-full p-4 overflow-auto">
              <div className="flex items-center justify-between pb-4 border-b dark:border-gray-700 mb-4">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">لوحة تحكم المدير</h1>
                <Button
                  variant="ghost"
                  onClick={() => navigate("/")}
                  className="text-blue-500 hover:underline dark:text-blue-400"
                >
                  العودة للصفحة الرئيسية
                </Button>
              </div>
              <div className="flex-1">
                <Outlet /> {/* This is where nested routes will render */}
              </div>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  );
};

export default AdminDashboard;