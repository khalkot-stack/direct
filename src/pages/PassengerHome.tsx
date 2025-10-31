"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Car, MessageSquare, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
// import InteractiveMap, { MarkerLocation } from "@/components/InteractiveMap"; // Commented out
import ChatDialog from "@/components/ChatDialog";
import RatingDialog from "@/components/RatingDialog";
import CancellationReasonDialog from "@/components/CancellationReasonDialog";
import { useUser } from "@/context/UserContext";
import { useSupabaseRealtime } from "@/hooks/useSupabaseRealtime";
import { Ride, RawRideData } from "@/types/supabase";
import RideStatusBadge from "@/components/RideStatusBadge";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter } from "@/components/ui/drawer";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

const rideRequestSchema = z.object({
  pickupLocation: z.string().min(3, { message: "موقع الانطلاق مطلوب." }),
  destination: z.string().min(3, { message: "الوجهة مطلوبة." }),
  passengersCount: z.number().min(1, { message: "يجب أن يكون عدد الركاب واحدًا على الأقل." }).max(10, { message: "الحد الأقصى لعدد الركاب هو 10." }),
});

type RideRequestInputs = z.infer<typeof rideRequestSchema>;

const PassengerHome: React.FC = () => {
  const { user, loading: userLoading } = useUser();
  const navigate = useNavigate();

  const [loadingRideData, setLoadingRideData] = useState(true);
  const [currentRide, setCurrentRide] = useState<Ride | null>(null);
  // const [mapMarkers, setMapMarkers] = useState<MarkerLocation[]>([]); // Commented out
  // const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number } | undefined>(undefined); // Commented out

  const [isRequestDrawerOpen, setIsRequestDrawerOpen] = useState(false);
  const [isChatDialogOpen, setIsChatDialogOpen] = useState(false);
  const [chatRideId, setChatRideId] = useState("");
  const [chatOtherUserId, setChatOtherUserId] = useState("");
  const [chatOtherUserName, setChatOtherUserName] = useState("");

  const [isRatingDialogOpen, setIsRatingDialogOpen] = useState(false);
  const [ratingTargetUser, setRatingTargetUser] = useState<{ id: string; name: string } | null>(null);
  const [rideToRate, setRideToRate] = useState<Ride | null>(null);

  const [isCancellationDialogOpen, setIsCancellationDialogOpen] = useState(false);
  const [rideToCancel, setRideToCancel] = useState<Ride | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);

  const form = useForm<RideRequestInputs>({
    resolver: zodResolver(rideRequestSchema),
    defaultValues: {
      pickupLocation: "",
      destination: "",
      passengersCount: 1,
    },
  });

  const { watch, setValue, formState: { errors } } = form;
  const pickupLocationInput = watch("pickupLocation");
  const destinationInput = watch("destination");

  const geocodeAddress = useCallback(async (address: string, _type: 'pickup' | 'destination') => {
    if (!import.meta.env.VITE_GOOGLE_MAPS_API_KEY) {
      toast.error("مفتاح Google Maps API غير مكوّن. الرجاء إضافة VITE_GOOGLE_MAPS_API_KEY إلى ملف .env الخاص بك.");
      return null;
    }

    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}`
      );
      const data = await response.json();

      if (data.results && data.results.length > 0) {
        const { lat, lng } = data.results[0].geometry.location;
        return { lat, lng };
      } else {
        // toast.error(`لم يتم العثور على إحداثيات لـ ${type === 'pickup' ? 'موقع الانطلاق' : 'الوجهة'}: "${address}". الرجاء إدخال عنوان أكثر دقة.`);
        return null;
      }
    } catch (error) {
      console.error("Error geocoding address:", error);
      toast.error("فشل تحديد الموقع الجغرافي. الرجاء التحقق من اتصالك بالإنترنت أو المحاولة مرة أخرى.");
      return null;
    }
  }, []);

  const fetchCurrentRide = useCallback(async (userId: string) => {
    setLoadingRideData(true);
    const { data: ridesRaw, error: ridesError } = await supabase
      .from('rides')
      .select(`
        *,
        passenger_profiles:passenger_id(id, full_name, avatar_url),
        driver_profiles:driver_id(id, full_name, avatar_url)
      `)
      .eq('passenger_id', userId)
      .in('status', ['pending', 'accepted'])
      .order('created_at', { ascending: false })
      .limit(1);

    if (ridesError) {
      toast.error(`فشل جلب الرحلات الحالية: ${ridesError.message}`);
      console.error("Error fetching current ride:", ridesError);
      setCurrentRide(null);
    } else if (ridesRaw && ridesRaw.length > 0) {
      const ride = ridesRaw[0] as RawRideData;
      const passengerProfile = Array.isArray(ride.passenger_profiles)
        ? ride.passenger_profiles[0] || null
        : ride.passenger_profiles;
      
      const driverProfile = Array.isArray(ride.driver_profiles)
        ? ride.driver_profiles[0] || null
        : ride.driver_profiles;

      setCurrentRide({
        ...ride,
        passenger_profiles: passengerProfile,
        driver_profiles: driverProfile,
      } as Ride);
    } else {
      setCurrentRide(null);
    }
    setLoadingRideData(false);
  }, []);

  useEffect(() => {
    if (!userLoading && user) {
      fetchCurrentRide(user.id);
    } else if (!userLoading && !user) {
      navigate("/auth");
    }
  }, [userLoading, user, fetchCurrentRide, navigate]);

  useSupabaseRealtime(
    'passenger_home_rides_channel',
    {
      event: '*',
      schema: 'public',
      table: 'rides',
      filter: `passenger_id=eq.${user?.id}`,
    },
    (payload) => {
      console.log('Change received!', payload);
      if (user) {
        fetchCurrentRide(user.id);
        if (payload.eventType === 'UPDATE' && payload.new.status === 'accepted' && payload.old.status === 'pending') {
          toast.success("تم قبول رحلتك من قبل سائق!");
        }
        if (payload.eventType === 'UPDATE' && payload.new.status === 'completed' && payload.old.status !== 'completed') {
          toast.success("تم إكمال رحلتك بنجاح!");
          const completedRide = payload.new as Ride;
          if (completedRide.driver_profiles) {
            setRideToRate(completedRide);
            setRatingTargetUser({ id: completedRide.driver_id!, name: completedRide.driver_profiles.full_name || 'السائق' });
            setIsRatingDialogOpen(true);
          }
        }
        if (payload.eventType === 'UPDATE' && payload.new.status === 'cancelled' && payload.old.status !== 'cancelled') {
          toast.warning(`تم إلغاء رحلتك. السبب: ${payload.new.cancellation_reason || 'غير محدد'}`);
        }
      }
    },
    !!user // Only enable if user is logged in
  );

  useEffect(() => {
    // const updateMapMarkers = async () => { // Commented out
    //   const newMarkers: MarkerLocation[] = [];
    //   let currentCenter = undefined;

    //   if (currentRide) {
    //     // Active ride markers
    //     if (currentRide.pickup_lat && currentRide.pickup_lng) {
    //       newMarkers.push({ id: 'pickup', lat: currentRide.pickup_lat, lng: currentRide.pickup_lng, title: 'موقع الانطلاق', iconColor: 'green' });
    //       currentCenter = { lat: currentRide.pickup_lat, lng: currentRide.pickup_lng };
    //     }
    //     if (currentRide.destination_lat && currentRide.destination_lng) {
    //       newMarkers.push({ id: 'destination', lat: currentRide.destination_lat, lng: currentRide.destination_lng, title: 'الوجهة', iconColor: 'red' });
    //       if (!currentCenter) currentCenter = { lat: currentRide.destination_lat, lng: currentRide.destination_lng };
    //     }
    //     if (currentRide.driver_current_lat && currentRide.driver_current_lng) {
    //       newMarkers.push({ id: 'driver', lat: currentRide.driver_current_lat, lng: currentRide.driver_current_lng, title: 'موقع السائق الحالي', iconColor: 'blue' });
    //       currentCenter = { lat: currentRide.driver_current_lat, lng: currentRide.driver_current_lng };
    //     }
    //   } else {
    //     // Request ride markers
    //     let pickupCoords = null;
    //     if (pickupLocationInput) {
    //       pickupCoords = await geocodeAddress(pickupLocationInput, 'pickup');
    //       if (pickupCoords) {
    //         newMarkers.push({ id: 'pickup-request', lat: pickupCoords.lat, lng: pickupCoords.lng, title: 'موقع الانطلاق', iconColor: 'green' });
    //         currentCenter = pickupCoords;
    //       }
    //     }

    //     let destinationCoords = null;
    //     if (destinationInput) {
    //       destinationCoords = await geocodeAddress(destinationInput, 'destination');
    //       if (destinationCoords) {
    //         newMarkers.push({ id: 'destination-request', lat: destinationCoords.lat, lng: destinationCoords.lng, title: 'الوجهة', iconColor: 'red' });
    //         if (!currentCenter) currentCenter = destinationCoords;
    //       }
    //     }
    //   }
    //   setMapMarkers(newMarkers);
    //   setMapCenter(currentCenter);
    // };

    // const delayDebounceFn = setTimeout(() => {
    //   updateMapMarkers();
    // }, 1000);

    // return () => clearTimeout(delayDebounceFn);
  }, [currentRide, pickupLocationInput, destinationInput, geocodeAddress]);

  const handleRequestRide = async (values: RideRequestInputs) => {
    if (!user?.id) {
      toast.error("الرجاء تسجيل الدخول لطلب رحلة.");
      return;
    }

    const pickupCoords = await geocodeAddress(values.pickupLocation, 'pickup');
    const destinationCoords = await geocodeAddress(values.destination, 'destination');

    if (!pickupCoords) {
      toast.error("الرجاء تحديد موقع الانطلاق بشكل صحيح. تأكد من أن العنوان صالح ويظهر على الخريطة.");
      return;
    }
    if (!destinationCoords) {
      toast.error("الرجاء تحديد الوجهة بشكل صحيح. تأكد من أن العنوان صالح ويظهر على الخريطة.");
      return;
    }

    setLoadingRideData(true);
    const { error } = await supabase.from('rides').insert({
      passenger_id: user.id,
      pickup_location: values.pickupLocation,
      destination: values.destination,
      passengers_count: values.passengersCount,
      status: 'pending',
      pickup_lat: pickupCoords.lat,
      pickup_lng: pickupCoords.lng,
      destination_lat: destinationCoords.lat,
      destination_lng: destinationCoords.lng,
    } as Omit<Ride, 'id' | 'created_at' | 'cancellation_reason' | 'driver_id' | 'passenger_profiles' | 'driver_profiles' | 'driver_current_lat' | 'driver_current_lng'>);
    setLoadingRideData(false);

    if (error) {
      toast.error(`فشل طلب الرحلة: ${error.message}`);
      console.error("Error requesting ride:", error);
    } else {
      toast.success("تم طلب رحلتك بنجاح! جاري البحث عن سائق.");
      setIsRequestDrawerOpen(false);
      form.reset();
      fetchCurrentRide(user.id); // Refresh current ride status
    }
  };

  const handleOpenChat = () => {
    if (!user || !currentRide || !currentRide.driver_profiles) {
      toast.error("لا يمكن بدء الدردشة. معلومات السائق أو الرحلة غير متوفرة.");
      return;
    }
    setChatRideId(currentRide.id);
    setChatOtherUserId(currentRide.driver_id!);
    setChatOtherUserName(currentRide.driver_profiles.full_name || 'السائق');
    setIsChatDialogOpen(true);
  };

  const handleSaveRating = async (rating: number, comment: string) => {
    if (!user || !rideToRate || !ratingTargetUser) return;

    const { error } = await supabase.from('ratings').insert({
      ride_id: rideToRate.id,
      rater_id: user.id,
      rated_user_id: ratingTargetUser.id,
      rating,
      comment,
    });

    if (error) {
      toast.error(`فشل حفظ التقييم: ${error.message}`);
      console.error("Error saving rating:", error);
    } else {
      toast.success("تم حفظ التقييم بنجاح!");
    }
  };

  const handleCancelRide = (ride: Ride) => {
    setRideToCancel(ride);
    setIsCancellationDialogOpen(true);
  };

  const confirmCancelRide = async (reason: string) => {
    if (!rideToCancel) return;

    setIsCancelling(true);
    const { error } = await supabase
      .from('rides')
      .update({ status: 'cancelled', cancellation_reason: reason })
      .eq('id', rideToCancel.id);
    setIsCancelling(false);
    setIsCancellationDialogOpen(false);
    setRideToCancel(null);

    if (error) {
      toast.error(`فشل إلغاء الرحلة: ${error.message}`);
      console.error("Error cancelling ride:", error);
    } else {
      toast.success("تم إلغاء الرحلة بنجاح.");
      if (user) {
        fetchCurrentRide(user.id); // Refresh current ride status
      }
    }
  };

  if (userLoading || loadingRideData) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-950">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="sr-only">جاري تحميل التطبيق...</span>
      </div>
    );
  }

  return (
    <div className="relative flex flex-col h-[calc(100vh-64px)]"> {/* Adjust height for header and bottom nav */}
      {/* <InteractiveMap markers={mapMarkers} center={mapCenter} zoom={14} /> */}

      {currentRide ? (
        // Active Ride Card (similar to Uber's bottom card for active rides)
        <Card className="absolute bottom-20 left-1/2 -translate-x-1/2 w-[95%] max-w-md shadow-lg z-10">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">رحلتك الحالية</CardTitle>
              <RideStatusBadge status={currentRide.status} />
            </div>
            <CardDescription>
              من {currentRide.pickup_location} إلى {currentRide.destination}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {currentRide.driver_id && currentRide.driver_profiles ? (
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">السائق:</span>
                <span>{currentRide.driver_profiles.full_name}</span>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">
                جاري البحث عن سائق...
              </div>
            )}
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">عدد الركاب:</span>
              <span>{currentRide.passengers_count}</span>
            </div>
            <div className="flex gap-2 mt-4">
              {currentRide.driver_id && (
                <Button onClick={handleOpenChat} variant="outline" className="flex-1">
                  <MessageSquare className="h-4 w-4 ml-2 rtl:mr-2" />
                  محادثة
                </Button>
              )}
              <Button onClick={() => handleCancelRide(currentRide)} variant="destructive" className="flex-1">
                <XCircle className="h-4 w-4 ml-2 rtl:mr-2" />
                إلغاء
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        // Request Ride Button (when no active ride)
        <Button
          onClick={() => setIsRequestDrawerOpen(true)}
          className="absolute bottom-20 left-1/2 -translate-x-1/2 w-[95%] max-w-md bg-primary hover:bg-primary-dark text-primary-foreground py-3 text-lg shadow-lg z-10"
        >
          <Car className="h-5 w-5 ml-2 rtl:mr-2" />
          طلب رحلة
        </Button>
      )}

      {/* Request Ride Drawer */}
      <Drawer open={isRequestDrawerOpen} onOpenChange={setIsRequestDrawerOpen}>
        <DrawerContent className="max-h-[60vh]"> {/* Reduced max height */}
          <DrawerHeader className="text-right">
            <DrawerTitle>طلب رحلة جديدة</DrawerTitle>
            <DrawerDescription>أدخل تفاصيل رحلتك وسنبحث عن سائق لك.</DrawerDescription>
          </DrawerHeader>
          <form onSubmit={form.handleSubmit(handleRequestRide)} className="p-4 space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="pickup-location">موقع الانطلاق</Label>
              <Input
                id="pickup-location"
                type="text"
                placeholder="أدخل موقع الانطلاق"
                {...form.register("pickupLocation")}
              />
              {errors.pickupLocation && (
                <p className="text-red-500 text-sm">{errors.pickupLocation.message}</p>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="destination">الوجهة</Label>
              <Input
                id="destination"
                type="text"
                placeholder="أدخل الوجهة"
                {...form.register("destination")}
              />
              {errors.destination && (
                <p className="text-red-500 text-sm">{errors.destination.message}</p>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="passengers-count">عدد الركاب</Label>
              <Input
                id="passengers-count"
                type="number"
                min="1"
                {...form.register("passengersCount", { valueAsNumber: true })}
                onChange={(e) => setValue("passengersCount", parseInt(e.target.value) || 1)}
              />
              {errors.passengersCount && (
                <p className="text-red-500 text-sm">{errors.passengersCount.message}</p>
              )}
            </div>
            <DrawerFooter className="flex flex-row justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsRequestDrawerOpen(false)}>
                إلغاء
              </Button>
              <Button type="submit" disabled={loadingRideData} className="bg-primary hover:bg-primary-dark text-primary-foreground">
                {loadingRideData ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin ml-2 rtl:mr-2" />
                    جاري الطلب...
                  </>
                ) : (
                  <>
                    <Car className="h-4 w-4 ml-2 rtl:mr-2" />
                    طلب الرحلة
                  </>
                )}
              </Button>
            </DrawerFooter>
          </form>
        </DrawerContent>
      </Drawer>

      {user && currentRide && currentRide.driver_id && (
        <ChatDialog
          open={isChatDialogOpen}
          onOpenChange={setIsChatDialogOpen}
          rideId={chatRideId}
          otherUserId={chatOtherUserId}
          otherUserName={chatOtherUserName}
        />
      )}

      {user && rideToRate && ratingTargetUser && (
        <RatingDialog
          open={isRatingDialogOpen}
          onOpenChange={setIsRatingDialogOpen}
          onSave={handleSaveRating}
          targetUserName={ratingTargetUser.name}
        />
      )}

      <CancellationReasonDialog
        open={isCancellationDialogOpen}
        onOpenChange={setIsCancellationDialogOpen}
        onConfirm={confirmCancelRide}
        isSubmitting={isCancelling}
      />
    </div>
  );
};

export default PassengerHome;