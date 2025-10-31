"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { Loader2 } from "lucide-react";
import { Profile } from "@/types/supabase"; // Import shared Profile type

interface UserFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile?: Profile;
  onSave: (profile: Profile) => Promise<void>; // Updated to accept Promise<void>
  isNewUser: boolean;
}

const UserFormDialog: React.FC<UserFormDialogProps> = ({ open, onOpenChange, profile, onSave, isNewUser }) => {
  const [fullName, setFullName] = useState(profile?.full_name || "");
  const [email, setEmail] = useState(profile?.email || "");
  const [password, setPassword] = useState("");
  const [userType, setUserType] = useState<"passenger" | "driver" | "admin">(profile?.user_type || "passenger");
  const [status, setStatus] = useState<"active" | "suspended" | "banned">(profile?.status || "active");
  const [phoneNumber, setPhoneNumber] = useState(profile?.phone_number || "");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (open) {
      if (isNewUser) {
        setFullName("");
        setEmail("");
        setPassword("");
        setUserType("passenger");
        setStatus("active");
        setPhoneNumber("");
      } else if (profile) {
        setFullName(profile.full_name || ""); // Handle null
        setEmail(profile.email);
        setUserType(profile.user_type);
        setStatus(profile.status);
        setPhoneNumber(profile.phone_number || ""); // Handle null
        setPassword("");
      }
    }
  }, [profile, open, isNewUser]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    if (isNewUser) {
      if (!fullName || !email || !password || !userType) {
        toast.error("الرجاء ملء جميع الحقول المطلوبة لإنشاء مستخدم جديد.");
        setIsSaving(false);
        return;
      }
      if (password.length < 6) {
        toast.error("يجب أن تتكون كلمة المرور من 6 أحرف على الأقل.");
        setIsSaving(false);
        return;
      }

      const finalPhoneNumber = phoneNumber === "" ? null : phoneNumber; // Convert empty string to null

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            phone_number: finalPhoneNumber,
            user_type: userType,
            status: status,
          },
        },
      });

      if (error) {
        toast.error(`فشل إنشاء المستخدم: ${error.message}`);
        console.error("Error creating new user:", error);
      } else if (data.user) {
        toast.success(`تم إنشاء المستخدم ${fullName} بنجاح! (الرجاء التحقق من البريد الإلكتروني للتفعيل).`);
        onOpenChange(false);
        // Pass a dummy profile with minimal data for new user, actual data will be fetched by parent
        await onSave({ id: data.user.id, full_name: fullName, email, user_type: userType, status, phone_number: finalPhoneNumber, avatar_url: null, created_at: new Date().toISOString() });
      }
    } else {
      if (!profile?.id || !fullName || !email || !userType || !status) {
        toast.error("الرجاء ملء جميع الحقول المطلوبة لتعديل المستخدم.");
        setIsSaving(false);
        return;
      }

      const finalPhoneNumber = phoneNumber === "" ? null : phoneNumber; // Convert empty string to null

      const updatedProfile: Profile = {
        id: profile.id,
        full_name: fullName,
        email,
        user_type: userType,
        status,
        phone_number: finalPhoneNumber,
        avatar_url: profile.avatar_url, // Keep existing avatar_url
        created_at: profile.created_at, // Ensure created_at is passed
      };
      await onSave(updatedProfile);
      onOpenChange(false);
    }
    setIsSaving(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isNewUser ? "إضافة مستخدم جديد" : "تعديل المستخدم"}</DialogTitle>
          <DialogDescription>
            {isNewUser ? "أدخل تفاصيل المستخدم الجديد." : "قم بتعديل تفاصيل المستخدم."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="full_name" className="text-right">
              الاسم الكامل
            </Label>
            <Input id="full_name" value={fullName} onChange={(e) => setFullName(e.target.value)} className="col-span-3" required />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="email" className="text-right">
              البريد الإلكتروني
            </Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="col-span-3" required disabled={!isNewUser} />
          </div>
          {isNewUser && (
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="password" className="text-right">
                كلمة المرور
              </Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="col-span-3" required />
            </div>
          )}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="phone_number" className="text-right">
              رقم الهاتف
            </Label>
            <Input id="phone_number" type="tel" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="user_type" className="text-right">
              النوع
            </Label>
            <Select value={userType} onValueChange={(value: "passenger" | "driver" | "admin") => setUserType(value)}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="اختر نوع المستخدم" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="passenger">راكب</SelectItem>
                <SelectItem value="driver">سائق</SelectItem>
                <SelectItem value="admin">مدير</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="status" className="text-right">
              الحالة
            </Label>
            <Select value={status} onValueChange={(value: "active" | "suspended" | "banned") => setStatus(value)}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="اختر حالة المستخدم" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">نشط</SelectItem>
                <SelectItem value="suspended">معلق</SelectItem>
                <SelectItem value="banned">محظور</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button type="submit" className="bg-primary hover:bg-primary-dark text-primary-foreground" disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin ml-2 rtl:mr-2" />
                  جاري الحفظ...
                </>
              ) : (
                "حفظ التغييرات"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default UserFormDialog;