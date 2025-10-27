"use client";

import React from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Home, MapPin, Car, Bell, Settings, Search, CalendarDays } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
}

interface BottomNavigationBarProps {
  navItems: NavItem[];
}

const BottomNavigationBar: React.FC<BottomNavigationBarProps> = ({ navItems }) => {
  const location = useLocation();
  const isMobile = useIsMobile();

  if (!isMobile) {
    return null; // Only render on mobile
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 border-t dark:border-gray-700 shadow-lg md:hidden">
      <nav className="flex justify-around h-16 items-center">
        {navItems.map((item) => (
          <Link key={item.href} to={item.href} className="flex-1">
            <Button
              variant="ghost"
              className={cn(
                "flex flex-col items-center justify-center w-full h-full",
                location.pathname === item.href || (item.href === "/passenger-dashboard" && location.pathname === "/passenger-dashboard/") || (item.href === "/driver-dashboard" && location.pathname === "/driver-dashboard/")
                  ? "text-primary dark:text-primary"
                  : "text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary",
              )}
            >
              <item.icon className="h-5 w-5 mb-1" />
              <span className="text-xs">{item.name}</span>
            </Button>
          </Link>
        ))}
      </nav>
    </div>
  );
};

export default BottomNavigationBar;