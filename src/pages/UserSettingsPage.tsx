"use client";

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Settings, Loader2 } from "lucide-react";
import LogoutButton from "@/components/LogoutButton";
import { supabase } from "@/lib/supabase";
import PageHeader from "@/components/PageHeader"; // Import PageHeader

const UserSettingsPage = () => {
  const navigate = useNavigate();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserRole = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserRole(user.user_metadata?.user_type || null);
      }
      setLoading(false);
    };
    fetchUserRole();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-950">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="sr-only">جاري التحميل...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-950 p-4">
      <Card className="w-full max-w-md bg-white dark:bg-gray-900 shadow-lg rounded-lg">
        <div className="p-6">
          <PageHeader
            title="الإعدادات"
            description="إدارة ملفك الشخصي وتفضيلات التطبيق"
          />
        </div>
        <CardContent className="space-y-6 text-center">
          <Settings className="h-12 w-12 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
          <p className="text-lg text-gray-700 dark:text-gray-300">
            هذه صفحة الإعدادات الخاصة بك. يمكنك تعديل معلوماتك الشخصية وتفضيلات التطبيق هنا.
          </p>
          <div className="space-y-2">
            <Button className="w-full bg-primary hover:bg-primary-dark text-primary-foreground transition-transform duration-200 ease-in-out hover:scale-[1.01]" onClick={() => navigate("/user-profile-edit")}>
              تعديل الملف الشخصي
            </Button>
            {userRole === "driver" && (
              <Button
                className="w-full bg-primary hover:bg-primary-dark text-primary-foreground transition-transform duration-200 ease-in-out hover:scale-[1.01]"
                onClick={() => navigate("/driver-settings")}
              >
                إدارة معلومات السيارة
              </Button>
            )}
            <Button variant="outline" className="w-full text-primary border-primary hover:bg-primary hover:text-primary-foreground transition-transform duration-200 ease-in-out hover:scale-[1.01]">
              تغيير اللغة
            </Button>
            <Button variant="outline" className="w-full text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground transition-transform duration-200 ease-in-out hover:scale-[1.01]" onClick={() => navigate("/reports")}>
              بلاغات وشكاوى
            </Button>
            <LogoutButton />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserSettingsPage;