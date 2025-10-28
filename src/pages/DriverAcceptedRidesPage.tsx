"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Car, Phone, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import PageHeader from "@/components/PageHeader";
import EmptyState from "@/components/EmptyState";
import ChatDialog from "@/components/ChatDialog"; // Import ChatDialog

// Define an interface for the raw data returned by Supabase select with joins for MULTIPLE rows
interface SupabaseJoinedRideData {
  id: string;
  pickup_location: string;
  destination: string;
  passengers_count: number;
  status: "pending" | "accepted" | "completed" | "cancelled";
  passenger_id: string;
  driver_id: string | null;
  profiles_passenger: Array<{ full_name: string; phone_number?: string }> | null;
}

interface AcceptedRide {
  id: string;
  pickup_location: string;
  destination: string;
  passengers_count: number;
  status: "pending" | "accepted" | "completed" | "cancelled";
  passenger_id: string; // Added passenger_id for chat
  passenger_name?: string;
  passenger_phone?: string;
}

const DriverAcceptedRidesPage = () => {
  const navigate = useNavigate();
  const [acceptedRides, setAcceptedRides] = useState<AcceptedRide[]>([]);
  const [loading, setLoading] = useState(true);
  const [driverId, setDriverId] = useState<string | null>(null);
  const [isChatDialogOpen, setIsChatDialogOpen] = useState(false); // New state for chat dialog
  const [chatTarget, setChatTarget] = useState<{ rideId: string; otherUserId: string; otherUserName: string } | null>(null);
  const [completingRideId, setCompletingRideId] = useState<string | null>(null); // New state for completing ride

  // useCallback for fetchAcceptedRides to ensure it's stable and doesn't cause infinite loops
  const fetchAcceptedRides = useCallback(async (currentDriverId: string) => {
    setLoading(true);
    const { data, error } = await supabase
      .from('rides')
      .select(`
        id,
        pickup_location,
        destination,
        passengers_count,
        status,
        passenger_id,
        driver_id,
        profiles_passenger:passenger_id (full_name, phone_number)
      `)
      .eq('driver_id', currentDriverId)
      .in('status', ['accepted', 'completed'])
      .order('created_at', { ascending: false });

    if (error) {
      toast.error(`فشل جلب الرحلات المقبولة: ${error.message}`);
      console.error("Error fetching accepted rides:", error);
    } else {
      const formattedRides: AcceptedRide[] = data.map((ride: SupabaseJoinedRideData) => ({
        id: ride.id,
        pickup_location: ride.pickup_location,
        destination: ride.destination,
        passengers_count: ride.passengers_count,
        status: ride.status,
        passenger_id: ride.passenger_id,
        passenger_name: ride.profiles_passenger?.[0]?.full_name || 'غير معروف',
        passenger_phone: ride.profiles_passenger?.[0]?.phone_number || 'غير متاح',
      }));
      setAcceptedRides(formattedRides);
    }
    setLoading(false);
  }, []);

  // Effect 1: Get driverId once on component mount
  useEffect(() => {
    const getDriver = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setDriverId(user.id);
      } else {
        toast.error("الرجاء تسجيل الدخول كسائق لعرض رحلاتك المقبولة.");
        navigate("/auth");
        setLoading(false); // If not logged in, stop loading here
      }
    };
    getDriver();
  }, [navigate]);

  // Effect 2: Fetch rides and subscribe to Realtime changes once driverId is available
  useEffect(() => {
    if (!driverId) {
      return; // Skip if driverId is not yet set
    }

    fetchAcceptedRides(driverId); // Initial fetch when driverId is set

    const channel = supabase
      .channel(`driver_rides_${driverId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE', // Listen for any updates
          schema: 'public',
          table: 'rides',
          filter: `driver_id=eq.${driverId}` // Filter by driver_id
        },
        (payload) => {
          // Re-fetch all accepted rides if any relevant update occurs
          if (payload.new.status === 'accepted' || payload.new.status === 'completed' || payload.new.status === 'cancelled') {
            toast.info(`تم تحديث حالة الرحلة: ${payload.new.pickup_location} إلى ${payload.new.destination} إلى ${payload.new.status}`);
            fetchAcceptedRides(driverId); // Re-fetch with the stable driverId
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [driverId, fetchAcceptedRides]); // Dependencies: driverId and the stable fetch function

  const handleCompleteRide = async (rideId: string) => {
    setCompletingRideId(rideId); // Set the ID of the ride being completed
    const { error } = await supabase
      .from('rides')
      .update({ status: 'completed' })
      .eq('id', rideId)
      .eq('driver_id', driverId);

    setCompletingRideId(null); // Clear the completing state
    if (error) {
      toast.error(`فشل إكمال الرحلة: ${error.message}`);
      console.error("Error completing ride:", error);
    } else {
      toast.success(`تم إكمال الرحلة رقم ${rideId.substring(0, 8)}... بنجاح.`);
      // The Realtime listener should pick this up and trigger a re-fetch
    }
  };

  const handleCall = (phoneNumber: string | undefined) => {
    if (phoneNumber && phoneNumber !== 'غير متاح') {
      window.location.href = `tel:${phoneNumber}`;
    } else {
      toast.info("رقم الهاتف غير متاح.");
    }
  };

  const handleMessage = (ride: AcceptedRide) => {
    if (!driverId) {
      toast.error("خطأ: معرف السائق غير موجود.");
      return;
    }
    setChatTarget({
      rideId: ride.id,
      otherUserId: ride.passenger_id,
      otherUserName: ride.passenger_name || 'الراكب',
    });
    setIsChatDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-950">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="sr-only">جاري تحميل الرحلات المقبولة...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-950 p-4">
      <Card className="w-full max-w-2xl bg-white dark:bg-gray-900 shadow-lg rounded-lg">
        <div className="p-6">
          <PageHeader
            title="رحلاتي المقبولة"
            description="عرض الرحلات التي قبلتها أو أكملتها"
            backPath="/driver-dashboard"
          />
        </div>
        <CardContent className="space-y-4">
          {acceptedRides.length > 0 ? (
            acceptedRides.map((ride) => (
              <div key={ride.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border rounded-md dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                <div className="text-right sm:text-left mb-2 sm:mb-0">
                  <p className="text-lg font-medium text-gray-900 dark:text-white">
                    من: {ride.pickup_location} إلى: {ride.destination}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    عدد الركاب: {ride.passengers_count} | الحالة: {ride.status === 'accepted' ? 'مقبولة' : 'مكتملة'} | الراكب: {ride.passenger_name}
                  </p>
                  {ride.status === 'accepted' && ride.passenger_phone && ride.passenger_phone !== 'غير متاح' && (
                    <div className="flex flex-wrap items-center gap-2 mt-2"> {/* Added flex-wrap for small screens */}
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        هاتف الراكب: {ride.passenger_phone}
                      </p>
                      <Button variant="outline" size="sm" onClick={() => handleCall(ride.passenger_phone)} className="flex items-center gap-1 text-primary border-primary hover:bg-primary hover:text-primary-foreground transition-transform duration-200 ease-in-out hover:scale-[1.01]">
                        <Phone className="h-4 w-4" />
                        اتصال
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleMessage(ride)} className="flex items-center gap-1 text-primary border-primary hover:bg-primary hover:text-primary-foreground transition-transform duration-200 ease-in-out hover:scale-[1.01]">
                        <MessageSquare className="h-4 w-4" />
                        رسالة
                      </Button>
                    </div>
                  )}
                </div>
                <div className="flex gap-2 mt-2 sm:mt-0"> {/* Added margin-top for small screens */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/ride-details/${ride.id}`)}
                    className="text-primary border-primary hover:bg-primary hover:text-primary-foreground transition-transform duration-200 ease-in-out hover:scale-[1.01]"
                  >
                    عرض التفاصيل
                  </Button>
                  {ride.status === 'accepted' && (
                    <Button
                      onClick={() => handleCompleteRide(ride.id)}
                      className="bg-primary hover:bg-primary-dark text-primary-foreground transition-transform duration-200 ease-in-out hover:scale-[1.01]"
                      disabled={completingRideId === ride.id} // Disable button for the specific ride being completed
                    >
                      {completingRideId === ride.id ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin ml-2 rtl:mr-2" />
                          جاري الإكمال...
                        </>
                      ) : (
                        "إكمال الرحلة"
                      )}
                    </Button>
                  )}
                </div>
              </div>
            ))
          ) : (
            <EmptyState
              icon={Car}
              title="لم تقبل أي رحلات بعد"
              description="ابحث عن رحلات جديدة واقبلها لتظهر هنا."
            />
          )}
        </CardContent>
      </Card>
      {chatTarget && driverId && (
        <ChatDialog
          open={isChatDialogOpen}
          onOpenChange={setIsChatDialogOpen}
          rideId={chatTarget.rideId}
          otherUserId={chatTarget.otherUserId}
          otherUserName={chatTarget.otherUserName}
          currentUserId={driverId}
        />
      )}
    </div>
  );
};

export default DriverAcceptedRidesPage;