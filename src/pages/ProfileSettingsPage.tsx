"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import PageHeader from "@/components/PageHeader";
import AvatarUpload from "@/components/AvatarUpload"; // Import AvatarUpload

interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  phone_number?: string;
  user_type: "passenger" | "driver" | "admin";
  car_model?: string;
  car_color?: string;
  license_plate?: string;
  avatar_url?: string; // Added avatar_url
}

const ProfileSettingsPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);

  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [carModel, setCarModel] = useState("");
  const [carColor, setCarColor] = useState("");
  const [licensePlate, setLicensePlate] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null); // State for avatar URL

  const fetchUserProfile = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      toast.error("الرجاء تسجيل الدخول لتعديل ملفك الشخصي.");
      navigate("/auth");
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, email, phone_number, user_type, car_model, car_color, license_plate, avatar_url') // Select avatar_url
      .eq('id', user.id)
      .single();

    if (error) {
      toast.error(`فشل جلب بيانات الملف الشخصي: ${error.message}`);
      console.error("Error fetching user profile:", error);
    } else if (data) {
      setProfile(data as UserProfile);
      setFullName(data.full_name || "");
      setPhoneNumber(data.phone_number || "");
      setCarModel(data.car_model || "");
      setCarColor(data.car_color || "");
      setLicensePlate(data.license_plate || "");
      setAvatarUrl(data.avatar_url || null); // Set avatar URL
    }
    setLoading(false);
  }, [navigate]);

  useEffect(() => {
    fetchUserProfile();
  }, [fetchUserProfile]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    setIsSaving(true);
    const updateData: Partial<UserProfile> = {
      full_name: fullName,
      phone_number: phoneNumber,
      // avatar_url is handled by AvatarUpload component directly
    };

    if (profile.user_type === "driver") {
      updateData.car_model = carModel;
      updateData.car_color = carColor;
      updateData.license_plate = licensePlate;
    }

    const { error } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', profile.id);
    setIsSaving(false);

    if (error) {
      toast.error(`فشل حفظ الملف الشخصي: ${error.message}`);
      console.error("Error saving user profile:", error);
    } else {
      toast.success("تم حفظ الملف الشخصي بنجاح!");
      // No need to re-fetch profile here, as AvatarUpload handles its own updates and calls onUploadSuccess
      // If other fields were updated, a re-fetch might be desired, but for now, we assume the form state is sufficient.
    }
  };

  const handleAvatarUploadSuccess = (newUrl: string) => {
    setAvatarUrl(newUrl);
    // Optionally, re-fetch profile if other parts of the profile depend on avatar_url
    // For now, just update the local state.
  };

  // Determine the correct back path based on user role
  const backPath = profile?.user_type === "passenger" ? "/passenger-dashboard" : profile?.user_type === "driver" ? "/driver-dashboard" : "/";

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-950 p-4">
      <Card className="w-full max-w-md bg-white dark:bg-gray-900 shadow-lg rounded-lg">
        <div className="p-6">
          <PageHeader
            title="تعديل الملف الشخصي"
            description="تحديث معلوماتك الشخصية"
            backPath={backPath}
          />
        </div>
        <CardContent>
          {loading ? (
            <div className="flex flex-col items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="sr-only">جاري تحميل الملف الشخصي...</span>
            </div>
          ) : profile ? (
            <form onSubmit={handleSave} className="space-y-6">
              {profile.id && ( // Only render AvatarUpload if userId is available
                <AvatarUpload
                  userId={profile.id}
                  initialAvatarUrl={avatarUrl}
                  onUploadSuccess={handleAvatarUploadSuccess}
                />
              )}

              <div className="grid w-full items-center gap-1.5">
                <Label htmlFor="full-name">الاسم الكامل</Label>
                <Input
                  id="full-name"
                  type="text"
                  placeholder="اسمك الكامل"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="mt-1"
                  required
                />
              </div>
              <div className="grid w-full items-center gap-1.5">
                <Label htmlFor="email">البريد الإلكتروني</Label>
                <Input
                  id="email"
                  type="email"
                  value={profile?.email || ""}
                  className="mt-1"
                  disabled // Email is usually not editable directly here
                />
              </div>
              <div className="grid w-full items-center gap-1.5">
                <Label htmlFor="phone-number">رقم الهاتف</Label>
                <Input
                  id="phone-number"
                  type="tel"
                  placeholder="07xxxxxxxxx"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="mt-1"
                />
              </div>

              {profile.user_type === "driver" && (
                <>
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
                </>
              )}

              <Button type="submit" className="w-full bg-primary hover:bg-primary-dark text-primary-foreground mt-6 transition-transform duration-200 ease-in-out hover:scale-[1.01]" disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin ml-2 rtl:mr-2" />
                    جاري الحفظ...
                  </>
                ) : (
                  "حفظ التغييرات"
                )}
              </Button>
            </form>
          ) : (
            <p className="text-center text-gray-600 dark:text-gray-400">
              تعذر تحميل الملف الشخصي.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfileSettingsPage;