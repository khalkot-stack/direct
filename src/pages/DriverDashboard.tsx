"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import PageHeader from "@/components/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Car, MapPin, History, Settings, Loader2, MessageSquare } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import EmptyState from "@/components/EmptyState";
import InteractiveMap from "@/components/InteractiveMap";
import ChatDialog from "@/components/ChatDialog";
import RatingDialog from "@/components/RatingDialog";
import { Badge } from "@/components/ui/badge";

interface Ride {
  id: string;
  passenger_id: string;
  driver_id: string | null;
  pickup_location: string;
  destination: string;
  passengers_count: number;
  status: "pending" | "accepted" | "completed" | "cancelled";
  created_at: string;
  pickup_lat: number;
  pickup_lng: number;
  destination_lat: number;
  destination_lng: number;
  passenger_profiles: {
    id: string;
    full_name: string;
    avatar_url: string | null;
  } | null;
  driver_profiles: {
    id: string;
    full_name: string;
    avatar_url: string | null;
  } | null;
}

const DriverDashboard: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentRide, setCurrentRide] = useState<Ride | null>(null);
  const [isChatDialogOpen, setIsChatDialogOpen] = useState(false);
  const [chatOtherUserId, setChatOtherUserId] = useState("");
  const [chatOtherUserName, setChatOtherUserName] = useState("");

  const [isRatingDialogOpen, setIsRatingDialogOpen] = useState(false);
  const [ratingTargetUser, setRatingTargetUser] = useState<{ id: string; name: string } | null>(null);
  const [rideToRate, setRideToRate] = useState<Ride | null>(null);

  const navigate = useNavigate();

  const fetchUserDataAndCurrentRide = useCallback(async () => {
    setLoading(true);
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      toast.error("الرجاء تسجيل الدخول للوصول إلى لوحة التحكم.");
      navigate("/auth");
      setLoading(false);
      return;
    }
    setUser(user);

    // Fetch current active ride for the driver
    const { data: ridesData, error: ridesError } = await supabase
      .from('rides')
      .select(`
        *,
        passenger_profiles:passenger_id(id, full_name, avatar_url),
        driver_profiles:driver_id(id, full_name, avatar_url)
      `)
      .eq('driver_id', user.id)
      .in('status', ['accepted', 'pending']) // Driver sees accepted and pending rides assigned to them
      .order('created_at', { ascending: false })
      .limit(1);

    if (ridesError) {
      toast.error(`فشل جلب الرحلات الحالية: ${ridesError.message}`);
      console.error("Error fetching current ride:", ridesError);
      setCurrentRide(null);
    } else if (ridesData && ridesData.length > 0) {
      setCurrentRide(ridesData[0] as Ride);
    } else {
      setCurrentRide(null);
    }
    setLoading(false);
  }, [navigate]);

  useEffect(() => {
    fetchUserDataAndCurrentRide();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user);
        fetchUserDataAndCurrentRide();
      } else {
        setUser(null);
        setCurrentRide(null);
        navigate("/auth");
      }
    });

    const rideChannel = supabase
      .channel('driver_rides_channel')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'rides',
          filter: `driver_id=eq.${user?.id}`,
        },
        (payload) => {
          console.log('Change received!', payload);
          fetchUserDataAndCurrentRide(); // Re-fetch data on any ride change
          if (payload.eventType === 'UPDATE' && payload.new.status === 'completed' && payload.old.status !== 'completed') {
            toast.success("تم إكمال الرحلة بنجاح!");
            // Prompt driver to rate passenger
            const completedRide = payload.new as Ride;
            if (completedRide.passenger_profiles) {
              setRideToRate(completedRide);
              setRatingTargetUser({ id: completedRide.passenger_id, name: completedRide.passenger_profiles.full_name || 'الراكب' });
              setIsRatingDialogOpen(true);
            }
          }
        }
      )
      .subscribe();

    return () => {
      authListener.subscription.unsubscribe();
      supabase.removeChannel(rideChannel);
    };
  }, [fetchUserDataAndCurrentRide, user?.id, navigate]);

  const handleCompleteRide = async () => {
    if (!currentRide) return;

    setLoading(true);
    const { error } = await supabase
      .from('rides')
      .update({ status: 'completed' })
      .eq('id', currentRide.id);
    setLoading(false);

    if (error) {
      toast.error(`فشل إكمال الرحلة: ${error.message}`);
      console.error("Error completing ride:", error);
    } else {
      // The realtime listener will handle the toast and rating dialog
      setCurrentRide(null); // Clear current ride from state immediately
    }
  };

  const handleOpenChat = () => {
    if (!user || !currentRide || !currentRide.passenger_profiles) {
      toast.error("لا يمكن بدء الدردشة. معلومات المستخدم أو الرحلة غير متوفرة.");
      return;
    }
    setChatOtherUserId(currentRide.passenger_id);
    setChatOtherUserName(currentRide.passenger_profiles.full_name || 'الراكب');
    setIsChatDialogOpen(true);
  };

  const handleSaveRating = async (rating: number, comment: string) => {
    if (!user || !rideToRate || !ratingTargetUser) return;

    const { error } = await supabase.from('ratings').insert({
      ride_id: rideToRate.id,
      rater_id: user.id,
      rated_user_id: ratingTargetUser.id,
      rating,
      comment,
    });

    if (error) {
      toast.error(`فشل حفظ التقييم: ${error.message}`);
      console.error("Error saving rating:", error);
    } else {
      toast.success("تم حفظ التقييم بنجاح!");
    }
  };

  const markers = currentRide ? [
    { id: 'pickup', lat: currentRide.pickup_lat, lng: currentRide.pickup_lng, title: 'موقع الانطلاق', iconColor: 'green' },
    { id: 'destination', lat: currentRide.destination_lat, lng: currentRide.destination_lng, title: 'الوجهة', iconColor: 'red' },
  ] : [];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-950">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="sr-only">جاري التحميل...</span>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <PageHeader title="لوحة تحكم السائق" description="إدارة رحلاتك وعرض المعلومات الهامة." />

      {currentRide ? (
        <Card className="mb-6 border-primary shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>رحلتك الحالية</span>
              <Badge variant="default" className="bg-blue-500">{currentRide.status === 'pending' ? 'قيد الانتظار' : 'مقبولة'}</Badge>
            </CardTitle>
            <CardDescription>
              من {currentRide.pickup_location} إلى {currentRide.destination}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">الراكب:</span>
              <span>{currentRide.passenger_profiles?.full_name || 'غير معروف'}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">عدد الركاب:</span>
              <span>{currentRide.passengers_count}</span>
            </div>
            <div className="h-[300px] w-full rounded-md overflow-hidden">
              <InteractiveMap markers={markers} />
            </div>
            <div className="flex gap-2 mt-4">
              <Button onClick={handleCompleteRide} disabled={loading} className="flex-1 bg-green-600 hover:bg-green-700 text-white">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "إكمال الرحلة"}
              </Button>
              <Button onClick={handleOpenChat} variant="outline" className="flex-1">
                <MessageSquare className="h-4 w-4 ml-2 rtl:mr-2" />
                محادثة مع الراكب
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <EmptyState
          icon={Car}
          title="لا توجد رحلات حالية"
          description="لا توجد رحلات مقبولة أو قيد الانتظار حاليًا. ابحث عن رحلات جديدة!"
        />
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mt-6">
        <Link to="/driver-dashboard/find-rides">
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">البحث عن ركاب</CardTitle>
              <MapPin className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">ابحث</p>
              <p className="text-xs text-muted-foreground">عن رحلات جديدة</p>
            </CardContent>
          </Card>
        </Link>
        <Link to="/driver-dashboard/accepted-rides">
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">رحلاتي المقبولة</CardTitle>
              <History className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">عرض</p>
              <p className="text-xs text-muted-foreground">الرحلات التي قبلتها</p>
            </CardContent>
          </Card>
        </Link>
        <Link to="/app-settings">
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">الإعدادات</CardTitle>
              <Settings className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">تعديل</p>
              <p className="text-xs text-muted-foreground">إعدادات حسابك</p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {user && currentRide && (
        <ChatDialog
          open={isChatDialogOpen}
          onOpenChange={setIsChatDialogOpen}
          rideId={currentRide.id}
          otherUserId={chatOtherUserId}
          otherUserName={chatOtherUserName}
          currentUserId={user.id}
        />
      )}

      {user && rideToRate && ratingTargetUser && (
        <RatingDialog
          open={isRatingDialogOpen}
          onOpenChange={setIsRatingDialogOpen}
          onSave={handleSaveRating}
          targetUserName={ratingTargetUser.name}
        />
      )}
    </div>
  );
};

export default DriverDashboard;