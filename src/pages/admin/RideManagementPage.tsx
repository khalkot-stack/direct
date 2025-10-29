"use client";

import React, { useState, useEffect, useCallback } from "react";
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
} from "@/components/ui/alert-dialog";
import { supabase } from "@/lib/supabase";
import { Loader2 } from "lucide-react";

// Define an interface for the raw data returned by Supabase select with joins for MULTIPLE rows
interface SupabaseJoinedRideData {
  id: string;
  pickup_location: string;
  destination: string;
  passengers_count: number;
  status: "pending" | "accepted" | "completed" | "cancelled";
  passenger_id: string;
  driver_id: string | null;
  // For multi-row queries, these are arrays of objects or null
  profiles_passenger: Array<{ full_name: string }> | null;
  profiles_driver: Array<{ full_name: string }> | null;
  cancellation_reason: string | null; // Added cancellation_reason
}

interface Ride {
  id: string;
  passenger_id: string;
  driver_id: string | null;
  passenger_name?: string;
  driver_name?: string;
  pickup_location: string;
  destination: string;
  passengers_count: number;
  status: "pending" | "accepted" | "completed" | "cancelled";
  cancellation_reason?: string | null; // Added cancellation_reason
}

const RideManagementPage = () => {
  const [rides, setRides] = useState<Ride[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [editingRide, setEditingRide] = useState<Ride | undefined>(undefined);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [rideToCancel, setRideToCancel] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchRides = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('rides')
      .select(`
        id,
        pickup_location,
        destination,
        passengers_count,
        status,
        passenger_id,
        driver_id,
        profiles_passenger:passenger_id (full_name),
        profiles_driver:driver_id (full_name),
        cancellation_reason
      `);

    if (error) {
      toast.error(`فشل جلب الرحلات: ${error.message}`);
      console.error("Error fetching rides:", error);
    } else {
      const formattedRides: Ride[] = data.map((ride: SupabaseJoinedRideData) => ({ // Cast to our defined interface
        id: ride.id,
        passenger_id: ride.passenger_id,
        driver_id: ride.driver_id,
        // Access the first element of the array, if it exists
        passenger_name: ride.profiles_passenger?.[0]?.full_name || 'غير معروف',
        driver_name: ride.profiles_driver?.[0]?.full_name || 'لا يوجد',
        pickup_location: ride.pickup_location,
        destination: ride.destination,
        passengers_count: ride.passengers_count,
        status: ride.status,
        cancellation_reason: ride.cancellation_reason, // Include cancellation_reason
      }));
      setRides(formattedRides);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchRides();
  }, [fetchRides]);

  const filteredRides = rides.filter(ride =>
    ride.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (ride.passenger_name?.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (ride.driver_name?.toLowerCase().includes(searchTerm.toLowerCase())) ||
    ride.pickup_location.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ride.destination.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ride.status.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (ride.cancellation_reason?.toLowerCase().includes(searchTerm.toLowerCase())) // Search by cancellation reason
  );

  const handleAddRide = () => {
    setEditingRide(undefined);
    setIsFormDialogOpen(true);
  };

  const handleEdit = (ride: Ride) => {
    setEditingRide(ride);
    setIsFormDialogOpen(true);
  };

  const handleSaveRide = async (updatedRide: Ride) => {
    if (updatedRide.id) { // Editing existing ride
      const { error } = await supabase
        .from('rides')
        .update({
          passenger_id: updatedRide.passenger_id,
          driver_id: updatedRide.driver_id,
          pickup_location: updatedRide.pickup_location,
          destination: updatedRide.destination,
          passengers_count: updatedRide.passengers_count,
          status: updatedRide.status,
          // cancellation_reason is not updated via this form, only via cancellation flow
        })
        .eq('id', updatedRide.id);

      if (error) {
        toast.error(`فشل تحديث الرحلة: ${error.message}`);
        console.error("Error updating ride:", error);
      } else {
        toast.success(`تم تحديث الرحلة ${updatedRide.id} بنجاح.`);
        fetchRides();
        setIsFormDialogOpen(false);
      }
    } else { // Adding new ride
      const { data, error } = await supabase
        .from('rides')
        .insert({
          passenger_id: updatedRide.passenger_id,
          driver_id: updatedRide.driver_id,
          pickup_location: updatedRide.pickup_location,
          destination: updatedRide.destination,
          passengers_count: updatedRide.passengers_count,
          status: updatedRide.status,
        });

      if (error) {
        toast.error(`فشل إضافة الرحلة: ${error.message}`);
        console.error("Error adding ride:", error);
      } else {
        toast.success(`تم إضافة الرحلة بنجاح.`);
        fetchRides();
        setIsFormDialogOpen(false);
      }
    }
  };

  const handleDeleteClick = (rideId: string) => {
    setRideToCancel(rideId);
    setIsConfirmDialogOpen(true);
  };

  const handleConfirmCancel = async () => {
    if (rideToCancel) {
      const { error } = await supabase
        .from('rides')
        .update({ status: "cancelled", cancellation_reason: "تم الإلغاء بواسطة المدير" }) // Admin cancellation reason
        .eq('id', rideToCancel);

      if (error) {
        toast.error(`فشل إلغاء الرحلة: ${error.message}`);
        console.error("Error cancelling ride:", error);
      } else {
        toast.warning(`تم إلغاء الرحلة رقم ${rideToCancel}.`);
        fetchRides();
      }
      setRideToCancel(null);
    }
    setIsConfirmDialogOpen(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="sr-only">جاري تحميل الرحلات...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">إدارة الرحلات</h2>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>قائمة الرحلات</CardTitle>
          <Button onClick={handleAddRide} className="bg-primary hover:bg-primary-dark text-primary-foreground">
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
                <TableHead>معرف الرحلة</TableHead><TableHead>الراكب</TableHead><TableHead>السائق</TableHead><TableHead>الانطلاق</TableHead><TableHead>الوجهة</TableHead><TableHead>الحالة</TableHead><TableHead>سبب الإلغاء</TableHead><TableHead className="text-right">الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRides.length > 0 ? (
                filteredRides.map((ride) => (
                  <TableRow key={ride.id}>
                    <TableCell>{ride.id.substring(0, 8)}...</TableCell><TableCell>{ride.passenger_name}</TableCell><TableCell>{ride.driver_name}</TableCell><TableCell>{ride.pickup_location}</TableCell><TableCell>{ride.destination}</TableCell><TableCell>{ride.status}</TableCell><TableCell>{ride.cancellation_reason || 'لا يوجد'}</TableCell><TableCell className="text-right space-x-2 rtl:space-x-reverse">
                      <Button variant="outline" size="sm" onClick={() => handleEdit(ride)} className="text-primary border-primary hover:bg-primary hover:text-primary-foreground">تعديل</Button>
                      {ride.status !== "completed" && ride.status !== "cancelled" && (
                        <Button variant="destructive" size="sm" onClick={() => handleDeleteClick(ride.id)}>إلغاء</Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow><TableCell colSpan={8} className="h-24 text-center">لا توجد نتائج.</TableCell></TableRow>
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
            <AlertDialogTitle>هل أنت متأكد تمامًا؟</AlertDialogTitle>
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