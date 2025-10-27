"use client";

import React from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Menu, ChevronLeft } from "lucide-react"; // Changed ChevronLeft to Menu for hamburger icon
import AdminSidebar from "@/components/AdminSidebar";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { useIsMobile } from "@/hooks/use-mobile";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-100 dark:bg-gray-950">
        <div className="flex items-center p-4 border-b dark:border-gray-700 bg-white dark:bg-gray-900">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="mr-2">
                <Menu className="h-6 w-6" /> {/* Hamburger icon */}
                <span className="sr-only">فتح القائمة</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="p-0 w-64">
              <AdminSidebar />
            </SheetContent>
          </Sheet>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">لوحة تحكم المدير</h1>
        </div>
        <div className="flex-1 p-4 overflow-auto">
          <Outlet />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-gray-100 dark:bg-gray-950">
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
  );
};

export default AdminDashboard;