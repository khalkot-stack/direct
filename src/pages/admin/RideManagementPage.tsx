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
import { PlusCircle, Search, Edit, Trash2, Loader2, Car as CarIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import RideFormDialog from "@/components/RideFormDialog";
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
import { Ride, RawRideData } from "@/types/supabase";
import RideStatusBadge from "@/components/RideStatusBadge";
import { useSupabaseRealtime } from "@/hooks/useSupabaseRealtime";
import RideTableSkeleton from "@/components/skeletons/RideTableSkeleton"; // Import the new skeleton component

const RideManagementPage: React.FC = () => {
  const { user, loading: userLoading } = useUser();
  const [rides, setRides] = useState<Ride[]>([]);
  const [loadingRides, setLoadingRides] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [selectedRide, setSelectedRide] = useState<Ride | undefined>(undefined);
  const [isDeleting, setIsDeleting] = useState(false);
  const [rideToDelete, setRideToDelete] = useState<Ride | null>(null);

  const fetchRides = useCallback(async () => {
    setLoadingRides(true);
    console.log("RideManagementPage: Attempting to fetch rides...");
    const { data: ridesRaw, error } = await supabase
      .from('rides')
      .select(`
        id,
        passenger_id,
        driver_id,
        pickup_location,
        destination,
        passengers_count,
        status,
        created_at,
        cancellation_reason,
        pickup_lat,
        pickup_lng,
        destination_lat,
        destination_lng,
        driver_current_lat,
        driver_current_lng,
        passenger_profiles:passenger_id(id, full_name, avatar_url, user_type),
        driver_profiles:driver_id(id, full_name, avatar_url, user_type)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error("RideManagementPage: Error fetching rides:", error);
      toast.error(`فشل جلب الرحلات: ${error.message}`);
      setRides([]);
    } else {
      console.log("RideManagementPage: Raw rides data received:", ridesRaw);
      const formattedRides: Ride[] = (ridesRaw as RawRideData[] || []).map(ride => {
        const passengerProfile = Array.isArray(ride.passenger_profiles)
          ? ride.passenger_profiles[0] || null
          : ride.passenger_profiles;
        
        const driverProfile = Array.isArray(ride.driver_profiles)
          ? ride.driver_profiles[0] || null
          : ride.driver_profiles;

        return {
          ...ride,
          passenger_profiles: passengerProfile,
          driver_profiles: driverProfile,
        };
      }) as Ride[];
      console.log("RideManagementPage: Formatted rides:", formattedRides);
      setRides(formattedRides);
    }
    setLoadingRides(false);
    console.log("RideManagementPage: Finished fetching rides.");
  }, []);

  useEffect(() => {
    fetchRides();
  }, [fetchRides]);

  useSupabaseRealtime(
    'admin_rides_channel',
    {
      event: '*',
      schema: 'public',
      table: 'rides',
    },
    (_payload) => {
      console.log('RideManagementPage: Realtime ride change received:', _payload);
      fetchRides();
    },
    !!user
  );

  const handleAddRide = () => {
    setSelectedRide(undefined);
    setIsFormDialogOpen(true);
  };

  const handleEditRide = (ride: Ride) => {
    setSelectedRide(ride);
    setIsFormDialogOpen(true);
  };

  const handleSaveRide = async (rideData: Omit<Ride, 'created_at' | 'passenger_profiles' | 'driver_profiles' | 'cancellation_reason' | 'pickup_lat' | 'pickup_lng' | 'destination_lat' | 'destination_lng' | 'driver_current_lat' | 'driver_current_lng'>) => {
    if (selectedRide) {
      const { id, ...updates } = rideData;
      const { error } = await supabase
        .from('rides')
        .update(updates)
        .eq('id', id);

      if (error) {
        toast.error(`فشل تحديث الرحلة: ${error.message}`);
        console.error("Error updating ride:", error);
        console.error("Supabase update error details:", error.details, error.hint, error.code);
      } else {
        toast.success("تم تحديث الرحلة بنجاح!");
      }
    } else {
      const { id, ...insertData } = rideData;
      const { error } = await supabase
        .from('rides')
        .insert(insertData);

      if (error) {
        toast.error(`فشل إضافة الرحلة: ${error.message}`);
        console.error("Error adding ride:", error);
        console.error("Supabase insert error details:", error.details, error.hint, error.code);
      } else {
        toast.success("تم إضافة الرحلة بنجاح!");
      }
    }
    setIsFormDialogOpen(false);
  };

  const handleDeleteRide = async () => {
    if (!rideToDelete) return;

    setIsDeleting(true);
    const { error } = await supabase
      .from('rides')
      .delete()
      .eq('id', rideToDelete.id);
    setIsDeleting(false);
    setRideToDelete(null);

    if (error) {
      toast.error(`فشل حذف الرحلة: ${error.message}`);
      console.error("Error deleting ride:", error);
    } else {
      toast.success("تم حذف الرحلة بنجاح!");
    }
  };

  const filteredRides = rides.filter(ride => {
    const passengerName = ride.passenger_profiles?.full_name || '';
    const driverName = ride.driver_profiles?.full_name || '';

    return (
      ride.pickup_location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ride.destination.toLowerCase().includes(searchTerm.toLowerCase()) ||
      passengerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      driverName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ride.status.toLowerCase().includes(searchTerm.toLowerCase())
    );
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
      <PageHeader title="إدارة الرحلات" description="عرض وإدارة جميع الرحلات في النظام." showBackButton={false} />

      <div className="flex items-center justify-between mb-4">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="البحث عن رحلة..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
        <Button onClick={handleAddRide} className="bg-primary hover:bg-primary-dark text-primary-foreground">
          <PlusCircle className="h-4 w-4 ml-2 rtl:mr-2" />
          إضافة رحلة
        </Button>
      </div>

      {loadingRides ? (
        <RideTableSkeleton />
      ) : filteredRides.length === 0 ? (
        <EmptyState
          icon={CarIcon}
          title="لا توجد رحلات"
          description="لا توجد بيانات رحلات لعرضها. ابدأ بإضافة رحلة جديدة."
        />
      ) : (
        <div className="rounded-md border overflow-x-auto"> {/* Added overflow-x-auto here */}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>الراكب</TableHead>
                <TableHead>السائق</TableHead>
                <TableHead>الانطلاق</TableHead>
                <TableHead>الوجهة</TableHead>
                <TableHead>الركاب</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead className="text-right">الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRides.map((ride) => {
                const passengerName = ride.passenger_profiles?.full_name || '';
                const driverName = ride.driver_profiles?.full_name || '';
                return (
                  <TableRow key={ride.id}>
                    <TableCell className="font-medium">{passengerName}</TableCell>
                    <TableCell>{driverName}</TableCell>
                    <TableCell>{ride.pickup_location}</TableCell>
                    <TableCell>{ride.destination}</TableCell>
                    <TableCell>{ride.passengers_count}</TableCell>
                    <TableCell><RideStatusBadge status={ride.status} /></TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditRide(ride)}
                        className="ml-2 rtl:mr-2"
                        title="تعديل"
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
                            onClick={() => setRideToDelete(ride)}
                            title="حذف"
                          >
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">حذف</span>
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>هل أنت متأكد تمامًا؟</AlertDialogTitle>
                            <AlertDialogDescription>
                              سيؤدي هذا الإجراء إلى حذف الرحلة من {rideToDelete?.pickup_location} إلى {rideToDelete?.destination} بشكل دائم. لا يمكن التراجع عن هذا الإجراء.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel onClick={() => setRideToDelete(null)}>إلغاء</AlertDialogCancel>
                            <AlertDialogAction onClick={handleDeleteRide} disabled={isDeleting}>
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
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      <RideFormDialog
        open={isFormDialogOpen}
        onOpenChange={setIsFormDialogOpen}
        ride={selectedRide}
        onSave={handleSaveRide}
      />
    </div>
  );
};

export default RideManagementPage;