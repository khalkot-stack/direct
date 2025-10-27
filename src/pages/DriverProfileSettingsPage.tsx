"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import PageHeader from "@/components/PageHeader"; // Import PageHeader

interface DriverProfile {
  id: string;
  full_name: string;
  email: string;
  phone_number?: string;
  car_model?: string;
  car_color?: string;
  license_plate?: string;
}

const DriverProfileSettingsPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [profile, setProfile] = useState<DriverProfile | null>(null);

  const [carModel, setCarModel] = useState("");
  const [carColor, setCarColor] = useState("");
  const [licensePlate, setLicensePlate] = useState("");

  const fetchDriverProfile = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user || user.user_metadata?.user_type !== "driver") {
      toast.error("ليس لديك الصلاحيات الكافية للوصول إلى هذه الصفحة.");
      navigate("/user-settings");
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, email, phone_number, car_model, car_color, license_plate')
      .eq('id', user.id)
      .single();

    if (error) {
      toast.error(`فشل جلب بيانات السائق: ${error.message}`);
      console.error("Error fetching driver profile:", error);
    } else if (data) {
      setProfile(data as DriverProfile);
      setCarModel(data.car_model || "");
      setCarColor(data.car_color || "");
      setLicensePlate(data.license_plate || "");
    }
    setLoading(false);
  }, [navigate]);

  useEffect(() => {
    fetchDriverProfile();
  }, [fetchDriverProfile]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    setIsSaving(true);
    const { error } = await supabase
      .from('profiles')
      .update({
        car_model: carModel,
        car_color: carColor,
        license_plate: licensePlate,
      })
      .eq('id', profile.id);
    setIsSaving(false);

    if (error) {
      toast.error(`فشل حفظ معلومات السيارة: ${error.message}`);
      console.error("Error saving vehicle info:", error);
    } else {
      toast.success("تم حفظ معلومات السيارة بنجاح!");
      fetchDriverProfile();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-950">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="sr-only">جاري تحميل معلومات السيارة...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-950 p-4">
      <Card className="w-full max-w-md bg-white dark:bg-gray-900 shadow-lg rounded-lg">
        <div className="p-6">
          <PageHeader
            title="إدارة معلومات السيارة"
            description="تحديث تفاصيل سيارتك"
          />
        </div>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-6">
            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="car-model">موديل السيارة</Label>
              <Input
                id="car-model"
                type="text"
                placeholder="مثال: تويوتا كامري"
                value={carModel}
                onChange={(e) => setCarModel(e.target.value)}
                className="mt-1"
              />
            </div>
            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="car-color">لون السيارة</Label>
              <Input
                id="car-color"
                type="text"
                placeholder="مثال: أبيض"
                value={carColor}
                onChange={(e) => setCarColor(e.target.value)}
                className="mt-1"
              />
            </div>
            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="license-plate">رقم اللوحة</Label>
              <Input
                id="license-plate"
                type="text"
                placeholder="مثال: 12-34567"
                value={licensePlate}
                onChange={(e) => setLicensePlate(e.target.value)}
                className="mt-1"
              />
            </div>
            <Button type="submit" className="w-full bg-primary hover:bg-primary-dark text-primary-foreground mt-6 transition-transform duration-200 ease-in-out hover:scale-[1.01]" disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin ml-2 rtl:mr-2" />
                  جاري الحفظ...
                </>
              ) : (
                "حفظ المعلومات"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default DriverProfileSettingsPage;