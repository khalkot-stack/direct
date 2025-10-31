"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import PageHeader from "@/components/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Car, MapPin, History, Settings, Loader2, MessageSquare, LocateFixed, PauseCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import EmptyState from "@/components/EmptyState";
import InteractiveMap from "@/components/InteractiveMap";
import ChatDialog from "@/components/ChatDialog";
import RatingDialog from "@/components/RatingDialog";
import { Badge } from "@/components/ui/badge";
import { useUser } from "@/context/UserContext";
import { MarkerLocation } from "@/components/InteractiveMap"; // Import MarkerLocation
import { Ride, Rating } from "@/types/supabase"; // Import shared Ride and Rating types
import { useSupabaseRealtime } from "@/hooks/useSupabaseRealtime"; // Import the new hook

const DriverDashboard: React.FC = () => {
  const { user, loading: userLoading } = useUser();
  const [loadingRides, setLoadingRides] = useState(true);
  const [currentRide, setCurrentRide] = useState<Ride | null>(null);
  const [isChatDialogOpen, setIsChatDialogOpen] = useState(false);
  const [chatOtherUserId, setChatOtherUserId] = useState("");
  const [chatOtherUserName, setChatOtherUserName] = useState("");

  const [isRatingDialogOpen, setIsRatingDialogOpen] = useState(false);
  const [ratingTargetUser, setRatingTargetUser] = useState<{ id: string; name: string } | null>(null);
  const [rideToRate, setRideToRate] = useState<Ride | null>(null);

  const [isTrackingLocation, setIsTrackingLocation] = useState(false);
  const locationIntervalRef = useRef<number | null>(null);

  const navigate = useNavigate();

  const fetchCurrentRide = useCallback(async (userId: string) => {
    setLoadingRides(true);
    // Fetch current active ride for the driver
    const { data: ridesData, error: ridesError } = await supabase
      .from('rides')
      .select(`
        *,
        passenger_profiles:passenger_id(id, full_name, avatar_url),
        driver_profiles:driver_id(id, full_name, avatar_url)
      `)
      .eq('driver_id', userId)
      .in('status', ['accepted']) // Driver only sees accepted rides as current
      .order('created_at', { ascending: false })
      .limit(1);

    if (ridesError) {
      toast.error(`فشل جلب الرحلات الحالية: ${ridesError.message}`);
      console.error("Error fetching current ride:", ridesError);
      setCurrentRide(null);
    } else if (ridesData && ridesData.length > 0) {
      setCurrentRide(ridesData[0] as Ride);
    } else {
      setCurrentRide(null);
    }
    setLoadingRides(false);
  }, []);

  useEffect(() => {
    if (!userLoading && user) {
      fetchCurrentRide(user.id);
    } else if (!userLoading && !user) {
      navigate("/auth");
    }
    return () => {
      if (locationIntervalRef.current) {
        clearInterval(locationIntervalRef.current);
      }
    };
  }, [userLoading, user, fetchCurrentRide, navigate]);

  useSupabaseRealtime(
    'driver_rides_channel',
    {
      event: '*',
      schema: 'public',
      table: 'rides',
      filter: `driver_id=eq.${user?.id}`,
    },
    (payload) => {
      console.log('Change received!', payload);
      if (user) {
        fetchCurrentRide(user.id); // Re-fetch data on any ride change
      }
      if (payload.eventType === 'UPDATE' && payload.new.status === 'completed' && payload.old.status !== 'completed') {
        toast.success("تم إكمال الرحلة بنجاح!");
        // Prompt driver to rate passenger
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

  const updateDriverLocation = useCallback(async () => {
    if (!currentRide || !user) return;

    // Simulate location change (e.g., move slightly towards destination)
    const currentLat = currentRide.driver_current_lat || currentRide.pickup_lat;
    const currentLng = currentRide.driver_current_lng || currentRide.pickup_lng;
    const destLat = currentRide.destination_lat;
    const destLng = currentRide.destination_lng;

    const newLat = (currentLat || 0) + ((destLat || 0) - (currentLat || 0)) * 0.01; // Move 1% towards destination
    const newLng = (currentLng || 0) + ((destLng || 0) - (currentLng || 0)) * 0.01;

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

    setLoadingRides(true);
    const { error } = await supabase
      .from('rides')
      .update({ status: 'completed' })
      .eq('id', currentRide.id);
    setLoadingRides(false);

    if (error) {
      toast.error(`فشل إكمال الرحلة: ${error.message}`);
      console.error("Error completing ride:", error);
    } else {
      // The realtime listener will handle the toast and rating dialog
      setCurrentRide(null); // Clear current ride from state immediately
      handleStopTracking(); // Stop tracking when ride is completed
    }
  };

  const handleOpenChat = () => {
    if (!user || !currentRide || !currentRide.passenger_profiles) {
      toast.error("لا يمكن بدء الدردشة. معلومات المستخدم أو الرحلة غير متوفرة.");
      return;
    }
    setChatOtherUserId(currentRide.passenger_id);
    setChatOtherUserName(currentRide.passenger_profiles.full_name || 'الراكب');
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

  const markers: MarkerLocation[] = currentRide ? [
    { id: 'pickup', lat: currentRide.pickup_lat!, lng: currentRide.pickup_lng!, title: 'موقع الانطلاق', iconColor: 'green' as const },
    { id: 'destination', lat: currentRide.destination_lat!, lng: currentRide.destination_lng!, title: 'الوجهة', iconColor: 'red' as const },
    ...(currentRide.driver_current_lat && currentRide.driver_current_lng
      ? [{ id: 'driver', lat: currentRide.driver_current_lat, lng: currentRide.driver_current_lng, title: 'موقعك الحالي', iconColor: 'blue' as const }]
      : [])
  ] : [];

  const mapCenter = currentRide?.driver_current_lat && currentRide?.driver_current_lng
    ? { lat: currentRide.driver_current_lat, lng: currentRide.driver_current_lng }
    : currentRide?.pickup_lat && currentRide?.pickup_lng
      ? { lat: currentRide.pickup_lat, lng: currentRide.pickup_lng }
      : undefined;

  if (userLoading || loadingRides) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-950">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="sr-only">جاري التحميل...</span>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <PageHeader title="لوحة تحكم السائق" description="إدارة رحلاتك وعرض المعلومات الهامة." />

      {currentRide ? (
        <Card className="mb-6 border-primary shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>رحلتك الحالية</span>
              <Badge variant="default" className="bg-blue-500">{currentRide.status === 'pending' ? 'قيد الانتظار' : 'مقبولة'}</Badge>
            </CardTitle>
            <CardDescription>
              من {currentRide.pickup_location} إلى {currentRide.destination}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">الراكب:</span>
              <span>{currentRide.passenger_profiles?.full_name || 'غير معروف'}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">عدد الركاب:</span>
              <span>{currentRide.passengers_count}</span>
            </div>
            <div className="h-[300px] w-full rounded-md overflow-hidden">
              <InteractiveMap markers={markers} center={mapCenter} zoom={14} />
            </div>
            <div className="flex gap-2 mt-4">
              <Button onClick={handleCompleteRide} disabled={loadingRides} className="flex-1 bg-green-600 hover:bg-green-700 text-white">
                {loadingRides ? <Loader2 className="h-4 w-4 animate-spin" /> : "إكمال الرحلة"}
              </Button>
              <Button onClick={handleOpenChat} variant="outline" className="flex-1">
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
          </CardContent>
        </Card>
      ) : (
        <EmptyState
          icon={Car}
          title="لا توجد رحلات حالية"
          description="لا توجد رحلات مقبولة أو قيد الانتظار حاليًا. ابحث عن رحلات جديدة!"
        />
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mt-6">
        <Link to="/driver-dashboard/find-rides">
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">البحث عن ركاب</CardTitle>
              <MapPin className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">ابحث</p>
              <p className="text-xs text-muted-foreground">عن رحلات جديدة</p>
            </CardContent>
          </Card>
        </Link>
        <Link to="/driver-dashboard/accepted-rides">
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">رحلاتي المقبولة</CardTitle>
              <History className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">عرض</p>
              <p className="text-xs text-muted-foreground">الرحلات التي قبلتها</p>
            </CardContent>
          </Card>
        </Link>
        <Link to="/app-settings">
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">الإعدادات</CardTitle>
              <Settings className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">تعديل</p>
              <p className="text-xs text-muted-foreground">إعدادات حسابك</p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {user && currentRide && (
        <ChatDialog
          open={isChatDialogOpen}
          onOpenChange={setIsChatDialogOpen}
          rideId={currentRide.id}
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
    </div>
  );
};

export default DriverDashboard;