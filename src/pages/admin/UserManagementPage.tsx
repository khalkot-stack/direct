"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import UserFormDialog from "@/components/UserFormDialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/lib/supabase";
import { Loader2 } from "lucide-react";

interface Profile {
  id: string;
  full_name: string;
  email: string;
  user_type: "passenger" | "driver" | "admin";
  status: "active" | "suspended" | "banned";
  phone_number?: string;
}

const UserManagementPage = () => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState<Profile | undefined>(undefined);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [profileToDelete, setProfileToDelete] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfiles = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from('profiles').select('*');
    if (error) {
      toast.error(`فشل جلب المستخدمين: ${error.message}`);
      console.error("Error fetching profiles:", error);
    } else {
      setProfiles(data as Profile[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchProfiles();
  }, [fetchProfiles]);

  const filteredProfiles = profiles.filter(profile =>
    profile.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    profile.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    profile.user_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    profile.status.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEdit = (profile: Profile) => {
    setEditingProfile(profile);
    setIsFormDialogOpen(true);
  };

  const handleSaveProfile = async (updatedProfile: Profile) => {
    // This function now only handles updating existing profiles.
    // New users must register via the AuthPage, and then their profiles can be managed here.
    const { data, error } = await supabase
      .from('profiles')
      .update({
        full_name: updatedProfile.full_name,
        email: updatedProfile.email,
        user_type: updatedProfile.user_type,
        status: updatedProfile.status,
        phone_number: updatedProfile.phone_number,
      })
      .eq('id', updatedProfile.id);

    if (error) {
      toast.error(`فشل تحديث المستخدم: ${error.message}`);
      console.error("Error updating profile:", error);
    } else {
      toast.success(`تم تحديث المستخدم ${updatedProfile.full_name} بنجاح.`);
      fetchProfiles();
      setIsFormDialogOpen(false);
    }
  };

  const handleDeleteClick = (profileId: string) => {
    setProfileToDelete(profileId);
    setIsConfirmDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (profileToDelete) {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', profileToDelete);

      if (error) {
        toast.error(`فشل حذف المستخدم: ${error.message}`);
        console.error("Error deleting profile:", error);
      } else {
        toast.warning(`تم حذف المستخدم بنجاح.`);
        fetchProfiles();
      }
      setProfileToDelete(null);
    }
    setIsConfirmDialogOpen(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="sr-only">جاري تحميل المستخدمين...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">إدارة المستخدمين</h2>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>قائمة المستخدمين</CardTitle>
          {/* Removed "Add new user" button as direct profile creation is not supported */}
          {/* <Button onClick={handleAddUser} className="bg-primary hover:bg-primary-dark text-primary-foreground">
            إضافة مستخدم جديد
          </Button> */}
        </CardHeader>
        <CardContent>
          <Input
            placeholder="ابحث عن مستخدم..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm mb-4"
          />
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>الاسم الكامل</TableHead>
                <TableHead>البريد الإلكتروني</TableHead>
                <TableHead>النوع</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead className="text-right">الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProfiles.length > 0 ? (
                filteredProfiles.map((profile) => (
                  <TableRow key={profile.id}>
                    <TableCell>{profile.full_name}</TableCell>
                    <TableCell>{profile.email}</TableCell>
                    <TableCell>{profile.user_type === 'passenger' ? 'راكب' : profile.user_type === 'driver' ? 'سائق' : 'مدير'}</TableCell>
                    <TableCell>{profile.status === 'active' ? 'نشط' : profile.status === 'suspended' ? 'معلق' : 'محظور'}</TableCell>
                    <TableCell className="text-right space-x-2 rtl:space-x-reverse">
                      <Button variant="outline" size="sm" onClick={() => handleEdit(profile)} className="text-primary border-primary hover:bg-primary hover:text-primary-foreground">
                        تعديل
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => handleDeleteClick(profile.id)}>
                        حذف
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    لا توجد نتائج.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <UserFormDialog
        open={isFormDialogOpen}
        onOpenChange={setIsFormDialogOpen}
        profile={editingProfile}
        onSave={handleSaveProfile}
        // isNewUser prop is removed as this dialog is now only for editing
      />
      <AlertDialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>هل أنت متأكد تمامًا؟</AlertDialogTitle>
            <AlertDialogDescription>
              لا يمكن التراجع عن هذا الإجراء. سيتم حذف هذا المستخدم بشكل دائم من سجلاتنا.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default UserManagementPage;