"use client";

import React from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { toast } from "sonner";

const FindRidesPage = () => {
  const navigate = useNavigate();

  // Dummy ride requests for demonstration
  const rideRequests = [
    { id: "1", pickup: "شارع الجامعة", destination: "دوار السابع", passengers: 2, time: "الآن" },
    { id: "2", pickup: "العبدلي", destination: "الصويفية", passengers: 1, time: "خلال 15 دقيقة" },
    { id: "3", pickup: "جبل عمان", destination: "المدينة الرياضية", passengers: 3, time: "خلال 30 دقيقة" },
  ];

  const handleAcceptRide = (rideId: string) => {
    toast.success(`تم قبول الرحلة رقم ${rideId}.`);
    // In a real app, you would send this to a backend
    navigate("/driver-dashboard"); // Redirect back to dashboard after accepting
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-950 p-4">
      <Card className="w-full max-w-2xl bg-white dark:bg-gray-900 shadow-lg rounded-lg">
        <CardHeader className="text-center">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/driver-dashboard")}
            className="absolute top-4 right-4 rtl:left-4 rtl:right-auto"
          >
            <ChevronLeft className="h-6 w-6" />
            <span className="sr-only">العودة</span>
          </Button>
          <CardTitle className="text-3xl font-bold text-gray-900 dark:text-white">
            البحث عن ركاب
          </CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-400">
            الرحلات المتاحة حالياً
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {rideRequests.length > 0 ? (
            rideRequests.map((ride) => (
              <div key={ride.id} className="flex items-center justify-between p-4 border rounded-md dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                <div>
                  <p className="text-lg font-medium text-gray-900 dark:text-white">
                    من: {ride.pickup} إلى: {ride.destination}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    عدد الركاب: {ride.passengers} | الوقت: {ride.time}
                  </p>
                </div>
                <Button
                  onClick={() => handleAcceptRide(ride.id)}
                  className="bg-green-500 hover:bg-green-600 text-white"
                >
                  قبول الرحلة
                </Button>
              </div>
            ))
          ) : (
            <p className="text-center text-gray-600 dark:text-gray-400">لا توجد رحلات متاحة حالياً.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default FindRidesPage;