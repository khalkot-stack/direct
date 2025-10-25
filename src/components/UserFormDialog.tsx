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

interface User {
  id: string;
  name: string;
  email: string;
  type: string;
  status: string;
}

interface UserFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user?: User; // Optional user object for editing
  onSave: (user: User) => void;
}

const UserFormDialog: React.FC<UserFormDialogProps> = ({ open, onOpenChange, user, onSave }) => {
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [type, setType] = useState(user?.type || "راكب");
  const [status, setStatus] = useState(user?.status || "نشط");

  useEffect(() => {
    if (user) {
      setName(user.name);
      setEmail(user.email);
      setType(user.type);
      setStatus(user.status);
    } else {
      setName("");
      setEmail("");
      setType("راكب");
      setStatus("نشط");
    }
  }, [user, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !type || !status) {
      toast.error("الرجاء ملء جميع الحقول.");
      return;
    }

    const newUser: User = {
      id: user?.id || `new-${Date.now()}`, // Generate a new ID if adding
      name,
      email,
      type,
      status,
    };
    onSave(newUser);
    onOpenChange(false); // Close dialog after saving
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{user ? "تعديل المستخدم" : "إضافة مستخدم جديد"}</DialogTitle>
          <DialogDescription>
            {user ? "قم بتعديل تفاصيل المستخدم." : "أدخل تفاصيل المستخدم الجديد هنا."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              الاسم
            </Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="col-span-3" required />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="email" className="text-right">
              البريد الإلكتروني
            </Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="col-span-3" required />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="type" className="text-right">
              النوع
            </Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="اختر نوع المستخدم" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="راكب">راكب</SelectItem>
                <SelectItem value="سائق">سائق</SelectItem>
                <SelectItem value="مدير">مدير</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="status" className="text-right">
              الحالة
            </Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="اختر حالة المستخدم" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="نشط">نشط</SelectItem>
                <SelectItem value="معلق">معلق</SelectItem>
                <SelectItem value="محظور">محظور</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button type="submit">حفظ التغييرات</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default UserFormDialog;