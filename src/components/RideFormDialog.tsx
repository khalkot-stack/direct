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

interface Ride {
  id: string;
  passenger: string;
  driver: string;
  pickup: string;
  destination: string;
  status: string;
}

interface RideFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ride?: Ride; // Optional ride object for editing
  onSave: (ride: Ride) => void;
}

const RideFormDialog: React.FC<RideFormDialogProps> = ({ open, onOpenChange, ride, onSave }) => {
  const [passenger, setPassenger] = useState(ride?.passenger || "");
  const [driver, setDriver] = useState(ride?.driver || "لا يوجد");
  const [pickup, setPickup] = useState(ride?.pickup || "");
  const [destination, setDestination] = useState(ride?.destination || "");
  const [status, setStatus] = useState(ride?.status || "قيد الانتظار");

  useEffect(() => {
    if (ride) {
      setPassenger(ride.passenger);
      setDriver(ride.driver);
      setPickup(ride.pickup);
      setDestination(ride.destination);
      setStatus(ride.status);
    } else {
      setPassenger("");
      setDriver("لا يوجد");
      setPickup("");
      setDestination("");
      setStatus("قيد الانتظار");
    }
  }, [ride, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!passenger || !pickup || !destination || !status) {
      toast.error("الرجاء ملء جميع الحقول المطلوبة.");
      return;
    }

    const newRide: Ride = {
      id: ride?.id || `R${Date.now()}`, // Generate a new ID if adding
      passenger,
      driver,
      pickup,
      destination,
      status,
    };
    onSave(newRide);
    onOpenChange(false); // Close dialog after saving
  };

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
            <Label htmlFor="passenger" className="text-right">
              الراكب
            </Label>
            <Input id="passenger" value={passenger} onChange={(e) => setPassenger(e.target.value)} className="col-span-3" required />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="driver" className="text-right">
              السائق
            </Label>
            <Input id="driver" value={driver} onChange={(e) => setDriver(e.target.value)} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="pickup" className="text-right">
              الانطلاق
            </Label>
            <Input id="pickup" value={pickup} onChange={(e) => setPickup(e.target.value)} className="col-span-3" required />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="destination" className="text-right">
              الوجهة
            </Label>
            <Input id="destination" value={destination} onChange={(e) => setDestination(e.target.value)} className="col-span-3" required />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="status" className="text-right">
              الحالة
            </Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="اختر حالة الرحلة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="قيد الانتظار">قيد الانتظار</SelectItem>
                <SelectItem value="مقبولة">مقبولة</SelectItem>
                <SelectItem value="مكتملة">مكتملة</SelectItem>
                <SelectItem value="ملغاة">ملغاة</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button type="submit">حفظ التغييرات</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default RideFormDialog;