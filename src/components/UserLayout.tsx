"use client";

import React, { useEffect, useState } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Loader2, Home, MapPin, Car, Bell, Settings, Search, CalendarDays } from "lucide-react";
import BottomNavigationBar from "@/components/BottomNavigationBar";

interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
  isActive?: boolean;
}

const UserLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);

  const passengerNavItems: NavItem[] = [
    { name: "الرئيسية", href: "/passenger-dashboard", icon: Home },
    { name: "طلب رحلة", href: "/passenger-dashboard/request-ride", icon: MapPin }, // Updated path
    { name: "رحلاتي", href: "/passenger-dashboard/my-rides", icon: Car },
    { name: "الإشعارات", href: "/notifications", icon: Bell },
    { name: "الإعدادات", href: "/user-settings", icon: Settings },
  ];

  const driverNavItems: NavItem[] = [
    { name: "الرئيسية", href: "/driver-dashboard", icon: Home },
    { name: "البحث", href: "/driver-dashboard/find-rides", icon: Search },
    { name: "رحلاتي", href: "/driver-dashboard/accepted-rides", icon: CalendarDays },
    { name: "الإشعارات", href: "/notifications", icon: Bell },
    { name: "الإعدادات", href: "/user-settings", icon: Settings },
  ];

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error) {
        toast.error(`خطأ في التحقق من الجلسة: ${error.message}`);
        navigate("/auth");
        return;
      }

      if (!session) {
        toast.warning("الرجاء تسجيل الدخول للوصول إلى هذه الصفحة.");
        navigate("/auth");
        return;
      }

      const role = session.user?.user_metadata?.user_type;
      setUserRole(role);
      setLoading(false);
    };

    checkUser();
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-950">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="sr-only">جاري التحميل...</span>
      </div>
    );
  }

  const currentNavItems = userRole === "passenger" ? passengerNavItems : driverNavItems;

  // Determine if the current path is one of the main dashboard paths to highlight the correct icon
  const isActive = (href: string) => {
    // Special handling for dashboard root paths
    if (href === "/passenger-dashboard" && location.pathname === "/passenger-dashboard") return true;
    if (href === "/driver-dashboard" && location.pathname === "/driver-dashboard") return true;
    // For other items, check if the path starts with the href
    return location.pathname.startsWith(href) && href !== "/passenger-dashboard" && href !== "/driver-dashboard";
  };

  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex-1">
        <Outlet />
      </div>
      {/* BottomNavigationBar is now rendered by App.tsx, not here */}
    </div>
  );
};

export default UserLayout;