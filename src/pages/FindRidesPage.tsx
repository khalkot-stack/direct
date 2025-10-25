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
    { id: "R001", pickup: "شارع الجامعة", destination: "دوار السابع", passengersCount: 2, time: "الآن" },
    { id: "R002", pickup: "العبدلي", destination: "الصويفية", passengersCount: 1, time: "خلال 15 دقيقة" },
    { id: "R003", pickup: "جبل عمان", destination: "المدينة الرياضية", passengersCount: 3, time: "خلال 30 دقيقة" },
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
              <div key={ride.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border rounded-md dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                <div className="text-right sm:text-left mb-2 sm:mb-0">
                  <p className="text-lg font-medium text-gray-900 dark:text-white">
                    من: {ride.pickup} إلى: {ride.destination}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    عدد الركاب: {ride.passengersCount} | الوقت: {ride.time}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/ride-details/${ride.id}`)}
                    className="text-blue-500 border-blue-500 hover:bg-blue-500 hover:text-white"
                  >
                    عرض التفاصيل
                  </Button>
                  <Button
                    onClick={() => handleAcceptRide(ride.id)}
                    className="bg-green-500 hover:bg-green-600 text-white"
                  >
                    قبول الرحلة
                  </Button>
                </div>
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