"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Loader2, MapPin, Calendar, Clock, Car, Info, DollarSign, XCircle, CheckCircle2 } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
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
} from "@/components/ui/alert-dialog";
import CancellationReasonDialog from "@/components/CancellationReasonDialog";
import { useNavigate } from "react-router-dom";

// Define an interface for the raw data returned by Supabase select with joins
interface SupabaseJoinedRideData {
  id: string;
  driver_id: string | null;
  passenger_id: string;
  pickup_location: string;
  destination: string;
  status: "pending" | "accepted" | "completed" | "cancelled";
  price: number | null;
  requested_at: string;
  accepted_at: string | null;
  completed_at: string | null;
  cancelled_at: string | null;
  ride_date: string | null;
  ride_time: string | null;
  passengers_count: number;
  driver_notes: string | null;
  passenger_notes: string | null;
  cancellation_reason: string | null;
  profiles_driver: Array<{
    full_name: string;
    phone_number: string;
    car_model: string;
    car_color: string;
    license_plate: string;
  }> | null;
}

interface Ride {
  id: string;
  driver_id: string | null;
  passenger_id: string;
  pickup_location: string;
  destination: string;
  status: "pending" | "accepted" | "completed" | "cancelled";
  price: number | null;
  requested_at: string;
  accepted_at: string | null;
  completed_at: string | null;
  cancelled_at: string | null;
  ride_date: string | null;
  ride_time: string | null;
  passengers_count: number;
  driver_notes: string | null;
  passenger_notes: string | null;
  cancellation_reason: string | null;
  driver_profile: {
    full_name: string;
    phone_number: string;
    car_model: string;
    car_color: string;
    license_plate: string;
  } | null;
}

export default function PassengerMyRidesPage() {
  const navigate = useNavigate();
  const [myRides, setMyRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPassengerId, setCurrentPassengerId] = useState<string | null>(null);
  const [isCancellationReasonDialogOpen, setIsCancellationReasonDialogOpen] = useState(false);
  const [selectedRideToCancel, setSelectedRideToCancel] = useState<Ride | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);

  useEffect(() => {
    const fetchPassengerId = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentPassengerId(user.id);
      } else {
        toast.error("الرجاء تسجيل الدخول لعرض رحلاتك.");
        setLoading(false);
      }
    };
    fetchPassengerId();
  }, []);

  useEffect(() => {
    if (currentPassengerId) {
      fetchMyRides(currentPassengerId);
    }
  }, [currentPassengerId]);

  const fetchMyRides = async (passengerId: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("rides")
        .select(`
          id,
          driver_id,
          passenger_id,
          pickup_location,
          destination,
          status,
          price,
          requested_at,
          accepted_at,
          completed_at,
          cancelled_at,
          ride_date,
          ride_time,
          passengers_count,
          driver_notes,
          passenger_notes,
          cancellation_reason,
          profiles_driver:driver_id (full_name, phone_number, car_model, car_color, license_plate)
        `)
        .eq("passenger_id", passengerId)
        .order("requested_at", { ascending: false });

      if (error) throw error;

      const formattedRides: Ride[] = data.map((ride: SupabaseJoinedRideData) => ({
        ...ride,
        driver_profile: ride.profiles_driver?.[0] || null,
      }));

      setMyRides(formattedRides);
    } catch (error) {
      toast.error("فشل تحميل الرحلات.");
      console.error("Error fetching my rides:", error);
    } finally {
      setLoading(false);
    }
  };

  const openCancellationReasonDialog = (ride: Ride) => {
    setSelectedRideToCancel(ride);
    setIsCancellationReasonDialogOpen(true);
  };

  const handleCancelRideWithReason = async (reason: string) => {
    if (!selectedRideToCancel || !currentPassengerId) return;

    setIsCancelling(true);
    try {
      const { error } = await supabase
        .from("rides")
        .update({ status: "cancelled", cancelled_at: new Date().toISOString(), cancellation_reason: reason })
        .eq("id", selectedRideToCancel.id)
        .eq("passenger_id", currentPassengerId);

      if (error) throw error;

      toast.success("تم إلغاء الرحلة بنجاح!");
      setIsCancellationReasonDialogOpen(false);
      setSelectedRideToCancel(null);
      if (currentPassengerId) {
        fetchMyRides(currentPassengerId); // Refresh the list
      }
    } catch (error) {
      toast.error("فشل إلغاء الرحلة.");
      console.error("Error cancelling ride:", error);
    } finally {
      setIsCancelling(false);
    }
  };

  const getStatusBadge = (status: Ride['status']) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">قيد الانتظار</Badge>;
      case 'accepted':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">مقبولة</Badge>;
      case 'completed':
        return <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">مكتملة</Badge>;
      case 'cancelled':
        return <Badge variant="secondary" className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">ملغاة</Badge>;
      default:
        return <Badge variant="secondary">غير معروف</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-950">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="sr-only">جاري تحميل الرحلات...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-100 dark:bg-gray-950 p-4">
      <Card className="w-full max-w-2xl bg-white dark:bg-gray-900 shadow-lg rounded-lg mx-auto">
        <div className="px-6 pt-0"> {/* Adjusted padding */}
          <PageHeader
            title="رحلاتي"
            description="عرض وإدارة جميع رحلاتك"
            backPath="/passenger-dashboard"
          />
        </div>
        <CardContent className="space-y-4">
          {myRides.length === 0 ? (
            <EmptyState
              icon={Car}
              title="لا توجد رحلات حاليًا"
              description="اطلب رحلة جديدة لتبدأ!"
            >
              <Button onClick={() => navigate("/passenger-dashboard/request-ride")} className="mt-4 bg-primary hover:bg-primary-dark text-primary-foreground transition-transform duration-200 ease-in-out hover:scale-[1.01]">
                طلب رحلة جديدة
              </Button>
            </EmptyState>
          ) : (
            myRides.map((ride) => (
              <Card key={ride.id} className={`border-l-4 ${ride.status === 'accepted' ? 'border-blue-500' : ride.status === 'pending' ? 'border-yellow-500' : ride.status === 'completed' ? 'border-green-500' : 'border-red-500'} shadow-sm hover:shadow-md transition-shadow duration-200`}>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center justify-between text-lg">
                    <div className="flex items-center">
                      <MapPin className="h-5 w-5 text-primary ml-2 rtl:mr-2" />
                      <span>{ride.pickup_location} <span className="mx-1">إلى</span> {ride.destination}</span>
                    </div>
                    {getStatusBadge(ride.status)}
                  </CardTitle>
                  <CardDescription className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                    {ride.ride_date && ride.ride_time ? (
                      <>
                        <Calendar className="h-4 w-4 ml-1 rtl:mr-1" />
                        {format(new Date(`${ride.ride_date}T${ride.ride_time}`), "EEEE, dd MMMM yyyy", { locale: ar })}
                        <Clock className="h-4 w-4 ml-3 rtl:mr-3" />
                        {format(new Date(`${ride.ride_date}T${ride.ride_time}`), "hh:mm a", { locale: ar })}
                      </>
                    ) : (
                      <span>التاريخ والوقت غير متاحين</span>
                    )}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  {ride.driver_profile && ride.status === 'accepted' && (
                    <>
                      <div className="flex items-center text-gray-700 dark:text-gray-300">
                        <Car className="h-4 w-4 ml-2 rtl:mr-2" />
                        السائق: {ride.driver_profile.full_name} ({ride.driver_profile.car_model} - {ride.driver_profile.license_plate})
                      </div>
                      <div className="flex items-center text-gray-700 dark:text-gray-300">
                        <Phone className="h-4 w-4 ml-2 rtl:mr-2" />
                        رقم السائق: {ride.driver_profile.phone_number}
                      </div>
                    </>
                  )}
                  <div className="flex items-center text-gray-700 dark:text-gray-300">
                    <DollarSign className="h-4 w-4 ml-2 rtl:mr-2" />
                    السعر: {ride.price !== null ? `${ride.price} دينار` : "غير متاح"}
                  </div>
                  <div className="flex items-center text-gray-700 dark:text-gray-300">
                    <Info className="h-4 w-4 ml-2 rtl:mr-2" />
                    عدد الركاب: {ride.passengers_count}
                  </div>
                  {ride.cancellation_reason && ride.status === 'cancelled' && (
                    <div className="flex items-start text-red-600 dark:text-red-400">
                      <XCircle className="h-4 w-4 ml-2 rtl:mr-2 mt-1 flex-shrink-0" />
                      سبب الإلغاء: {ride.cancellation_reason}
                    </div>
                  )}
                  <div className="flex justify-end space-x-2 rtl:space-x-reverse mt-4">
                    {ride.status === 'pending' && (
                      <Button
                        variant="destructive"
                        onClick={() => openCancellationReasonDialog(ride)}
                        disabled={isCancelling}
                        className="transition-transform duration-200 ease-in-out hover:scale-[1.02]"
                      >
                        {isCancelling && selectedRideToCancel?.id === ride.id ? (
                          <Loader2 className="h-4 w-4 animate-spin ml-2 rtl:mr-2" />
                        ) : (
                          "إلغاء الرحلة"
                        )}
                      </Button>
                    )}
                    {ride.status === 'accepted' && (
                      <Button
                        onClick={() => navigate(`/passenger-dashboard/track-ride/${ride.id}`)}
                        className="bg-blue-600 hover:bg-blue-700 text-white transition-transform duration-200 ease-in-out hover:scale-[1.02]"
                      >
                        تتبع الرحلة
                      </Button>
                    )}
                    {ride.status === 'completed' && (
                      <Button
                        variant="outline"
                        disabled
                        className="text-green-600 border-green-600"
                      >
                        <CheckCircle2 className="h-4 w-4 ml-2 rtl:mr-2" />
                        تمت بنجاح
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </CardContent>
      </Card>

      <CancellationReasonDialog
        open={isCancellationReasonDialogOpen}
        onOpenChange={setIsCancellationReasonDialogOpen}
        onConfirm={handleCancelRideWithReason}
        isSubmitting={isCancelling}
      />
    </div>
  );
}