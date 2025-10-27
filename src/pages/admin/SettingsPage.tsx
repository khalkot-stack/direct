"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { Loader2 } from "lucide-react";

const SettingsPage = () => {
  const [commissionRate, setCommissionRate] = useState("10");
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [settingsId, setSettingsId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('settings')
      .select('*')
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 means no rows found
      toast.error(`فشل جلب الإعدادات: ${error.message}`);
      console.error("Error fetching settings:", error);
    } else if (data) {
      setSettingsId(data.id);
      setCommissionRate(String(data.commission_rate));
      setNotificationsEnabled(data.notifications_enabled);
    } else {
      // If no settings found, initialize with defaults and prepare for insert
      setCommissionRate("10");
      setNotificationsEnabled(true);
      setSettingsId(null); // No existing ID
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    const parsedCommissionRate = parseFloat(commissionRate);
    if (isNaN(parsedCommissionRate) || parsedCommissionRate < 0 || parsedCommissionRate > 100) {
      toast.error("الرجاء إدخال نسبة عمولة صحيحة بين 0 و 100.");
      setIsSaving(false);
      return;
    }

    if (settingsId) {
      // Update existing settings
      const { error } = await supabase
        .from('settings')
        .update({
          commission_rate: parsedCommissionRate,
          notifications_enabled: notificationsEnabled,
        })
        .eq('id', settingsId);

      if (error) {
        toast.error(`فشل تحديث الإعدادات: ${error.message}`);
        console.error("Error updating settings:", error);
      } else {
        toast.success("تم حفظ الإعدادات بنجاح!");
      }
    } else {
      // Insert new settings (should only happen if no default was inserted or it was deleted)
      const { data, error } = await supabase
        .from('settings')
        .insert({
          commission_rate: parsedCommissionRate,
          notifications_enabled: notificationsEnabled,
        })
        .select();

      if (error) {
        toast.error(`فشل حفظ الإعدادات: ${error.message}`);
        console.error("Error inserting settings:", error);
      } else if (data && data.length > 0) {
        setSettingsId(data[0].id);
        toast.success("تم حفظ الإعدادات بنجاح!");
      }
    }
    setIsSaving(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="sr-only">جاري تحميل الإعدادات...</span>
      </div>
    );
  }

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
                min="0"
                max="100"
                step="0.1"
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
            <Button type="submit" className="bg-primary hover:bg-primary-dark text-primary-foreground" disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin ml-2 rtl:mr-2" />
                  جاري الحفظ...
                </>
              ) : (
                "حفظ الإعدادات"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default SettingsPage;