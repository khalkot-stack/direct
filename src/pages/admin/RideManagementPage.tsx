"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import RideFormDialog from "@/components/RideFormDialog";
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

interface Ride {
  id: string;
  passenger: string;
  driver: string;
  pickup: string;
  destination: string;
  status: string;
}

const initialRides: Ride[] = [
  { id: "R001", passenger: "سارة علي", driver: "أحمد محمود", pickup: "شارع الجامعة", destination: "دوار السابع", status: "مكتملة" },
  { id: "R002", passenger: "ليلى خالد", driver: "لا يوجد", pickup: "العبدلي", destination: "الصويفية", status: "قيد الانتظار" },
  { id: "R003", passenger: "يوسف حسن", driver: "فاطمة سعيد", pickup: "جبل عمان", destination: "المدينة الرياضية", status: "ملغاة" },
  { id: "R004", passenger: "علياء محمد", driver: "محمد سعيد", pickup: "الشميساني", destination: "مجمع رغدان", status: "مكتملة" },
  { id: "R005", passenger: "خالد فهد", driver: "لا يوجد", pickup: "الجبيهة", destination: "وسط البلد", status: "قيد الانتظار" },
];

const RideManagementPage = () => {
  const [rides, setRides] = useState<Ride[]>(initialRides);
  const [searchTerm, setSearchTerm] = useState("");
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [editingRide, setEditingRide] = useState<Ride | undefined>(undefined);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [rideToCancel, setRideToCancel] = useState<string | null>(null);

  const filteredRides = rides.filter(ride =>
    ride.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ride.passenger.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ride.driver.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ride.pickup.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ride.destination.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ride.status.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddRide = () => {
    setEditingRide(undefined);
    setIsFormDialogOpen(true);
  };

  const handleEdit = (ride: Ride) => {
    setEditingRide(ride);
    setIsFormDialogOpen(true);
  };

  const handleSaveRide = (updatedRide: Ride) => {
    if (rides.some(r => r.id === updatedRide.id)) {
      setRides(rides.map(r => (r.id === updatedRide.id ? updatedRide : r)));
      toast.success(`تم تحديث الرحلة ${updatedRide.id} بنجاح.`);
    } else {
      setRides([...rides, updatedRide]);
      toast.success(`تم إضافة الرحلة ${updatedRide.id} بنجاح.`);
    }
  };

  const handleCancelClick = (rideId: string) => {
    setRideToCancel(rideId);
    setIsConfirmDialogOpen(true);
  };

  const handleConfirmCancel = () => {
    if (rideToCancel) {
      setRides(rides.map(r => (r.id === rideToCancel ? { ...r, status: "ملغاة" } : r)));
      toast.warning(`تم إلغاء الرحلة رقم ${rideToCancel}.`);
      setRideToCancel(null);
    }
    setIsConfirmDialogOpen(false);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">إدارة الرحلات</h2>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>قائمة الرحلات</CardTitle>
          <Button onClick={handleAddRide} className="bg-green-500 hover:bg-green-600 text-white">
            إضافة رحلة جديدة
          </Button>
        </CardHeader>
        <CardContent>
          <Input
            placeholder="ابحث عن رحلة..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm mb-4"
          />
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
              {filteredRides.length > 0 ? (
                filteredRides.map((ride) => (
                  <TableRow key={ride.id}>
                    <TableCell>{ride.id}</TableCell>
                    <TableCell>{ride.passenger}</TableCell>
                    <TableCell>{ride.driver}</TableCell>
                    <TableCell>{ride.pickup}</TableCell>
                    <TableCell>{ride.destination}</TableCell>
                    <TableCell>{ride.status}</TableCell>
                    <TableCell className="text-right space-x-2 rtl:space-x-reverse">
                      <Button variant="outline" size="sm" onClick={() => handleEdit(ride)}>
                        تعديل
                      </Button>
                      {ride.status !== "مكتملة" && ride.status !== "ملغاة" && (
                        <Button variant="destructive" size="sm" onClick={() => handleCancelClick(ride.id)}>
                          إلغاء
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center">
                    لا توجد نتائج.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <RideFormDialog
        open={isFormDialogOpen}
        onOpenChange={setIsFormDialogOpen}
        ride={editingRide}
        onSave={handleSaveRide}
      />
      <AlertDialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>هل أنت متأكد من إلغاء هذه الرحلة؟</AlertDialogTitle>
            <AlertDialogDescription>
              لا يمكن التراجع عن هذا الإجراء. سيتم تغيير حالة الرحلة إلى "ملغاة".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmCancel} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              تأكيد الإلغاء
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default RideManagementPage;