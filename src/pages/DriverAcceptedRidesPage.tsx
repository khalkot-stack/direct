"use client";

import React, { useState, useEffect, useCallback } from "react";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, MessageSquare, XCircle, History as HistoryIcon, Trash2 } from "lucide-react";
import { toast } from "sonner";
import EmptyState from "@/components/EmptyState";
import ChatDialog from "@/components/ChatDialog";
import CancellationReasonDialog from "@/components/CancellationReasonDialog";
import { useUser } from "@/context/UserContext";
import { RealtimeChannel } from "@supabase/supabase-js";
import { Ride } from "@/types/supabase";
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
import supabaseService from "@/services/supabaseService"; // Import the new service
import { supabase } from "@/integrations/supabase/client"; // Keep for realtime channel

const DriverAcceptedRidesPage: React.FC = () => {
  const { user, loading: userLoading } = useUser();
  const [rides, setRides] = useState<Ride[]>([]);
  const [loadingRides, setLoadingRides] = useState(true);

  const [isChatDialogOpen, setIsChatDialogOpen] = useState(false);
  const [chatRideId, setChatRideId] = useState("");
  const [chatOtherUserId, setChatOtherUserId] = useState("");
  const [chatOtherUserName, setChatOtherUserName] = useState("");

  const [isCancellationDialogOpen, setIsCancellationDialogOpen] = useState(false);
  const [rideToCancel, setRideToCancel] = useState<Ride | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);

  const [isDeleting, setIsDeleting] = useState(false);
  const [rideToDelete, setRideToDelete] = useState<Ride | null>(null);

  const fetchAcceptedRides = useCallback(async (userId: string) => {
    setLoadingRides(true);
    try {
      const fetchedRides = await supabaseService.getDriverAcceptedRides(userId);
      setRides(fetchedRides);
    } catch (error: any) {
      toast.error(`فشل جلب الرحلات المقبولة: ${error.message}`);
      console.error("Error fetching accepted rides:", error);
      setRides([]);
    } finally {
      setLoadingRides(false);
    }
  }, []);

  useEffect(() => {
    let channel: RealtimeChannel | undefined;
    if (!userLoading && user) {
      fetchAcceptedRides(user.id);

      channel = supabase
        .channel('driver_accepted_rides_channel')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'rides',
            filter: `driver_id=eq.${user.id}`,
          },
          (payload) => {
            fetchAcceptedRides(user.id);
            if (payload.eventType === 'UPDATE' && payload.new.status === 'completed' && payload.old.status !== 'completed') {
              toast.success("تم إكمال الرحلة بنجاح!");
            }
          }
        )
        .subscribe();
    } else if (!userLoading && !user) {
      toast.error("الرجاء تسجيل الدخول لعرض الرحلات المقبولة.");
    }

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [userLoading, user, fetchAcceptedRides]);

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
        fetchAcceptedRides(user.id);
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

  const handleDeleteRide = async () => {
    if (!rideToDelete) return;

    setIsDeleting(true);
    try {
      await supabaseService.deleteRide(rideToDelete.id);
      toast.success("تم حذف الرحلة بنجاح!");
      if (user) {
        fetchAcceptedRides(user.id);
      }
    } catch (error: any) {
      toast.error(`فشل حذف الرحلة: ${error.message}`);
      console.error("Error deleting ride:", error);
    } finally {
      setIsDeleting(false);
      setRideToDelete(null);
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
      <PageHeader title="رحلاتي المقبولة" description="عرض وإدارة الرحلات التي قبلتها." backPath="/driver-dashboard" />

      {rides.length === 0 ? (
        <EmptyState
          icon={HistoryIcon}
          title="لا توجد رحلات مقبولة"
          description="لم تقبل أي رحلات بعد. ابدأ بالبحث عن ركاب!"
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
                  <span>{new Date(ride.created_at).toLocaleDateString('ar-SA', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                {ride.status === 'cancelled' && ride.cancellation_reason && (
                  <div className="text-sm text-red-500">
                    <span className="font-medium">سبب الإلغاء:</span> {ride.cancellation_reason}
                  </div>
                )}
                <div className="flex gap-2 mt-4">
                  <Button onClick={() => handleOpenChat(ride)} variant="outline" size="sm" className="flex-1">
                    <MessageSquare className="h-4 w-4 ml-2 rtl:mr-2" />
                    محادثة
                  </Button>
                  {ride.status === 'accepted' && (
                    <Button onClick={() => handleCancelRide(ride)} variant="destructive" size="sm" className="flex-1">
                      <XCircle className="h-4 w-4 ml-2 rtl:mr-2" />
                      إلغاء الرحلة
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

      <CancellationReasonDialog
        open={isCancellationDialogOpen}
        onOpenChange={setIsCancellationDialogOpen}
        onConfirm={confirmCancelRide}
        isSubmitting={isCancelling}
      />
    </div>
  );
};

export default DriverAcceptedRidesPage;