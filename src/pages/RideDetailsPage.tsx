"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, User, Car, Info, Loader2, Users, Phone, MessageSquare } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import PageHeader from "@/components/PageHeader"; // Import PageHeader

// Define an interface for the raw data returned by Supabase select with joins for a SINGLE row
// Even with .single(), Supabase might return joined relations as an array of one item.
interface SupabaseJoinedRideData {
  id: string;
  pickup_location: string;
  destination: string;
  passengers_count: number;
  status: "pending" | "accepted" | "completed" | "cancelled";
  passenger_id: string;
  driver_id: string | null;
  profiles_passenger: Array<{ full_name: string; phone_number?: string }> | null; // Added phone_number
  profiles_driver: Array<{ full_name: string; phone_number?: string }> | null;     // Added phone_number
}

interface Ride {
  id: string;
  passenger_id: string;
  driver_id: string | null;
  passenger_name?: string;
  passenger_phone?: string; // Added passenger phone
  driver_name?: string;
  driver_phone?: string; // Added driver phone
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
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const fetchRideDetails = useCallback(async () => {
    if (!rideId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    setCurrentUserId(user?.id || null);
    setCurrentUserRole(user?.user_metadata?.user_type || null);

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
        profiles_passenger:passenger_id (full_name, phone_number),
        profiles_driver:driver_id (full_name, phone_number)
      `)
      .eq('id', rideId)
      .single()
      .returns<SupabaseJoinedRideData>();

    if (error) {
      toast.error(`فشل جلب تفاصيل الرحلة: ${error.message}`);
      console.error("Error fetching ride details:", error);
      setRide(null);
    } else if (data) {
      setRide({
        id: data.id,
        passenger_id: data.passenger_id,
        driver_id: data.driver_id,
        passenger_name: data.profiles_passenger?.[0]?.full_name || 'غير معروف',
        passenger_phone: data.profiles_passenger?.[0]?.phone_number || 'غير متاح',
        driver_name: data.profiles_driver?.[0]?.full_name || 'لا يوجد',
        driver_phone: data.profiles_driver?.[0]?.phone_number || 'غير متاح',
        pickup_location: data.pickup_location,
        destination: data.destination,
        passengers_count: data.passengers_count,
        status: data.status,
      });
    } else {
      toast.error("الرحلة المطلوبة غير موجودة.");
      console.error("Ride not found for ID:", rideId);
      setRide(null);
    }
    setLoading(false);
  }, [rideId]);

  useEffect(() => {
    fetchRideDetails();
  }, [fetchRideDetails]);

  const handleCall = (phoneNumber: string | undefined) => {
    if (phoneNumber && phoneNumber !== 'غير متاح') {
      window.location.href = `tel:${phoneNumber}`;
    } else {
      toast.info("رقم الهاتف غير متاح.");
    }
  };

  const handleMessage = (phoneNumber: string | undefined) => {
    if (phoneNumber && phoneNumber !== 'غير متاح') {
      window.location.href = `sms:${phoneNumber}`;
    } else {
      toast.info("رقم الهاتف غير متاح.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-950">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="sr-only">جاري تحميل تفاصيل الرحلة...</span>
      </div>
    );
  }

  if (!ride) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-950 p-4">
        <Card className="w-full max-w-md bg-white dark:bg-gray-900 shadow-lg rounded-lg text-center">
          <div className="p-6">
            <PageHeader
              title="الرحلة غير موجودة"
              description="عذرًا، لم نتمكن من العثور على تفاصيل الرحلة المطلوبة."
            />
          </div>
          <CardContent>
            <Button onClick={() => navigate(-1)} className="mt-6 bg-primary hover:bg-primary-dark text-primary-foreground transition-transform duration-200 ease-in-out hover:scale-[1.01]">
              العودة
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isDriver = currentUserRole === "driver" && currentUserId === ride.driver_id;
  const isPassenger = currentUserRole === "passenger" && currentUserId === ride.passenger_id;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-950 p-4">
      <Card className="w-full max-w-md bg-white dark:bg-gray-900 shadow-lg rounded-lg">
        <div className="px-6 pt-0"> {/* Adjusted padding */}
          <PageHeader
            title={`تفاصيل الرحلة #${ride.id.substring(0, 8)}...`}
            description="معلومات مفصلة عن الرحلة"
          />
        </div>
        <CardContent className="space-y-4 text-right">
          <div className="flex items-center gap-3">
            <MapPin className="h-5 w-5 text-muted-foreground" />
            <p className="text-lg text-gray-800 dark:text-gray-200">
              <span className="font-semibold">من:</span> {ride.pickup_location}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <MapPin className="h-5 w-5 text-muted-foreground" />
            <p className="text-lg text-gray-800 dark:text-gray-200">
              <span className="font-semibold">إلى:</span> {ride.destination}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <User className="h-5 w-5 text-muted-foreground" />
            <p className="text-lg text-gray-800 dark:text-gray-200">
              <span className="font-semibold">الراكب:</span> {ride.passenger_name}
            </p>
          </div>
          {isDriver && ride.status === "accepted" && ( // Only show passenger phone if current user is driver and ride is accepted
            <div className="flex items-center gap-3">
              <Phone className="h-5 w-5 text-muted-foreground" />
              <p className="text-lg text-gray-800 dark:text-gray-200">
                <span className="font-semibold">هاتف الراكب:</span> {ride.passenger_phone}
              </p>
              <Button variant="outline" size="sm" onClick={() => handleCall(ride.passenger_phone)} className="ml-auto flex items-center gap-1 text-primary border-primary hover:bg-primary hover:text-primary-foreground transition-transform duration-200 ease-in-out hover:scale-[1.01]">
                <Phone className="h-4 w-4" />
                اتصال
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleMessage(ride.passenger_phone)} className="flex items-center gap-1 text-primary border-primary hover:bg-primary hover:text-primary-foreground transition-transform duration-200 ease-in-out hover:scale-[1.01]">
                <MessageSquare className="h-4 w-4" />
                رسالة
              </Button>
            </div>
          )}
          <div className="flex items-center gap-3">
            <Car className="h-5 w-5 text-muted-foreground" />
            <p className="text-lg text-gray-800 dark:text-gray-200">
              <span className="font-semibold">السائق:</span> {ride.driver_name}
            </p>
          </div>
          {isPassenger && ride.status === "accepted" && ride.driver_id && (
            <div className="flex items-center gap-3">
              <Phone className="h-5 w-5 text-muted-foreground" />
              <p className="text-lg text-gray-800 dark:text-gray-200">
                <span className="font-semibold">هاتف السائق:</span> {ride.driver_phone}
              </p>
              <Button variant="outline" size="sm" onClick={() => handleCall(ride.driver_phone)} className="ml-auto flex items-center gap-1 text-primary border-primary hover:bg-primary hover:text-primary-foreground transition-transform duration-200 ease-in-out hover:scale-[1.01]">
                <Phone className="h-4 w-4" />
                اتصال
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleMessage(ride.driver_phone)} className="flex items-center gap-1 text-primary border-primary hover:bg-primary hover:text-primary-foreground transition-transform duration-200 ease-in-out hover:scale-[1.01]">
                <MessageSquare className="h-4 w-4" />
                رسالة
              </Button>
            </div>
          )}
          <div className="flex items-center gap-3">
            <Users className="h-5 w-5 text-muted-foreground" />
            <p className="text-lg text-gray-800 dark:text-gray-200">
              <span className="font-semibold">عدد الركاب:</span> {ride.passengers_count}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Info className="h-5 w-5 text-muted-foreground" />
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