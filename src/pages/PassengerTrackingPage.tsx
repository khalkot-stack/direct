"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, MapPin, User, Car, Phone, MessageSquare, XCircle, Info, Users } from "lucide-react"; // Added Users import
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import PageHeader from "@/components/PageHeader";
import InteractiveMap from "@/components/InteractiveMap"; // Import the InteractiveMap component
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

// Define an interface for the raw data returned by Supabase select with joins for a SINGLE row
interface SupabaseJoinedRideData {
  id: string;
  pickup_location: string;
  pickup_lat: number;
  pickup_lng: number;
  destination: string;
  destination_lat: number;
  destination_lng: number;
  passengers_count: number;
  status: "pending" | "accepted" | "completed" | "cancelled";
  passenger_id: string;
  driver_id: string | null;
  profiles_passenger: Array<{ full_name: string; phone_number?: string }> | null;
  profiles_driver: Array<{ full_name: string; phone_number?: string; car_model?: string; car_color?: string; license_plate?: string; current_lat?: number; current_lng?: number }> | null; // Added current_lat, current_lng
}

interface Ride {
  id: string;
  passenger_id: string;
  driver_id: string | null;
  passenger_name?: string;
  passenger_phone?: string;
  driver_name?: string;
  driver_phone?: string;
  driver_car_model?: string;
  driver_car_color?: string;
  driver_license_plate?: string;
  driver_current_lat?: number; // New field for driver's current latitude
  driver_current_lng?: number; // New field for driver's current longitude
  pickup_location: string;
  pickup_lat: number;
  pickup_lng: number;
  destination: string;
  destination_lat: number;
  destination_lng: number;
  passengers_count: number;
  status: "pending" | "accepted" | "completed" | "cancelled";
}

const PassengerTrackingPage: React.FC = () => {
  const { rideId } = useParams<{ rideId: string }>();
  const navigate = useNavigate();
  const [ride, setRide] = useState<Ride | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isConfirmCancelOpen, setIsConfirmCancelOpen] = useState(false);

  const fetchRideDetails = useCallback(async () => {
    if (!rideId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    setCurrentUserId(user?.id || null);

    const { data, error } = await supabase
      .from('rides')
      .select(`
        id,
        pickup_location,
        pickup_lat,
        pickup_lng,
        destination,
        destination_lat,
        destination_lng,
        passengers_count,
        status,
        passenger_id,
        driver_id,
        profiles_passenger:passenger_id (full_name, phone_number),
        profiles_driver:driver_id (full_name, phone_number, car_model, car_color, license_plate, current_lat, current_lng)
      `)
      .eq('id', rideId)
      .single()
      .returns<SupabaseJoinedRideData>();

    if (error) {
      toast.error(`فشل جلب تفاصيل الرحلة: ${error.message}`);
      console.error("Error fetching ride details:", error);
      setRide(null);
    } else if (data) {
      setRide({
        id: data.id,
        passenger_id: data.passenger_id,
        driver_id: data.driver_id,
        passenger_name: data.profiles_passenger?.[0]?.full_name || 'غير معروف',
        passenger_phone: data.profiles_passenger?.[0]?.phone_number || 'غير متاح',
        driver_name: data.profiles_driver?.[0]?.full_name || 'لا يوجد',
        driver_phone: data.profiles_driver?.[0]?.phone_number || 'غير متاح',
        driver_car_model: data.profiles_driver?.[0]?.car_model || 'غير متاح',
        driver_car_color: data.profiles_driver?.[0]?.car_color || 'غير متاح',
        driver_license_plate: data.profiles_driver?.[0]?.license_plate || 'غير متاح',
        driver_current_lat: data.profiles_driver?.[0]?.current_lat, // Set driver's current lat
        driver_current_lng: data.profiles_driver?.[0]?.current_lng, // Set driver's current lng
        pickup_location: data.pickup_location,
        pickup_lat: data.pickup_lat,
        pickup_lng: data.pickup_lng,
        destination: data.destination,
        destination_lat: data.destination_lat,
        destination_lng: data.destination_lng,
        passengers_count: data.passengers_count,
        status: data.status,
      });
    } else {
      toast.error("الرحلة المطلوبة غير موجودة.");
      console.error("Ride not found for ID:", rideId);
      setRide(null);
    }
    setLoading(false);
  }, [rideId]);

  useEffect(() => {
    fetchRideDetails();

    // Realtime listener for ride status changes
    const rideChannel = supabase
      .channel(`ride_${rideId}_status_changes`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'rides', filter: `id=eq.${rideId}` },
        (payload) => {
          if (payload.new.status !== ride?.status) {
            toast.info(`تم تحديث حالة الرحلة إلى: ${payload.new.status}`);
            fetchRideDetails(); // Re-fetch details to update UI
          }
        }
      )
      .subscribe();

    // Realtime listener for driver location changes
    let driverLocationChannel: any;
    if (ride?.driver_id) {
      driverLocationChannel = supabase
        .channel(`driver_${ride.driver_id}_location_changes`)
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${ride.driver_id}` },
          (payload) => {
            setRide(prevRide => {
              if (prevRide) {
                return {
                  ...prevRide,
                  driver_current_lat: payload.new.current_lat,
                  driver_current_lng: payload.new.current_lng,
                };
              }
              return prevRide;
            });
          }
        )
        .subscribe();
    }


    return () => {
      supabase.removeChannel(rideChannel);
      if (driverLocationChannel) {
        supabase.removeChannel(driverLocationChannel);
      }
    };
  }, [fetchRideDetails, rideId, ride?.status, ride?.driver_id]); // Added ride.driver_id to dependencies

  const handleCall = (phoneNumber: string | undefined) => {
    if (phoneNumber && phoneNumber !== 'غير متاح') {
      window.location.href = `tel:${phoneNumber}`;
    } else {
      toast.info("رقم الهاتف غير متاح.");
    }
  };

  const handleMessage = (phoneNumber: string | undefined) => {
    if (phoneNumber && phoneNumber !== 'غير متاح') {
      window.location.href = `sms:${phoneNumber}`;
    } else {
      toast.info("رقم الهاتف غير متاح.");
    }
  };

  const handleCancelRide = async () => {
    if (!rideId || !currentUserId) {
      toast.error("خطأ: لا يمكن إلغاء الرحلة.");
      return;
    }

    setIsCancelling(true);
    const { error } = await supabase
      .from('rides')
      .update({ status: 'cancelled' })
      .eq('id', rideId)
      .eq('passenger_id', currentUserId); // Ensure only the requesting passenger can cancel

    setIsCancelling(false);
    setIsConfirmCancelOpen(false);

    if (error) {
      toast.error(`فشل إلغاء الرحلة: ${error.message}`);
      console.error("Error cancelling ride:", error);
    } else {
      toast.warning(`تم إلغاء الرحلة رقم ${rideId.substring(0, 8)}...`);
      navigate("/passenger-dashboard/my-rides"); // Navigate back to my rides
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-950">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="sr-only">جاري تحميل تفاصيل الرحلة...</span>
      </div>
    );
  }

  if (!ride) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-950 p-4">
        <Card className="w-full max-w-md bg-white dark:bg-gray-900 shadow-lg rounded-lg text-center">
          <div className="p-6">
            <PageHeader
              title="الرحلة غير موجودة"
              description="عذرًا، لم نتمكن من العثور على تفاصيل الرحلة المطلوبة."
            />
          </div>
          <CardContent>
            <Button onClick={() => navigate(-1)} className="mt-6 bg-primary hover:bg-primary-dark text-primary-foreground transition-transform duration-200 ease-in-out hover:scale-[1.01]">
              العودة
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const mapMarkers = [
    {
      id: "pickup",
      lat: ride.pickup_lat,
      lng: ride.pickup_lng,
      title: "نقطة الانطلاق",
      description: ride.pickup_location,
      iconColor: "hsl(var(--primary))", // Green for pickup
    },
    {
      id: "destination",
      lat: ride.destination_lat,
      lng: ride.destination_lng,
      title: "الوجهة",
      description: ride.destination,
      iconColor: "#EF4444", // Red for destination
    },
  ];

  // Add driver's current location if available and ride is accepted
  if (ride.status === "accepted" && ride.driver_current_lat && ride.driver_current_lng) {
    mapMarkers.push({
      id: "driver_current",
      lat: ride.driver_current_lat,
      lng: ride.driver_current_lng,
      title: "موقع السائق الحالي",
      description: `السائق: ${ride.driver_name}`,
      iconColor: "#3B82F6", // Blue for driver
    });
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-950 p-4">
      <Card className="w-full max-w-md bg-white dark:bg-gray-900 shadow-lg rounded-lg">
        <div className="p-6">
          <PageHeader
            title={`تتبع الرحلة #${ride.id.substring(0, 8)}...`}
            description="تفاصيل رحلتك والسائق"
            backPath="/passenger-dashboard/my-rides"
          />
        </div>
        <CardContent className="space-y-4 text-right">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">تفاصيل الرحلة</h3>
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <MapPin className="h-5 w-5 text-muted-foreground" />
              <p className="text-lg text-gray-800 dark:text-gray-200">
                <span className="font-semibold">من:</span> {ride.pickup_location}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <MapPin className="h-5 w-5 text-muted-foreground" />
              <p className="text-lg text-gray-800 dark:text-gray-200">
                <span className="font-semibold">إلى:</span> {ride.destination}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Users className="h-5 w-5 text-muted-foreground" />
              <p className="text-lg text-gray-800 dark:text-gray-200">
                <span className="font-semibold">عدد الركاب:</span> {ride.passengers_count}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Info className="h-5 w-5 text-muted-foreground" />
              <p className="text-lg text-gray-800 dark:text-gray-200">
                <span className="font-semibold">الحالة:</span> {ride.status === 'pending' ? 'قيد الانتظار' : ride.status === 'accepted' ? 'مقبولة' : ride.status === 'completed' ? 'مكتملة' : 'ملغاة'}
              </p>
            </div>
          </div>

          {ride.driver_id && ride.status === "accepted" && (
            <>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mt-6 mb-2">تفاصيل السائق</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <User className="h-5 w-5 text-muted-foreground" />
                  <p className="text-lg text-gray-800 dark:text-gray-200">
                    <span className="font-semibold">الاسم:</span> {ride.driver_name}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-muted-foreground" />
                  <p className="text-lg text-gray-800 dark:text-gray-200">
                    <span className="font-semibold">الهاتف:</span> {ride.driver_phone}
                  </p>
                  <Button variant="outline" size="sm" onClick={() => handleCall(ride.driver_phone)} className="ml-auto flex items-center gap-1 text-primary border-primary hover:bg-primary hover:text-primary-foreground transition-transform duration-200 ease-in-out hover:scale-[1.01]">
                    <Phone className="h-4 w-4" />
                    اتصال
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleMessage(ride.driver_phone)} className="flex items-center gap-1 text-primary border-primary hover:bg-primary hover:text-primary-foreground transition-transform duration-200 ease-in-out hover:scale-[1.01]">
                    <MessageSquare className="h-4 w-4" />
                    رسالة
                  </Button>
                </div>
                <div className="flex items-center gap-3">
                  <Car className="h-5 w-5 text-muted-foreground" />
                  <p className="text-lg text-gray-800 dark:text-gray-200">
                    <span className="font-semibold">السيارة:</span> {ride.driver_car_color} {ride.driver_car_model} ({ride.driver_license_plate})
                  </p>
                </div>
              </div>
            </>
          )}

          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mt-6 mb-2">الخريطة</h3>
          <div className="w-full h-[400px] rounded-lg overflow-hidden">
            <InteractiveMap markers={mapMarkers} />
          </div>

          {ride.status === "accepted" && (
            <Button
              variant="destructive"
              onClick={() => setIsConfirmCancelOpen(true)}
              disabled={isCancelling}
              className="w-full mt-6 flex items-center gap-2 transition-transform duration-200 ease-in-out hover:scale-[1.01]"
            >
              {isCancelling ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin ml-2 rtl:mr-2" />
                  جاري الإلغاء...
                </>
              ) : (
                <>
                  إلغاء الرحلة <XCircle className="h-4 w-4 mr-2 rtl:ml-2" />
                </>
              )}
            </Button>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={isConfirmCancelOpen} onOpenChange={setIsConfirmCancelOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>هل أنت متأكد تمامًا؟</AlertDialogTitle>
            <AlertDialogDescription>
              لا يمكن التراجع عن هذا الإجراء. سيتم إلغاء رحلتك.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>العودة</AlertDialogCancel>
            <AlertDialogAction onClick={handleCancelRide} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              تأكيد الإلغاء
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default PassengerTrackingPage;