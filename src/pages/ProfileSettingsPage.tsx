"use client";

import React, { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase"; // Import supabase client
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { toast } from "sonner";
import { Loader2, User } from "lucide-react"; // Added User icon
import { Switch } from "../components/ui/switch";
import PageHeader from "@/components/PageHeader"; // Add PageHeader import
import AvatarUpload from "@/components/AvatarUpload"; // Import AvatarUpload component

// Define a local Profile interface based on the expected data structure
interface Profile {
  id: string;
  full_name: string | null;
  username: string | null;
  website: string | null;
  avatar_url: string | null;
  user_type: "passenger" | "driver" | "admin" | null; // Use user_type
  car_model: string | null;
  car_color: string | null;
  license_plate: string | null;
  updated_at: string | null;
  phone_number: string | null;
}

export default function ProfileSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [fullname, setFullname] = useState<Profile["full_name"]>(null);
  const [username, setUsername] = useState<Profile["username"]>(null);
  const [website, setWebsite] = useState<Profile["website"]>(null);
  const [avatar_url, setAvatarUrl] = useState<Profile["avatar_url"]>(null);
  const [userType, setUserType] = useState<Profile["user_type"]>(null); // Use userType
  const [carModel, setCarModel] = useState<Profile["car_model"]>(null);
  const [carColor, setCarColor] = useState<Profile["car_color"]>(null);
  const [licensePlate, setLicensePlate] = useState<Profile["license_plate"]>(null);
  const [phoneNumber, setPhoneNumber] = useState<Profile["phone_number"]>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null); // New state for user email

  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const getProfile = useCallback(async () => {
    try {
      setLoading(true);
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError || !user) {
        toast.error("الرجاء تسجيل الدخول لعرض ملفك الشخصي.");
        // Navigation is handled by ProtectedRoute, so no need to navigate here
        return;
      }
      setCurrentUserId(user.id);
      setUserEmail(user.email); // Set the user's email

      const { data, error, status } = await supabase
        .from("profiles")
        .select(`full_name, username, website, avatar_url, user_type, car_model, car_color, license_plate, phone_number`) // Select user_type and phone_number
        .eq("id", user.id)
        .single();

      if (error && status !== 406) {
        throw error;
      }

      if (data) {
        setFullname(data.full_name);
        setUsername(data.username);
        setWebsite(data.website);
        setAvatarUrl(data.avatar_url);
        setUserType(data.user_type); // Set userType
        setCarModel(data.car_model);
        setCarColor(data.car_color);
        setLicensePlate(data.license_plate);
        setPhoneNumber(data.phone_number); // Set phone_number
      }
    } catch (error) {
      toast.error("فشل تحميل ملف تعريف المستخدم!");
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    getProfile();
  }, [getProfile]);

  async function updateProfile({
    fullname,
    username,
    website,
    avatar_url,
    user_type,
    car_model,
    car_color,
    license_plate,
    phone_number,
  }: {
    fullname: Profile["full_name"];
    username: Profile["username"];
    website: Profile["website"];
    avatar_url: Profile["avatar_url"];
    user_type: Profile["user_type"];
    car_model: Profile["car_model"];
    car_color: Profile["car_color"];
    license_plate: Profile["license_plate"];
    phone_number: Profile["phone_number"];
  }) {
    try {
      setLoading(true);

      if (!currentUserId) {
        toast.error("خطأ: معرف المستخدم غير موجود.");
        return;
      }

      const { error } = await supabase.from("profiles").upsert({
        id: currentUserId,
        full_name: fullname,
        username,
        website,
        avatar_url,
        user_type, // Update user_type
        car_model: user_type === "driver" ? car_model : null, // Clear car details if not a driver
        car_color: user_type === "driver" ? car_color : null,
        license_plate: user_type === "driver" ? license_plate : null,
        phone_number, // Update phone_number
        updated_at: new Date().toISOString(),
      });
      if (error) throw error;
      toast.success("تم تحديث الملف الشخصي بنجاح!");
    } catch (error) {
      toast.error("فشل تحديث الملف الشخصي!");
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  const handleAvatarUploadSuccess = (newUrl: string) => {
    setAvatarUrl(newUrl);
    // No need to call updateProfile here, AvatarUpload component already handles it
  };

  const handleSignOut = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signOut();
    setLoading(false);
    if (error) {
      toast.error(`فشل تسجيل الخروج: ${error.message}`);
    } else {
      toast.success("تم تسجيل الخروج بنجاح.");
      // Redirection is handled by the ProtectedRoute or App.tsx listener
    }
  };

  // Determine the correct back path based on user role
  const backPath = userType === "passenger" ? "/passenger-dashboard" : userType === "driver" ? "/driver-dashboard" : "/";

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-950">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="sr-only">جاري تحميل الملف الشخصي...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-950 p-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-900 shadow-lg rounded-lg">
        <div className="p-6">
          <PageHeader
            title="إعدادات الملف الشخصي"
            description="تحديث معلومات ملفك الشخصي"
            backPath={backPath}
          />
        </div>
        <div className="flex flex-col items-center space-y-4 p-6 pt-0">
          {currentUserId && (
            <AvatarUpload
              userId={currentUserId}
              initialAvatarUrl={avatar_url}
              onUploadSuccess={handleAvatarUploadSuccess}
            />
          )}
        </div>
        <div className="space-y-4 p-6 pt-0">
          <div className="grid w-full items-center gap-1.5">
            <Label htmlFor="email">البريد الإلكتروني</Label>
            <Input id="email" type="text" value={userEmail || ""} disabled />
          </div>
          <div className="grid w-full items-center gap-1.5">
            <Label htmlFor="fullName">الاسم الكامل</Label>
            <Input
              id="fullName"
              type="text"
              value={fullname || ""}
              onChange={(e) => setFullname(e.target.value)}
            />
          </div>
          <div className="grid w-full items-center gap-1.5">
            <Label htmlFor="phoneNumber">رقم الهاتف</Label>
            <Input
              id="phoneNumber"
              type="tel"
              value={phoneNumber || ""}
              onChange={(e) => setPhoneNumber(e.target.value)}
            />
          </div>
          <div className="grid w-full items-center gap-1.5">
            <Label htmlFor="username">اسم المستخدم</Label>
            <Input
              id="username"
              type="text"
              value={username || ""}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          <div className="grid w-full items-center gap-1.5">
            <Label htmlFor="website">الموقع الإلكتروني</Label>
            <Input
              id="website"
              type="url"
              value={website || ""}
              onChange={(e) => setWebsite(e.target.value)}
            />
          </div>
          <div className="flex items-center justify-between space-x-2 rtl:space-x-reverse">
            <Label htmlFor="user-type-switch">هل أنت سائق؟</Label>
            <Switch
              id="user-type-switch"
              checked={userType === "driver"}
              onCheckedChange={(checked) => setUserType(checked ? "driver" : "passenger")}
            />
          </div>

          {userType === "driver" && (
            <>
              <div className="grid w-full items-center gap-1.5">
                <Label htmlFor="car-model">موديل السيارة</Label>
                <Input
                  id="car-model"
                  type="text"
                  value={carModel || ""}
                  onChange={(e) => setCarModel(e.target.value)}
                />
              </div>
              <div className="grid w-full items-center gap-1.5">
                <Label htmlFor="car-color">لون السيارة</Label>
                <Input
                  id="car-color"
                  type="text"
                  value={carColor || ""}
                  onChange={(e) => setCarColor(e.target.value)}
                />
              </div>
              <div className="grid w-full items-center gap-1.5">
                <Label htmlFor="license-plate">رقم اللوحة</Label>
                <Input
                  id="license-plate"
                  type="text"
                  value={licensePlate || ""}
                  onChange={(e) => setLicensePlate(e.target.value)}
                />
              </div>
            </>
          )}

          <Button
            className="w-full bg-primary hover:bg-primary-dark text-primary-foreground transition-transform duration-200 ease-in-out hover:scale-[1.01]"
            onClick={() =>
              updateProfile({
                fullname,
                username,
                website,
                avatar_url,
                user_type: userType,
                car_model: carModel,
                car_color: carColor,
                license_plate: licensePlate,
                phone_number: phoneNumber,
              })
            }
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="ml-2 h-4 w-4 animate-spin rtl:mr-2" />
            ) : (
              "تحديث الملف الشخصي"
            )}
          </Button>
          <Button
            className="w-full text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground transition-transform duration-200 ease-in-out hover:scale-[1.01]"
            variant="outline"
            onClick={handleSignOut}
          >
            تسجيل الخروج
          </Button>
        </div>
      </div>
    </div>
  );
}