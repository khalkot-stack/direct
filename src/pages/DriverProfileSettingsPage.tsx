"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Car, Loader2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

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
      navigate("/user-settings"); // Redirect if not a driver
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
      fetchDriverProfile(); // Refresh data
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-950">
        <Loader2 className="h-8 w-8 animate-spin text-green-500" />
        <span className="sr-only">جاري تحميل معلومات السيارة...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-950 p-4">
      <Card className="w-full max-w-md bg-white dark:bg-gray-900 shadow-lg rounded-lg">
        <CardHeader className="text-center">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/user-settings")}
            className="absolute top-4 right-4 rtl:left-4 rtl:right-auto"
          >
            <ChevronLeft className="h-6 w-6" />
            <span className="sr-only">العودة</span>
          </Button>
          <CardTitle className="text-3xl font-bold text-gray-900 dark:text-white">
            إدارة معلومات السيارة
          </CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-400">
            تحديث تفاصيل سيارتك
          </CardDescription>
        </CardHeader>
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
            <Button type="submit" className="w-full bg-green-500 hover:bg-green-600 text-white mt-6" disabled={isSaving}>
              {isSaving ? "جاري الحفظ..." : "حفظ المعلومات"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default DriverProfileSettingsPage;