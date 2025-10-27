"use client";

import React from "react";
import { Card, CardContent, CardDescription } from "@/components/ui/card";
import { Bell } from "lucide-react";
import PageHeader from "@/components/PageHeader"; // Import PageHeader
import EmptyState from "@/components/EmptyState"; // Import EmptyState

const NotificationsPage = () => {
  const notifications: string[] = []; // Example: empty array for no notifications

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-950 p-4">
      <Card className="w-full max-w-md bg-white dark:bg-gray-900 shadow-lg rounded-lg">
        <div className="p-6">
          <PageHeader
            title="الإشعارات"
            description="جميع التنبيهات والتحديثات الخاصة بك"
          />
        </div>
        <CardContent className="space-y-4 text-center">
          {notifications.length > 0 ? (
            // Render notifications here if available
            <p>قائمة الإشعارات...</p>
          ) : (
            <EmptyState
              icon={Bell}
              title="لا توجد إشعارات جديدة"
              description="عندما يكون لديك إشعارات، ستظهر هنا."
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default NotificationsPage;