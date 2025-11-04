"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, Car, MessageSquare, CheckCircle, Search, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import ChatDialog from "@/components/ChatDialog";
import EmptyState from "@/components/EmptyState";
import RideSearchDialog from "@/components/RideSearchDialog";
import { useUser } from "@/context/UserContext";
import { useSupabaseRealtime } from "@/hooks/useSupabaseRealtime";
import { Ride, RawRideData } from "@/types/supabase";
import RideStatusBadge from "@/components/RideStatusBadge";
import PageHeader from "@/components/PageHeader";
import { ScrollArea } from "@/components/ui/scroll-area";

interface RideSearchCriteria {
  pickupLocation?: string;
  destination?: string;
}

const PAGE_SIZE = 5; // عدد الرحلات التي يتم تحميلها في كل مرة

const DriverAvailableRidesPage: React.FC = () => {
  const { user, loading: userLoading } = useUser();
  const navigate = useNavigate();

  const [loadingRides, setLoadingRides] = useState(true);
  const [availableRides, setAvailableRides] = useState<Ride[]>([]);
  const [page, setPage] = useState(0); // Current page for pagination
  const [hasMoreRides, setHasMoreRides] = useState(false);

  const [isSearchDialogOpen, setIsSearchDialogOpen] = useState(false);
  const [searchCriteria, setSearchCriteria] = useState<RideSearchCriteria>({});

  const [isChatDialogOpen, setIsChatDialogOpen] = useState(false);
  const [chatRideId, setChatRideId] = useState("");
  const [chatOtherUserId, setChatOtherUserId] = useState("");
  const [chatOtherUserName, setChatOtherUserName] = useState("");

  const fetchAvailableRides = useCallback(async (currentPage: number, append: boolean) => {
    if (!user?.id) {
      console.log("DriverAvailableRidesPage: fetchAvailableRides - User ID not available, skipping fetch.");
      setLoadingRides(false);
      return;
    }

    console.log("DriverAvailableRidesPage: fetchAvailableRides - User ID:", user.id, "User Type from app_metadata:", user.app_metadata?.user_type, "Page:", currentPage, "Append:", append, "Search Criteria:", searchCriteria);

    setLoadingRides(true);

    const limit = PAGE_SIZE;
    const offset = currentPage * limit;

    let query = supabase
      .from('rides')
      .select(`
        *,
        passenger_profiles:passenger_id(id, full_name, avatar_url, user_type)
      `, { count: 'exact' })
      .eq('status', 'pending')
      .is('driver_id', null)
      // .neq('passenger_id', user.id) // تم تعليق هذا الشرط للسماح للسائق برؤية رحلاته الخاصة لأغراض الاختبار
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Log the constructed query filters (simplified representation)
    console.log("DriverAvailableRidesPage: fetchAvailableRides - Supabase query filters - status=pending, driver_id=null, passenger_id!=current_user_id (temporarily disabled)");

    if (searchCriteria?.pickupLocation) {
      query = query.ilike('pickup_location', `%${searchCriteria.pickupLocation}%`);
      console.log("DriverAvailableRidesPage: fetchAvailableRides - Adding pickup_location filter:", searchCriteria.pickupLocation);
    }
    if (searchCriteria?.destination) {
      query = query.ilike('destination', `%${searchCriteria.destination}%`);
      console.log("DriverAvailableRidesPage: fetchAvailableRides - Adding destination filter:", searchCriteria.destination);
    }

    const { data: ridesRaw, error: ridesError, count } = await query;

    if (ridesError) {
      console.error("DriverAvailableRidesPage: fetchAvailableRides - Error fetching available rides:", ridesError);
      toast.error(`فشل جلب الرحلات المتاحة: ${ridesError.message}`);
      setAvailableRides([]);
      setHasMoreRides(false);
    } else {
      console.log("DriverAvailableRidesPage: fetchAvailableRides - Successfully fetched rides. Count:", count, "Raw data:", ridesRaw);
      const formattedRides: Ride[] = (ridesRaw as RawRideData[] || []).map(ride => {
        const passengerProfile = Array.isArray(ride.passenger_profiles)
          ? ride.passenger_profiles[0] || null
          : ride.passenger_profiles;
        
        return {
          ...ride,
          passenger_profiles: passengerProfile,
          driver_profiles: null,
        };
      }) as Ride[];

      setAvailableRides(prev => append ? [...prev, ...formattedRides] : formattedRides);
      setHasMoreRides(count !== null && (offset + formattedRides.length) < count);
    }
    setLoadingRides(false);
  }, [user, searchCriteria]); // Dependencies: user and searchCriteria, NOT page

  // Effect for initial load and when search criteria changes
  useEffect(() => {
    if (!userLoading && user) {
      setPage(0); // Reset page to 0 for new search/initial load
      setAvailableRides([]); // Clear existing rides
      fetchAvailableRides(0, false); // Fetch the first page, not appending
    } else if (!userLoading && !user) {
      navigate("/auth");
    }
  }, [userLoading, user, navigate, searchCriteria, fetchAvailableRides]);

  // Effect for loading more when `page` state changes
  useEffect(() => {
    if (page > 0 && !userLoading && user) {
      fetchAvailableRides(page, true); // Fetch and append
    }
  }, [page, userLoading, user, fetchAvailableRides]);

  useSupabaseRealtime(
    'driver_available_rides_channel',
    {
      event: '*',
      schema: 'public',
      table: 'rides',
      filter: `status=eq.pending`,
    },
    (_payload) => {
      if (user) {
        // On any change to pending rides, directly re-fetch the first page and clear existing rides
        setAvailableRides([]); // Clear existing rides immediately for visual feedback
        setPage(0); // Reset page to 0
        fetchAvailableRides(0, false); // Re-fetch the first page
      }
    },
    !!user
  );

  const handleAcceptRide = async (rideId: string) => {
    if (!user?.id) {
      toast.error("الرجاء تسجيل الدخول لقبول الرحلة.");
      return;
    }

    setLoadingRides(true);
    const { error } = await supabase
      .from('rides')
      .update({ driver_id: user.id, status: 'accepted' })
      .eq('id', rideId)
      .eq('status', 'pending')
      .is('driver_id', null);

    setLoadingRides(false);

    if (error) {
      toast.error(`فشل قبول الرحلة: ${error.message}`);
      console.error("Error accepting ride:", error);
    } else {
      toast.success("تم قبول الرحلة بنجاح! يمكنك الآن عرضها في رحلاتي المقبولة.");
      navigate("/driver-dashboard"); // Redirect to home to show current ride
    }
  };

  const handleOpenChat = (ride: Ride) => {
    if (!user || !ride.passenger_profiles) {
      toast.error("لا يمكن بدء الدردشة. معلومات الراكب أو الرحلة غير متوفرة.");
      return;
    }
    setChatRideId(ride.id);
    setChatOtherUserId(ride.passenger_id);
    setChatOtherUserName(ride.passenger_profiles.full_name || 'الراكب');
    setIsChatDialogOpen(true);
  };

  const handleSearch = (criteria: RideSearchCriteria) => {
    setSearchCriteria(criteria);
    // setPage(0) and setAvailableRides([]) are handled by the useEffect when searchCriteria changes
    setIsSearchDialogOpen(false);
  };

  const handleLoadMore = () => {
    if (user && !loadingRides && hasMoreRides) {
      setPage(prevPage => prevPage + 1); // This will trigger the second useEffect
    }
  };

  const handleRefreshAvailableRides = () => {
    if (user) {
      setPage(0); // Reset page to 0
      setAvailableRides([]); // Clear existing rides
      fetchAvailableRides(0, false); // Fetch rides from start (not appending)
    }
  };

  if (userLoading || loadingRides) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-950">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="sr-only">جاري تحميل الرحلات المتاحة...</span>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <PageHeader title="الرحلات المتاحة" description="تصفح وقبول الرحلات الجديدة." backPath="/driver-dashboard" />

      <div className="flex justify-end mb-4">
        <Button
          onClick={() => setIsSearchDialogOpen(true)}
          className="bg-primary hover:bg-primary-dark text-primary-foreground"
        >
          <Search className="h-4 w-4 ml-2 rtl:mr-2" />
          بحث عن رحلات
        </Button>
        <Button
          onClick={handleRefreshAvailableRides}
          variant="outline"
          className="ml-2 rtl:mr-2 text-primary border-primary hover:bg-primary hover:text-primary-foreground"
        >
          <RefreshCw className="h-4 w-4 ml-2 rtl:mr-2" />
          تحديث
        </Button>
      </div>

      <ScrollArea className="h-[calc(100vh-250px)]">
        {availableRides.length === 0 ? (
          <EmptyState
            icon={Car}
            title="لا توجد رحلات متاحة"
            description="لا توجد رحلات تنتظر سائقين حاليًا. حاول البحث بمعايير مختلفة أو تحديث القائمة."
          />
        ) : (
          <div className="grid gap-4">
            {availableRides.map((ride: Ride) => (
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
                    <span>{new Date(ride.created_at).toLocaleDateString('ar-SA')}</span>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button onClick={() => handleAcceptRide(ride.id)} disabled={loadingRides} className="flex-1 bg-primary hover:bg-primary-dark text-primary-foreground">
                      {loadingRides ? (
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
                    <Button onClick={() => handleOpenChat(ride)} variant="outline" className="flex-1">
                      <MessageSquare className="h-4 w-4 ml-2 rtl:mr-2" />
                      محادثة مع الراكب
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
            {hasMoreRides && (
              <Button onClick={handleLoadMore} disabled={loadingRides} className="w-full mt-4">
                {loadingRides ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin ml-2 rtl:mr-2" />
                    جاري التحميل...
                  </>
                ) : (
                  "تحميل المزيد"
                )}
              </Button>
            )}
          </div>
        )}
      </ScrollArea>

      {user && (
        <ChatDialog
          open={isChatDialogOpen}
          onOpenChange={setIsChatDialogOpen}
          rideId={chatRideId}
          otherUserId={chatOtherUserId}
          otherUserName={chatOtherUserName}
        />
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

export default DriverAvailableRidesPage;