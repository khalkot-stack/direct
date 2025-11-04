"use client";

import React, { useState, useEffect, useCallback } from "react";
import PageHeader from "@/components/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { SystemSetting } from "@/types/supabase";
import { useUser } from "@/context/UserContext"; // Import useUser

// Define default system settings
const defaultSystemSettings: Omit<SystemSetting, 'id' | 'created_at'>[] = [
  { key: 'allow_new_registrations', value: 'true', description: 'السماح للمستخدمين الجدد بالتسجيل في التطبيق.' },
  { key: 'driver_auto_approve', value: 'true', description: 'الموافقة تلقائيًا على السائقين الجدد عند التسجيل.' },
  { key: 'default_currency', value: 'JOD', description: 'العملة الافتراضية المستخدمة في التطبيق.' },
  { key: 'default_map_zoom', value: '12', description: 'مستوى التكبير الافتراضي للخريطة.' },
  { key: 'default_map_center_lat', value: '31.9539', description: 'خط العرض الافتراضي لمركز الخريطة.' },
  { key: 'default_map_center_lng', value: '35.9106', description: 'خط الطول الافتراضي لمركز الخريطة.' },
];

const AdminSettingsPage: React.FC = () => {
  const { user, profile, loading: userContextLoading } = useUser();
  const [settings, setSettings] = useState<SystemSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('settings')
      .select('*');

    if (error) {
      toast.error(`فشل جلب الإعدادات: ${error.message}`);
      console.error("Error fetching settings:", error);
      setSettings([]); // Ensure settings is an empty array on error
    } else {
      const fetchedSettingsMap = new Map(data.map(s => [s.key, s]));
      const mergedSettings: SystemSetting[] = defaultSystemSettings.map(defaultSetting => {
        const existingSetting = fetchedSettingsMap.get(defaultSetting.key);
        if (existingSetting) {
          return existingSetting as SystemSetting;
        } else {
          // For new settings, omit 'id' from the object passed to upsert.
          // However, for local state, we need to conform to SystemSetting interface.
          // Since 'id' is now optional, we can simply omit it.
          return {
            key: defaultSetting.key,
            value: defaultSetting.value,
            description: defaultSetting.description,
            created_at: new Date().toISOString(), // Placeholder for local state
          };
        }
      });
      setSettings(mergedSettings);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!userContextLoading) {
      fetchSettings();
    }
  }, [userContextLoading, user, profile, fetchSettings]);

  const handleSettingChange = (key: string, newValue: string | boolean) => {
    setSettings(prevSettings =>
      prevSettings.map(setting =>
        setting.key === key ? { ...setting, value: String(newValue) } : setting
      )
    );
  };

  const handleSaveSettings = async () => {
    setIsSaving(true);
    
    // Prepare updates for upsert. If 'id' is undefined (for new settings), omit it.
    const updates = settings.map(setting => {
      const { id, ...rest } = setting;
      return id ? { id, ...rest } : rest; // Conditionally include id
    });

    const { error } = await supabase
      .from('settings')
      .upsert(updates, { onConflict: 'key' }); // Use 'key' for onConflict as it's unique

    if (error) {
      toast.error(`فشل حفظ الإعدادات: ${error.message}`);
      console.error("Error saving settings:", error);
    } else {
      toast.success("تم حفظ الإعدادات بنجاح!");
      fetchSettings(); // Re-fetch to get actual IDs for newly inserted settings
    }
    setIsSaving(false);
  };

  const getSettingValue = (key: string, defaultValue: string = "") => {
    return settings.find(s => s.key === key)?.value || defaultValue;
  };

  if (userContextLoading || loading) {
    return (
      <div className="container mx-auto p-4 flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="sr-only">جاري تحميل الإعدادات...</span>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <PageHeader title="إعدادات النظام" description="إدارة الإعدادات العامة للتطبيق." showBackButton={false} />

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>إعدادات عامة</CardTitle>
          <CardDescription>تكوين الخيارات الأساسية للتطبيق.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="allow-new-registrations">السماح بالتسجيلات الجديدة</Label>
            <Switch
              id="allow-new-registrations"
              checked={getSettingValue("allow_new_registrations") === "true"}
              onCheckedChange={(checked) => handleSettingChange("allow_new_registrations", checked)}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="driver-auto-approve">الموافقة التلقائية للسائقين</Label>
            <Switch
              id="driver-auto-approve"
              checked={getSettingValue("driver_auto_approve") === "true"}
              onCheckedChange={(checked) => handleSettingChange("driver_auto_approve", checked)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="default-currency">العملة الافتراضية</Label>
            <Input
              id="default-currency"
              value={getSettingValue("default_currency", "JOD")}
              onChange={(e) => handleSettingChange("default_currency", e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>إعدادات الخريطة</CardTitle>
          <CardDescription>تكوين خيارات عرض الخريطة.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="default-map-zoom">تكبير الخريطة الافتراضي</Label>
            <Input
              id="default-map-zoom"
              type="number"
              min="1"
              max="20"
              value={getSettingValue("default_map_zoom", "12")}
              onChange={(e) => handleSettingChange("default_map_zoom", e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="default-map-center-lat">خط عرض مركز الخريطة</Label>
            <Input
              id="default-map-center-lat"
              type="number"
              step="any"
              value={getSettingValue("default_map_center_lat", "31.9539")}
              onChange={(e) => handleSettingChange("default_map_center_lat", e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="default-map-center-lng">خط طول مركز الخريطة</Label>
            <Input
              id="default-map-center-lng"
              type="number"
              step="any"
              value={getSettingValue("default_map_center_lng", "35.9106")}
              onChange={(e) => handleSettingChange("default_map_center_lng", e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
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
    </div>
  );
};

export default AdminSettingsPage;