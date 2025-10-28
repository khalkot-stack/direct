"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Car, Phone, MessageSquare } from "lucide-react"; // Import Phone and MessageSquare
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
  passenger_id: string; // Ensure passenger_id is included in the raw data
  driver_id: string | null; // Ensure driver_id is included in the raw data
  profiles_passenger: Array<{ full_name: string; phone_number?: string }> | null; // Added phone_number
}

interface AcceptedRide {
  id: string;
  pickup_location: string;
  destination: string;
  passengers_count: number;
  status: "pending" | "accepted" | "completed" | "cancelled";
  passenger_name?: string;
  passenger_phone?: string; // Added passenger_phone
}

const DriverAcceptedRidesPage = () => {
  const navigate = useNavigate();
  const [acceptedRides, setAcceptedRides] = useState<AcceptedRide[]>([]);
  const [loading, setLoading] = useState(true);
  const [driverId, setDriverId] = useState<string | null>(null);

  const fetchAcceptedRides = useCallback(async (currentDriverId: string) => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error("الرجاء تسجيل الدخول كسائق لعرض رحلاتك المقبولة.");
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
        passenger_id,
        driver_id,
        profiles_passenger:passenger_id (full_name, phone_number)
      `);

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
        passenger_phone: ride.profiles_passenger?.[0]?.phone_number || 'غير متاح', // Access passenger phone
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

  const handleCall = (phoneNumber: string | undefined) => {
    if (phoneNumber && phoneNumber !== 'غير متاح') {
      window.location.href = `tel:${phoneNumber}`;
    } else {
      toast.info("رقم الهاتف غير متاح.");
    }
  };

  const handleMessage = (phoneNumber: string | undefined) => {
    if (phoneNumber && phoneNumber !== 'غير متاح') {
      window.location.href = `sms:${phoneNumber`;
    } else {
      toast.info("رقم الهاتف غير متاح.");
    }
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
                    <div className="flex items-center gap-2 mt-2">
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        هاتف الراكب: {ride.passenger_phone}
                      </p>
                      <Button variant="outline" size="sm" onClick={() => handleCall(ride.passenger_phone)} className="flex items-center gap-1 text-primary border-primary hover:bg-primary hover:text-primary-foreground transition-transform duration-200 ease-in-out hover:scale-[1.01]">
                        <Phone className="h-4 w-4" />
                        اتصال
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleMessage(ride.passenger_phone)} className="flex items-center gap-1 text-primary border-primary hover:bg-primary hover:text-primary-foreground transition-transform duration-200 ease-in-out hover:scale-[1.01]">
                        <MessageSquare className="h-4 w-4" />
                        رسالة
                      </Button>
                    </div>
                  )}
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
                  {ride.status === 'accepted' && (
                    <Button
                      onClick={() => handleCompleteRide(ride.id)}
                      className="bg-primary hover:bg-primary-dark text-primary-foreground transition-transform duration-200 ease-in-out hover:scale-[1.01]"
                      disabled={loading}
                    >
                      {loading ? (
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
    </div>
  );
};

export default DriverAcceptedRidesPage;