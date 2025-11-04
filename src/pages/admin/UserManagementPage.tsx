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
import { PlusCircle, Search, Edit, Trash2, Loader2, Users as UsersIcon } from "lucide-react";
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
import { useUser } from "@/context/UserContext";
import { Profile } from "@/types/supabase";
import UserStatusBadge from "@/components/UserStatusBadge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import UserTableSkeleton from "@/components/skeletons/UserTableSkeleton";
import supabaseService from "@/services/supabaseService"; // Import the new service

const UserManagementPage: React.FC = () => {
  const { user, loading: userLoading } = useUser();
  const [users, setUsers] = useState<Profile[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<Profile | undefined>(undefined);
  const [isNewUser, setIsNewUser] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [userToDelete, setUserToDelete] = useState<Profile | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoadingUsers(true);
    try {
      const fetchedUsers = await supabaseService.getAllUsers();
      setUsers(fetchedUsers);
    } catch (error: any) {
      toast.error(`فشل جلب المستخدمين: ${error.message}`);
      console.error("Error fetching users:", error);
      setUsers([]);
    } finally {
      setLoadingUsers(false);
    }
  }, []);

  useEffect(() => {
    if (!userLoading && user) {
      fetchUsers();
    } else if (!userLoading && !user) {
      setLoadingUsers(false);
    }
  }, [userLoading, user, fetchUsers]);

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
    try {
      if (isNewUser) {
        // For new users, the profile is already created via auth.signUp in UserFormDialog
        // We just need to re-fetch the list to include the new user.
        fetchUsers();
      } else if (selectedUser) {
        const { id, ...updates } = profileData;
        await supabaseService.updateProfile(id, updates);
        toast.success("تم تحديث المستخدم بنجاح!");
        fetchUsers();
      }
    } catch (error: any) {
      toast.error(`فشل حفظ المستخدم: ${error.message}`);
      console.error("Error saving user:", error);
    }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;

    setIsDeleting(true);
    try {
      await supabaseService.deleteProfile(userToDelete.id);
      toast.success("تم حذف المستخدم بنجاح!");
      fetchUsers();
    } catch (error: any) {
      toast.error(`فشل حذف المستخدم: ${error.message}`);
      console.error("Error deleting user:", error);
    } finally {
      setIsDeleting(false);
      setUserToDelete(null);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = (
      (user.full_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.user_type.toLowerCase().includes(searchTerm.toLowerCase())
    );
    const matchesStatus = filterStatus === "all" || user.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  if (userLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <PageHeader title="إدارة المستخدمين" description="عرض وإدارة جميع المستخدمين في النظام." showBackButton={false} />

      <div className="flex items-center justify-between mb-4 gap-4">
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
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="تصفية حسب الحالة" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">جميع الحالات</SelectItem>
            <SelectItem value="active">نشط</SelectItem>
            <SelectItem value="suspended">معلق</SelectItem>
            <SelectItem value="banned">محظور</SelectItem>
            <SelectItem value="pending_review">قيد المراجعة</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={handleAddUser} className="bg-primary hover:bg-primary-dark text-primary-foreground">
          <PlusCircle className="h-4 w-4 ml-2 rtl:mr-2" />
          إضافة مستخدم
        </Button>
      </div>

      {loadingUsers ? (
        <UserTableSkeleton />
      ) : filteredUsers.length === 0 ? (
        <EmptyState
          icon={UsersIcon}
          title="لا يوجد مستخدمون"
          description="لا توجد بيانات مستخدمين لعرضها. ابدأ بإضافة مستخدم جديد."
        />
      ) : (
        <div className="rounded-md border overflow-x-auto">
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
                  <TableCell><UserStatusBadge status={user.status} /></TableCell>
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