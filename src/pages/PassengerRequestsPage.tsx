"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

// Define an interface for the raw data returned by Supabase select with joins for MULTIPLE rows
interface SupabaseJoinedRideData {
  id: string;
  pickup_location: string;
  destination: string;
  passengers_count: number;
  status: "pending" | "accepted" | "completed" | "cancelled";
  driver_id: string | null;
  profiles_driver: Array<{ full_name: string }> | null; // For multi-row queries, these are arrays of objects or null
}

interface RideRequest {
  id: string;
  pickup_location: string;
  destination: string;
  passengers_count: number;
  status: "pending" | "accepted" | "completed" | "cancelled";
  driver_name?: string;
}

const PassengerRequestsPage = () => {
  const navigate = useNavigate();
  const [passengerRequests, setPassengerRequests] = useState<RideRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  const fetchPassengerRides = useCallback(async (currentUserId: string) => {
    setLoading(true);
    const { data, error } = await supabase
      .from('rides')
      .select(`
        id,
        pickup_location,
        destination,
        passengers_count,
        status,
        driver_id,
        profiles_driver:driver_id (full_name)
      `)
      .eq('passenger_id', currentUserId)
      .order('created_at', { ascending: false });

    if (error) {
      toast.error(`فشل جلب طلبات الرحلات: ${error.message}`);
      console.error("Error fetching passenger rides:", error);
    } else {
      const formattedRequests: RideRequest[] = data.map((ride: SupabaseJoinedRideData) => ({ // Cast to our defined interface
        id: ride.id,
        pickup_location: ride.pickup_location,
        destination: ride.destination,
        passengers_count: ride.passengers_count,
        status: ride.status,
        driver_name: ride.profiles_driver?.[0]?.full_name || 'لا يوجد', // Access first element
      }));
      setPassengerRequests(formattedRequests);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    const getUserAndFetchRides = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        fetchPassengerRides(user.id);
      } else {
        toast.error("الرجاء تسجيل الدخول لعرض طلباتك.");
        navigate("/auth");
      }
    };
    getUserAndFetchRides();
  }, [navigate, fetchPassengerRides]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-950">
        <Loader2 className="h-8 w-8 animate-spin text-green-500" />
        <span className="sr-only">جاري تحميل طلبات الرحلات...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-950 p-4">
      <Card className="w-full max-w-2xl bg-white dark:bg-gray-900 shadow-lg rounded-lg">
        <CardHeader className="text-center">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/passenger-dashboard")}
            className="absolute top-4 right-4 rtl:left-4 rtl:right-auto"
          >
            <ChevronLeft className="h-6 w-6" />
            <span className="sr-only">العودة</span>
          </Button>
          <CardTitle className="text-3xl font-bold text-gray-900 dark:text-white">
            طلبات رحلاتي
          </CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-400">
            عرض حالة طلبات رحلاتك
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {passengerRequests.length > 0 ? (
            passengerRequests.map((request) => (
              <div key={request.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border rounded-md dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                <div className="text-right sm:text-left mb-2 sm:mb-0">
                  <p className="text-lg font-medium text-gray-900 dark:text-white">
                    من: {request.pickup_location} إلى: {request.destination}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    عدد الركاب: {request.passengers_count} | الحالة: {request.status === 'pending' ? 'قيد الانتظار' : request.status === 'accepted' ? 'مقبولة' : request.status === 'completed' ? 'مكتملة' : 'ملغاة'}
                  </p>
                  {request.driver_name !== "لا يوجد" && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      السائق: {request.driver_name}
                    </p>
                  )}
                </div>
                <Button
                  variant="outline"
                  className="text-blue-500 border-blue-500 hover:bg-blue-500 hover:text-white text-sm px-4 py-2 rounded-lg shadow-md"
                  onClick={() => navigate(`/ride-details/${request.id}`)}
                >
                  عرض التفاصيل
                </Button>
              </div>
            ))
          ) : (
            <p className="text-center text-gray-600 dark:text-gray-400">لم تقم بطلب أي رحلات بعد.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PassengerRequestsPage;