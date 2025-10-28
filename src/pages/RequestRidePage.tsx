"use client";

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import PageHeader from "@/components/PageHeader";
import { Loader2 } from "lucide-react";

const RequestRidePage: React.FC = () => {
  const navigate = useNavigate();
  const [pickupLocation, setPickupLocation] = useState("");
  const [destination, setDestination] = useState("");
  const [passengers, setPassengers] = useState(1);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const getUserId = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
      } else {
        toast.error("الرجاء تسجيل الدخول لطلب رحلة.");
        navigate("/auth");
      }
    };
    getUserId();
  }, [navigate]);

  const handleRequestRide = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) {
      toast.error("خطأ: لم يتم العثور على معرف المستخدم.");
      return;
    }
    if (!pickupLocation || !destination) {
      toast.error("الرجاء إدخال موقع الانطلاق والوجهة.");
      return;
    }

    setLoading(true);

    // For simplicity, we'll use dummy lat/lng for now.
    // In a real app, you'd use a geocoding service to get these from the address.
    // A full map integration would be needed to get accurate coordinates.
    const dummyLat = 31.9539; // Amman latitude
    const dummyLng = 35.9106; // Amman longitude

    const { data, error } = await supabase
      .from('rides')
      .insert([
        {
          passenger_id: userId,
          pickup_location: pickupLocation,
          pickup_lat: dummyLat,
          pickup_lng: dummyLng,
          destination: destination,
          destination_lat: dummyLat + 0.01, // Slightly different for destination
          destination_lng: dummyLng + 0.01,
          passengers_count: passengers,
          status: 'pending',
        },
      ])
      .select();

    setLoading(false);

    if (error) {
      toast.error(`فشل طلب الرحلة: ${error.message}`);
      console.error("Error requesting ride:", error);
    } else {
      toast.success("تم طلب الرحلة بنجاح! جاري البحث عن سائق.");
      navigate("/passenger-dashboard/my-rides");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-950 p-4">
      <Card className="w-full max-w-md bg-white dark:bg-gray-900 shadow-lg rounded-lg">
        <div className="px-6 pt-0"> {/* Adjusted padding */}
          <PageHeader
            title="طلب رحلة جديدة"
            description="أدخل تفاصيل رحلتك وسنبحث لك عن سائق."
            backPath="/passenger-dashboard"
          />
        </div>
        <CardContent className="space-y-6">
          <form onSubmit={handleRequestRide} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="pickup-location">موقع الانطلاق</Label>
              <Input
                id="pickup-location"
                type="text"
                placeholder="أدخل موقع الانطلاق"
                value={pickupLocation}
                onChange={(e) => setPickupLocation(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="destination">الوجهة</Label>
              <Input
                id="destination"
                type="text"
                placeholder="أدخل الوجهة"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                required
              />
            </div>

            <div className="space-y-4">
              <Label htmlFor="passengers">عدد الركاب: {passengers}</Label>
              <Slider
                id="passengers"
                min={1}
                max={5}
                step={1}
                value={[passengers]}
                onValueChange={(val) => setPassengers(val[0])}
                className="w-full"
              />
            </div>

            <div className="flex gap-4">
              <Button
                type="submit"
                className="flex-1 bg-primary hover:bg-primary-dark text-primary-foreground text-lg py-6 rounded-lg shadow-lg transition-all duration-300 transform hover:scale-[1.01]"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin ml-2 rtl:mr-2" />
                    جاري طلب الرحلة...
                  </>
                ) : (
                  "طلب الرحلة"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default RequestRidePage;