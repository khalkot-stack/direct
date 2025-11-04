"use client";

import React, { useState, useEffect, useCallback } from "react";
import PageHeader from "@/components/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Loader2, Sun, Moon } from "lucide-react";
import { toast } from "sonner";
import LogoutButton from "@/components/LogoutButton";
import { useUser } from "@/context/UserContext";
import { UserSettings } from "@/types/supabase";
import { useTheme } from "next-themes";
import supabaseService from "@/services/supabaseService"; // Import the new service

const AppSettingsPage: React.FC = () => {
  const { user, loading: userLoading } = useUser();
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { setTheme } = useTheme();

  const fetchUserSettings = useCallback(async (userId: string) => {
    setLoadingSettings(true);
    try {
      let fetchedSettings = await supabaseService.getUserSettings(userId);

      if (fetchedSettings) {
        setSettings(fetchedSettings);
        setTheme(fetchedSettings.theme);
      } else {
        // If no settings found, create default ones using upsert
        const defaultSettings: Omit<UserSettings, 'id'> = {
          user_id: userId,
          theme: 'system',
          notifications_enabled: true,
          language: 'ar',
        };
        const newSettings = await supabaseService.upsertUserSettings(defaultSettings);
        setSettings(newSettings);
        if (newSettings) setTheme(newSettings.theme);
      }
    } catch (error: any) {
      toast.error(`فشل جلب إعدادات المستخدم: ${error.message}`);
      console.error("Error fetching user settings:", error);
      setSettings(null);
    } finally {
      setLoadingSettings(false);
    }
  }, [setTheme]);

  useEffect(() => {
    if (!userLoading && user) {
      fetchUserSettings(user.id);
    } else if (!userLoading && !user) {
      setLoadingSettings(false);
    }
  }, [userLoading, user, fetchUserSettings]);

  const handleSettingChange = (key: keyof UserSettings, value: any) => {
    if (settings) {
      setSettings(prev => prev ? { ...prev, [key]: value } : null);
      if (key === 'theme') {
        setTheme(value);
      }
    }
  };

  const handleSaveSettings = async () => {
    if (!user?.id || !settings) return;

    setIsSaving(true);
    try {
      await supabaseService.upsertUserSettings({
        user_id: user.id,
        theme: settings.theme,
        notifications_enabled: settings.notifications_enabled,
        language: settings.language,
      });
      toast.success("تم حفظ الإعدادات بنجاح!");
    } catch (error: any) {
      toast.error(`فشل حفظ الإعدادات: ${error.message}`);
      console.error("Error saving settings:", error);
    } finally {
      setIsSaving(false);
    }
  };

  if (userLoading || loadingSettings) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-950">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="sr-only">جاري تحميل الإعدادات...</span>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto p-4 text-center">
        <PageHeader title="إعدادات التطبيق" description="تخصيص تجربتك في التطبيق." backPath="/" />
        <p className="text-red-500 dark:text-red-400">الرجاء تسجيل الدخول لعرض الإعدادات.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <PageHeader title="إعدادات التطبيق" description="تخصيص تجربتك في التطبيق." backPath="/" />

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>المظهر</CardTitle>
          <CardDescription>اختر المظهر الذي تفضله للتطبيق.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="theme-switch">الوضع الداكن</Label>
            <Switch
              id="theme-switch"
              checked={settings?.theme === 'dark'}
              onCheckedChange={(checked) => handleSettingChange('theme', checked ? 'dark' : 'light')}
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant={settings?.theme === 'light' ? 'default' : 'outline'}
              onClick={() => handleSettingChange('theme', 'light')}
              className="flex-1"
            >
              <Sun className="h-4 w-4 ml-2 rtl:mr-2" />
              فاتح
            </Button>
            <Button
              variant={settings?.theme === 'dark' ? 'default' : 'outline'}
              onClick={() => handleSettingChange('theme', 'dark')}
              className="flex-1"
            >
              <Moon className="h-4 w-4 ml-2 rtl:mr-2" />
              داكن
            </Button>
            <Button
              variant={settings?.theme === 'system' ? 'default' : 'outline'}
              onClick={() => handleSettingChange('theme', 'system')}
              className="flex-1"
            >
              النظام
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>الإشعارات</CardTitle>
          <CardDescription>إدارة تفضيلات الإشعارات.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="notifications-enabled">تمكين الإشعارات</Label>
            <Switch
              id="notifications-enabled"
              checked={settings?.notifications_enabled || false}
              onCheckedChange={(checked) => handleSettingChange('notifications_enabled', checked)}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>اللغة</CardTitle>
          <CardDescription>اختر لغة التطبيق.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button
              variant={settings?.language === 'ar' ? 'default' : 'outline'}
              onClick={() => handleSettingChange('language', 'ar')}
              className="flex-1"
            >
              العربية
            </Button>
            <Button
              variant={settings?.language === 'en' ? 'default' : 'outline'}
              onClick={() => handleSettingChange('language', 'en')}
              className="flex-1"
            >
              English
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end mb-6">
        <Button onClick={handleSaveSettings} disabled={isSaving} className="bg-primary hover:bg-primary-dark text-primary-foreground">
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin ml-2 rtl:mr-2" />
              جاري الحفظ...
            </>
          ) : (
            "حفظ الإعدادات"
          )}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>تسجيل الخروج</CardTitle>
          <CardDescription>تسجيل الخروج من حسابك.</CardDescription>
        </CardHeader>
        <CardContent>
          <LogoutButton />
        </CardContent>
      </Card>
    </div>
  );
};

export default AppSettingsPage;