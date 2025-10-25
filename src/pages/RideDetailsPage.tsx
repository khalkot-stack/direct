"use client";

import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, MapPin, User, Car, Info } from "lucide-react";

// Dummy data for rides
const dummyRides = [
  { id: "req1", passenger: "ليلى خالد", driver: "لا يوجد", pickup: "شارع الجامعة", destination: "دوار السابع", passengersCount: 2, status: "قيد الانتظار" },
  { id: "req2", passenger: "سارة علي", driver: "أحمد محمود", pickup: "العبدلي", destination: "الصويفية", passengersCount: 1, status: "مقبولة" },
  { id: "req3", passenger: "يوسف حسن", driver: "فاطمة سعيد", pickup: "جبل عمان", destination: "المدينة الرياضية", passengersCount: 3, status: "مكتملة" },
  { id: "R001", passenger: "سارة علي", driver: "أحمد محمود", pickup: "شارع الجامعة", destination: "دوار السابع", passengersCount: 2, status: "مكتملة" },
  { id: "R002", passenger: "ليلى خالد", driver: "لا يوجد", pickup: "العبدلي", destination: "الصويفية", passengersCount: 1, status: "قيد الانتظار" },
  { id: "R003", passenger: "يوسف حسن", driver: "فاطمة سعيد", pickup: "جبل عمان", destination: "المدينة الرياضية", passengersCount: 3, status: "ملغاة" },
  { id: "R004", passenger: "علياء محمد", driver: "محمد سعيد", pickup: "الشميساني", destination: "مجمع رغدان", passengersCount: 1, status: "مكتملة" },
  { id: "R005", passenger: "خالد فهد", driver: "لا يوجد", pickup: "الجبيهة", destination: "وسط البلد", passengersCount: 2, status: "قيد الانتظار" },
];

const RideDetailsPage = () => {
  const { rideId } = useParams<{ rideId: string }>();
  const navigate = useNavigate();

  const ride = dummyRides.find(r => r.id === rideId);

  if (!ride) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-950 p-4">
        <Card className="w-full max-w-md bg-white dark:bg-gray-900 shadow-lg rounded-lg text-center">
          <CardHeader>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              className="absolute top-4 right-4 rtl:left-4 rtl:right-auto"
            >
              <ChevronLeft className="h-6 w-6" />
              <span className="sr-only">العودة</span>
            </Button>
            <CardTitle className="text-3xl font-bold text-gray-900 dark:text-white">
              الرحلة غير موجودة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 dark:text-gray-400">
              عذرًا، لم نتمكن من العثور على تفاصيل الرحلة المطلوبة.
            </p>
            <Button onClick={() => navigate(-1)} className="mt-6 bg-blue-500 hover:bg-blue-600 text-white">
              العودة
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-950 p-4">
      <Card className="w-full max-w-md bg-white dark:bg-gray-900 shadow-lg rounded-lg">
        <CardHeader className="text-center">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="absolute top-4 right-4 rtl:left-4 rtl:right-auto"
          >
            <ChevronLeft className="h-6 w-6" />
            <span className="sr-only">العودة</span>
          </Button>
          <CardTitle className="text-3xl font-bold text-gray-900 dark:text-white">
            تفاصيل الرحلة #{ride.id}
          </CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-400">
            معلومات مفصلة عن الرحلة
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-right">
          <div className="flex items-center gap-3">
            <MapPin className="h-5 w-5 text-gray-500 dark:text-gray-400" />
            <p className="text-lg text-gray-800 dark:text-gray-200">
              <span className="font-semibold">من:</span> {ride.pickup}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <MapPin className="h-5 w-5 text-gray-500 dark:text-gray-400" />
            <p className="text-lg text-gray-800 dark:text-gray-200">
              <span className="font-semibold">إلى:</span> {ride.destination}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <User className="h-5 w-5 text-gray-500 dark:text-gray-400" />
            <p className="text-lg text-gray-800 dark:text-gray-200">
              <span className="font-semibold">الراكب:</span> {ride.passenger}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Car className="h-5 w-5 text-gray-500 dark:text-gray-400" />
            <p className="text-lg text-gray-800 dark:text-gray-200">
              <span className="font-semibold">السائق:</span> {ride.driver}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Users className="h-5 w-5 text-gray-500 dark:text-gray-400" />
            <p className="text-lg text-gray-800 dark:text-gray-200">
              <span className="font-semibold">عدد الركاب:</span> {ride.passengersCount}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Info className="h-5 w-5 text-gray-500 dark:text-gray-400" />
            <p className="text-lg text-gray-800 dark:text-gray-200">
              <span className="font-semibold">الحالة:</span> {ride.status}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RideDetailsPage;