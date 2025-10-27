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
      fetchUserProfile();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-950">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="sr-only">جاري تحميل الملف الشخصي...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-950 p-4">
      <Card className="w-full max-w-md bg-white dark:bg-gray-900 shadow-lg rounded-lg">
        <div className="p-6">
          <PageHeader
            title="تعديل الملف الشخصي"
            description="تحديث معلوماتك الشخصية"
          />
        </div>
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
            <Button type="submit" className="w-full bg-primary hover:bg-primary-dark text-primary-foreground mt-6" disabled={isSaving}>
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
        </CardContent>
      </Card>
    </div>
  );
};

export default UserProfileEditPage;