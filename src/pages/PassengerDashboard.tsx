"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import PageHeader from "@/components/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, History, Settings, Loader2, MessageSquare, Star, XCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import EmptyState from "@/components/EmptyState";
import InteractiveMap from "@/components/InteractiveMap";
import ChatDialog from "@/components/ChatDialog";
import RatingDialog from "@/components/RatingDialog";
import CancellationReasonDialog from "@/components/CancellationReasonDialog";
import { Badge } from "@/components/ui/badge"; // Imported Badge

interface Ride {
  id: string;
  passenger_id: string;
  driver_id: string | null;
  pickup_location: string;
  destination: string;
  passengers_count: number;
  status: "pending" | "accepted" | "completed" | "cancelled";
  created_at: string;
  pickup_lat: number;
  pickup_lng: number;
  destination_lat: number;
  destination_lng: number;
  cancellation_reason: string | null;
  passenger_profiles: {
    id: string;
    full_name: string;
    avatar_url: string | null;
  } | null;
  driver_profiles: {
    id: string;
    full_name: string;
    avatar_url: string | null;
  } | null;
}

// Rating interface is used as a type, so keeping it.
interface Rating {
  id: string;
  ride_id: string;
  rater_id: string;
  rated_user_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
}

const PassengerDashboard: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentRide, setCurrentRide] = useState<Ride | null>(null);
  const [isChatDialogOpen, setIsChatDialogOpen] = useState(false);
  const [chatRideId, setChatRideId] = useState(""); // Correctly defined
  const [chatOtherUserId, setChatOtherUserId] = useState("");
  const [chatOtherUserName, setChatOtherUserName] = useState("");

  const [isRatingDialogOpen, setIsRatingDialogOpen] = useState(false);
  const [ratingTargetUser, setRatingTargetUser] = useState<{ id: string; name: string } | null>(null);
  const [rideToRate, setRideToRate] = useState<Ride | null>(null);

  const [isCancellationDialogOpen, setIsCancellationDialogOpen] = useState(false);
  const [rideToCancel, setRideToCancel] = useState<Ride | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);

  const navigate = useNavigate();

  const fetchUserDataAndCurrentRide = useCallback(async () => {
    setLoading(true);
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      toast.error("الرجاء تسجيل الدخول للوصول إلى لوحة التحكم.");
      navigate("/auth");
      setLoading(false);
      return;
    }
    setUser(user);

    // Fetch current active ride for the passenger
    const { data: ridesData, error: ridesError } = await supabase
      .from('rides')
      .select(`
        *,
        passenger_profiles:passenger_id(id, full_name, avatar_url),
        driver_profiles:driver_id(id, full_name, avatar_url)
      `)
      .eq('passenger_id', user.id)
      .in('status', ['pending', 'accepted'])
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
    setLoading(false);
  }, [navigate]);

  useEffect(() => {
    fetchUserDataAndCurrentRide();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user);
        fetchUserDataAndCurrentRide();
      } else {
        setUser(null);
        setCurrentRide(null);
        navigate("/auth");
      }
    });

    const rideChannel = supabase
      .channel('passenger_rides_channel')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'rides',
          filter: `passenger_id=eq.${user?.id}`,
        },
        (payload) => {
          console.log('Change received!', payload);
          fetchUserDataAndCurrentRide(); // Re-fetch data on any ride change
          if (payload.eventType === 'UPDATE' && payload.new.status === 'accepted' && payload.old.status === 'pending') {
            toast.success("تم قبول رحلتك من قبل سائق!");
          }
          if (payload.eventType === 'UPDATE' && payload.new.status === 'completed' && payload.old.status !== 'completed') {
            toast.success("تم إكمال رحلتك بنجاح!");
            // Prompt passenger to rate driver
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
      )
      .subscribe();

    return () => {
      authListener.subscription.unsubscribe();
      supabase.removeChannel(rideChannel);
    };
  }, [fetchUserDataAndCurrentRide, user?.id, navigate]);

  const handleOpenChat = () => {
    if (!user || !currentRide || !currentRide.driver_profiles) {
      toast.error("لا يمكن بدء الدردشة. معلومات السائق أو الرحلة غير متوفرة.");
      return;
    }
    setChatRideId(currentRide.id); // Corrected usage
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
      setCurrentRide(null); // Clear current ride from state immediately
    }
  };

  const markers = currentRide ? [
    { id: 'pickup', lat: currentRide.pickup_lat, lng: currentRide.pickup_lng, title: 'موقع الانطلاق', iconColor: 'green' },
    { id: 'destination', lat: currentRide.destination_lat, lng: currentRide.destination_lng, title: 'الوجهة', iconColor: 'red' },
  ] : [];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-950">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="sr-only">جاري التحميل...</span>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <PageHeader title="لوحة تحكم الراكب" description="عرض رحلاتك الحالية وطلب رحلات جديدة." />

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
            <div className="h-[300px] w-full rounded-md overflow-hidden">
              <InteractiveMap markers={markers} />
            </div>
            <div className="flex gap-2 mt-4">
              {currentRide.driver_id && (
                <Button onClick={handleOpenChat} variant="outline" className="flex-1">
                  <MessageSquare className="h-4 w-4 ml-2 rtl:mr-2" />
                  محادثة مع السائق
                </Button>
              )}
              <Button onClick={() => handleCancelRide(currentRide)} variant="destructive" className="flex-1">
                <XCircle className="h-4 w-4 ml-2 rtl:mr-2" />
                إلغاء الرحلة
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <EmptyState
          icon={MapPin}
          title="لا توجد رحلات حالية"
          description="لا توجد رحلات قيد الانتظار أو مقبولة حاليًا. اطلب رحلة جديدة!"
        />
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mt-6">
        <Link to="/passenger-dashboard/request-ride">
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">طلب رحلة</CardTitle>
              <MapPin className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">اطلب</p>
              <p className="text-xs text-muted-foreground">رحلة جديدة الآن</p>
            </CardContent>
          </Card>
        </Link>
        <Link to="/passenger-dashboard/my-rides">
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">رحلاتي</CardTitle>
              <History className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">عرض</p>
              <p className="text-xs text-muted-foreground">سجل رحلاتك</p>
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

      {user && currentRide && currentRide.driver_id && (
        <ChatDialog
          open={isChatDialogOpen}
          onOpenChange={setIsChatDialogOpen}
          rideId={chatRideId}
          otherUserId={chatOtherUserId}
          otherUserName={chatOtherUserName}
          currentUserId={user.id}
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

export default PassengerDashboard;