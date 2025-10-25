"use client";

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { ChevronLeft } from "lucide-react";
import { supabase } from "@/lib/supabase";

const RequestRidePage = () => {
  const navigate = useNavigate();
  const [pickupLocation, setPickupLocation] = useState("");
  const [destination, setDestination] = useState("");
  const [passengersCount, setPassengersCount] = useState("1");
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

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

  const handleSubmit = async (e: React.FormEvent) => {
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
    const { data, error } = await supabase.from('rides').insert([
      {
        passenger_id: userId,
        pickup_location: pickupLocation,
        destination: destination,
        passengers_count: parseInt(passengersCount),
        status: "pending",
      },
    ]).select();
    setLoading(false);

    if (error) {
      toast.error(`فشل طلب الرحلة: ${error.message}`);
      console.error("Error requesting ride:", error);
    } else {
      toast.success(`تم طلب رحلة من ${pickupLocation} إلى ${destination} لـ ${passengersCount} ركاب.`);
      navigate("/passenger-requests"); // Redirect to passenger requests page
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-950 p-4">
      <Card className="w-full max-w-md bg-white dark:bg-gray-900 shadow-lg rounded-lg">
        <CardHeader className="text-center">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/passenger-dashboard")}
            className="absolute top-4 right-4 rtl:left-4 rtl:right-auto"
          >
            <ChevronLeft className="h-6 w-6" />
            <span className="sr-only">العودة</span>
          </Button>
          <CardTitle className="text-3xl font-bold text-gray-900 dark:text-white">
            طلب رحلة جديدة
          </CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-400">
            املأ التفاصيل لطلب رحلتك
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="pickup-location">موقع الانطلاق</Label>
              <Input
                id="pickup-location"
                type="text"
                placeholder="أدخل موقع الانطلاق"
                value={pickupLocation}
                onChange={(e) => setPickupLocation(e.target.value)}
                required
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="destination">الوجهة</Label>
              <Input
                id="destination"
                type="text"
                placeholder="أدخل الوجهة"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                required
                className="mt-1"
              />
            </div>
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
            <Button type="submit" className="w-full bg-green-500 hover:bg-green-600 text-white mt-6" disabled={loading}>
              {loading ? "جاري طلب الرحلة..." : "طلب الرحلة"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default RequestRidePage;