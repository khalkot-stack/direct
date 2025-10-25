"use client";

import React, { useState } from "react";
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
} from "@/components/ui/alert-dialog"; // Import AlertDialog components

interface User {
  id: string;
  name: string;
  email: string;
  type: string;
  status: string;
}

const initialUsers: User[] = [
  { id: "1", name: "أحمد محمود", email: "ahmad@example.com", type: "سائق", status: "نشط" },
  { id: "2", name: "سارة علي", email: "sara@example.com", type: "راكب", status: "نشط" },
  { id: "3", name: "ليلى خالد", email: "layla@example.com", type: "راكب", status: "معلق" },
  { id: "4", name: "يوسف حسن", email: "yousef@example.com", type: "سائق", status: "نشط" },
  { id: "5", name: "فاطمة سعيد", email: "fatima@example.com", type: "سائق", status: "نشط" },
  { id: "6", name: "عمران السيد", email: "omran@example.com", type: "راكب", status: "نشط" },
];

const UserManagementPage = () => {
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [searchTerm, setSearchTerm] = useState("");
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | undefined>(undefined);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.status.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddUser = () => {
    setEditingUser(undefined);
    setIsFormDialogOpen(true);
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setIsFormDialogOpen(true);
  };

  const handleSaveUser = (updatedUser: User) => {
    if (users.some(u => u.id === updatedUser.id)) {
      setUsers(users.map(u => (u.id === updatedUser.id ? updatedUser : u)));
      toast.success(`تم تحديث المستخدم ${updatedUser.name} بنجاح.`);
    } else {
      setUsers([...users, updatedUser]);
      toast.success(`تم إضافة المستخدم ${updatedUser.name} بنجاح.`);
    }
  };

  const handleDeleteClick = (userId: string) => {
    setUserToDelete(userId);
    setIsConfirmDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (userToDelete) {
      setUsers(users.filter(user => user.id !== userToDelete));
      toast.warning(`تم حذف المستخدم بنجاح.`);
      setUserToDelete(null);
    }
    setIsConfirmDialogOpen(false);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">إدارة المستخدمين</h2>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>قائمة المستخدمين</CardTitle>
          <Button onClick={handleAddUser} className="bg-green-500 hover:bg-green-600 text-white">
            إضافة مستخدم جديد
          </Button>
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
                <TableHead>الاسم</TableHead>
                <TableHead>البريد الإلكتروني</TableHead>
                <TableHead>النوع</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead className="text-right">الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.type}</TableCell>
                    <TableCell>{user.status}</TableCell>
                    <TableCell className="text-right space-x-2 rtl:space-x-reverse">
                      <Button variant="outline" size="sm" onClick={() => handleEdit(user)}>
                        تعديل
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => handleDeleteClick(user.id)}>
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
        user={editingUser}
        onSave={handleSaveUser}
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