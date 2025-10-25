"use client";

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { ChevronLeft } from "lucide-react";

const RequestRidePage = () => {
  const navigate = useNavigate();
  const [pickupLocation, setPickupLocation] = useState("");
  const [destination, setDestination] = useState("");
  const [passengers, setPassengers] = useState("1");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pickupLocation || !destination) {
      toast.error("الرجاء إدخال موقع الانطلاق والوجهة.");
      return;
    }
    // Simulate ride request
    toast.success(`تم طلب رحلة من ${pickupLocation} إلى ${destination} لـ ${passengers} ركاب.`);
    navigate("/passenger-dashboard");
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
              <Select value={passengers} onValueChange={setPassengers}>
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
            <Button type="submit" className="w-full bg-green-500 hover:bg-green-600 text-white mt-6">
              طلب الرحلة
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default RequestRidePage;