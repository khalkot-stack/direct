"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Star, Car } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import RatingDialog from "@/components/RatingDialog";
import PageHeader from "@/components/PageHeader"; // Import PageHeader
import EmptyState from "@/components/EmptyState"; // Import EmptyState

// Define an interface for the raw data returned by Supabase select with joins for MULTIPLE rows
interface SupabaseJoinedRideData {
  id: string;
  pickup_location: string;
  destination: string;
  passengers_count: number;
  status: "pending" | "accepted" | "completed" | "cancelled";
  driver_id: string | null;
  profiles_driver: Array<{ full_name: string }> | null; // For multi-row queries, these are arrays of objects or null
  ratings: Array<{ rating: number; comment: string }> | null; // Assuming a 'ratings' table with a foreign key to 'rides'
}

interface RideRequest {
  id: string;
  pickup_location: string;
  destination: string;
  passengers_count: number;
  status: "pending" | "accepted" | "completed" | "cancelled";
  driver_id: string | null;
  driver_name?: string;
  has_rated?: boolean; // To track if the passenger has already rated this ride
  current_rating?: number;
  current_comment?: string;
}

const PassengerRequestsPage = () => {
  const navigate = useNavigate();
  const [passengerRequests, setPassengerRequests] = useState<RideRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [isRatingDialogOpen, setIsRatingDialogOpen] = useState(false);
  const [rideToRate, setRideToRate] = useState<RideRequest | null>(null);

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
        profiles_driver:driver_id (full_name),
        ratings!left(rating, comment)
      `)
      .eq('passenger_id', currentUserId)
      .order('created_at', { ascending: false });

    if (error) {
      toast.error(`فشل جلب طلبات الرحلات: ${error.message}`);
      console.error("Error fetching passenger rides:", error);
    } else {
      const formattedRequests: RideRequest[] = data.map((ride: SupabaseJoinedRideData) => ({
        id: ride.id,
        pickup_location: ride.pickup_location,
        destination: ride.destination,
        passengers_count: ride.passengers_count,
        status: ride.status,
        driver_id: ride.driver_id,
        driver_name: ride.profiles_driver?.[0]?.full_name || 'لا يوجد',
        has_rated: ride.ratings && ride.ratings.length > 0,
        current_rating: ride.ratings?.[0]?.rating,
        current_comment: ride.ratings?.[0]?.comment,
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

  const handleRateDriver = (ride: RideRequest) => {
    setRideToRate(ride);
    setIsRatingDialogOpen(true);
  };

  const handleSaveRating = async (rating: number, comment: string) => {
    if (!rideToRate || !userId || !rideToRate.driver_id) {
      toast.error("خطأ: لا يمكن حفظ التقييم.");
      return;
    }

    const { error } = await supabase.from('ratings').insert({
      ride_id: rideToRate.id,
      rater_id: userId,
      rated_user_id: rideToRate.driver_id,
      rating: rating,
      comment: comment,
    });

    if (error) {
      toast.error(`فشل حفظ التقييم: ${error.message}`);
      console.error("Error saving rating:", error);
    } else {
      toast.success("تم حفظ تقييمك بنجاح!");
      if (userId) fetchPassengerRides(userId);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-950">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="sr-only">جاري تحميل طلبات الرحلات...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-950 p-4">
      <Card className="w-full max-w-2xl bg-white dark:bg-gray-900 shadow-lg rounded-lg">
        <div className="p-6">
          <PageHeader
            title="طلبات رحلاتي"
            description="عرض حالة طلبات رحلاتك"
            backPath="/passenger-dashboard"
          />
        </div>
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
                  {request.has_rated && request.current_rating !== undefined && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1">
                      تقييمك: {request.current_rating} <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                      {request.current_comment && ` ("${request.current_comment}")`}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="text-primary border-primary hover:bg-primary hover:text-primary-foreground text-sm px-4 py-2 rounded-lg shadow-md transition-transform duration-200 ease-in-out hover:scale-[1.01]"
                    onClick={() => navigate(`/ride-details/${request.id}`)}
                  >
                    عرض التفاصيل
                  </Button>
                  {request.status === "completed" && !request.has_rated && request.driver_id && (
                    <Button
                      className="bg-yellow-500 hover:bg-yellow-600 text-white text-sm px-4 py-2 rounded-lg shadow-md transition-transform duration-200 ease-in-out hover:scale-[1.01]"
                      onClick={() => handleRateDriver(request)}
                    >
                      تقييم السائق
                    </Button>
                  )}
                </div>
              </div>
            ))
          ) : (
            <EmptyState
              icon={Car}
              title="لم تقم بطلب أي رحلات بعد"
              description="ابدأ بطلب رحلة جديدة لتظهر هنا."
            />
          )}
        </CardContent>
      </Card>
      {rideToRate && (
        <RatingDialog
          open={isRatingDialogOpen}
          onOpenChange={setIsRatingDialogOpen}
          onSave={handleSaveRating}
          targetUserName={rideToRate.driver_name || "السائق"}
          initialRating={rideToRate.current_rating}
          initialComment={rideToRate.current_comment}
        />
      )}
    </div>
  );
};

export default PassengerRequestsPage;