"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, User, Loader2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  phone_number?: string;
}

const UserProfileEditPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);

  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");

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
      .select('id, full_name, email, phone_number')
      .eq('id', user.id)
      .single();

    if (error) {
      toast.error(`فشل جلب بيانات الملف الشخصي: ${error.message}`);
      console.error("Error fetching user profile:", error);
    } else if (data) {
      setProfile(data as UserProfile);
      setFullName(data.full_name || "");
      setPhoneNumber(data.phone_number || "");
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
    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: fullName,
        phone_number: phoneNumber,
      })
      .eq('id', profile.id);
    setIsSaving(false);

    if (error) {
      toast.error(`فشل حفظ الملف الشخصي: ${error.message}`);
      console.error("Error saving user profile:", error);
    } else {
      toast.success("تم حفظ الملف الشخصي بنجاح!");
      fetchUserProfile(); // Refresh data
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-950">
        <Loader2 className="h-8 w-8 animate-spin text-green-500" />
        <span className="sr-only">جاري تحميل الملف الشخصي...</span>
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
            تعديل الملف الشخصي
          </CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-400">
            تحديث معلوماتك الشخصية
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-6">
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
            <Button type="submit" className="w-full bg-green-500 hover:bg-green-600 text-white mt-6" disabled={isSaving}>
              {isSaving ? "جاري الحفظ..." : "حفظ التغييرات"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserProfileEditPage;