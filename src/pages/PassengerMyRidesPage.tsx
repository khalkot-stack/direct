"use client";

import React, { useState, useEffect, useCallback } from "react";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, MessageSquare, Star, XCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import EmptyState from "@/components/EmptyState";
import { Badge } from "@/components/ui/badge";
import ChatDialog from "@/components/ChatDialog";
import RatingDialog from "@/components/RatingDialog";
import CancellationReasonDialog from "@/components/CancellationReasonDialog";

interface Ride {
  id: string;
  passenger_id: string;
  driver_id: string | null;
  pickup_location: string;
  destination: string;
  passengers_count: number;
  status: "pending" | "accepted" | "completed" | "cancelled";
  created_at: string;
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

interface Rating {
  id: string;
  ride_id: string;
  rater_id: string;
  rated_user_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
}

const PassengerMyRidesPage: React.FC = () => {
  const [rides, setRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

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

  const fetchMyRides = useCallback(async () => {
    setLoading(true);
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      toast.error("الرجاء تسجيل الدخول لعرض رحلاتك.");
      setLoading(false);
      return;
    }
    setCurrentUserId(user.id);

    const { data, error } = await supabase
      .from('rides')
      .select(`
        *,
        passenger_profiles:passenger_id(id, full_name, avatar_url),
        driver_profiles:driver_id(id, full_name, avatar_url)
      `)
      .eq('passenger_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      toast.error(`فشل جلب رحلاتي: ${error.message}`);
      console.error("Error fetching my rides:", error);
    } else {
      setRides(data as Ride[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchMyRides();

    const channel = supabase
      .channel('passenger_my_rides_channel')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'rides',
          filter: `passenger_id=eq.${currentUserId}`,
        },
        (payload) => {
          console.log('Change received in my rides!', payload);
          fetchMyRides(); // Re-fetch data on any ride change
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
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchMyRides, currentUserId]);

  const handleOpenChat = (ride: Ride) => {
    if (!currentUserId || !ride.driver_id || !ride.driver_profiles) {
      toast.error("لا يمكن بدء الدردشة. معلومات السائق أو الرحلة غير متوفرة.");
      return;
    }
    setChatRideId(ride.id);
    setChatOtherUserId(ride.driver_id);
    setChatOtherUserName(ride.driver_profiles.full_name || 'السائق');
    setIsChatDialogOpen(true);
  };

  const handleOpenRatingDialog = (ride: Ride) => {
    if (!currentUserId || !ride.driver_id || !ride.driver_profiles) {
      toast.error("لا يمكن تقييم السائق. معلومات السائق أو الرحلة غير متوفرة.");
      return;
    }
    setRideToRate(ride);
    setRatingTargetUser({ id: ride.driver_id, name: ride.driver_profiles.full_name || 'السائق' });
    setIsRatingDialogOpen(true);
  };

  const handleSaveRating = async (rating: number, comment: string) => {
    if (!currentUserId || !rideToRate || !ratingTargetUser) return;

    const { error } = await supabase.from('ratings').insert({
      ride_id: rideToRate.id,
      rater_id: currentUserId,
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
      fetchMyRides();
    }
  };

  const getStatusBadge = (status: "pending" | "accepted" | "completed" | "cancelled") => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary" className="bg-blue-500 hover:bg-blue-500/80">قيد الانتظار</Badge>;
      case "accepted":
        return <Badge variant="default" className="bg-green-500 hover:bg-green-500/80">مقبولة</Badge>;
      case "completed":
        return <Badge variant="default" className="bg-purple-500 hover:bg-purple-500/80">مكتملة</Badge>;
      case "cancelled":
        return <Badge variant="destructive">ملغاة</Badge>;
      default:
        return <Badge variant="outline">غير معروف</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-950">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="sr-only">جاري تحميل الرحلات...</span>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <PageHeader title="رحلاتي" description="عرض سجل رحلاتك وحالتها." backPath="/passenger-dashboard" />

      {rides.length === 0 ? (
        <EmptyState
          icon={History}
          title="لا توجد رحلات سابقة"
          description="لم تطلب أي رحلات بعد. ابدأ بطلب رحلة جديدة!"
        />
      ) : (
        <div className="grid gap-4">
          {rides.map((ride) => (
            <Card key={ride.id} className="shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>رحلة من {ride.pickup_location} إلى {ride.destination}</span>
                  {getStatusBadge(ride.status)}
                </CardTitle>
                <CardDescription>
                  السائق: {ride.driver_profiles?.full_name || 'لم يتم التعيين بعد'}
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
                {ride.status === 'cancelled' && ride.cancellation_reason && (
                  <div className="text-sm text-red-500">
                    <span className="font-medium">سبب الإلغاء:</span> {ride.cancellation_reason}
                  </div>
                )}
                <div className="flex gap-2 mt-4">
                  {ride.driver_id && (ride.status === 'accepted' || ride.status === 'completed') && (
                    <Button onClick={() => handleOpenChat(ride)} variant="outline" size="sm" className="flex-1">
                      <MessageSquare className="h-4 w-4 ml-2 rtl:mr-2" />
                      محادثة
                    </Button>
                  )}
                  {(ride.status === 'pending' || ride.status === 'accepted') && (
                    <Button onClick={() => handleCancelRide(ride)} variant="destructive" size="sm" className="flex-1">
                      <XCircle className="h-4 w-4 ml-2 rtl:mr-2" />
                      إلغاء الرحلة
                    </Button>
                  )}
                  {ride.status === 'completed' && ride.driver_id && (
                    <Button onClick={() => handleOpenRatingDialog(ride)} variant="secondary" size="sm" className="flex-1">
                      <Star className="h-4 w-4 ml-2 rtl:mr-2" />
                      تقييم السائق
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {currentUserId && (
        <ChatDialog
          open={isChatDialogOpen}
          onOpenChange={setIsChatDialogOpen}
          rideId={chatRideId}
          otherUserId={chatOtherUserId}
          otherUserName={chatOtherUserName}
          currentUserId={currentUserId}
        />
      )}

      {currentUserId && rideToRate && ratingTargetUser && (
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

export default PassengerMyRidesPage;