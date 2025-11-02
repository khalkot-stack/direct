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
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useUser } from "@/context/UserContext";
import { Ride, ProfileDetails } from "@/types/supabase";

interface ComplaintFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: () => void; // Callback to refresh complaints list
}

const ComplaintFormDialog: React.FC<ComplaintFormDialogProps> = ({ open, onOpenChange, onSave }) => {
  const { user } = useUser(); // Removed userLoading
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [selectedRideId, setSelectedRideId] = useState<string | null>(null);
  const [passengerCompletedRides, setPassengerCompletedRides] = useState<Ride[]>([]);
  const [loadingRides, setLoadingRides] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open && user?.id) {
      const fetchCompletedRides = async () => {
        setLoadingRides(true);
        const { data, error } = await supabase
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

        if (error) {
          toast.error(`فشل جلب الرحلات المكتملة: ${error.message}`);
          console.error("Error fetching completed rides for complaint:", error);
          setPassengerCompletedRides([]);
        } else {
          const formattedRides: Ride[] = (data || []).map(ride => ({
            ...ride,
            driver_profiles: Array.isArray(ride.driver_profiles) ? ride.driver_profiles[0] : ride.driver_profiles,
          })) as Ride[];
          setPassengerCompletedRides(formattedRides);
        }
        setLoadingRides(false);
      };
      fetchCompletedRides();
    } else if (!open) {
      // Reset form when dialog closes
      setSubject("");
      setDescription("");
      setSelectedRideId(null);
    }
  }, [open, user?.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) {
      toast.error("الرجاء تسجيل الدخول لتقديم شكوى.");
      return;
    }
    if (!subject.trim() || !description.trim()) {
      toast.error("الرجاء ملء جميع الحقول المطلوبة.");
      return;
    }

    setIsSubmitting(true);

    let driverIdToComplainAbout: string | null = null;
    if (selectedRideId) {
      const selectedRide = passengerCompletedRides.find(ride => ride.id === selectedRideId);
      driverIdToComplainAbout = selectedRide?.driver_id || null;
    }

    const { error } = await supabase.from('complaints').insert({
      passenger_id: user.id,
      ride_id: selectedRideId,
      driver_id: driverIdToComplainAbout,
      subject: subject.trim(),
      description: description.trim(),
      status: 'pending',
    });

    setIsSubmitting(false);

    if (error) {
      toast.error(`فشل تقديم الشكوى: ${error.message}`);
      console.error("Error submitting complaint:", error);
    } else {
      toast.success("تم تقديم الشكوى بنجاح! سيتم مراجعتها من قبل الإدارة.");
      onOpenChange(false);
      onSave(); // Trigger refresh in parent
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>تقديم شكوى جديدة</DialogTitle>
          <DialogDescription>
            الرجاء وصف مشكلتك بالتفصيل. سيتم مراجعتها من قبل فريق الإدارة.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid gap-1.5">
            <Label htmlFor="ride">الرحلة المتعلقة (اختياري)</Label>
            {loadingRides ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>جاري تحميل الرحلات...</span>
              </div>
            ) : (
              <Select value={selectedRideId || ""} onValueChange={setSelectedRideId}>
                <SelectTrigger id="ride">
                  <SelectValue placeholder="اختر رحلة (إذا كانت الشكوى متعلقة برحلة معينة)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="null">لا توجد رحلة محددة</SelectItem>
                  {passengerCompletedRides.map(ride => (
                    <SelectItem key={ride.id} value={ride.id}>
                      من {ride.pickup_location} إلى {ride.destination} (السائق: {(ride.driver_profiles as ProfileDetails)?.full_name || 'غير معروف'})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="subject">الموضوع</Label>
            <Input
              id="subject"
              placeholder="مثال: سلوك غير لائق من السائق"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              required
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="description">الوصف التفصيلي</Label>
            <Textarea
              id="description"
              placeholder="الرجاء وصف ما حدث بالتفصيل..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="resize-y"
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
                "تقديم الشكوى"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ComplaintFormDialog;