"use client";

import React from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";

const PassengerRequestsPage = () => {
  const navigate = useNavigate();

  // Dummy ride requests for demonstration
  const passengerRequests = [
    { id: "req1", pickup: "شارع الجامعة", destination: "دوار السابع", passengersCount: 2, status: "قيد الانتظار", driver: "لا يوجد" },
    { id: "req2", pickup: "العبدلي", destination: "الصويفية", passengersCount: 1, status: "مقبولة", driver: "أحمد محمود" },
    { id: "req3", pickup: "جبل عمان", destination: "المدينة الرياضية", passengersCount: 3, status: "مكتملة", driver: "سارة علي" },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-950 p-4">
      <Card className="w-full max-w-2xl bg-white dark:bg-gray-900 shadow-lg rounded-lg">
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
            طلبات رحلاتي
          </CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-400">
            عرض حالة طلبات رحلاتك
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {passengerRequests.length > 0 ? (
            passengerRequests.map((request) => (
              <div key={request.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border rounded-md dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                <div className="text-right sm:text-left mb-2 sm:mb-0">
                  <p className="text-lg font-medium text-gray-900 dark:text-white">
                    من: {request.pickup} إلى: {request.destination}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    عدد الركاب: {request.passengersCount} | الحالة: {request.status}
                  </p>
                  {request.driver !== "لا يوجد" && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      السائق: {request.driver}
                    </p>
                  )}
                </div>
                <Button
                  variant="outline"
                  className="text-blue-500 border-blue-500 hover:bg-blue-500 hover:text-white text-sm px-4 py-2 rounded-lg shadow-md"
                  onClick={() => navigate(`/ride-details/${request.id}`)}
                >
                  عرض التفاصيل
                </Button>
              </div>
            ))
          ) : (
            <p className="text-center text-gray-600 dark:text-gray-400">لم تقم بطلب أي رحلات بعد.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PassengerRequestsPage;