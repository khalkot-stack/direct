"use client";

import React, { useState, useEffect, useCallback } from "react";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PlusCircle, Search, Edit, Trash2, Loader2, Users } from "lucide-react"; // Removed Ban, CheckCircle, Clock
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import UserFormDialog from "@/components/UserFormDialog";
import EmptyState from "@/components/EmptyState";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";

interface Profile {
  id: string;
  full_name: string;
  email: string;
  user_type: "passenger" | "driver" | "admin";
  status: "active" | "suspended" | "banned";
  phone_number?: string;
  created_at: string;
}

const UserManagementPage: React.FC = () => {
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<Profile | undefined>(undefined);
  const [isNewUser, setIsNewUser] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [userToDelete, setUserToDelete] = useState<Profile | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast.error(`فشل جلب المستخدمين: ${error.message}`);
      console.error("Error fetching users:", error);
    } else {
      setUsers(data as Profile[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleAddUser = () => {
    setSelectedUser(undefined);
    setIsNewUser(true);
    setIsFormDialogOpen(true);
  };

  const handleEditUser = (user: Profile) => {
    setSelectedUser(user);
    setIsNewUser(false);
    setIsFormDialogOpen(true);
  };

  const handleSaveUser = async (profileData: Profile) => {
    if (isNewUser) {
      // User creation is handled within UserFormDialog via supabase.auth.signUp
      // We just need to refetch users to show the new one
      fetchUsers();
    } else if (selectedUser) {
      const { id, ...updates } = profileData;
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', id);

      if (error) {
        toast.error(`فشل تحديث المستخدم: ${error.message}`);
        console.error("Error updating user:", error);
      } else {
        toast.success("تم تحديث المستخدم بنجاح!");
        fetchUsers();
      }
    }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;

    setIsDeleting(true);
    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', userToDelete.id);
    setIsDeleting(false);
    setUserToDelete(null); // Close the dialog

    if (error) {
      toast.error(`فشل حذف المستخدم: ${error.message}`);
      console.error("Error deleting user:", error);
    } else {
      toast.success("تم حذف المستخدم بنجاح!");
      fetchUsers();
    }
  };

  const filteredUsers = users.filter(user =>
    user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.user_type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: "active" | "suspended" | "banned") => {
    switch (status) {
      case "active":
        return <Badge variant="default" className="bg-green-500 hover:bg-green-500/80">نشط</Badge>;
      case "suspended":
        return <Badge variant="secondary" className="bg-yellow-500 hover:bg-yellow-500/80">معلق</Badge>;
      case "banned":
        return <Badge variant="destructive">محظور</Badge>;
      default:
        return <Badge variant="outline">غير معروف</Badge>;
    }
  };

  return (
    <div className="container mx-auto p-4">
      <PageHeader title="إدارة المستخدمين" description="عرض وإدارة جميع المستخدمين في النظام." />

      <div className="flex items-center justify-between mb-4">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="البحث عن مستخدم..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
        <Button onClick={handleAddUser} className="bg-primary hover:bg-primary-dark text-primary-foreground">
          <PlusCircle className="h-4 w-4 ml-2 rtl:mr-2" />
          إضافة مستخدم
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filteredUsers.length === 0 ? (
        <EmptyState
          icon={Users}
          title="لا يوجد مستخدمون"
          description="لا توجد بيانات مستخدمين لعرضها. ابدأ بإضافة مستخدم جديد."
        />
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>الاسم الكامل</TableHead>
                <TableHead>البريد الإلكتروني</TableHead>
                <TableHead>النوع</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead>رقم الهاتف</TableHead>
                <TableHead className="text-right">الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.full_name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.user_type === "passenger" ? "راكب" : user.user_type === "driver" ? "سائق" : "مدير"}</TableCell>
                  <TableCell>{getStatusBadge(user.status)}</TableCell>
                  <TableCell>{user.phone_number || "N/A"}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditUser(user)}
                      className="ml-2 rtl:mr-2"
                    >
                      <Edit className="h-4 w-4" />
                      <span className="sr-only">تعديل</span>
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-500 hover:bg-red-100 dark:hover:bg-red-900/20"
                          onClick={() => setUserToDelete(user)}
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">حذف</span>
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>هل أنت متأكد تمامًا؟</AlertDialogTitle>
                          <AlertDialogDescription>
                            سيؤدي هذا الإجراء إلى حذف المستخدم {userToDelete?.full_name} بشكل دائم من قاعدة البيانات. لا يمكن التراجع عن هذا الإجراء.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel onClick={() => setUserToDelete(null)}>إلغاء</AlertDialogCancel>
                          <AlertDialogAction onClick={handleDeleteUser} disabled={isDeleting}>
                            {isDeleting ? (
                              <>
                                <Loader2 className="h-4 w-4 animate-spin ml-2 rtl:mr-2" />
                                جاري الحذف...
                              </>
                            ) : (
                              "حذف"
                            )}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <UserFormDialog
        open={isFormDialogOpen}
        onOpenChange={setIsFormDialogOpen}
        profile={selectedUser}
        onSave={handleSaveUser}
        isNewUser={isNewUser}
      />
    </div>
  );
};

export default UserManagementPage;