"use client";

import React, { useState, useEffect, useCallback } from "react";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Search, MapPin, CheckCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import EmptyState from "@/components/EmptyState";
import RideSearchDialog from "@/components/RideSearchDialog";
import InteractiveMap from "@/components/InteractiveMap";
import { Badge } from "@/components/ui/badge";
import { useUser } from "@/context/UserContext";
import { MarkerLocation } from "@/components/InteractiveMap"; // Import MarkerLocation
import { Ride, RawRideData, ProfileDetails } from "@/types/supabase"; // Import shared Ride type
import { useSupabaseRealtime } from "@/hooks/useSupabaseRealtime"; // Import the new hook

interface RideSearchCriteria {
  pickupLocation?: string;
  destination?: string;
  passengersCount?: number;
}

const FindRidesPage: React.FC = () => {
  const { user, loading: userLoading } = useUser();
  const [availableRides, setAvailableRides] = useState<Ride[]>([] as Ride[]);
  const [loadingRides, setLoadingRides] = useState(true);
  const [isSearchDialogOpen, setIsSearchDialogOpen] = useState(false);
  const [searchCriteria, setSearchCriteria] = useState<RideSearchCriteria>({});
  const [isAcceptingRide, setIsAcceptingRide] = useState<string | null>(null);

  const fetchAvailableRides = useCallback(async (userId: string, criteria: RideSearchCriteria = {}) => {
    setLoadingRides(true);

    let query = supabase
      .from('rides')
      .select(`
        *,
        passenger_profiles:passenger_id(id, full_name, avatar_url)
      `)
      .eq('status', 'pending')
      .is('driver_id', null)
      .neq('passenger_id', userId) // Drivers cannot accept their own rides
      .order('created_at', { ascending: false });

    if (criteria.pickupLocation) {
      query = query.ilike('pickup_location', `%${criteria.pickupLocation}%`);
    }
    if (criteria.destination) {
      query = query.ilike('destination', `%${criteria.destination}%`);
    }
    if (criteria.passengersCount) {
      query = query.gte('passengers_count', criteria.passengersCount);
    }

    const { data: ridesRaw, error } = await query;

    if (error) {
      toast.error(`فشل جلب الرحلات المتاحة: ${error.message}`);
      console.error("Error fetching available rides:", error);
      setAvailableRides([]);
    } else {
      const formattedRides: Ride[] = (ridesRaw as RawRideData[] || []).map(ride => {
        const passengerProfile = Array.isArray(ride.passenger_profiles)
          ? ride.passenger_profiles[0] || null
          : ride.passenger_profiles;
        
        // Driver profiles are not selected here, so they will be null
        const driverProfile = null;

        return {
          ...ride,
          passenger_profiles: passengerProfile,
          driver_profiles: driverProfile,
        };
      }) as Ride[];
      setAvailableRides(formattedRides);
    }
    setLoadingRides(false);
  }, []);

  useEffect(() => {
    if (!userLoading && user) {
      fetchAvailableRides(user.id, searchCriteria);
    } else if (!userLoading && !user) {
      toast.error("الرجاء تسجيل الدخول للبحث عن رحلات.");
    }
  }, [userLoading, user, fetchAvailableRides, searchCriteria]);

  useSupabaseRealtime(
    'available_rides_channel',
    {
      event: '*',
      schema: 'public',
      table: 'rides',
      filter: `status=eq.pending`,
    },
    (payload) => {
      console.log('Change received in available rides!', payload);
      if (user) {
        fetchAvailableRides(user.id, searchCriteria); // Re-fetch data on any ride change
      }
    },
    !!user // Only enable if user is logged in
  );

  const handleSearch = (criteria: RideSearchCriteria) => {
    setSearchCriteria(criteria);
    if (user) {
      fetchAvailableRides(user.id, criteria);
    }
  };

  const handleAcceptRide = async (rideId: string) => {
    if (!user?.id) {
      toast.error("الرجاء تسجيل الدخول لقبول الرحلة.");
      return;
    }

    setIsAcceptingRide(rideId);
    const { error } = await supabase
      .from('rides')
      .update({ driver_id: user.id, status: 'accepted' })
      .eq('id', rideId)
      .eq('status', 'pending') // Ensure it's still pending
      .is('driver_id', null); // Ensure no other driver accepted it

    setIsAcceptingRide(null);

    if (error) {
      toast.error(`فشل قبول الرحلة: ${error.message}`);
      console.error("Error accepting ride:", error);
    } else {
      toast.success("تم قبول الرحلة بنجاح! يمكنك الآن عرضها في لوحة التحكم الخاصة بك.");
      if (user) {
        fetchAvailableRides(user.id, searchCriteria); // Refresh the list
      }
    }
  };

  const markers: MarkerLocation[] = availableRides.flatMap(ride => [
    { id: `${ride.id}-pickup`, lat: ride.pickup_lat!, lng: ride.pickup_lng!, title: `انطلاق: ${ride.pickup_location}`, iconColor: 'green' as const },
    { id: `${ride.id}-destination`, lat: ride.destination_lat!, lng: ride.destination_lng!, title: `وجهة: ${ride.destination}`, iconColor: 'red' as const },
  ]);

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
      <PageHeader title="البحث عن ركاب" description="ابحث عن رحلات متاحة وقدم عروضك." backPath="/driver-dashboard" />

      <div className="mb-6">
        <Button onClick={() => setIsSearchDialogOpen(true)} className="w-full bg-secondary hover:bg-secondary/80 text-secondary-foreground">
          <Search className="h-4 w-4 ml-2 rtl:mr-2" />
          تصفية الرحلات
        </Button>
      </div>

      <div className="h-[400px] w-full mb-6">
        <InteractiveMap markers={markers} />
      </div>

      {availableRides.length === 0 ? (
        <EmptyState
          icon={MapPin}
          title="لا توجد رحلات متاحة"
          description="لا توجد رحلات تنتظر سائقين حاليًا. حاول تعديل معايير البحث أو تحقق لاحقًا."
        />
      ) : (
        <div className="grid gap-4">
          {availableRides.map((ride) => (
            <Card key={ride.id} className="shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>رحلة من {ride.pickup_location} إلى {ride.destination}</span>
                  <Badge variant="secondary" className="bg-blue-500">قيد الانتظار</Badge>
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
                  <span>{new Date(ride.created_at).toLocaleDateString('ar-SA')}</span>
                </div>
                <Button
                  onClick={() => handleAcceptRide(ride.id)}
                  disabled={isAcceptingRide === ride.id}
                  className="w-full bg-primary hover:bg-primary-dark text-primary-foreground mt-4"
                >
                  {isAcceptingRide === ride.id ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin ml-2 rtl:mr-2" />
                      جاري القبول...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 ml-2 rtl:mr-2" />
                      قبول الرحلة
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <RideSearchDialog
        open={isSearchDialogOpen}
        onOpenChange={setIsSearchDialogOpen}
        onSearch={handleSearch}
        initialCriteria={searchCriteria}
      />
    </div>
  );
};

export default FindRidesPage;