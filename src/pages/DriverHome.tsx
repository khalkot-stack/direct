"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, Car, MessageSquare, CheckCircle, PauseCircle, LocateFixed, XCircle, History, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import InteractiveMap, { MarkerLocation } from "@/components/InteractiveMap";
import ChatDialog from "@/components/ChatDialog";
import RatingDialog from "@/components/RatingDialog";
import CancellationReasonDialog from "@/components/CancellationReasonDialog";
import { useUser } from "@/context/UserContext";
import { useSupabaseRealtime } from "@/hooks/useSupabaseRealtime";
import { Ride, RawRideData, Rating } from "@/types/supabase";
import RideStatusBadge from "@/components/RideStatusBadge";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter } from "@/components/ui/drawer";
import { ScrollArea } from "@/components/ui/scroll-area";
import EmptyState from "@/components/EmptyState";
import RideSearchDialog from "@/components/RideSearchDialog";

interface RideSearchCriteria {
  pickupLocation?: string;
  destination?: string;
  passengersCount?: number;
}

const DriverHome: React.FC = () => {
  const { user, loading: userLoading } = useUser();
  const navigate = useNavigate();

  const [loadingRideData, setLoadingRideData] = useState(true);
  const [currentRide, setCurrentRide] = useState<Ride | null>(null);
  const [availableRides, setAvailableRides] = useState<Ride[]>([]);
  const [mapMarkers, setMapMarkers] = useState<MarkerLocation[]>([]);
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number } | undefined>(undefined);
  const [mapZoom, setMapZoom] = useState<number>(12);
  const [isMapReady, setIsMapReady] = useState(false);

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

  const [isSearchDialogOpen, setIsSearchDialogOpen] = useState(false);
  const [searchCriteria, setSearchCriteria] = useState<RideSearchCriteria>({});
  const [isAvailableRidesDrawerOpen, setIsAvailableRidesDrawerOpen] = useState(false);

  const googleMapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  const fetchDriverRides = useCallback(async (userId: string, criteria?: RideSearchCriteria) => {
    setLoadingRideData(true);
    console.log("[DriverHome] Fetching driver rides for user:", userId, "with criteria:", criteria);

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
      console.error("[DriverHome] Error fetching current ride:", currentRideError);
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
      setAvailableRides([]);
      console.log("[DriverHome] Current ride found:", ride);
    } else {
      setCurrentRide(null);
      let query = supabase
        .from('rides')
        .select(`
          *,
          passenger_profiles:passenger_id(id, full_name, avatar_url)
        `)
        .eq('status', 'pending')
        .is('driver_id', null)
        .neq('passenger_id', userId)
        .order('created_at', { ascending: false });

      if (criteria?.pickupLocation) {
        query = query.ilike('pickup_location', `%${criteria.pickupLocation}%`);
      }
      if (criteria?.destination) {
        query = query.ilike('destination', `%${criteria.destination}%`);
      }
      if (criteria?.passengersCount) {
        query = query.eq('passengers_count', criteria.passengersCount);
      }

      const { data: availableRidesRaw, error: availableRidesError } = await query;

      if (availableRidesError) {
        toast.error(`فشل جلب الرحلات المتاحة: ${availableRidesError.message}`);
        console.error("[DriverHome] Error fetching available rides:", availableRidesError);
        setAvailableRides([]);
      } else {
        const formattedAvailableRides: Ride[] = (availableRidesRaw as RawRideData[] || []).map(ride => {
          const passengerProfile = Array.isArray(ride.passenger_profiles)
            ? ride.passenger_profiles[0] || null
            : ride.passenger_profiles;
          
          const driverProfile = null;

          return {
            ...ride,
            passenger_profiles: passengerProfile,
            driver_profiles: driverProfile,
          };
        }) as Ride[];
        setAvailableRides(formattedAvailableRides);
        console.log("[DriverHome] Available rides fetched:", formattedAvailableRides);
      }
    }
    setLoadingRideData(false);
  }, []);

  useEffect(() => {
    if (!userLoading && user) {
      fetchDriverRides(user.id, searchCriteria);
    } else if (!userLoading && !user) {
      navigate("/auth");
    }
    return () => {
      if (locationIntervalRef.current) {
        clearInterval(locationIntervalRef.current);
      }
    };
  }, [userLoading, user, fetchDriverRides, navigate, searchCriteria]);

  useEffect(() => {
    if (!currentRide && availableRides.length > 0) {
      setIsAvailableRidesDrawerOpen(true);
    } else {
      setIsAvailableRidesDrawerOpen(false);
    }
  }, [currentRide, availableRides]);

  useSupabaseRealtime(
    'driver_home_rides_channel',
    {
      event: '*',
      schema: 'public',
      table: 'rides',
      filter: `driver_id=eq.${user?.id}`,
    },
    (payload) => {
      console.log('[DriverHome] Realtime change received on driver_home_rides_channel!', payload);
      if (user) {
        fetchDriverRides(user.id, searchCriteria);
      }
      if (payload.eventType === 'UPDATE' && payload.new.status === 'completed' && payload.old.status !== 'completed') {
        toast.success("تم إكمال الرحلة بنجاح!");
        const completedRide = payload.new as Ride;
        if (completedRide.passenger_profiles) {
          setRideToRate(completedRide);
          setRatingTargetUser({ id: completedRide.passenger_id, name: completedRide.passenger_profiles.full_name || 'الراكب' });
          setIsRatingDialogOpen(true);
        }
        setIsTrackingLocation(false);
      }
      if (payload.eventType === 'UPDATE' && payload.new.status === 'cancelled' && payload.old.status !== 'cancelled') {
        toast.warning(`تم إلغاء الرحلة. السبب: ${payload.new.cancellation_reason || 'غير محدد'}`);
        setIsTrackingLocation(false);
      }
    },
    !!user
  );

  useSupabaseRealtime(
    'driver_available_rides_channel',
    {
      event: '*',
      schema: 'public',
      table: 'rides',
      filter: `status=eq.pending`,
    },
    (payload) => {
      console.log('[DriverHome] Realtime change received on driver_available_rides_channel!', payload);
      if (user && !currentRide) {
        fetchDriverRides(user.id, searchCriteria);
      }
    },
    !!user && !currentRide
  );

  const handleMapReady = useCallback(() => {
    setIsMapReady(true);
  }, []);

  useEffect(() => {
    const updateMapMarkers = () => {
      if (!isMapReady || !window.google || !window.google.maps || !window.google.maps.LatLngBounds) {
        return;
      }

      const newMarkers: MarkerLocation[] = [];
      let currentCenter = undefined;
      let currentZoom = 12;

      if (currentRide) {
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
          currentZoom = 14;
        }
      } else if (availableRides.length > 0) {
        const bounds = new window.google.maps.LatLngBounds();
        let hasValidCoords = false;

        availableRides.forEach(ride => {
          if (ride.pickup_lat && ride.pickup_lng) {
            newMarkers.push({ id: `${ride.id}-pickup`, lat: ride.pickup_lat, lng: ride.pickup_lng, title: `انطلاق: ${ride.pickup_location}`, iconColor: 'green' });
            bounds.extend({ lat: ride.pickup_lat, lng: ride.pickup_lng });
            hasValidCoords = true;
          }
          if (ride.destination_lat && ride.destination_lng) {
            newMarkers.push({ id: `${ride.id}-destination`, lat: ride.destination_lat, lng: ride.destination_lng, title: `وجهة: ${ride.destination}`, iconColor: 'red' });
            bounds.extend({ lat: ride.destination_lat, lng: ride.destination_lng });
            hasValidCoords = true;
          }
        });

        if (hasValidCoords) {
          const centerCoords = bounds.getCenter();
          if (centerCoords) {
            currentCenter = centerCoords.toJSON();
          }
        }
      }
      setMapMarkers(newMarkers);
      setMapCenter(currentCenter);
      setMapZoom(currentZoom);
    };

    updateMapMarkers();
  }, [currentRide, availableRides, isMapReady]);

  const updateDriverLocation = useCallback(async () => {
    if (!currentRide || !user) return;

    const currentLat = currentRide.driver_current_lat || currentRide.pickup_lat;
    const currentLng = currentRide.driver_current_lng || currentRide.pickup_lng;
    const destLat = currentRide.destination_lat;
    const destLng = currentRide.destination_lng;

    if (currentLat === null || currentLng === null || destLat === null || destLng === null) {
      console.warn("[DriverHome] Missing coordinates for location update.");
      return;
    }

    const newLat = currentLat + (destLat - currentLat) * 0.01;
    const newLng = currentLng + (destLng - currentLng) * 0.01;

    const { error } = await supabase
      .from('rides')
      .update({ driver_current_lat: newLat, driver_current_lng: newLng })
      .eq('id', currentRide.id);

    if (error) {
      console.error("[DriverHome] Error updating driver location:", error);
      toast.error("فشل تحديث موقع السائق.");
    } else {
      console.log(`[DriverHome] Driver location updated for ride ${currentRide.id} to lat: ${newLat}, lng: ${newLng}`);
    }
  }, [currentRide, user]);

  const handleStartTracking = () => {
    if (!currentRide) {
      toast.error("لا توجد رحلة نشطة لبدء التتبع.");
      return;
    }
    setIsTrackingLocation(true);
    toast.info("بدء تتبع موقعك.");
    locationIntervalRef.current = window.setInterval(updateDriverLocation, 5000);
    console.log("[DriverHome] Started location tracking.");
  };

  const handleStopTracking = () => {
    if (locationIntervalRef.current) {
      clearInterval(locationIntervalRef.current);
      locationIntervalRef.current = null;
    }
    setIsTrackingLocation(false);
    toast.info("تم إيقاف تتبع موقعك.");
    console.log("[DriverHome] Stopped location tracking.");
  };

  const handleCompleteRide = async () => {
    if (!currentRide) return;

    setLoadingRideData(true);
    console.log(`[DriverHome] Attempting to complete ride: ${currentRide.id}`);
    const { error } = await supabase
      .from('rides')
      .update({ status: 'completed' })
      .eq('id', currentRide.id);
    setLoadingRideData(false);

    if (error) {
      toast.error(`فشل إكمال الرحلة: ${error.message}`);
      console.error("[DriverHome] Error completing ride:", error);
    } else {
      console.log(`[DriverHome] Ride ${currentRide.id} marked as completed.`);
      setCurrentRide(null);
      handleStopTracking();
    }
  };

  const handleAcceptRide = async (rideId: string) => {
    if (!user?.id) {
      toast.error("الرجاء تسجيل الدخول لقبول الرحلة.");
      return;
    }

    setLoadingRideData(true);
    console.log(`[DriverHome] Attempting to accept ride: ${rideId} by driver: ${user.id}`);
    const { error } = await supabase
      .from('rides')
      .update({ driver_id: user.id, status: 'accepted' })
      .eq('id', rideId)
      .eq('status', 'pending')
      .is('driver_id', null);

    setLoadingRideData(false);

    if (error) {
      toast.error(`فشل قبول الرحلة: ${error.message}`);
      console.error("[DriverHome] Error accepting ride:", error);
    } else {
      toast.success("تم قبول الرحلة بنجاح! يمكنك الآن عرضها في لوحة التحكم الخاصة بك.");
      console.log(`[DriverHome] Ride ${rideId} accepted by driver ${user.id}.`);
      if (user) {
        fetchDriverRides(user.id, searchCriteria);
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
    console.log(`[DriverHome] Opening chat for ride ${ride.id} with passenger ${ride.passenger_id}`);
  };

  const handleSaveRating = async (rating: number, comment: string) => {
    if (!user || !rideToRate || !ratingTargetUser) return;

    console.log(`[DriverHome] Saving rating for user ${ratingTargetUser.id} on ride ${rideToRate.id}`);
    const { error } = await supabase.from('ratings').insert({
      ride_id: rideToRate.id,
      rater_id: user.id,
      rated_user_id: ratingTargetUser.id,
      rating,
      comment,
    } as Omit<Rating, 'id' | 'created_at'>);

    if (error) {
      toast.error(`فشل حفظ التقييم: ${error.message}`);
      console.error("[DriverHome] Error saving rating:", error);
    } else {
      toast.success("تم حفظ التقييم بنجاح!");
      console.log(`[DriverHome] Rating saved successfully for user ${ratingTargetUser.id}`);
    }
  };

  const handleCancelRide = (ride: Ride) => {
    setRideToCancel(ride);
    setIsCancellationDialogOpen(true);
    console.log(`[DriverHome] Opening cancellation dialog for ride ${ride.id}`);
  };

  const confirmCancelRide = async (reason: string) => {
    if (!rideToCancel) return;

    setIsCancelling(true);
    console.log(`[DriverHome] Confirming cancellation for ride ${rideToCancel.id} with reason: ${reason}`);
    const { error } = await supabase
      .from('rides')
      .update({ status: 'cancelled', cancellation_reason: reason })
      .eq('id', rideToCancel.id);
    setIsCancelling(false);
    setIsCancellationDialogOpen(false);
    setRideToCancel(null);

    if (error) {
      toast.error(`فشل إلغاء الرحلة: ${error.message}`);
      console.error("[DriverHome] Error cancelling ride:", error);
    } else {
      toast.success("تم إلغاء الرحلة بنجاح.");
      console.log(`[DriverHome] Ride ${rideToCancel.id} cancelled successfully.`);
      if (user) {
        fetchDriverRides(user.id, searchCriteria);
      }
    }
  };

  const handleSearch = (criteria: RideSearchCriteria) => {
    setSearchCriteria(criteria);
    setIsSearchDialogOpen(false);
    console.log("[DriverHome] Search criteria updated:", criteria);
  };

  if (userLoading || loadingRideData) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-950">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="sr-only">جاري تحميل التطبيق...</span>
      </div>
    );
  }

  if (!googleMapsApiKey) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-950 p-4 text-center">
        <Car className="h-16 w-16 text-red-500 mb-4" />
        <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">
          خطأ في إعداد الخريطة
        </h3>
        <p className="text-gray-600 dark:text-gray-400 max-w-sm">
          الرجاء إضافة مفتاح Google Maps API الخاص بك إلى ملف .env الخاص بالمشروع.
          (VITE_GOOGLE_MAPS_API_KEY)
        </p>
        <Button onClick={() => navigate("/")} className="mt-4">العودة للصفحة الرئيسية</Button>
      </div>
    );
  }

  return (
    <div className="relative flex flex-col h-[calc(100vh-64px)]">
      <InteractiveMap markers={mapMarkers} center={mapCenter} zoom={mapZoom} onMapReady={handleMapReady} />

      {currentRide ? (
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
        <Drawer open={isAvailableRidesDrawerOpen} onOpenChange={setIsAvailableRidesDrawerOpen}>
          <DrawerContent className="max-h-[60vh]">
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
            <DrawerFooter className="flex flex-row justify-between items-center p-4 border-t dark:border-gray-700">
              <Button variant="outline" onClick={() => navigate("/driver-dashboard/accepted-rides")}>
                <History className="h-4 w-4 ml-2 rtl:mr-2" />
                عرض رحلاتي المقبولة
              </Button>
              <Button
                onClick={() => setIsSearchDialogOpen(true)}
                className="bg-primary hover:bg-primary-dark text-primary-foreground"
              >
                <Search className="h-4 w-4 ml-2 rtl:mr-2" />
                بحث عن رحلات
              </Button>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      ) : (
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 w-[95%] max-w-md shadow-lg z-10 p-4 bg-card rounded-lg">
          <EmptyState
            icon={Car}
            title="لا توجد رحلات حاليًا"
            description="لا توجد رحلات مقبولة أو متاحة لك في الوقت الحالي. يرجى التحقق لاحقًا."
          />
          <Button
            onClick={() => setIsSearchDialogOpen(true)}
            className="w-full bg-primary hover:bg-primary-dark text-primary-foreground mt-4"
          >
            <Search className="h-5 w-5 ml-2 rtl:mr-2" />
            بحث عن رحلات
          </Button>
        </div>
      )}

      {user && (currentRide || availableRides.length > 0) && (
        <ChatDialog
          open={isChatDialogOpen}
          onOpenChange={setIsChatDialogOpen}
          rideId={currentRide?.id || availableRides[0]?.id || ""}
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

      <RideSearchDialog
        open={isSearchDialogOpen}
        onOpenChange={setIsSearchDialogOpen}
        onSearch={handleSearch}
        initialCriteria={searchCriteria}
      />
    </div>
  );
};

export default DriverHome;