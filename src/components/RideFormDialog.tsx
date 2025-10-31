"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { Loader2 } from "lucide-react";
import { Profile, Ride } from "@/types/supabase"; // Import shared types

interface RideFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ride?: Ride;
  onSave: (ride: Omit<Ride, 'created_at' | 'passenger_profiles' | 'driver_profiles' | 'cancellation_reason' | 'pickup_lat' | 'pickup_lng' | 'destination_lat' | 'destination_lng' | 'driver_current_lat' | 'driver_current_lng'>) => void;
}

const RideFormDialog: React.FC<RideFormDialogProps> = ({ open, onOpenChange, ride, onSave }) => {
  const [passengerId, setPassengerId] = useState(ride?.passenger_id || "");
  const [driverId, setDriverId] = useState<string | null>(ride?.driver_id || null);
  const [pickupLocation, setPickupLocation] = useState(ride?.pickup_location || "");
  const [destination, setDestination] = useState(ride?.destination || "");
  const [passengersCount, setPassengersCount] = useState(String(ride?.passengers_count || 1));
  const [status, setStatus] = useState<"pending" | "accepted" | "completed" | "cancelled">(ride?.status || "pending");
  const [passengers, setPassengers] = useState<Profile[]>([]);
  const [drivers, setDrivers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, user_type');

      if (profilesError) {
        toast.error(`فشل جلب المستخدمين: ${profilesError.message}`);
        console.error("Error fetching profiles:", profilesError);
      } else {
        setPassengers(profilesData.filter(p => p.user_type === 'passenger') as Profile[]);
        setDrivers(profilesData.filter(p => p.user_type === 'driver') as Profile[]);
      }
      setLoading(false);
    };

    fetchUsers();
  }, []);

  useEffect(() => {
    if (ride) {
      setPassengerId(ride.passenger_id);
      setDriverId(ride.driver_id);
      setPickupLocation(ride.pickup_location);
      setDestination(ride.destination);
      setPassengersCount(String(ride.passengers_count));
      setStatus(ride.status);
    } else {
      setPassengerId("");
      setDriverId(null);
      setPickupLocation("");
      setDestination("");
      setPassengersCount("1");
      setStatus("pending");
    }
  }, [ride, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!passengerId || !pickupLocation || !destination || !status || !passengersCount) {
      toast.error("الرجاء ملء جميع الحقول المطلوبة.");
      return;
    }

    const newRide: Omit<Ride, 'created_at' | 'passenger_profiles' | 'driver_profiles' | 'cancellation_reason' | 'pickup_lat' | 'pickup_lng' | 'destination_lat' | 'destination_lng' | 'driver_current_lat' | 'driver_current_lng'> = {
      id: ride?.id || "",
      passenger_id: passengerId,
      driver_id: driverId,
      pickup_location: pickupLocation,
      destination: destination,
      passengers_count: parseInt(passengersCount),
      status: status,
    };
    onSave(newRide);
  };

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>جاري التحميل...</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{ride ? "تعديل الرحلة" : "إضافة رحلة جديدة"}</DialogTitle>
          <DialogDescription>
            {ride ? "قم بتعديل تفاصيل الرحلة." : "أدخل تفاصيل الرحلة الجديدة هنا."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="passenger_id" className="text-right">
              الراكب
            </Label>
            <Select value={passengerId} onValueChange={setPassengerId}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="اختر الراكب" />
              </SelectTrigger>
              <SelectContent>
                {passengers.map(p => (
                  <SelectItem key={p.id} value={p.id}>{p.full_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="driver_id" className="text-right">
              السائق
            </Label>
            <Select value={driverId || ""} onValueChange={(value) => setDriverId(value === "null" ? null : value)}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="اختر السائق (اختياري)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="null">لا يوجد</SelectItem>
                {drivers.map(d => (
                  <SelectItem key={d.id} value={d.id}>{d.full_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="pickup_location" className="text-right">
              الانطلاق
            </Label>
            <Input id="pickup_location" value={pickupLocation} onChange={(e) => setPickupLocation(e.target.value)} className="col-span-3" required />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="destination" className="text-right">
              الوجهة
            </Label>
            <Input id="destination" value={destination} onChange={(e) => setDestination(e.target.value)} className="col-span-3" required />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="passengers_count" className="text-right">
              عدد الركاب
            </Label>
            <Input id="passengers_count" type="number" min="1" value={passengersCount} onChange={(e) => setPassengersCount(e.target.value)} className="col-span-3" required />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="status" className="text-right">
              الحالة
            </Label>
            <Select value={status} onValueChange={(value: "pending" | "accepted" | "completed" | "cancelled") => setStatus(value)}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="اختر حالة الرحلة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">قيد الانتظار</SelectItem>
                <SelectItem value="accepted">مقبولة</SelectItem>
                <SelectItem value="completed">مكتملة</SelectItem>
                <SelectItem value="cancelled">ملغاة</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button type="submit" className="bg-primary hover:bg-primary-dark text-primary-foreground">حفظ التغييرات</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default RideFormDialog;