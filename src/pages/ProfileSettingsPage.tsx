"use client";

import React, { useState, useEffect } from "react";
import PageHeader from "@/components/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
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
import { useUser } from "@/context/UserContext";
import { Profile } from "@/types/supabase";
import supabaseService from "@/services/supabaseService"; // Import the new service

const profileSchema = z.object({
  full_name: z.string().min(2, { message: "الاسم الكامل مطلوب." }),
  phone_number: z.string().nullable().optional(),
  user_type: z.enum(["passenger", "driver", "admin"]),
});

type ProfileFormInputs = z.infer<typeof profileSchema>;

const ProfileSettingsPage: React.FC = () => {
  const { user, profile, loading: userLoading, fetchUserProfile } = useUser();
  const [isSaving, setIsSaving] = useState(false);
  const [localProfile, setLocalProfile] = useState<Profile | null>(null);

  const form = useForm<ProfileFormInputs>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: "",
      phone_number: "",
      user_type: "passenger",
    },
  });

  useEffect(() => {
    if (!userLoading && profile) {
      setLocalProfile(profile);
      form.reset({
        full_name: profile.full_name || "",
        phone_number: profile.phone_number || "",
        user_type: profile.user_type,
      });
    }
  }, [userLoading, profile, form]);

  const handleAvatarUploadSuccess = async (newUrl: string) => {
    if (localProfile) {
      setLocalProfile(prev => prev ? { ...prev, avatar_url: newUrl } : null);
      // Also update auth.user metadata
      await supabase.auth.updateUser({ data: { avatar_url: newUrl } });
      fetchUserProfile(); // Re-fetch to update global context
    }
  };

  const handleSaveChanges = async (values: ProfileFormInputs) => {
    if (!localProfile || !user) return;

    setIsSaving(true);
    const updatedPhoneNumber = values.phone_number === "" ? null : values.phone_number;

    try {
      await supabaseService.updateProfile(localProfile.id, {
        full_name: values.full_name,
        phone_number: updatedPhoneNumber,
        user_type: values.user_type,
      });
      toast.success("تم حفظ التغييرات بنجاح!");
      // Also update auth.user metadata
      await supabase.auth.updateUser({
        data: {
          full_name: values.full_name,
          user_type: values.user_type,
          phone_number: updatedPhoneNumber,
        }
      });
      fetchUserProfile(); // Re-fetch to update global context
    } catch (error: any) {
      toast.error(`فشل حفظ التغييرات: ${error.message}`);
      console.error("Error saving profile changes:", error);
    } finally {
      setIsSaving(false);
    }
  };

  if (userLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-950">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="sr-only">جاري تحميل الملف الشخصي...</span>
      </div>
    );
  }

  if (!user || !localProfile) {
    return (
      <div className="container mx-auto p-4 text-center">
        <PageHeader title="إعدادات الملف الشخصي" description="إدارة معلومات ملفك الشخصي." backPath="/" />
        <p className="text-red-500 dark:text-red-400">فشل تحميل الملف الشخصي. الرجاء تسجيل الدخول.</p>
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
          {localProfile.id && (
            <AvatarUpload
              userId={localProfile.id}
              initialAvatarUrl={localProfile.avatar_url || null}
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
                <Input id="email" value={localProfile.email} disabled className="bg-gray-100 dark:bg-gray-800" />
              </div>
              <FormField
                control={form.control}
                name="phone_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>رقم الهاتف</FormLabel>
                    <FormControl>
                      <Input type="tel" placeholder="07XXXXXXXX" {...field} value={field.value || ""} />
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
                        {localProfile.user_type === 'admin' && <SelectItem value="admin">مدير</SelectItem>}
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