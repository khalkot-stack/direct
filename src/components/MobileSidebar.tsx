"use client";

import React from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import AdminSidebar from "./AdminSidebar";

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
        <AdminSidebar className="border-none" />
      </SheetContent>
    </Sheet>
  );
};

export default MobileSidebar;