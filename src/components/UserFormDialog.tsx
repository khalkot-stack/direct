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

interface Profile {
  id: string;
  full_name: string;
  email: string;
  user_type: "passenger" | "driver" | "admin";
  status: "active" | "suspended" | "banned";
  phone_number?: string;
}

interface UserFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile?: Profile; // Optional profile object for editing
  onSave: (profile: Profile) => void;
  // isNewUser prop is removed
}

const UserFormDialog: React.FC<UserFormDialogProps> = ({ open, onOpenChange, profile, onSave }) => {
  const [fullName, setFullName] = useState(profile?.full_name || "");
  const [email, setEmail] = useState(profile?.email || "");
  const [userType, setUserType] = useState<"passenger" | "driver" | "admin">(profile?.user_type || "passenger");
  const [status, setStatus] = useState<"active" | "suspended" | "banned">(profile?.status || "active");
  const [phoneNumber, setPhoneNumber] = useState(profile?.phone_number || "");

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name);
      setEmail(profile.email);
      setUserType(profile.user_type);
      setStatus(profile.status);
      setPhoneNumber(profile.phone_number || "");
    } else {
      // Reset form if no profile is passed (e.g., dialog opened without an existing profile)
      setFullName("");
      setEmail("");
      setUserType("passenger");
      setStatus("active");
      setPhoneNumber("");
    }
  }, [profile, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.id || !fullName || !email || !userType || !status) {
      toast.error("الرجاء ملء جميع الحقول المطلوبة.");
      return;
    }

    const updatedProfile: Profile = {
      id: profile.id, // Always use the existing profile ID for updates
      full_name: fullName,
      email,
      user_type: userType,
      status,
      phone_number: phoneNumber,
    };
    onSave(updatedProfile);
    // Dialog will be closed by parent component after successful save
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>تعديل المستخدم</DialogTitle>
          <DialogDescription>
            قم بتعديل تفاصيل المستخدم.
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
            {/* Email is disabled as it's the primary identifier and should not be changed via profile edit */}
            <Input id="email" type="email" value={email} className="col-span-3" required disabled />
          </div>
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
            <Button type="submit" className="bg-primary hover:bg-primary-dark text-primary-foreground">حفظ التغييرات</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default UserFormDialog;