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

const RequestRidePage: React.FC = () => {
  const [pickupLocation, setPickupLocation] = useState("");
  const [destination, setDestination] = useState("");
  const [passengersCount, setPassengersCount] = useState(1);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const navigate = useNavigate();

  const [pickupCoords, setPickupCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [destinationCoords, setDestinationCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number } | undefined>(undefined);
  const [mapMarkers, setMapMarkers] = useState<any[]>([]);

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
        toast.error(`لم يتم العثور على إحداثيات لـ: ${address}`);
        return null;
      }
    } catch (error) {
      console.error("Error geocoding address:", error);
      toast.error("فشل تحديد الموقع الجغرافي. الرجاء المحاولة مرة أخرى.");
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
          if (!newCenter) newCenter = coords; // If only destination is set, center on it
        }
      } else {
        setDestinationCoords(null);
      }

      setMapMarkers(newMarkers);
      if (newCenter) {
        setMapCenter(newCenter);
      } else {
        setMapCenter(undefined); // Reset to default if no locations
      }
    };

    const delayDebounceFn = setTimeout(() => {
      updateMap();
    }, 1000); // Debounce for 1 second

    return () => clearTimeout(delayDebounceFn);
  }, [pickupLocation, destination, geocodeAddress]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) {
      toast.error("الرجاء تسجيل الدخول لطلب رحلة.");
      return;
    }
    if (!pickupLocation || !destination || !pickupCoords || !destinationCoords) {
      toast.error("الرجاء تحديد موقع الانطلاق والوجهة بشكل صحيح.");
      return;
    }
    if (passengersCount <= 0) {
      toast.error("يجب أن يكون عدد الركاب واحدًا على الأقل.");
      return;
    }

    setLoading(true);
    const { error } = await supabase.from('rides').insert({
      passenger_id: userId,
      pickup_location: pickupLocation,
      destination: destination,
      passengers_count: passengersCount,
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

  return (
    <div className="container mx-auto p-4">
      <PageHeader title="طلب رحلة جديدة" description="أدخل تفاصيل رحلتك وسنبحث عن سائق لك." backPath="/passenger-dashboard" />

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>تفاصيل الرحلة</CardTitle>
          <CardDescription>املأ الحقول أدناه لطلب رحلة.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-2">
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
            <div className="grid gap-2">
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
            <div className="grid gap-2">
              <Label htmlFor="passengers-count">عدد الركاب</Label>
              <Input
                id="passengers-count"
                type="number"
                min="1"
                value={passengersCount}
                onChange={(e) => setPassengersCount(parseInt(e.target.value) || 1)}
                required
              />
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