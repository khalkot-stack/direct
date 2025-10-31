"use client";

import React, { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Users, Settings, Shield } from "lucide-react";
import { MadeWithDyad } from "@/components/made-with-dyad";
import { useUser } from "@/context/UserContext";

const Index: React.FC = () => {
  const { user, profile, loading } = useUser();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user && profile) {
      // Redirect authenticated users to their respective dashboards
      if (profile.user_type === "passenger") {
        navigate("/passenger-dashboard");
      } else if (profile.user_type === "driver") {
        navigate("/driver-dashboard");
      } else if (profile.user_type === "admin") {
        navigate("/admin-dashboard");
      }
    }
  }, [loading, user, profile, navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-950">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="sr-only">جاري التحميل...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-950 p-4">
      <Card className="w-full max-w-lg text-center">
        <CardHeader>
          <div className="flex justify-center mb-4">
            <img src="/دايركت.png" alt="DIRECT Logo" className="h-16 w-auto dark:invert" />
          </div>
          <CardTitle className="text-4xl font-bold text-primary dark:text-primary-light mb-2">
            مرحبًا بك في DIRECT
          </CardTitle>
          <CardDescription className="text-lg text-gray-600 dark:text-gray-400">
            منصة النقل الذكي لرحلاتك اليومية.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-md text-gray-700 dark:text-gray-300">
            سواء كنت تبحث عن رحلة مريحة أو ترغب في كسب المال كسائق، فإن DIRECT هنا لخدمتك.
          </p>

          <div className="grid gap-4 md:grid-cols-2">
            <Link to="/auth">
              <Button className="w-full bg-primary hover:bg-primary-dark text-primary-foreground py-6 text-lg">
                <Users className="h-6 w-6 ml-3 rtl:mr-3" />
                تسجيل الدخول / إنشاء حساب
              </Button>
            </Link>
            <Link to="/about-us">
              <Button variant="outline" className="w-full py-6 text-lg border-primary text-primary hover:bg-primary hover:text-primary-foreground">
                <Settings className="h-6 w-6 ml-3 rtl:mr-3" />
                المزيد عنا
              </Button>
            </Link>
          </div>
          <div className="mt-4">
            <Link to="/admin-login">
              <Button variant="ghost" className="w-full text-primary hover:underline">
                <Shield className="h-5 w-5 ml-2 rtl:mr-2" />
                تسجيل دخول المدير
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
      <MadeWithDyad />
    </div>
  );
};

export default Index;