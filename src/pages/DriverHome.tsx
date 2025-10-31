"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, MapPin, Car, MessageSquare, CheckCircle, PauseCircle, LocateFixed, XCircle, History } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import InteractiveMap, { MarkerLocation } from "@/components/InteractiveMap";
import ChatDialog from "@/components/ChatDialog";
import RatingDialog from "@/components/RatingDialog";
import CancellationReasonDialog from "@/components/CancellationReasonDialog";
import { useUser } from "@/context/UserContext";
import { useSupabaseRealtime } from "@/hooks/useSupabaseRealtime";
import { Ride, RawRideData, ProfileDetails, Rating } from "@/types/supabase";
import RideStatusBadge from "@/components/RideStatusBadge";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter } from "@/components/ui/drawer";
import { ScrollArea } from "@/components/ui/scroll-area";

const DriverHome: React.FC = () => {
  const { user, loading: userLoading } = useUser();
  const navigate = useNavigate();

  const [loadingRideData, setLoadingRideData] = useState(true);
  const [currentRide, setCurrentRide] = useState<Ride | null>(null);
  const [availableRides, setAvailableRides] = useState<Ride[]>([]);
  const [mapMarkers, setMapMarkers] = useState<MarkerLocation[]>([]);
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number } | undefined>(undefined);
  const [mapZoom, setMapZoom] = useState<number>(12);

  const [isChatDialogOpen, setIsChatDialogOpen] = useState(false);
  const [chatOtherUserId, setChatOtherUserId] = useState("");
  const [chatOtherUserName, setChatOtherUserName] = useState("");

  const [isRatingDialogOpen, setIsRatingDialogOpen] = useState(false);
  const [ratingTargetUser, setRatingTargetUser] = useState<{ id: string; name: string } | null>(null);
  const [rideToRate, setRideToRate] = useState<Ride | null>(null);

  const [isCancellationDialogOpen, setIsCancellationDialogOpen] = useState(false);
  const [rideToCancel, setRideToCancel] = useState<Ride | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);

  const [isTrackingLocation, setIsTrackingLocation] = useState(false);
  const locationIntervalRef = useRef<number | null>(null);

  const fetchDriverRides = useCallback(async (userId: string) => {
    setLoadingRideData(true);
    // Fetch current active ride for the driver
    const { data: currentRideRaw, error: currentRideError } = await supabase
      .from('rides')
      .select(`
        *,
        passenger_profiles:passenger_id(id, full_name, avatar_url),
        driver_profiles:driver_id(id, full_name, avatar_url)
      `)
      .eq('driver_id', userId)
      .in('status', ['accepted'])
      .order('created_at', { ascending: false })
      .limit(1);

    if (currentRideError) {
      toast.error(`فشل جلب الرحلة الحالية: ${currentRideError.message}`);
      console.error("Error fetching current ride:", currentRideError);
      setCurrentRide(null);
    } else if (currentRideRaw && currentRideRaw.length > 0) {
      const ride = currentRideRaw[0] as RawRideData;
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
      setAvailableRides([]); // Clear available rides if there's a current one
    } else {
      setCurrentRide(null);
      // If no current ride, fetch available rides
      const { data: availableRidesRaw, error: availableRidesError } = await supabase
        .from('rides')
        .select(`
          *,
          passenger_profiles:passenger_id(id, full_name, avatar_url)
        `)
        .eq('status', 'pending')
        .is('driver_id', null)
        .neq('passenger_id', userId) // Drivers cannot accept their own rides
        .order('created_at', { ascending: false });

      if (availableRidesError) {
        toast.error(`فشل جلب الرحلات المتاحة: ${availableRidesError.message}`);
        console.error("Error fetching available rides:", availableRidesError);
        setAvailableRides([]);
      } else {
        const formattedAvailableRides: Ride[] = (availableRidesRaw as RawRideData[] || []).map(ride => {
          const passengerProfile = Array.isArray(ride.passenger_profiles)
            ? ride.passenger_profiles[0] || null
            : ride.passenger_profiles;
          
          const driverProfile = null; // No driver assigned yet

          return {
            ...ride,
            passenger_profiles: passengerProfile,
            driver_profiles: driverProfile,
          };
        }) as Ride[];
        setAvailableRides(formattedAvailableRides);
      }
    }
    setLoadingRideData(false);
  }, []);

  useEffect(() => {
    if (!userLoading && user) {
      fetchDriverRides(user.id);
    } else if (!userLoading && !user) {
      navigate("/auth");
    }
    return () => {
      if (locationIntervalRef.current) {
        clearInterval(locationIntervalRef.current);
      }
    };
  }, [userLoading, user, fetchDriverRides, navigate]);

  useSupabaseRealtime(
    'driver_home_rides_channel',
    {
      event: '*',
      schema: 'public',
      table: 'rides',
      filter: `driver_id=eq.${user?.id}`, // Listen for changes on driver's own rides
    },
    (payload) => {
      console.log('Change received in driver home!', payload);
      if (user) {
        fetchDriverRides(user.id); // Re-fetch data on any ride change
      }
      if (payload.eventType === 'UPDATE' && payload.new.status === 'completed' && payload.old.status !== 'completed') {
        toast.success("تم إكمال الرحلة بنجاح!");
        const completedRide = payload.new as Ride;
        if (completedRide.passenger_profiles) {
          setRideToRate(completedRide);
          setRatingTargetUser({ id: completedRide.passenger_id, name: completedRide.passenger_profiles.full_name || 'الراكب' });
          setIsRatingDialogOpen(true);
        }
        setIsTrackingLocation(false); // Stop tracking when ride is completed
      }
      if (payload.eventType === 'UPDATE' && payload.new.status === 'cancelled' && payload.old.status !== 'cancelled') {
        toast.warning(`تم إلغاء الرحلة. السبب: ${payload.new.cancellation_reason || 'غير محدد'}`);
        setIsTrackingLocation(false); // Stop tracking when ride is cancelled
      }
    },
    !!user // Only enable if user is logged in
  );

  useSupabaseRealtime(
    'driver_available_rides_channel',
    {
      event: '*',
      schema: 'public',
      table: 'rides',
      filter: `status=eq.pending`, // Listen for new pending rides
    },
    (payload) => {
      console.log('Change received in available rides!', payload);
      if (user && !currentRide) { // Only update available rides if no current ride
        fetchDriverRides(user.id);
      }
    },
    !!user && !currentRide // Only enable if user is logged in and has no current ride
  );

  useEffect(() => {
    const updateMapMarkers = () => {
      const newMarkers: MarkerLocation[] = [];
      let currentCenter = undefined;
      let currentZoom = 12;

      if (currentRide) {
        // Active ride markers
        if (currentRide.pickup_lat && currentRide.pickup_lng) {
          newMarkers.push({ id: 'pickup', lat: currentRide.pickup_lat, lng: currentRide.pickup_lng, title: 'موقع الانطلاق', iconColor: 'green' });
          currentCenter = { lat: currentRide.pickup_lat, lng: currentRide.pickup_lng };
        }
        if (currentRide.destination_lat && currentRide.destination_lng) {
          newMarkers.push({ id: 'destination', lat: currentRide.destination_lat, lng: currentRide.destination_lng, title: 'الوجهة', iconColor: 'red' });
          if (!currentCenter) currentCenter = { lat: currentRide.destination_lat, lng: currentRide.destination_lng };
        }
        if (currentRide.driver_current_lat && currentRide.driver_current_lng) {
          newMarkers.push({ id: 'driver', lat: currentRide.driver_current_lat, lng: currentRide.driver_current_lng, title: 'موقعك الحالي', iconColor: 'blue' });
          currentCenter = { lat: currentRide.driver_current_lat, lng: currentRide.driver_current_lng };
          currentZoom = 14; // Zoom in on driver's current location
        }
      } else if (availableRides.length > 0) {
        // Available rides markers
        const bounds = new window.google.maps.LatLngBounds();
        availableRides.forEach(ride => {
          if (ride.pickup_lat && ride.pickup_lng) {
            newMarkers.push({ id: `${ride.id}-pickup`, lat: ride.pickup_lat, lng: ride.pickup_lng, title: `انطلاق: ${ride.pickup_location}`, iconColor: 'green' });
            bounds.extend({ lat: ride.pickup_lat, lng: ride.pickup_lng });
          }
          if (ride.destination_lat && ride.destination_lng) {
            newMarkers.push({ id: `${ride.id}-destination`, lat: ride.destination_lat, lng: ride.destination_lng, title: `وجهة: ${ride.destination}`, iconColor: 'red' });
            bounds.extend({ lat: ride.destination_lat, lng: ride.destination_lng });
          }
        });
        if (!bounds.isEmpty()) {
          // Calculate center and zoom to fit all markers
          currentCenter = bounds.getCenter().toJSON();
          // No specific zoom, let map fit bounds
        }
      }
      setMapMarkers(newMarkers);
      setMapCenter(currentCenter);
      setMapZoom(currentZoom);
    };

    updateMapMarkers();
  }, [currentRide, availableRides]);

  const updateDriverLocation = useCallback(async () => {
    if (!currentRide || !user) return;

    // Simulate location change (e.g., move slightly towards destination)
    const currentLat = currentRide.driver_current_lat || currentRide.pickup_lat;
    const currentLng = currentRide.driver_current_lng || currentRide.pickup_lng;
    const destLat = currentRide.destination_lat;
    const destLng = currentRide.destination_lng;

    if (currentLat === null || currentLng === null || destLat === null || destLng === null) {
      console.warn("Missing coordinates for location update.");
      return;
    }

    const newLat = currentLat + (destLat - currentLat) * 0.01; // Move 1% towards destination
    const newLng = currentLng + (destLng - currentLng) * 0.01;

    const { error } = await supabase
      .from('rides')
      .update({ driver_current_lat: newLat, driver_current_lng: newLng })
      .eq('id', currentRide.id);

    if (error) {
      console.error("Error updating driver location:", error);
      toast.error("فشل تحديث موقع السائق.");
    }
  }, [currentRide, user]);

  const handleStartTracking = () => {
    if (!currentRide) {
      toast.error("لا توجد رحلة نشطة لبدء التتبع.");
      return;
    }
    setIsTrackingLocation(true);
    toast.info("بدء تتبع موقعك.");
    // Start updating location every 5 seconds
    locationIntervalRef.current = window.setInterval(updateDriverLocation, 5000);
  };

  const handleStopTracking = () => {
    if (locationIntervalRef.current) {
      clearInterval(locationIntervalRef.current);
      locationIntervalRef.current = null;
    }
    setIsTrackingLocation(false);
    toast.info("تم إيقاف تتبع موقعك.");
  };

  const handleCompleteRide = async () => {
    if (!currentRide) return;

    setLoadingRideData(true);
    const { error } = await supabase
      .from('rides')
      .update({ status: 'completed' })
      .eq('id', currentRide.id);
    setLoadingRideData(false);

    if (error) {
      toast.error(`فشل إكمال الرحلة: ${error.message}`);
      console.error("Error completing ride:", error);
    } else {
      // The realtime listener will handle the toast and rating dialog
      setCurrentRide(null); // Clear current ride from state immediately
      handleStopTracking(); // Stop tracking when ride is completed
    }
  };

  const handleAcceptRide = async (rideId: string) => {
    if (!user?.id) {
      toast.error("الرجاء تسجيل الدخول لقبول الرحلة.");
      return;
    }

    setLoadingRideData(true); // Use general loading for accepting
    const { error } = await supabase
      .from('rides')
      .update({ driver_id: user.id, status: 'accepted' })
      .eq('id', rideId)
      .eq('status', 'pending') // Ensure it's still pending
      .is('driver_id', null); // Ensure no other driver accepted it

    setLoadingRideData(false);

    if (error) {
      toast.error(`فشل قبول الرحلة: ${error.message}`);
      console.error("Error accepting ride:", error);
    } else {
      toast.success("تم قبول الرحلة بنجاح! يمكنك الآن عرضها في لوحة التحكم الخاصة بك.");
      if (user) {
        fetchDriverRides(user.id); // Refresh the list
      }
    }
  };

  const handleOpenChat = (ride: Ride) => {
    if (!user || !ride.passenger_profiles) {
      toast.error("لا يمكن بدء الدردشة. معلومات المستخدم أو الرحلة غير متوفرة.");
      return;
    }
    setChatOtherUserId(ride.passenger_id);
    setChatOtherUserName(ride.passenger_profiles.full_name || 'الراكب');
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
    } as Omit<Rating, 'id' | 'created_at'>);

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
        fetchDriverRides(user.id);
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
      <InteractiveMap markers={mapMarkers} center={mapCenter} zoom={mapZoom} />

      {currentRide ? (
        // Active Ride Card for Driver
        <Card className="absolute bottom-4 left-1/2 -translate-x-1/2 w-[95%] max-w-md shadow-lg z-10">
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
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">الراكب:</span>
              <span>{currentRide.passenger_profiles?.full_name || 'غير معروف'}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">عدد الركاب:</span>
              <span>{currentRide.passengers_count}</span>
            </div>
            <div className="flex gap-2 mt-4">
              <Button onClick={handleCompleteRide} disabled={loadingRideData} className="flex-1 bg-green-600 hover:bg-green-700 text-white">
                {loadingRideData ? <Loader2 className="h-4 w-4 animate-spin" /> : "إكمال الرحلة"}
              </Button>
              <Button onClick={() => handleOpenChat(currentRide)} variant="outline" className="flex-1">
                <MessageSquare className="h-4 w-4 ml-2 rtl:mr-2" />
                محادثة مع الراكب
              </Button>
            </div>
            <div className="flex gap-2 mt-2">
              {isTrackingLocation ? (
                <Button onClick={handleStopTracking} variant="secondary" className="flex-1">
                  <PauseCircle className="h-4 w-4 ml-2 rtl:mr-2" />
                  إيقاف التتبع
                </Button>
              ) : (
                <Button onClick={handleStartTracking} variant="outline" className="flex-1">
                  <LocateFixed className="h-4 w-4 ml-2 rtl:mr-2" />
                  بدء التتبع
                </Button>
              )}
            </div>
            <Button onClick={() => handleCancelRide(currentRide)} variant="destructive" className="w-full mt-2">
              <XCircle className="h-4 w-4 ml-2 rtl:mr-2" />
              إلغاء الرحلة
            </Button>
          </CardContent>
        </Card>
      ) : (
        // Available Rides Drawer for Driver
        <Drawer open={availableRides.length > 0} onOpenChange={() => { /* Keep open if rides available */ }}>
          <DrawerContent className="max-h-[80vh]">
            <DrawerHeader className="text-right">
              <DrawerTitle>الرحلات المتاحة</DrawerTitle>
              <DrawerDescription>
                {availableRides.length > 0 ? "اختر رحلة لقبولها." : "لا توجد رحلات متاحة حاليًا."}
              </DrawerDescription>
            </DrawerHeader>
            <ScrollArea className="flex-1 p-4">
              {availableRides.length === 0 ? (
                <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                  <Car className="h-12 w-12 mx-auto mb-4" />
                  <p>لا توجد رحلات تنتظر سائقين حاليًا.</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {availableRides.map((ride) => (
                    <Card key={ride.id} className="shadow-sm">
                      <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                          <span>رحلة من {ride.pickup_location} إلى {ride.destination}</span>
                          <RideStatusBadge status={ride.status} />
                        </CardTitle>
                        <CardDescription>
                          الراكب: {ride.passenger_profiles?.full_name || 'غير معروف'}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium">عدد الركاب:</span>
                          <span>{ride.passengers_count}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium">تاريخ الطلب:</span>
                          <span>{new Date(ride.created_at).toLocaleDateString('ar-SA')}</span>
                        </div>
                        <Button
                          onClick={() => handleAcceptRide(ride.id)}
                          disabled={loadingRideData}
                          className="w-full bg-primary hover:bg-primary-dark text-primary-foreground mt-4"
                        >
                          {loadingRideData ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin ml-2 rtl:mr-2" />
                              جاري القبول...
                            </>
                          ) : (
                            <>
                              <CheckCircle className="h-4 w-4 ml-2 rtl:mr-2" />
                              قبول الرحلة
                            </>
                          )}
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </ScrollArea>
            <DrawerFooter>
              <Button variant="outline" onClick={() => navigate("/driver-dashboard/accepted-rides")}>
                <History className="h-4 w-4 ml-2 rtl:mr-2" />
                عرض رحلاتي المقبولة
              </Button>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      )}

      {user && (currentRide || availableRides.length > 0) && (
        <ChatDialog
          open={isChatDialogOpen}
          onOpenChange={setIsChatDialogOpen}
          rideId={currentRide?.id || availableRides[0]?.id || ""} // Use current ride or first available ride for chat context
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

export default DriverHome;