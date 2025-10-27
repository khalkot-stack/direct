"use client";

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { MapPin, Users } from "lucide-react";
import { supabase } from "@/lib/supabase";
import LocationPickerMap from "@/components/LocationPickerMap";
import PageHeader from "@/components/PageHeader"; // Import PageHeader

interface LocationData {
  lat: number;
  lng: number;
  address: string;
}

const RequestRidePage = () => {
  const navigate = useNavigate();
  const [pickupLocation, setPickupLocation] = useState<LocationData | null>(null);
  const [destination, setDestination] = useState<LocationData | null>(null);
  const [passengersCount, setPassengersCount] = useState("1");
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [step, setStep] = useState(1); // 1: Input details, 2: Confirm ride

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
      } else {
        toast.error("الرجاء تسجيل الدخول لطلب رحلة.");
        navigate("/auth");
      }
    };
    fetchUser();
  }, [navigate]);

  const handleRequestSubmit = async () => {
    if (!userId) {
      toast.error("خطأ: لم يتم العثور على معرف المستخدم.");
      return;
    }
    if (!pickupLocation || !destination) {
      toast.error("الرجاء تحديد موقع الانطلاق والوجهة على الخريطة.");
      return;
    }

    setLoading(true);
    const { data, error } = await supabase.from('rides').insert([
      {
        passenger_id: userId,
        pickup_location: pickupLocation.address,
        pickup_lat: pickupLocation.lat,
        pickup_lng: pickupLocation.lng,
        destination: destination.address,
        destination_lat: destination.lat,
        destination_lng: destination.lng,
        passengers_count: parseInt(passengersCount),
        status: "pending",
      },
    ]).select();
    setLoading(false);

    if (error) {
      toast.error(`فشل طلب الرحلة: ${error.message}`);
      console.error("Error requesting ride:", error);
    } else {
      toast.success(`تم طلب رحلة من ${pickupLocation.address} إلى ${destination.address} لـ ${passengersCount} ركاب.`);
      navigate("/passenger-requests");
    }
  };

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pickupLocation || !destination || !pickupLocation.address || !destination.address) {
      toast.error("الرجاء تحديد موقع الانطلاق والوجهة بشكل صحيح.");
      return;
    }
    setStep(2);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-950 p-4">
      <Card className="w-full max-w-md bg-white dark:bg-gray-900 shadow-lg rounded-lg">
        <div className="p-6">
          <PageHeader
            title="طلب رحلة جديدة"
            description={step === 1 ? "املأ التفاصيل لطلب رحلتك" : "تأكيد تفاصيل رحلتك"}
            backPath={step === 1 ? "/passenger-dashboard" : undefined}
          />
        </div>
        <CardContent>
          {step === 1 && (
            <form onSubmit={handleNextStep} className="space-y-6">
              <LocationPickerMap
                label="موقع الانطلاق"
                onLocationSelect={setPickupLocation}
                initialLocation={pickupLocation || undefined}
              />
              <LocationPickerMap
                label="الوجهة"
                onLocationSelect={setDestination}
                initialLocation={destination || undefined}
              />
              <div>
                <Label htmlFor="passengers">عدد الركاب</Label>
                <Select value={passengersCount} onValueChange={setPassengersCount}>
                  <SelectTrigger id="passengers" className="w-full mt-1">
                    <SelectValue placeholder="اختر عدد الركاب" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 راكب</SelectItem>
                    <SelectItem value="2">2 ركاب</SelectItem>
                    <SelectItem value="3">3 ركاب</SelectItem>
                    <SelectItem value="4">4 ركاب</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full bg-primary hover:bg-primary-dark text-primary-foreground mt-6">
                التالي
              </Button>
            </form>
          )}

          {step === 2 && (
            <div className="space-y-6 text-right">
              <div className="flex items-center gap-3">
                <MapPin className="h-5 w-5 text-muted-foreground" />
                <p className="text-lg text-gray-800 dark:text-gray-200">
                  <span className="font-semibold">من:</span> {pickupLocation?.address}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="h-5 w-5 text-muted-foreground" />
                <p className="text-lg text-gray-800 dark:text-gray-200">
                  <span className="font-semibold">إلى:</span> {destination?.address}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-muted-foreground" />
                <p className="text-lg text-gray-800 dark:text-gray-200">
                  <span className="font-semibold">عدد الركاب:</span> {passengersCount}
                </p>
              </div>
              <div className="flex justify-between gap-4 mt-6">
                <Button variant="outline" onClick={() => setStep(1)} className="flex-1 text-primary border-primary hover:bg-primary hover:text-primary-foreground">
                  تعديل
                </Button>
                <Button onClick={handleRequestSubmit} className="flex-1 bg-primary hover:bg-primary-dark text-primary-foreground" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin ml-2 rtl:mr-2" />
                      جاري طلب الرحلة...
                    </>
                  ) : (
                    "تأكيد وطلب الرحلة"
                  )}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default RequestRidePage;