"use client";

import React from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import AdminSidebar from "./AdminSidebar";
import { DialogTitle, DialogDescription } from "@/components/ui/dialog"; // Import DialogTitle and DialogDescription

interface MobileSidebarProps {
  // className?: string; // Removed unused prop
}

const MobileSidebar: React.FC<MobileSidebarProps> = ({ /* className */ }) => {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">فتح القائمة</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="p-0 w-64">
        <DialogTitle className="sr-only">قائمة التنقل</DialogTitle> {/* Hidden title for accessibility */}
        <DialogDescription className="sr-only">قائمة التنقل الرئيسية للوحة تحكم المدير.</DialogDescription> {/* Hidden description for accessibility */}
        <AdminSidebar className="border-none" />
      </SheetContent>
    </Sheet>
  );
};

export default MobileSidebar;