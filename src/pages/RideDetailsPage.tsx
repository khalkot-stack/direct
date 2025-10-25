"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, MapPin, User, Car, Info, Loader2, Users } from "lucide-react"; // Added Users and Loader2
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

// Define an interface for the raw data returned by Supabase select with joins for a SINGLE row
interface SupabaseJoinedRideData {
  id: string;
  pickup_location: string;
  destination: string;
  passengers_count: number;
  status: "pending" | "accepted" | "completed" | "cancelled";
  passenger_id: string;
  driver_id: string | null;
  // For .single() query, these should be objects or null, not arrays
  profiles_passenger: { full_name: string } | null;
  profiles_driver: { full_name: string } | null;
}

interface Ride {
  id: string;
  passenger_id: string;
  driver_id: string | null;
  passenger_name?: string;
  driver_name?: string;
  pickup_location: string;
  destination: string;
  passengers_count: number;
  status: "pending" | "accepted" | "completed" | "cancelled";
}

const RideDetailsPage = () => {
  const { rideId } = useParams<{ rideId: string }>();
  const navigate = useNavigate();
  const [ride, setRide] = useState<Ride | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchRideDetails = useCallback(async () => {
    if (!rideId) {
      setLoading(false);
      return;
    }

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
        profiles_passenger:passenger_id (full_name),
        profiles_driver:driver_id (full_name)
      `)
      .eq('id', rideId)
      .single();

    if (error) {
      toast.error(`فشل جلب تفاصيل الرحلة: ${error.message}`);
      console.error("Error fetching ride details:", error);
      setRide(null);
    } else {
      const typedData = data as SupabaseJoinedRideData; // Cast to our defined interface
      setRide({
        id: typedData.id,
        passenger_id: typedData.passenger_id,
        driver_id: typedData.driver_id,
        // Access full_name directly on the object, as .single() returns an object
        passenger_name: typedData.profiles_passenger?.full_name || 'غير معروف',
        driver_name: typedData.profiles_driver?.full_name || 'لا يوجد',
        pickup_location: typedData.pickup_location,
        destination: typedData.destination,
        passengers_count: typedData.passengers_count,
        status: typedData.status,
      });
    }
    setLoading(false);
  }, [rideId]);

  useEffect(() => {
    fetchRideDetails();
  }, [fetchRideDetails]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-950">
        <Loader2 className="h-8 w-8 animate-spin text-green-500" />
        <span className="sr-only">جاري تحميل تفاصيل الرحلة...</span>
      </div>
    );
  }

  if (!ride) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-950 p-4">
        <Card className="w-full max-w-md bg-white dark:bg-gray-900 shadow-lg rounded-lg text-center">
          <CardHeader>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              className="absolute top-4 right-4 rtl:left-4 rtl:right-auto"
            >
              <ChevronLeft className="h-6 w-6" />
              <span className="sr-only">العودة</span>
            </Button>
            <CardTitle className="text-3xl font-bold text-gray-900 dark:text-white">
              الرحلة غير موجودة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 dark:text-gray-400">
              عذرًا، لم نتمكن من العثور على تفاصيل الرحلة المطلوبة.
            </p>
            <Button onClick={() => navigate(-1)} className="mt-6 bg-blue-500 hover:bg-blue-600 text-white">
              العودة
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-950 p-4">
      <Card className="w-full max-w-md bg-white dark:bg-gray-900 shadow-lg rounded-lg">
        <CardHeader className="text-center">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="absolute top-4 right-4 rtl:left-4 rtl:right-auto"
          >
            <ChevronLeft className="h-6 w-6" />
            <span className="sr-only">العودة</span>
          </Button>
          <CardTitle className="text-3xl font-bold text-gray-900 dark:text-white">
            تفاصيل الرحلة #{ride.id.substring(0, 8)}...
          </CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-400">
            معلومات مفصلة عن الرحلة
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-right">
          <div className="flex items-center gap-3">
            <MapPin className="h-5 w-5 text-gray-500 dark:text-gray-400" />
            <p className="text-lg text-gray-800 dark:text-gray-200">
              <span className="font-semibold">من:</span> {ride.pickup_location}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <MapPin className="h-5 w-5 text-gray-500 dark:text-gray-400" />
            <p className="text-lg text-gray-800 dark:text-gray-200">
              <span className="font-semibold">إلى:</span> {ride.destination}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <User className="h-5 w-5 text-gray-500 dark:text-gray-400" />
            <p className="text-lg text-gray-800 dark:text-gray-200">
              <span className="font-semibold">الراكب:</span> {ride.passenger_name}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Car className="h-5 w-5 text-gray-500 dark:text-gray-400" />
            <p className="text-lg text-gray-800 dark:text-gray-200">
              <span className="font-semibold">السائق:</span> {ride.driver_name}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Users className="h-5 w-5 text-gray-500 dark:text-gray-400" />
            <p className="text-lg text-gray-800 dark:text-gray-200">
              <span className="font-semibold">عدد الركاب:</span> {ride.passengers_count}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Info className="h-5 w-5 text-gray-500 dark:text-gray-400" />
            <p className="text-lg text-gray-800 dark:text-gray-200">
              <span className="font-semibold">الحالة:</span> {ride.status === 'pending' ? 'قيد الانتظار' : ride.status === 'accepted' ? 'مقبولة' : ride.status === 'completed' ? 'مكتملة' : 'ملغاة'}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RideDetailsPage;