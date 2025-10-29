"use client";

import React, { useState, useEffect, useCallback } from "react";
import PageHeader from "@/components/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react"; // Removed unused 'User' import
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import AvatarUpload from "@/components/AvatarUpload";
import LogoutButton from "@/components/LogoutButton";

interface Profile {
  id: string;
  full_name: string;
  email: string;
  user_type: "passenger" | "driver" | "admin";
  status: "active" | "suspended" | "banned";
  phone_number?: string;
  avatar_url?: string | null;
  created_at: string;
}

const ProfileSettingsPage: React.FC = () => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const fetchUserProfile = useCallback(async () => {
    setLoading(true);
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      toast.error("الرجاء تسجيل الدخول لعرض ملفك الشخصي.");
      setLoading(false);
      return;
    }

    const { data, error, status } = await supabase
      .from('profiles')
      .select('id, full_name, email, user_type, status, phone_number, avatar_url, created_at')
      .eq('id', user.id)
      .single();

    if (error && status !== 406) { // 406 means no rows found, which is fine if profile doesn't exist yet
      toast.error(`فشل جلب الملف الشخصي: ${error.message}`);
      console.error("Error fetching profile:", error);
      setProfile(null);
    } else if (data) {
      setProfile(data as Profile);
    } else {
      // If no profile found, create a basic one
      const { data: newProfile, error: insertError } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          full_name: user.user_metadata.full_name || user.email?.split('@')[0] || 'مستخدم جديد',
          email: user.email,
          user_type: user.user_metadata.user_type || 'passenger',
          status: user.user_metadata.status || 'active',
          phone_number: user.user_metadata.phone_number || null,
          avatar_url: user.user_metadata.avatar_url || null,
        })
        .select()
        .single();

      if (insertError) {
        toast.error(`فشل إنشاء الملف الشخصي الافتراضي: ${insertError.message}`);
        console.error("Error creating default profile:", insertError);
      } else {
        setProfile(newProfile as Profile);
      }
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchUserProfile();
  }, [fetchUserProfile]);

  const handleProfileChange = (key: keyof Profile, value: any) => {
    if (profile) {
      setProfile(prev => prev ? { ...prev, [key]: value } : null);
    }
  };

  const handleAvatarUploadSuccess = (newUrl: string) => {
    if (profile) {
      setProfile(prev => prev ? { ...prev, avatar_url: newUrl } : null);
    }
  };

  const handleSaveChanges = async () => {
    if (!profile) return;

    setIsSaving(true);
    const { id, email, created_at, ...updates } = profile; // Exclude id, email, created_at from updates
    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', id);
    setIsSaving(false);

    if (error) {
      toast.error(`فشل حفظ التغييرات: ${error.message}`);
      console.error("Error saving profile changes:", error);
    } else {
      toast.success("تم حفظ التغييرات بنجاح!");
      // Also update auth.user metadata if full_name or user_type changed
      await supabase.auth.updateUser({
        data: {
          full_name: profile.full_name,
          user_type: profile.user_type,
          phone_number: profile.phone_number,
          avatar_url: profile.avatar_url,
        }
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-950">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="sr-only">جاري تحميل الملف الشخصي...</span>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="container mx-auto p-4 text-center">
        <PageHeader title="إعدادات الملف الشخصي" description="إدارة معلومات ملفك الشخصي." backPath="/" />
        <p className="text-red-500 dark:text-red-400">فشل تحميل الملف الشخصي.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <PageHeader title="إعدادات الملف الشخصي" description="إدارة معلومات ملفك الشخصي." backPath="/" />

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>الصورة الشخصية</CardTitle>
          <CardDescription>قم بتحميل صورة شخصية جديدة.</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          {profile.id && (
            <AvatarUpload
              userId={profile.id}
              initialAvatarUrl={profile.avatar_url || null}
              onUploadSuccess={handleAvatarUploadSuccess}
            />
          )}
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>المعلومات الأساسية</CardTitle>
          <CardDescription>تحديث اسمك ورقم هاتفك.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="full_name">الاسم الكامل</Label>
            <Input
              id="full_name"
              value={profile.full_name}
              onChange={(e) => handleProfileChange('full_name', e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="email">البريد الإلكتروني</Label>
            <Input id="email" value={profile.email} disabled className="bg-gray-100 dark:bg-gray-800" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="phone_number">رقم الهاتف</Label>
            <Input
              id="phone_number"
              type="tel"
              value={profile.phone_number || ''}
              onChange={(e) => handleProfileChange('phone_number', e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="user_type">نوع المستخدم</Label>
            <Select value={profile.user_type} onValueChange={(value: "passenger" | "driver" | "admin") => handleProfileChange('user_type', value)}>
              <SelectTrigger>
                <SelectValue placeholder="اختر نوع المستخدم" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="passenger">راكب</SelectItem>
                <SelectItem value="driver">سائق</SelectItem>
                {profile.user_type === 'admin' && <SelectItem value="admin">مدير</SelectItem>}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end mb-6">
        <Button onClick={handleSaveChanges} disabled={isSaving} className="bg-primary hover:bg-primary-dark text-primary-foreground">
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin ml-2 rtl:mr-2" />
              جاري الحفظ...
            </>
          ) : (
            "حفظ التغييرات"
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

export default ProfileSettingsPage;