"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Car } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import PageHeader from "@/components/PageHeader"; // Import PageHeader
import EmptyState from "@/components/EmptyState"; // Import EmptyState

// Define an interface for the raw data returned by Supabase select with joins for MULTIPLE rows
interface SupabaseJoinedRideData {
  id: string;
  pickup_location: string;
  destination: string;
  passengers_count: number;
  status: "pending" | "accepted" | "completed" | "cancelled";
  passenger_id: string;
  driver_id: string | null;
  profiles_passenger: Array<{ full_name: string }> | null; // For multi-row queries, these are arrays of objects or null
}

interface AcceptedRide {
  id: string;
  pickup_location: string;
  destination: string;
  passengers_count: number;
  status: "pending" | "accepted" | "completed" | "cancelled";
  passenger_name?: string;
}

const DriverAcceptedRidesPage = () => {
  const navigate = useNavigate();
  const [acceptedRides, setAcceptedRides] = useState<AcceptedRide[]>([]);
  const [loading, setLoading] = useState(true);
  const [driverId, setDriverId] = useState<string | null>(null);

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
        profiles_passenger:passenger_id (full_name)
      `)
      .eq('driver_id', currentDriverId)
      .in('status', ['accepted', 'completed']) // Show accepted and completed rides
      .order('created_at', { ascending: false });

    if (error) {
      toast.error(`فشل جلب الرحلات المقبولة: ${error.message}`);
      console.error("Error fetching accepted rides:", error);
    } else {
      const formattedRides: AcceptedRide[] = data.map((ride: SupabaseJoinedRideData) => ({ // Cast to our defined interface
        id: ride.id,
        pickup_location: ride.pickup_location,
        destination: ride.destination,
        passengers_count: ride.passengers_count,
        status: ride.status,
        passenger_name: ride.profiles_passenger?.[0]?.full_name || 'غير معروف', // Access first element
      }));
      setAcceptedRides(formattedRides);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    const getDriverAndFetchRides = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setDriverId(user.id);
        fetchAcceptedRides(user.id);
      } else {
        toast.error("الرجاء تسجيل الدخول كسائق لعرض رحلاتك المقبولة.");
        navigate("/auth");
      }
    };
    getDriverAndFetchRides();
  }, [navigate, fetchAcceptedRides]);

  const handleCompleteRide = async (rideId: string) => {
    setLoading(true);
    const { error } = await supabase
      .from('rides')
      .update({ status: 'completed' })
      .eq('id', rideId)
      .eq('driver_id', driverId); // Ensure only the assigned driver can complete

    setLoading(false);
    if (error) {
      toast.error(`فشل إكمال الرحلة: ${error.message}`);
      console.error("Error completing ride:", error);
    } else {
      toast.success(`تم إكمال الرحلة رقم ${rideId.substring(0, 8)}... بنجاح.`);
      if (driverId) fetchAcceptedRides(driverId); // Refresh the list
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-950">
        <Loader2 className="h-8 w-8 animate-spin text-green-500" />
        <span className="sr-only">جاري تحميل الرحلات المقبولة...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-950 p-4">
      <Card className="w-full max-w-2xl bg-white dark:bg-gray-900 shadow-lg rounded-lg">
        <div className="p-6"> {/* Added padding to the div containing PageHeader */}
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
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/ride-details/${ride.id}`)}
                    className="text-blue-500 border-blue-500 hover:bg-blue-500 hover:text-white"
                  >
                    عرض التفاصيل
                  </Button>
                  {ride.status === 'accepted' && (
                    <Button
                      onClick={() => handleCompleteRide(ride.id)}
                      className="bg-green-500 hover:bg-green-600 text-white"
                      disabled={loading}
                    >
                      {loading ? "جاري الإكمال..." : "إكمال الرحلة"}
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
    </div>
  );
};

export default DriverAcceptedRidesPage;