"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const rides = [
  { id: "R001", passenger: "سارة علي", driver: "أحمد محمود", pickup: "شارع الجامعة", destination: "دوار السابع", status: "مكتملة" },
  { id: "R002", passenger: "ليلى خالد", driver: "لا يوجد", pickup: "العبدلي", destination: "الصويفية", status: "قيد الانتظار" },
  { id: "R003", passenger: "يوسف حسن", driver: "فاطمة سعيد", pickup: "جبل عمان", destination: "المدينة الرياضية", status: "ملغاة" },
];

const RideManagementPage = () => {
  const handleViewDetails = (rideId: string) => {
    toast.info(`عرض تفاصيل الرحلة رقم ${rideId}`);
    // Implement actual view details logic here
  };

  const handleCancelRide = (rideId: string) => {
    toast.warning(`إلغاء الرحلة رقم ${rideId}`);
    // Implement actual cancel logic here
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">إدارة الرحلات</h2>
      <Card>
        <CardHeader>
          <CardTitle>قائمة الرحلات</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>معرف الرحلة</TableHead>
                <TableHead>الراكب</TableHead>
                <TableHead>السائق</TableHead>
                <TableHead>الانطلاق</TableHead>
                <TableHead>الوجهة</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead className="text-right">الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rides.map((ride) => (
                <TableRow key={ride.id}>
                  <TableCell>{ride.id}</TableCell>
                  <TableCell>{ride.passenger}</TableCell>
                  <TableCell>{ride.driver}</TableCell>
                  <TableCell>{ride.pickup}</TableCell>
                  <TableCell>{ride.destination}</TableCell>
                  <TableCell>{ride.status}</TableCell>
                  <TableCell className="text-right space-x-2 rtl:space-x-reverse">
                    <Button variant="outline" size="sm" onClick={() => handleViewDetails(ride.id)}>
                      تفاصيل
                    </Button>
                    {ride.status !== "مكتملة" && ride.status !== "ملغاة" && (
                      <Button variant="destructive" size="sm" onClick={() => handleCancelRide(ride.id)}>
                        إلغاء
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default RideManagementPage;