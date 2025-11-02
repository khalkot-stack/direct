"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useUser } from "@/context/UserContext";
import { Ride, RawRideData, ProfileDetails } from "@/types/supabase";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface ComplaintFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplaintSubmitted?: () => void;
}

const ComplaintFormDialog: React.FC<ComplaintFormDialogProps> = ({
  open,
  onOpenChange,
  onComplaintSubmitted,
}) => {
  const { user, loading: userLoading } = useUser();
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [selectedDriverId, setSelectedDriverId] = useState<string>("");
  const [selectedRideId, setSelectedRideId] = useState<string | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [availableRides, setAvailableRides] = useState<Ride[]>([]);
  const [availableDrivers, setAvailableDrivers] = useState<ProfileDetails[]>([]);

  const fetchPassengerData = useCallback(async () => {
    if (!user?.id) return;
    setLoadingData(true);

    // Fetch completed rides for the passenger
    const { data: ridesRaw, error: ridesError } = await supabase
      .from('rides')
      .select(`
        id,
        pickup_location,
        destination,
        driver_id,
        driver_profiles:driver_id(id, full_name)
      `)
      .eq('passenger_id', user.id)
      .eq('status', 'completed')
      .order('created_at', { ascending: false });

    if (ridesError) {
      toast.error(`فشل جلب الرحلات المكتملة: ${ridesError.message}`);
      console.error("Error fetching completed rides:", ridesError);
    } else {
      const formattedRides: Ride[] = (ridesRaw as RawRideData[] || []).map(ride => {
        const driverProfile = Array.isArray(ride.driver_profiles)
          ? ride.driver_profiles[0] || null
          : ride.driver_profiles;
        return {
          ...ride,
          driver_profiles: driverProfile,
        };
      }) as Ride[];
      setAvailableRides(formattedRides);

      // Extract unique drivers from these rides
      const uniqueDriversMap = new Map<string, ProfileDetails>();
      formattedRides.forEach(ride => {
        if (ride.driver_id && ride.driver_profiles) {
          uniqueDriversMap.set(ride.driver_id, {
            id: ride.driver_id,
            full_name: ride.driver_profiles.full_name,
            avatar_url: ride.driver_profiles.avatar_url,
          });
        }
      });
      setAvailableDrivers(Array.from(uniqueDriversMap.values()));
    }
    setLoadingData(false);
  }, [user?.id]);

  useEffect(() => {
    if (open && user?.id) {
      setSubject("");
      setDescription("");
      setSelectedDriverId("");
      setSelectedRideId(undefined);
      fetchPassengerData();
    }
  }, [open, user?.id, fetchPassengerData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) {
      toast.error("الرجاء تسجيل الدخول لتقديم شكوى.");
      return;
    }
    if (!subject.trim() || !description.trim() || !selectedDriverId) {
      toast.error("الرجاء ملء جميع الحقول المطلوبة (الموضوع، الوصف، والسائق).");
      return;
    }

    setIsSubmitting(true);
    
    const { data, error } = await supabase.from('complaints').insert({
      passenger_id: user.id,
      driver_id: selectedDriverId,
      ride_id: selectedRideId || null,
      subject: subject.trim(),
      description: description.trim(),
      status: 'pending',
    });
    setIsSubmitting(false);

    if (error) {
      toast.error(`فشل تقديم الشكوى: ${error.message}`);
      console.error("Error submitting complaint:", error);
    } else {
      toast.success("تم تقديم الشكوى بنجاح! سيتم مراجعتها قريبًا.");
      onOpenChange(false);
      onComplaintSubmitted?.();
    }
  };

  if (userLoading || loadingData) {
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
          <DialogTitle>تقديم شكوى جديدة</DialogTitle>
          <DialogDescription>
            الرجاء اختيار السائق والرحلة (اختياري) ووصف مشكلتك بالتفصيل.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid gap-1.5">
            <Label htmlFor="driver-select">السائق</Label>
            <Select value={selectedDriverId} onValueChange={setSelectedDriverId}>
              <SelectTrigger id="driver-select">
                <SelectValue placeholder="اختر السائق" />
              </SelectTrigger>
              <SelectContent>
                {availableDrivers.length === 0 ? (
                  <SelectItem value="no-drivers" disabled>لا يوجد سائقون متاحون للشكوى</SelectItem>
                ) : (
                  availableDrivers.map(driver => (
                    <SelectItem key={driver.id} value={driver.id}>
                      {driver.full_name || `سائق (${driver.id.substring(0, 8)}...)`}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="ride-select">الرحلة (اختياري)</Label>
            <Select
              value={selectedRideId || ""}
              onValueChange={(value) => setSelectedRideId(value === "null" ? undefined : value)}
              disabled={!selectedDriverId}
            >
              <SelectTrigger id="ride-select">
                <SelectValue placeholder="اختر الرحلة المتعلقة بالشكوى" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="null">لا توجد رحلة محددة</SelectItem>
                {availableRides
                  .filter(ride => ride.driver_id === selectedDriverId)
                  .map(ride => (
                    <SelectItem key={ride.id} value={ride.id}>
                      {ride.pickup_location} إلى {ride.destination} ({new Date(ride.created_at).toLocaleDateString('ar-SA')})
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="subject">الموضوع</Label>
            <Input
              id="subject"
              type="text"
              placeholder="مثال: سلوك غير لائق، تأخير، إلخ."
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              required
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="description">الوصف التفصيلي</Label>
            <Textarea
              id="description"
              placeholder="الرجاء تقديم أكبر قدر ممكن من التفاصيل حول المشكلة."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="col-span-3 resize-y"
              rows={5}
              required
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              إلغاء
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin ml-2 rtl:mr-2" />
                  جاري الإرسال...
                </>
              ) : (
                "إرسال الشكوى"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ComplaintFormDialog;