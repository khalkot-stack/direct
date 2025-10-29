"use client";

import React, { useState, useEffect, useCallback } from "react";
import PageHeader from "@/components/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import AvatarUpload from "@/components/AvatarUpload";
import LogoutButton from "@/components/LogoutButton";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

interface Profile {
  id: string;
  full_name: string;
  email: string;
  user_type: "passenger" | "driver" | "admin";
  status: "active" | "suspended" | "banned";
  phone_number?: string | null;
  avatar_url?: string | null;
  created_at: string;
}

const profileSchema = z.object({
  full_name: z.string().min(2, { message: "الاسم الكامل مطلوب." }),
  phone_number: z.string().optional(),
  user_type: z.enum(["passenger", "driver", "admin"]),
});

type ProfileFormInputs = z.infer<typeof profileSchema>;

const ProfileSettingsPage: React.FC = () => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm<ProfileFormInputs>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: "",
      phone_number: "",
      user_type: "passenger",
    },
  });

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
      form.reset({
        full_name: data.full_name,
        phone_number: data.phone_number || "",
        user_type: data.user_type,
      });
    } else {
      // If no profile found, create a basic one
      const defaultFullName = user.user_metadata.full_name || user.email?.split('@')[0] || 'مستخدم جديد';
      const defaultUserType = user.user_metadata.user_type || 'passenger';
      const defaultStatus = user.user_metadata.status || 'active';
      const defaultPhoneNumber = user.user_metadata.phone_number || null;
      const defaultAvatarUrl = user.user_metadata.avatar_url || null;

      const { data: newProfile, error: insertError } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          full_name: defaultFullName,
          email: user.email,
          user_type: defaultUserType,
          status: defaultStatus,
          phone_number: defaultPhoneNumber,
          avatar_url: defaultAvatarUrl,
        })
        .select()
        .single();

      if (insertError) {
        toast.error(`فشل إنشاء الملف الشخصي الافتراضي: ${insertError.message}`);
        console.error("Error creating default profile:", insertError);
      } else {
        setProfile(newProfile as Profile);
        form.reset({
          full_name: newProfile.full_name,
          phone_number: newProfile.phone_number || "",
          user_type: newProfile.user_type,
        });
      }
    }
    setLoading(false);
  }, [form]);

  useEffect(() => {
    fetchUserProfile();
  }, [fetchUserProfile]);

  const handleAvatarUploadSuccess = (newUrl: string) => {
    if (profile) {
      setProfile(prev => prev ? { ...prev, avatar_url: newUrl } : null);
      // Also update auth.user metadata
      supabase.auth.updateUser({ data: { avatar_url: newUrl } });
    }
  };

  const handleSaveChanges = async (values: ProfileFormInputs) => {
    if (!profile) return;

    setIsSaving(true);
    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: values.full_name,
        phone_number: values.phone_number,
        user_type: values.user_type,
      })
      .eq('id', profile.id);
    setIsSaving(false);

    if (error) {
      toast.error(`فشل حفظ التغييرات: ${error.message}`);
      console.error("Error saving profile changes:", error);
    } else {
      toast.success("تم حفظ التغييرات بنجاح!");
      // Also update auth.user metadata
      await supabase.auth.updateUser({
        data: {
          full_name: values.full_name,
          user_type: values.user_type,
          phone_number: values.phone_number,
        }
      });
      setProfile(prev => prev ? { ...prev, ...values } : null); // Update local state
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
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSaveChanges)} className="space-y-4">
              <FormField
                control={form.control}
                name="full_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>الاسم الكامل</FormLabel>
                    <FormControl>
                      <Input placeholder="أحمد محمد" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid gap-2">
                <Label htmlFor="email">البريد الإلكتروني</Label>
                <Input id="email" value={profile.email} disabled className="bg-gray-100 dark:bg-gray-800" />
              </div>
              <FormField
                control={form.control}
                name="phone_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>رقم الهاتف</FormLabel>
                    <FormControl>
                      <Input type="tel" placeholder="07XXXXXXXX" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="user_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>نوع المستخدم</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="اختر نوع المستخدم" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="passenger">راكب</SelectItem>
                        <SelectItem value="driver">سائق</SelectItem>
                        {profile.user_type === 'admin' && <SelectItem value="admin">مدير</SelectItem>}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={isSaving} className="w-full bg-primary hover:bg-primary-dark text-primary-foreground">
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
          </Form>
        </CardContent>
      </Card>

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