"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

const SettingsPage = () => {
  const [commissionRate, setCommissionRate] = useState("10");
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("تم حفظ الإعدادات بنجاح!");
    // Implement actual save settings logic here
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">الإعدادات</h2>
      <Card>
        <CardHeader>
          <CardTitle>إعدادات عامة</CardTitle>
          <CardDescription>إدارة الإعدادات الأساسية للتطبيق.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSaveSettings} className="space-y-6">
            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="commission-rate">نسبة العمولة للسائقين (%)</Label>
              <Input
                id="commission-rate"
                type="number"
                value={commissionRate}
                onChange={(e) => setCommissionRate(e.target.value)}
                className="max-w-xs"
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="notifications-enabled">تفعيل إشعارات النظام</Label>
              <Switch
                id="notifications-enabled"
                checked={notificationsEnabled}
                onCheckedChange={setNotificationsEnabled}
              />
            </div>
            <Button type="submit" className="bg-blue-500 hover:bg-blue-600 text-white">
              حفظ الإعدادات
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default SettingsPage;