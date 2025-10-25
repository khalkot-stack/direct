"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

const initialUsers = [
  { id: "1", name: "أحمد محمود", email: "ahmad@example.com", type: "سائق", status: "نشط" },
  { id: "2", name: "سارة علي", email: "sara@example.com", type: "راكب", status: "نشط" },
  { id: "3", name: "ليلى خالد", email: "layla@example.com", type: "راكب", status: "معلق" },
  { id: "4", name: "يوسف حسن", email: "yousef@example.com", type: "سائق", status: "نشط" },
  { id: "5", name: "فاطمة سعيد", email: "fatima@example.com", type: "سائق", status: "نشط" },
  { id: "6", name: "عمران السيد", email: "omran@example.com", type: "راكب", status: "نشط" },
];

const UserManagementPage = () => {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredUsers = initialUsers.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.status.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEdit = (userId: string) => {
    toast.info(`تعديل المستخدم رقم ${userId}`);
    // Implement actual edit logic here
  };

  const handleDelete = (userId: string) => {
    toast.warning(`حذف المستخدم رقم ${userId}`);
    // Implement actual delete logic here
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">إدارة المستخدمين</h2>
      <Card>
        <CardHeader>
          <CardTitle>قائمة المستخدمين</CardTitle>
          <Input
            placeholder="ابحث عن مستخدم..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm mt-4"
          />
        </CardHeader>
        <CardContent>
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
                      <Button variant="outline" size="sm" onClick={() => handleEdit(user.id)}>
                        تعديل
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => handleDelete(user.id)}>
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
    </div>
  );
};

export default UserManagementPage;