"use client";

import React from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Home, Users, Car, Settings } from "lucide-react";
import LogoutButton from "@/components/LogoutButton";

interface AdminSidebarProps {
  className?: string;
}

const AdminSidebar: React.FC<AdminSidebarProps> = ({ className }) => {
  const location = useLocation();

  const navItems = [
    {
      name: "نظرة عامة",
      href: "/admin-dashboard",
      icon: Home,
    },
    {
      name: "إدارة المستخدمين",
      href: "/admin-dashboard/users",
      icon: Users,
    },
    {
      name: "إدارة الرحلات",
      href: "/admin-dashboard/rides",
      icon: Car,
    },
    {
      name: "الإعدادات",
      href: "/admin-dashboard/settings",
      icon: Settings,
    },
  ];

  return (
    <div className={cn("h-full flex flex-col border-r dark:border-gray-700 bg-sidebar dark:bg-sidebar-background", className)}>
      <div className="p-4 border-b dark:border-gray-700">
        <h2 className="text-2xl font-bold text-sidebar-primary dark:text-sidebar-primary-foreground text-center">لوحة المدير</h2>
      </div>
      <ScrollArea className="flex-1 py-4">
        <nav className="grid items-start px-4 text-sm font-medium">
          {navItems.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-sidebar-primary dark:hover:text-sidebar-primary-foreground",
                location.pathname === item.href || (item.href === "/admin-dashboard" && location.pathname === "/admin-dashboard/")
                  ? "bg-sidebar-accent text-sidebar-accent-foreground dark:bg-sidebar-accent dark:text-sidebar-accent-foreground"
                  : "text-sidebar-foreground dark:text-sidebar-foreground",
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.name}
            </Link>
          ))}
        </nav>
      </ScrollArea>
      <div className="p-4 border-t dark:border-gray-700 space-y-2">
        <LogoutButton />
        <Link to="/">
          <Button variant="outline" className="w-full text-sidebar-foreground dark:text-sidebar-foreground hover:bg-sidebar-accent dark:hover:bg-sidebar-accent">
            العودة للصفحة الرئيسية
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default AdminSidebar;