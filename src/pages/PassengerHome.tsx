"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, Car, MessageSquare, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import ChatDialog from "@/components/ChatDialog";
import RatingDialog from "@/components/RatingDialog";
import CancellationReasonDialog from "@/components/CancellationReasonDialog";
import { useUser } from "@/context/UserContext";
import { useSupabaseRealtime } from "@/hooks/useSupabaseRealtime";
import { Ride, RawRideData } from "@/types/supabase";
import RideStatusBadge from "@/components/RideStatusBadge";
import EmptyState from "@/components/EmptyState"; // Added EmptyState for placeholder
import { createRideViaEdgeFunction } from "@/utils/supabaseFunctions"; // Import the Edge Function utility
import RequestRideDialog from "@/components/RequestRideDialog"; // Import the new RequestRideDialog
import InteractiveMap from "@/components/InteractiveMap"; // Import InteractiveMap

// Removed rideRequestSchema and RideRequestInputs as they are now in RequestRideDialog

const PassengerHome: React.FC = () => {
  const { user, loading: userLoading } = useUser();
  const navigate = useNavigate();

  const [loadingRideData, setLoadingRideData] = useState(true);
  const [currentRide, setCurrentRide] = useState<Ride | null>(null);

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

  const [isRequestRideDialogOpen, setIsRequestRideDialogOpen] = useState(false); // New state for RequestRideDialog

  // Removed useForm hook as it's now in RequestRideDialog

  const fetchCurrentRide = useCallback(async (userId: string) => {
    setLoadingRideData(true);
    const { data: ridesRaw, error: ridesError } = await supabase
      .from('rides')
      .select(`
        *,
        passenger_profiles:passenger_id(id, full_name, avatar_url, user_type),
        driver_profiles:driver_id(id, full_name, avatar_url, user_type)
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
      // console.log('Change received in PassengerHome!', payload);
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

  const handleRequestRide = async (values: { pickupLocation: string; destination: string; passengersCount: number }) => {
    if (!user?.id) {
      toast.error("الرجاء تسجيل الدخول لطلب رحلة.");
      return;
    }

    setLoadingRideData(true);
    const result = await createRideViaEdgeFunction({
      passenger_id: user.id,
      pickup_location: values.pickupLocation,
      destination: values.destination,
      passengers_count: values.passengersCount,
    });
    setLoadingRideData(false);

    if (result) {
      setIsRequestRideDialogOpen(false); // Close dialog on success
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
    <div className="relative flex flex-col h-[calc(100vh-64px)]">
      {/* Placeholder for map area */}
      <InteractiveMap />

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
          onClick={() => setIsRequestRideDialogOpen(true)} // Open the new dialog
          className="absolute bottom-20 left-1/2 -translate-x-1/2 w-[95%] max-w-md bg-primary hover:bg-primary-dark text-primary-foreground py-3 text-lg shadow-lg z-10"
        >
          <Car className="h-5 w-5 ml-2 rtl:mr-2" />
          طلب رحلة
        </Button>
      )}

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

      {user && (
        <RequestRideDialog
          open={isRequestRideDialogOpen}
          onOpenChange={setIsRequestRideDialogOpen}
          onSave={handleRequestRide}
          isSubmitting={loadingRideData} // Use loadingRideData to indicate submission status
        />
      )}
    </div>
  );
};

export default PassengerHome;