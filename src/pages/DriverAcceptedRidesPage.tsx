"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Loader2, Car, MapPin, Calendar, Clock, User, Phone, DollarSign, Info } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ar } from "date-fns/locale"; // Import Arabic locale

interface Ride {
  id: string;
  driver_id: string;
  passenger_id: string;
  origin: string;
  destination: string;
  status: "pending" | "accepted" | "completed" | "cancelled";
  price: number;
  requested_at: string;
  accepted_at: string | null;
  completed_at: string | null;
  cancelled_at: string | null;
  ride_date: string;
  ride_time: string;
  passengers_count: number;
  driver_notes: string | null;
  passenger_notes: string | null;
  profiles: {
    full_name: string;
    phone_number: string;
    avatar_url: string | null;
  } | null;
}

export default function DriverAcceptedRidesPage() {
  const [acceptedRides, setAcceptedRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDriverId, setCurrentDriverId] = useState<string | null>(null);
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const [selectedRideToCancel, setSelectedRideToCancel] = useState<Ride | null>(null);
  const [isCompletingRide, setIsCompletingRide] = useState(false);
  const [isCancellingRide, setIsCancellingRide] = useState(false);

  useEffect(() => {
    const fetchDriverId = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentDriverId(user.id);
      } else {
        toast.error("الرجاء تسجيل الدخول لعرض رحلاتك المقبولة.");
        setLoading(false);
      }
    };
    fetchDriverId();
  }, []);

  useEffect(() => {
    if (currentDriverId) {
      fetchAcceptedRides(currentDriverId);
    }
  }, [currentDriverId]);

  const fetchAcceptedRides = async (driverId: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("rides")
        .select(`
          *,
          profiles (
            full_name,
            phone_number,
            avatar_url
          )
        `)
        .eq("driver_id", driverId)
        .eq("status", "accepted")
        .order("ride_date", { ascending: true })
        .order("ride_time", { ascending: true });

      if (error) throw error;

      setAcceptedRides(data as Ride[]);
    } catch (error) {
      toast.error("فشل تحميل الرحلات المقبولة.");
      console.error("Error fetching accepted rides:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteRide = async (rideId: string) => {
    setIsCompletingRide(true);
    try {
      const { error } = await supabase
        .from("rides")
        .update({ status: "completed", completed_at: new Date().toISOString() })
        .eq("id", rideId);

      if (error) throw error;

      toast.success("تم إكمال الرحلة بنجاح!");
      if (currentDriverId) {
        fetchAcceptedRides(currentDriverId); // Refresh the list
      }
    } catch (error) {
      toast.error("فشل إكمال الرحلة.");
      console.error("Error completing ride:", error);
    } finally {
      setIsCompletingRide(false);
    }
  };

  const handleCancelRide = async () => {
    if (!selectedRideToCancel) return;

    setIsCancellingRide(true);
    try {
      const { error } = await supabase
        .from("rides")
        .update({ status: "cancelled", cancelled_at: new Date().toISOString() })
        .eq("id", selectedRideToCancel.id);

      if (error) throw error;

      toast.success("تم إلغاء الرحلة بنجاح!");
      setIsCancelDialogOpen(false);
      setSelectedRideToCancel(null);
      if (currentDriverId) {
        fetchAcceptedRides(currentDriverId); // Refresh the list
      }
    } catch (error) {
      toast.error("فشل إلغاء الرحلة.");
      console.error("Error cancelling ride:", error);
    } finally {
      setIsCancellingRide(false);
    }
  };

  const openCancelDialog = (ride: Ride) => {
    setSelectedRideToCancel(ride);
    setIsCancelDialogOpen(true);
  };

  const closeCancelDialog = () => {
    setIsCancelDialogOpen(false);
    setSelectedRideToCancel(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-950">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="sr-only">جاري تحميل الرحلات...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-100 dark:bg-gray-950 p-4"> {/* Removed items-center justify-center */}
      <Card className="w-full max-w-2xl bg-white dark:bg-gray-900 shadow-lg rounded-lg mx-auto mt-8"> {/* Added mx-auto mt-8 for centering and top margin */}
        <div className="p-6">
          <PageHeader
            title="رحلاتي المقبولة"
            description="عرض وإدارة الرحلات التي قبلتها"
            backPath="/driver-dashboard"
          />
        </div>
        <CardContent className="space-y-4">
          {acceptedRides.length === 0 ? (
            <p className="text-center text-gray-600 dark:text-gray-400">لا توجد رحلات مقبولة حاليًا.</p>
          ) : (
            acceptedRides.map((ride) => (
              <Card key={ride.id} className="border-l-4 border-primary shadow-sm hover:shadow-md transition-shadow duration-200">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center justify-between text-lg">
                    <div className="flex items-center">
                      <MapPin className="h-5 w-5 text-primary ml-2 rtl:mr-2" />
                      <span>{ride.origin} <span className="mx-1">إلى</span> {ride.destination}</span>
                    </div>
                    <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                      مقبولة
                    </Badge>
                  </CardTitle>
                  <CardDescription className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                    <Calendar className="h-4 w-4 ml-1 rtl:mr-1" />
                    {format(new Date(`${ride.ride_date}T${ride.ride_time}`), "EEEE, dd MMMM yyyy", { locale: ar })}
                    <Clock className="h-4 w-4 ml-3 rtl:mr-3" />
                    {format(new Date(`${ride.ride_date}T${ride.ride_time}`), "hh:mm a", { locale: ar })}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="flex items-center text-gray-700 dark:text-gray-300">
                    <User className="h-4 w-4 ml-2 rtl:mr-2" />
                    الراكب: {ride.profiles?.full_name || "غير معروف"}
                  </div>
                  <div className="flex items-center text-gray-700 dark:text-gray-300">
                    <Phone className="h-4 w-4 ml-2 rtl:mr-2" />
                    رقم الراكب: {ride.profiles?.phone_number || "غير متاح"}
                  </div>
                  <div className="flex items-center text-gray-700 dark:text-gray-300">
                    <DollarSign className="h-4 w-4 ml-2 rtl:mr-2" />
                    السعر: {ride.price} ريال
                  </div>
                  <div className="flex items-center text-gray-700 dark:text-gray-300">
                    <User className="h-4 w-4 ml-2 rtl:mr-2" />
                    عدد الركاب: {ride.passengers_count}
                  </div>
                  {ride.passenger_notes && (
                    <div className="flex items-start text-gray-700 dark:text-gray-300">
                      <Info className="h-4 w-4 ml-2 rtl:mr-2 mt-1 flex-shrink-0" />
                      ملاحظات الراكب: {ride.passenger_notes}
                    </div>
                  )}
                  <div className="flex justify-end space-x-2 rtl:space-x-reverse mt-4">
                    <Button
                      variant="destructive"
                      onClick={() => openCancelDialog(ride)}
                      disabled={isCancellingRide || isCompletingRide}
                      className="transition-transform duration-200 ease-in-out hover:scale-[1.02]"
                    >
                      {isCancellingRide && selectedRideToCancel?.id === ride.id ? (
                        <Loader2 className="h-4 w-4 animate-spin ml-2 rtl:mr-2" />
                      ) : (
                        "إلغاء الرحلة"
                      )}
                    </Button>
                    <Button
                      onClick={() => handleCompleteRide(ride.id)}
                      disabled={isCompletingRide || isCancellingRide}
                      className="bg-green-600 hover:bg-green-700 text-white transition-transform duration-200 ease-in-out hover:scale-[1.02]"
                    >
                      {isCompletingRide ? (
                        <Loader2 className="h-4 w-4 animate-spin ml-2 rtl:mr-2" />
                      ) : (
                        "إكمال الرحلة"
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </CardContent>
      </Card>

      <Dialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تأكيد إلغاء الرحلة</DialogTitle>
            <DialogDescription>
              هل أنت متأكد أنك تريد إلغاء هذه الرحلة؟ هذا الإجراء لا يمكن التراجع عنه.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={closeCancelDialog} disabled={isCancellingRide}>
              إلغاء
            </Button>
            <Button variant="destructive" onClick={handleCancelRide} disabled={isCancellingRide}>
              {isCancellingRide ? (
                <Loader2 className="h-4 w-4 animate-spin ml-2 rtl:mr-2" />
              ) : (
                "تأكيد الإلغاء"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}