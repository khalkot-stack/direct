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

const AdminSettingsPage: React.FC = () => {
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
    } else {
      setSettings(data as SystemSetting[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleSettingChange = (id: string, newValue: string | boolean) => {
    setSettings(prevSettings =>
      prevSettings.map(setting =>
        setting.id === id ? { ...setting, value: String(newValue) } : setting
      )
    );
  };

  const handleSaveSettings = async () => {
    setIsSaving(true);
    const updates = settings.map(({ id, key, value }) => ({ id, key, value }));
    const { error } = await supabase
      .from('settings')
      .upsert(updates, { onConflict: 'id' });

    if (error) {
      toast.error(`فشل حفظ الإعدادات: ${error.message}`);
      console.error("Error saving settings:", error);
    } else {
      toast.success("تم حفظ الإعدادات بنجاح!");
      fetchSettings();
    }
    setIsSaving(false);
  };

  const getSettingValue = (key: string, defaultValue: string = "") => {
    return settings.find(s => s.key === key)?.value || defaultValue;
  };

  const getSettingId = (key: string) => {
    return settings.find(s => s.key === key)?.id || "";
  };

  if (loading) {
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
              onCheckedChange={(checked) => handleSettingChange(getSettingId("allow_new_registrations"), checked)}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="driver-auto-approve">الموافقة التلقائية للسائقين</Label>
            <Switch
              id="driver-auto-approve"
              checked={getSettingValue("driver_auto_approve") === "true"}
              onCheckedChange={(checked) => handleSettingChange(getSettingId("driver_auto_approve"), checked)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="default-currency">العملة الافتراضية</Label>
            <Input
              id="default-currency"
              value={getSettingValue("default_currency", "JOD")}
              onChange={(e) => handleSettingChange(getSettingId("default_currency"), e.target.value)}
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
              onChange={(e) => handleSettingChange(getSettingId("default_map_zoom"), e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="default-map-center-lat">خط عرض مركز الخريطة</Label>
            <Input
              id="default-map-center-lat"
              type="number"
              step="any"
              value={getSettingValue("default_map_center_lat", "31.9539")}
              onChange={(e) => handleSettingChange(getSettingId("default_map_center_lat"), e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="default-map-center-lng">خط طول مركز الخريطة</Label>
            <Input
              id="default-map-center-lng"
              type="number"
              step="any"
              value={getSettingValue("default_map_center_lng", "35.9106")}
              onChange={(e) => handleSettingChange(getSettingId("default_map_center_lng"), e.target.value)}
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