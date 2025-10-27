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

interface RideRequest {
  id: string;
  pickup_location: string;
  destination: string;
  passengers_count: number;
  time: string; // This will be derived from created_at or a specific time field
  passenger_name?: string;
}

const FindRidesPage = () => {
  const navigate = useNavigate();
  const [rideRequests, setRideRequests] = useState<RideRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [driverId, setDriverId] = useState<string | null>(null);

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
        destination,
        passengers_count,
        status,
        profiles_passenger:passenger_id (full_name)
      `)
      .eq('status', 'pending')
      .order('created_at', { ascending: true });

    if (error) {
      toast.error(`فشل جلب الرحلات المتاحة: ${error.message}`);
      console.error("Error fetching pending rides:", error);
    } else {
      const formattedRequests: RideRequest[] = data.map((ride: SupabaseJoinedRideData) => ({ // Cast to our defined interface
        id: ride.id,
        pickup_location: ride.pickup_location,
        destination: ride.destination,
        passengers_count: ride.passengers_count,
        time: "الآن", // Placeholder, could be calculated from created_at
        passenger_name: ride.profiles_passenger?.[0]?.full_name || 'غير معروف', // Access first element
      }));
      setRideRequests(formattedRequests);
    }
    setLoading(false);
  }, [navigate]);

  useEffect(() => {
    fetchPendingRides();
  }, [fetchPendingRides]);

  const handleAcceptRide = async (rideId: string) => {
    if (!driverId) {
      toast.error("خطأ: لم يتم العثور على معرف السائق.");
      return;
    }
    setLoading(true);
    const { error } = await supabase
      .from('rides')
      .update({ driver_id: driverId, status: 'accepted' })
      .eq('id', rideId);
    setLoading(false);

    if (error) {
      toast.error(`فشل قبول الرحلة: ${error.message}`);
      console.error("Error accepting ride:", error);
    } else {
      toast.success(`تم قبول الرحلة رقم ${rideId.substring(0, 8)}...`);
      fetchPendingRides(); // Refresh the list of pending rides
      navigate("/driver-dashboard/accepted-rides"); // Redirect to accepted rides page
    }
  };

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