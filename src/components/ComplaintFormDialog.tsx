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
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useUser } from "@/context/UserContext";
import { ProfileDetails } from "@/types/supabase";

interface ComplaintFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  driverId: string;
  rideId?: string;
  driverName: string;
  onComplaintSubmitted?: () => void;
}

const ComplaintFormDialog: React.FC<ComplaintFormDialogProps> = ({
  open,
  onOpenChange,
  driverId,
  rideId,
  driverName,
  onComplaintSubmitted,
}) => {
  const { user, loading: userLoading } = useUser();
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!open) {
      setSubject("");
      setDescription("");
    }
  }, [open]);

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
    const { error } = await supabase.from('complaints').insert({
      passenger_id: user.id,
      driver_id: driverId,
      ride_id: rideId || null,
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

  if (userLoading) {
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
          <DialogTitle>تقديم شكوى ضد {driverName}</DialogTitle>
          <DialogDescription>
            الرجاء وصف مشكلتك بالتفصيل.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
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