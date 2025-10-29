"use client";

import React, { useState, useEffect, useCallback } from "react";
import PageHeader from "@/components/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, MapPin, MessageSquare } from "lucide-react"; // Removed Car
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import InteractiveMap from "@/components/InteractiveMap";
import { Button } from "@/components/ui/button";
import ChatDialog from "@/components/ChatDialog";
import { Badge } from "@/components/ui/badge"; // Imported Badge

interface Ride {
  id: string;
  passenger_id: string;
  driver_id: string | null;
  pickup_location: string;
  destination: string;
  status: "pending" | "accepted" | "completed" | "cancelled";
  pickup_lat: number;
  pickup_lng: number;
  destination_lat: number;
  destination_lng: number;
  driver_current_lat: number | null;
  driver_current_lng: number | null;
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

const PassengerTrackingPage: React.FC = () => {
  const [ride, setRide] = useState<Ride | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isChatDialogOpen, setIsChatDialogOpen] = useState(false);
  const [chatOtherUserId, setChatOtherUserId] = useState("");
  const [chatOtherUserName, setChatOtherUserName] = useState("");

  const fetchRideDetails = useCallback(async () => {
    setLoading(true);
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      toast.error("الرجاء تسجيل الدخول لتتبع رحلتك.");
      setLoading(false);
      return;
    }
    setCurrentUserId(user.id);

    const { data, error } = await supabase
      .from('rides')
      .select(`
        *,
        passenger_profiles:passenger_id(id, full_name, avatar_url),
        driver_profiles:driver_id(id, full_name, avatar_url)
      `)
      .eq('passenger_id', user.id)
      .in('status', ['accepted']) // Only track accepted rides
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      if (error.code === 'PGRST116') { // No rows found
        setRide(null);
      } else {
        toast.error(`فشل جلب تفاصيل الرحلة: ${error.message}`);
        console.error("Error fetching ride details:", error);
      }
    } else {
      setRide(data as Ride);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchRideDetails();

    const channel = supabase
      .channel('ride_tracking_channel')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'rides',
          filter: `passenger_id=eq.${currentUserId}`,
        },
        (payload) => {
          console.log('Ride update received!', payload);
          if (payload.new.status === 'completed') {
            toast.success("لقد وصلت رحلتك إلى وجهتها!");
            setRide(null); // Clear ride from state
          } else if (payload.new.status === 'cancelled') {
            toast.warning(`تم إلغاء رحلتك. السبب: ${payload.new.cancellation_reason || 'غير محدد'}`);
            setRide(null); // Clear ride from state
          } else {
            setRide(payload.new as Ride);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchRideDetails, currentUserId]);

  const handleOpenChat = () => {
    if (!currentUserId || !ride || !ride.driver_id || !ride.driver_profiles) {
      toast.error("لا يمكن بدء الدردشة. معلومات السائق أو الرحلة غير متوفرة.");
      return;
    }
    setChatRideId(ride.id); // Corrected usage
    setChatOtherUserId(ride.driver_id);
    setChatOtherUserName(ride.driver_profiles.full_name || 'السائق');
    setIsChatDialogOpen(true);
  };

  const markers = [];
  if (ride) {
    markers.push({ id: 'pickup', lat: ride.pickup_lat, lng: ride.pickup_lng, title: 'موقع الانطلاق', iconColor: 'green' });
    markers.push({ id: 'destination', lat: ride.destination_lat, lng: ride.destination_lng, title: 'الوجهة', iconColor: 'red' });
    if (ride.driver_current_lat && ride.driver_current_lng) {
      markers.push({ id: 'driver', lat: ride.driver_current_lat, lng: ride.driver_current_lng, title: 'موقع السائق الحالي', iconColor: 'blue' });
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-950">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="sr-only">جاري تحميل صفحة التتبع...</span>
      </div>
    );
  }

  if (!ride) {
    return (
      <div className="container mx-auto p-4">
        <PageHeader title="تتبع الرحلة" description="تتبع رحلتك الحالية في الوقت الفعلي." backPath="/passenger-dashboard" />
        <Card className="text-center py-8">
          <CardContent>
            <MapPin className="h-12 w-12 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
            <CardTitle className="text-xl font-semibold mb-2">لا توجد رحلة نشطة للتتبع</CardTitle>
            <CardDescription>
              يمكنك طلب رحلة جديدة من لوحة التحكم الخاصة بك.
            </CardDescription>
            <Button onClick={() => window.history.back()} className="mt-4 bg-primary hover:bg-primary-dark text-primary-foreground">
              العودة إلى لوحة التحكم
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <PageHeader title="تتبع الرحلة" description="تتبع رحلتك الحالية في الوقت الفعلي." backPath="/passenger-dashboard" />

      <Card className="mb-6 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>رحلتك إلى {ride.destination}</span>
            <Badge variant="default" className="bg-blue-500">
              {ride.status === 'pending' ? 'قيد الانتظار' : ride.status === 'accepted' ? 'مقبولة' : 'غير معروف'}
            </Badge>
          </CardTitle>
          <CardDescription>
            السائق: {ride.driver_profiles?.full_name || 'جاري التعيين'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="h-[400px] w-full rounded-md overflow-hidden">
            <InteractiveMap markers={markers} center={{ lat: ride.driver_current_lat || ride.pickup_lat, lng: ride.driver_current_lng || ride.pickup_lng }} zoom={14} />
          </div>
          <div className="flex justify-center mt-4">
            <Button onClick={handleOpenChat} variant="outline" className="w-full max-w-xs">
              <MessageSquare className="h-4 w-4 ml-2 rtl:mr-2" />
              محادثة مع السائق
            </Button>
          </div>
        </CardContent>
      </Card>

      {currentUserId && ride.driver_id && (
        <ChatDialog
          open={isChatDialogOpen}
          onOpenChange={setIsChatDialogOpen}
          rideId={chatRideId}
          otherUserId={chatOtherUserId}
          otherUserName={chatOtherUserName}
          currentUserId={currentUserId}
        />
      )}
    </div>
  );
};

export default PassengerTrackingPage;