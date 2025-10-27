"use client";

import React from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Settings } from "lucide-react";
import LogoutButton from "@/components/LogoutButton";

const UserSettingsPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-950 p-4">
      <Card className="w-full max-w-md bg-white dark:bg-gray-900 shadow-lg rounded-lg">
        <CardHeader className="text-center">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)} // Go back to previous page
            className="absolute top-4 right-4 rtl:left-4 rtl:right-auto"
          >
            <ChevronLeft className="h-6 w-6" />
            <span className="sr-only">العودة</span>
          </Button>
          <CardTitle className="text-3xl font-bold text-gray-900 dark:text-white">
            الإعدادات
          </CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-400">
            إدارة ملفك الشخصي وتفضيلات التطبيق
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 text-center">
          <Settings className="h-12 w-12 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
          <p className="text-lg text-gray-700 dark:text-gray-300">
            هذه صفحة الإعدادات الخاصة بك. يمكنك تعديل معلوماتك الشخصية وتفضيلات التطبيق هنا.
          </p>
          <div className="space-y-2">
            <Button className="w-full bg-blue-500 hover:bg-blue-600 text-white">
              تعديل الملف الشخصي
            </Button>
            <Button variant="outline" className="w-full">
              تغيير اللغة
            </Button>
            <LogoutButton />
          </div>
          <Button onClick={() => navigate(-1)} variant="ghost" className="mt-4 text-blue-500 hover:underline">
            العودة
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserSettingsPage;