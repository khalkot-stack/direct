"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Car } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import PageHeader from "@/components/PageHeader";
import EmptyState from "@/components/EmptyState";
// import InteractiveMap from "@/components/InteractiveMap"; // Removed InteractiveMap import

// Define an interface for the raw data returned by Supabase select with joins for MULTIPLE rows
interface SupabaseJoinedRideData {
  id: string;
  pickup_location: string;
  pickup_lat: number; // Added latitude
  pickup_lng: number; // Added longitude
  destination: string;
  passengers_count: number;
  status: "pending" | "accepted" | "completed" | "cancelled";
  passenger_id: string;
  driver_id: string | null;
  profiles_passenger: Array<{ full_name: string }> | null; // For multi-row queries, these are arrays of objects or null
  created_at: string; // Added created_at for sorting and display
}

interface RideRequest {
  id: string;
  pickup_location: string;
  pickup_lat: number;
  pickup_lng: number;
  destination: string;
  passengers_count: number;
  time: string; // This will be derived from created_at or a specific time field
  passenger_name?: string;
  status: "pending" | "accepted" | "completed" | "cancelled"; // Include status for filtering
}

const FindRidesPage = () => {
  const navigate = useNavigate();
  const [rideRequests, setRideRequests] = useState<RideRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [driverId, setDriverId] = useState<string | null>(null);

  const formatRideData = (ride: SupabaseJoinedRideData): RideRequest => ({
    id: ride.id,
    pickup_location: ride.pickup_location,
    pickup_lat: ride.pickup_lat,
    pickup_lng: ride.pickup_lng,
    destination: ride.destination,
    passengers_count: ride.passengers_count,
    time: new Date(ride.created_at).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' }),
    passenger_name: ride.profiles_passenger?.[0]?.full_name || 'غير معروف',
    status: ride.status,
  });

  const fetchPendingRides = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error("الرجاء تسجيل الدخول كسائق لعرض الرحلات.");
      navigate("/auth");
      setLoading(false);
      return;
    }
    setDriverId(user.id);

    const { data, error } = await supabase
      .from('rides')
      .select(`
        id,
        pickup_location,
        pickup_lat,
        pickup_lng,
        destination,
        passengers_count,
        status,
        passenger_id,
        driver_id,
        profiles_passenger:passenger_id (full_name),
        created_at
      `)
      .eq('status', 'pending')
      .order('created_at', { ascending: true });

    if (error) {
      toast.error(`فشل جلب الرحلات المتاحة: ${error.message}`);
      console.error("Error fetching pending rides:", error);
    } else {
      setRideRequests(data.map(formatRideData));
    }
    setLoading(false);
  }, [navigate]);

  useEffect(() => {
    fetchPendingRides();

    const channel = supabase
      .channel('pending_rides_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'rides' },
        (payload) => {
          if (payload.eventType === 'INSERT' && payload.new.status === 'pending') {
            // Fetch the full ride data including passenger name
            supabase
              .from('rides')
              .select(`
                id,
                pickup_location,
                pickup_lat,
                pickup_lng,
                destination,
                passengers_count,
                status,
                passenger_id,
                driver_id,
                profiles_passenger:passenger_id (full_name),
                created_at
              `)
              .eq('id', payload.new.id)
              .single()
              .then(({ data, error }) => {
                if (error) {
                  console.error("Error fetching new ride for realtime:", error);
                } else if (data) {
                  setRideRequests((prev) => {
                    const newRide = formatRideData(data as SupabaseJoinedRideData);
                    // Ensure no duplicates and add new ride
                    if (!prev.some(ride => ride.id === newRide.id)) {
                      toast.info(`رحلة جديدة متاحة: من ${newRide.pickup_location} إلى ${newRide.destination}`);
                      return [...prev, newRide].sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());
                    }
                    return prev;
                  });
                }
              });
          } else if (payload.eventType === 'UPDATE' || payload.eventType === 'DELETE') {
            setRideRequests((prev) => prev.filter((ride) => ride.id !== payload.old.id));
            if (payload.eventType === 'UPDATE' && payload.new.status === 'accepted' && payload.new.driver_id !== driverId) {
                toast.warning(`تم قبول الرحلة من ${payload.old.pickup_location} إلى ${payload.old.destination} بواسطة سائق آخر.`);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchPendingRides, driverId]); // Include driverId in dependencies for the realtime filter

  const handleAcceptRide = async (rideId: string) => {
    if (!driverId) {
      toast.error("خطأ: لم يتم العثور على معرف السائق.");
      return;
    }
    setLoading(true);
    const { error } = await supabase
      .from('rides')
      .update({ driver_id: driverId, status: 'accepted' })
      .eq('id', rideId)
      .eq('status', 'pending'); // Ensure only pending rides can be accepted
    setLoading(false);

    if (error) {
      toast.error(`فشل قبول الرحلة: ${error.message}`);
      console.error("Error accepting ride:", error);
    } else {
      toast.success(`تم قبول الرحلة رقم ${rideId.substring(0, 8)}...`);
      // Realtime subscription will handle removing this ride from the list
      navigate("/driver-dashboard/accepted-rides"); // Redirect to accepted rides page
    }
  };

  // const mapMarkers = rideRequests.map(ride => ({
  //   id: ride.id,
  //   lat: ride.pickup_lat,
  //   lng: ride.pickup_lng,
  //   title: `رحلة من: ${ride.pickup_location}`,
  //   description: `إلى: ${ride.destination} (${ride.passengers_count} ركاب)`,
  //   iconColor: "hsl(var(--primary))", // Green for pending rides
  // }));

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-950">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="sr-only">جاري تحميل الرحلات المتاحة...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-950 p-4">
      <Card className="w-full max-w-2xl bg-white dark:bg-gray-900 shadow-lg rounded-lg">
        <div className="p-6">
          <PageHeader
            title="البحث عن ركاب"
            description="الرحلات المتاحة حالياً"
            backPath="/driver-dashboard"
          />
        </div>
        <CardContent className="space-y-4">
          {/* Removed InteractiveMap component */}
          {/* <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2 text-right">الرحلات على الخريطة</h3>
          <InteractiveMap markers={mapMarkers} onMarkerClick={(marker) => toast.info(marker.title)} /> */}

          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2 text-right mt-6">قائمة الرحلات</h3>
          {rideRequests.length > 0 ? (
            rideRequests.map((ride) => (
              <div key={ride.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border rounded-md dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                <div className="text-right sm:text-left mb-2 sm:mb-0">
                  <p className="text-lg font-medium text-gray-900 dark:text-white">
                    من: {ride.pickup_location} إلى: {ride.destination}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    عدد الركاب: {ride.passengers_count} | الوقت: {ride.time} | الراكب: {ride.passenger_name}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/ride-details/${ride.id}`)}
                    className="text-primary border-primary hover:bg-primary hover:text-primary-foreground transition-transform duration-200 ease-in-out hover:scale-[1.01]"
                  >
                    عرض التفاصيل
                  </Button>
                  <Button
                    onClick={() => handleAcceptRide(ride.id)}
                    className="bg-primary hover:bg-primary-dark text-primary-foreground transition-transform duration-200 ease-in-out hover:scale-[1.01]"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin ml-2 rtl:mr-2" />
                        جاري القبول...
                      </>
                    ) : (
                        "قبول الرحلة"
                      )}
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <EmptyState
              icon={Car}
              title="لا توجد رحلات متاحة حالياً"
              description="تحقق مرة أخرى لاحقًا أو قم بتعديل تفضيلاتك."
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default FindRidesPage;