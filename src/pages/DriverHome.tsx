"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, Car, MessageSquare, PauseCircle, LocateFixed, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import ChatDialog from "@/components/ChatDialog";
import CancellationReasonDialog from "@/components/CancellationReasonDialog";
import { useUser } from "@/context/UserContext";
import { useSupabaseRealtime } from "@/hooks/useSupabaseRealtime";
import { Ride } from "@/types/supabase";
import RideStatusBadge from "@/components/RideStatusBadge";
import InteractiveMap from "@/components/InteractiveMap";
import supabaseService from "@/services/supabaseService"; // Import the new service

const DriverHome: React.FC = () => {
  const { user, loading: userLoading } = useUser();
  const navigate = useNavigate();

  const [loadingRideData, setLoadingRideData] = useState(true);
  const [currentRide, setCurrentRide] = useState<Ride | null>(null);

  const [isChatDialogOpen, setIsChatDialogOpen] = useState(false);
  const [chatRideId, setChatRideId] = useState("");
  const [chatOtherUserId, setChatOtherUserId] = useState("");
  const [chatOtherUserName, setChatOtherUserName] = useState("");

  const [isCancellationDialogOpen, setIsCancellationDialogOpen] = useState(false);
  const [rideToCancel, setRideToCancel] = useState<Ride | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);

  const [isTrackingLocation, setIsTrackingLocation] = useState(false);
  const locationIntervalRef = useRef<number | null>(null);

  const fetchCurrentRide = useCallback(async () => {
    if (!user?.id) return;

    setLoadingRideData(true);
    try {
      const ride = await supabaseService.getDriverCurrentRide(user.id);
      setCurrentRide(ride);
    } catch (currentRideError: any) {
      toast.error(`فشل جلب الرحلة الحالية: ${currentRideError.message}`);
      console.error("Error fetching current ride:", currentRideError);
      setCurrentRide(null);
    } finally {
      setLoadingRideData(false);
    }
  }, [user]);

  useEffect(() => {
    if (!userLoading && user) {
      fetchCurrentRide();
    } else if (!userLoading && !user) {
      navigate("/auth");
    }
    return () => {
      if (locationIntervalRef.current) {
        clearInterval(locationIntervalRef.current);
      }
    };
  }, [userLoading, user, navigate, fetchCurrentRide]);

  useSupabaseRealtime(
    'driver_home_rides_channel',
    {
      event: '*',
      schema: 'public',
      table: 'rides',
      filter: `driver_id=eq.${user?.id}`,
    },
    (_payload) => {
      if (user) {
        fetchCurrentRide();
      }
      if (_payload.eventType === 'UPDATE' && _payload.new.status === 'completed' && _payload.old.status !== 'completed') {
        toast.success("تم إكمال الرحلة بنجاح!");
        setIsTrackingLocation(false);
      }
      if (_payload.eventType === 'UPDATE' && _payload.new.status === 'cancelled' && _payload.old.status !== 'cancelled') {
        toast.warning(`تم إلغاء الرحلة. السبب: ${_payload.new.cancellation_reason || 'غير محدد'}`);
        setIsTrackingLocation(false);
      }
    },
    !!user
  );

  const updateDriverLocation = useCallback(async () => {
    if (!currentRide || !user) return;

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          try {
            await supabaseService.updateRide(currentRide.id, {
              driver_current_lat: latitude,
              driver_current_lng: longitude,
            });
            setCurrentRide(prev => prev ? { ...prev, driver_current_lat: latitude, driver_current_lng: longitude } : null);
          } catch (error: any) {
            toast.error(`فشل تحديث موقع السائق: ${error.message}`);
            console.error("Error updating driver location:", error);
          }
        },
        (_error) => {
          toast.error("فشل الحصول على موقعك. الرجاء التأكد من تمكين خدمات الموقع.");
          handleStopTracking();
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
    } else {
      toast.error("متصفحك لا يدعم تحديد الموقع الجغرافي.");
      handleStopTracking();
    }
  }, [currentRide, user]);

  const handleStartTracking = () => {
    if (!currentRide) {
      toast.error("لا توجد رحلة نشطة لبدء التتبع.");
      return;
    }
    setIsTrackingLocation(true);
    toast.info("بدء تتبع موقعك.");
    updateDriverLocation();
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
    try {
      await supabaseService.updateRide(currentRide.id, { status: 'completed' });
      setCurrentRide(null);
      handleStopTracking();
    } catch (error: any) {
      toast.error(`فشل إكمال الرحلة: ${error.message}`);
      console.error("Error completing ride:", error);
    } finally {
      setLoadingRideData(false);
    }
  };

  const handleOpenChat = (ride: Ride) => {
    if (!user || !ride.passenger_profiles) {
      toast.error("لا يمكن بدء الدردشة. معلومات المستخدم أو الرحلة غير متوفرة.");
      return;
    }
    setChatRideId(ride.id);
    setChatOtherUserId(ride.passenger_id);
    setChatOtherUserName(ride.passenger_profiles.full_name || 'الراكب');
    setIsChatDialogOpen(true);
  };

  const handleCancelRide = (ride: Ride) => {
    setRideToCancel(ride);
    setIsCancellationDialogOpen(true);
  };

  const confirmCancelRide = async (reason: string) => {
    if (!rideToCancel) return;

    setIsCancelling(true);
    try {
      await supabaseService.updateRide(rideToCancel.id, { status: 'cancelled', cancellation_reason: reason });
      toast.success("تم إلغاء الرحلة بنجاح.");
      if (user) {
        fetchCurrentRide();
      }
    } catch (error: any) {
      toast.error(`فشل إلغاء الرحلة: ${error.message}`);
      console.error("Error cancelling ride:", error);
    } finally {
      setIsCancelling(false);
      setIsCancellationDialogOpen(false);
      setRideToCancel(null);
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
    <div className="relative flex flex-col h-[calc(100vh-64px)]">
      <InteractiveMap />

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
        <Button
          onClick={() => navigate("/driver-dashboard/available-rides")}
          className="absolute bottom-20 left-1/2 -translate-x-1/2 w-[95%] max-w-md bg-primary hover:bg-primary-dark text-primary-foreground py-3 text-lg shadow-lg z-10"
        >
          <Car className="h-5 w-5 ml-2 rtl:mr-2" />
          عرض الرحلات المتاحة
        </Button>
      )}

      {user && currentRide && (
        <ChatDialog
          open={isChatDialogOpen}
          onOpenChange={setIsChatDialogOpen}
          rideId={chatRideId}
          otherUserId={chatOtherUserId}
          otherUserName={chatOtherUserName}
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