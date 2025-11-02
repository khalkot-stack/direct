"use client";

import React, { useState, useEffect, useCallback } from "react";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, MessageSquare, Star, XCircle, History as HistoryIcon, Trash2, Flag } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import EmptyState from "@/components/EmptyState";
import ChatDialog from "@/components/ChatDialog";
import RatingDialog from "@/components/RatingDialog";
import CancellationReasonDialog from "@/components/CancellationReasonDialog";
import ComplaintFormDialog from "@/components/ComplaintFormDialog"; // Keep for submitting new complaints
import ComplaintChatDialog from "@/components/ComplaintChatDialog"; // Import the new ComplaintChatDialog
import { useUser } from "@/context/UserContext";
import { Ride, Rating, RawRideData } from "@/types/supabase";
import { useSupabaseRealtime } from "@/hooks/useSupabaseRealtime";
import RideStatusBadge from "@/components/RideStatusBadge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const PassengerMyRidesPage: React.FC = () => {
  const { user, loading: userLoading } = useUser();
  const [rides, setRides] = useState<Ride[]>([]);
  const [loadingRides, setLoadingRides] = useState(true);

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

  const [isDeleting, setIsDeleting] = useState(false);
  const [rideToDelete, setRideToDelete] = useState<Ride | null>(null);

  const [isComplaintFormDialogOpen, setIsComplaintFormDialogOpen] = useState(false); // State for submitting NEW complaint
  const [complaintDriverId, setComplaintDriverId] = useState("");
  const [complaintRideId, setComplaintRideId] = useState<string | undefined>(undefined);
  const [complaintDriverName, setComplaintDriverName] = useState("");

  const [isComplaintChatDialogOpen, setIsComplaintChatDialogOpen] = useState(false); // New state for viewing complaint chat
  const [viewComplaintChatId, setViewComplaintChatId] = useState(""); // New state for the complaint ID to view chat

  const fetchMyRides = useCallback(async (userId: string) => {
    console.log("PassengerMyRidesPage: Fetching rides for userId:", userId);
    setLoadingRides(true);
    const { data: ridesRaw, error } = await supabase
      .from('rides')
      .select(`
        *,
        passenger_profiles:passenger_id(id, full_name, avatar_url, user_type),
        driver_profiles:driver_id(id, full_name, avatar_url, user_type)
      `)
      .eq('passenger_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error("PassengerMyRidesPage: Error fetching rides:", error);
      toast.error(`فشل جلب رحلاتي: ${error.message}`);
      setRides([]); // Ensure rides are cleared on error
    } else {
      console.log("PassengerMyRidesPage: Rides fetched successfully:", ridesRaw);
      const formattedRides: Ride[] = (ridesRaw as RawRideData[] || []).map(ride => {
        const passengerProfile = Array.isArray(ride.passenger_profiles)
          ? ride.passenger_profiles[0] || null
          : ride.passenger_profiles;
        
        const driverProfile = Array.isArray(ride.driver_profiles)
          ? ride.driver_profiles[0] || null
          : ride.driver_profiles;

        return {
          ...ride,
          passenger_profiles: passengerProfile,
          driver_profiles: driverProfile,
        };
      }) as Ride[];
      setRides(formattedRides);
    }
    setLoadingRides(false);
    console.log("PassengerMyRidesPage: Loading rides complete.");
  }, []);

  useEffect(() => {
    console.log("PassengerMyRidesPage: useEffect triggered. userLoading:", userLoading, "user:", user?.id);
    if (!userLoading && user) {
      fetchMyRides(user.id);
    } else if (!userLoading && !user) {
      console.log("PassengerMyRidesPage: User not logged in, redirecting or showing error.");
      toast.error("الرجاء تسجيل الدخول لعرض رحلاتك.");
      // Optionally navigate to auth page if not already handled by ProtectedRoute
    }
  }, [userLoading, user, fetchMyRides]);

  useSupabaseRealtime(
    'passenger_my_rides_channel',
    {
      event: '*',
      schema: 'public',
      table: 'rides',
      filter: `passenger_id=eq.${user?.id}`,
    },
    (payload) => {
      console.log("PassengerMyRidesPage: Realtime update received:", payload);
      if (user) {
        fetchMyRides(user.id);
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
    },
    !!user
  );

  const handleOpenChat = (ride: Ride) => {
    if (!user || !ride.driver_id || !ride.driver_profiles) {
      toast.error("لا يمكن بدء الدردشة. معلومات السائق أو الرحلة غير متوفرة.");
      return;
    }
    setChatRideId(ride.id);
    setChatOtherUserId(ride.driver_id);
    setChatOtherUserName(ride.driver_profiles.full_name || 'السائق');
    setIsChatDialogOpen(true);
  };

  const handleOpenRatingDialog = (ride: Ride) => {
    if (!user || !ride.driver_id || !ride.driver_profiles) {
      toast.error("لا يمكن تقييم السائق. معلومات السائق أو الرحلة غير متوفرة.");
      return;
    }
    setRideToRate(ride);
    setRatingTargetUser({ id: ride.driver_id, name: ride.driver_profiles.full_name || 'السائق' });
    setIsRatingDialogOpen(true);
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
        fetchMyRides(user.id);
      }
    }
  };

  const handleDeleteRide = async () => {
    if (!rideToDelete) return;

    setIsDeleting(true);
    const { error } = await supabase
      .from('rides')
      .delete()
      .eq('id', rideToDelete.id);
    setIsDeleting(false);
    setRideToDelete(null);

    if (error) {
      toast.error(`فشل حذف الرحلة: ${error.message}`);
      console.error("Error deleting ride:", error);
    } else {
      toast.success("تم حذف الرحلة بنجاح!");
      if (user) {
        fetchMyRides(user.id);
      }
    }
  };

  const handleOpenComplaintFormDialog = (ride: Ride) => {
    if (!ride.driver_id || !ride.driver_profiles) {
      toast.error("لا يمكن تقديم شكوى. معلومات السائق غير متوفرة.");
      return;
    }
    setComplaintDriverId(ride.driver_id);
    setComplaintRideId(ride.id);
    setComplaintDriverName(ride.driver_profiles.full_name || 'السائق');
    setIsComplaintFormDialogOpen(true);
  };

  const handleOpenComplaintChat = async (ride: Ride) => {
    if (!user?.id) {
      toast.error("الرجاء تسجيل الدخول لعرض محادثة الشكوى.");
      return;
    }
    if (!ride.driver_id) {
      toast.error("لا يمكن عرض محادثة الشكوى. لا يوجد سائق لهذه الرحلة.");
      return;
    }

    // Check if a complaint already exists for this ride and passenger
    const { data: existingComplaints, error } = await supabase
      .from('complaints')
      .select('id')
      .eq('passenger_id', user.id)
      .eq('driver_id', ride.driver_id)
      .eq('ride_id', ride.id)
      .limit(1);

    if (error) {
      toast.error(`فشل جلب الشكوى: ${error.message}`);
      console.error("Error fetching existing complaint:", error);
      return;
    }

    // Check if any complaint was returned
    if (existingComplaints && existingComplaints.length > 0) {
      setViewComplaintChatId(existingComplaints[0].id); // Use the ID of the first complaint found
      setIsComplaintChatDialogOpen(true);
    } else {
      toast.info("لا توجد شكوى سابقة لهذه الرحلة. يمكنك تقديم شكوى جديدة.");
      handleOpenComplaintFormDialog(ride); // Offer to create a new complaint
    }
  };

  if (userLoading || loadingRides) {
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
          icon={HistoryIcon}
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
                  <RideStatusBadge status={ride.status} />
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
                  <span>{new Date(ride.created_at).toLocaleDateString('ar-SA', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
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
                  {(ride.status === 'completed' || ride.status === 'cancelled') && ride.driver_id && (
                    <Button onClick={() => handleOpenComplaintChat(ride)} variant="outline" size="sm" className="flex-1 text-red-500 border-red-500 hover:bg-red-50 hover:text-red-600">
                      <Flag className="h-4 w-4 ml-2 rtl:mr-2" />
                      شكوى
                    </Button>
                  )}
                  {(ride.status === 'cancelled' || ride.status === 'completed') && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-500 hover:bg-red-100 dark:hover:bg-red-900/20 flex-1"
                          onClick={() => setRideToDelete(ride)}
                        >
                          <Trash2 className="h-4 w-4 ml-2 rtl:mr-2" />
                          حذف
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>هل أنت متأكد تمامًا؟</AlertDialogTitle>
                          <AlertDialogDescription>
                            سيؤدي هذا الإجراء إلى حذف الرحلة من {ride.pickup_location} إلى {ride.destination} بشكل دائم. لا يمكن التراجع عن هذا الإجراء.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel onClick={() => setRideToDelete(null)}>إلغاء</AlertDialogCancel>
                          <AlertDialogAction onClick={handleDeleteRide} disabled={isDeleting}>
                            {isDeleting ? (
                              <>
                                <Loader2 className="h-4 w-4 animate-spin ml-2 rtl:mr-2" />
                                جاري الحذف...
                              </>
                            ) : (
                              "حذف"
                            )}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {user && (
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

      {user && complaintDriverId && (
        <ComplaintFormDialog
          open={isComplaintFormDialogOpen}
          onOpenChange={setIsComplaintFormDialogOpen}
          driverId={complaintDriverId}
          rideId={complaintRideId}
          driverName={complaintDriverName}
          onComplaintSubmitted={() => { /* Optional: handle post-submission logic, e.g., refresh ride list */ }}
        />
      )}

      {user && (
        <ComplaintChatDialog
          open={isComplaintChatDialogOpen}
          onOpenChange={setIsComplaintChatDialogOpen}
          complaintId={viewComplaintChatId}
        />
      )}
    </div>
  );
};

export default PassengerMyRidesPage;