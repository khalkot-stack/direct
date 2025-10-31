"use client";

import React, { useState, useEffect, useCallback } from "react";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Car } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import InteractiveMap from "@/components/InteractiveMap";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useUser } from "@/context/UserContext";

const rideRequestSchema = z.object({
  pickupLocation: z.string().min(3, { message: "موقع الانطلاق مطلوب." }),
  destination: z.string().min(3, { message: "الوجهة مطلوبة." }),
  passengersCount: z.number().min(1, { message: "يجب أن يكون عدد الركاب واحدًا على الأقل." }).max(10, { message: "الحد الأقصى لعدد الركاب هو 10." }),
});

type RideRequestInputs = z.infer<typeof rideRequestSchema>;

const RequestRidePage: React.FC = () => {
  const { user, loading: userLoading } = useUser();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const [pickupCoords, setPickupCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [destinationCoords, setDestinationCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number } | undefined>(undefined);
  const [mapMarkers, setMapMarkers] = useState<any[]>([]);

  const form = useForm<RideRequestInputs>({
    resolver: zodResolver(rideRequestSchema),
    defaultValues: {
      pickupLocation: "",
      destination: "",
      passengersCount: 1,
    },
  });

  const { watch, setValue, formState: { errors } } = form;
  const pickupLocation = watch("pickupLocation");
  const destination = watch("destination");

  useEffect(() => {
    if (!userLoading && !user) {
      toast.error("الرجاء تسجيل الدخول لطلب رحلة.");
      navigate("/auth");
    }
  }, [userLoading, user, navigate]);

  const geocodeAddress = useCallback(async (address: string) => {
    if (!import.meta.env.VITE_GOOGLE_MAPS_API_KEY) {
      toast.error("Google Maps API Key is not configured.");
      return null;
    }

    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}`
      );
      const data = await response.json();

      if (data.results && data.results.length > 0) {
        const { lat, lng } = data.results[0].geometry.location;
        return { lat, lng };
      } else {
        // toast.error(`لم يتم العثور على إحداثيات لـ: ${address}`); // Suppress frequent toasts for geocoding
        return null;
      }
    } catch (error) {
      console.error("Error geocoding address:", error);
      // toast.error("فشل تحديد الموقع الجغرافي. الرجاء المحاولة مرة أخرى."); // Suppress frequent toasts
      return null;
    }
  }, []);

  useEffect(() => {
    const updateMap = async () => {
      const newMarkers = [];
      let newCenter = undefined;

      if (pickupLocation) {
        const coords = await geocodeAddress(pickupLocation);
        setPickupCoords(coords);
        if (coords) {
          newMarkers.push({ id: 'pickup', lat: coords.lat, lng: coords.lng, title: 'موقع الانطلاق', iconColor: 'green' });
          newCenter = coords;
        }
      } else {
        setPickupCoords(null);
      }

      if (destination) {
        const coords = await geocodeAddress(destination);
        setDestinationCoords(coords);
        if (coords) {
          newMarkers.push({ id: 'destination', lat: coords.lat, lng: coords.lng, title: 'الوجهة', iconColor: 'red' });
          if (!newCenter) newCenter = coords;
        }
      } else {
        setDestinationCoords(null);
      }

      setMapMarkers(newMarkers);
      if (newCenter) {
        setMapCenter(newCenter);
      } else {
        setMapCenter(undefined);
      }
    };

    const delayDebounceFn = setTimeout(() => {
      updateMap();
    }, 1000);

    return () => clearTimeout(delayDebounceFn);
  }, [pickupLocation, destination, geocodeAddress]);

  const handleSubmit = async (values: RideRequestInputs) => {
    if (!user?.id) {
      toast.error("الرجاء تسجيل الدخول لطلب رحلة.");
      return;
    }
    if (!pickupCoords || !destinationCoords) {
      toast.error("الرجاء تحديد موقع الانطلاق والوجهة بشكل صحيح على الخريطة.");
      return;
    }

    setLoading(true);
    const { error } = await supabase.from('rides').insert({
      passenger_id: user.id,
      pickup_location: values.pickupLocation,
      destination: values.destination,
      passengers_count: values.passengersCount,
      status: 'pending',
      pickup_lat: pickupCoords.lat,
      pickup_lng: pickupCoords.lng,
      destination_lat: destinationCoords.lat,
      destination_lng: destinationCoords.lng,
    });
    setLoading(false);

    if (error) {
      toast.error(`فشل طلب الرحلة: ${error.message}`);
      console.error("Error requesting ride:", error);
    } else {
      toast.success("تم طلب رحلتك بنجاح! جاري البحث عن سائق.");
      navigate("/passenger-dashboard");
    }
  };

  if (userLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-950">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="sr-only">جاري التحميل...</span>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <PageHeader title="طلب رحلة جديدة" description="أدخل تفاصيل رحلتك وسنبحث عن سائق لك." backPath="/passenger-dashboard" />

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>تفاصيل الرحلة</CardTitle>
          <CardDescription>املأ الحقول أدناه لطلب رحلة.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="pickup-location">موقع الانطلاق</Label>
              <Input
                id="pickup-location"
                type="text"
                placeholder="أدخل موقع الانطلاق"
                {...form.register("pickupLocation")}
              />
              {errors.pickupLocation && (
                <p className="text-red-500 text-sm">{errors.pickupLocation.message}</p>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="destination">الوجهة</Label>
              <Input
                id="destination"
                type="text"
                placeholder="أدخل الوجهة"
                {...form.register("destination")}
              />
              {errors.destination && (
                <p className="text-red-500 text-sm">{errors.destination.message}</p>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="passengers-count">عدد الركاب</Label>
              <Input
                id="passengers-count"
                type="number"
                min="1"
                {...form.register("passengersCount", { valueAsNumber: true })}
                onChange={(e) => setValue("passengersCount", parseInt(e.target.value) || 1)}
              />
              {errors.passengersCount && (
                <p className="text-red-500 text-sm">{errors.passengersCount.message}</p>
              )}
            </div>
            <Button type="submit" className="w-full bg-primary hover:bg-primary-dark text-primary-foreground" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin ml-2 rtl:mr-2" />
                  جاري طلب الرحلة...
                </>
              ) : (
                <>
                  <Car className="h-4 w-4 ml-2 rtl:mr-2" />
                  طلب الرحلة
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>معاينة الخريطة</CardTitle>
          <CardDescription>تأكد من مواقع الانطلاق والوجهة على الخريطة.</CardDescription>
        </CardHeader>
        <CardContent>
          <InteractiveMap markers={mapMarkers} center={mapCenter} />
        </CardContent>
      </Card>
    </div>
  );
};

export default RequestRidePage;