"use client";

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Settings, Bell, FileText, Globe, LogOut, Loader2 } from "lucide-react";
import LogoutButton from "@/components/LogoutButton";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button"; // التأكد من وجود الاستيراد الصحيح

const AppSettingsPage = () => {
  const navigate = useNavigate();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserRole = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Get user_type directly from app_metadata
        setUserRole(user.app_metadata?.user_type as string || null);
      }
      setLoading(false);
    };
    fetchUserRole();
  }, []);

  const handleChangeLanguage = () => {
    toast.info("تغيير اللغة غير متاح حاليًا. هذه ميزة قيد التطوير!");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-950">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="sr-only">جاري التحميل...</span>
      </div>
    );
  }

  // Determine the correct back path based on user role
  const backPath = userRole === "passenger" ? "/passenger-dashboard" : userRole === "driver" ? "/driver-dashboard" : "/";

  return (
    <div className="min-h-screen flex flex-col bg-gray-100 dark:bg-gray-950 p-4">
      <Card className="w-full max-w-md bg-white dark:bg-gray-900 shadow-lg rounded-lg mx-auto">
        <div className="px-6 pt-0">
          <PageHeader
            title="إعدادات التطبيق"
            description="إدارة تفضيلات التطبيق والإشعارات والبلاغات"
            backPath={backPath}
          />
        </div>
        <CardContent className="space-y-6 text-center">
          <Settings className="h-12 w-12 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
          <p className="text-lg text-gray-700 dark:text-gray-300">
            هذه صفحة الإعدادات العامة للتطبيق.
          </p>
          <div className="space-y-2">
            <Button className="w-full bg-primary hover:bg-primary-dark text-primary-foreground transition-transform duration-200 ease-in-out hover:scale-[1.01]" onClick={() => navigate("/profile-settings")}>
              <FileText className="h-4 w-4 ml-2 rtl:mr-2" />
              تعديل الملف الشخصي
            </Button>
            <Button variant="outline" className="w-full text-primary border-primary hover:bg-primary hover:text-primary-foreground transition-transform duration-200 ease-in-out hover:scale-[1.01]" onClick={() => navigate("/notifications")}>
              <Bell className="h-4 w-4 ml-2 rtl:mr-2" />
              الإشعارات
            </Button>
            <Button variant="outline" className="w-full text-primary border-primary hover:bg-primary hover:text-primary-foreground transition-transform duration-200 ease-in-out hover:scale-[1.01]" onClick={handleChangeLanguage}>
              <Globe className="h-4 w-4 ml-2 rtl:mr-2" />
              تغيير اللغة
            </Button>
            <Button variant="outline" className="w-full text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground transition-transform duration-200 ease-in-out hover:scale-[1.01]" onClick={() => navigate("/reports")}>
              <FileText className="h-4 w-4 ml-2 rtl:mr-2" />
              بلاغات وشكاوى
            </Button>
            <LogoutButton />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AppSettingsPage;