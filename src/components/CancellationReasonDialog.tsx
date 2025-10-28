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
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

interface CancellationReasonDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (reason: string) => void;
  isSubmitting: boolean;
}

const predefinedReasons = [
  "تغيرت خططي",
  "لم يعد السائق متاحًا",
  "وجدت رحلة أخرى",
  "مشكلة في التطبيق",
  "سبب آخر (يرجى التحديد)",
];

const CancellationReasonDialog: React.FC<CancellationReasonDialogProps> = ({
  open,
  onOpenChange,
  onConfirm,
  isSubmitting,
}) => {
  const [selectedReason, setSelectedReason] = useState("");
  const [customReason, setCustomReason] = useState("");

  useEffect(() => {
    if (!open) {
      setSelectedReason("");
      setCustomReason("");
    }
  }, [open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let finalReason = selectedReason;
    if (selectedReason === "سبب آخر (يرجى التحديد)") {
      finalReason = customReason.trim();
      if (!finalReason) {
        toast.error("الرجاء إدخال سبب الإلغاء المخصص.");
        return;
      }
    } else if (!selectedReason) {
      toast.error("الرجاء اختيار سبب للإلغاء.");
      return;
    }
    onConfirm(finalReason);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>لماذا تقوم بإلغاء الرحلة؟</DialogTitle>
          <DialogDescription>
            الرجاء اختيار سبب الإلغاء لمساعدتنا في تحسين الخدمة.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <RadioGroup
            onValueChange={setSelectedReason}
            value={selectedReason}
            className="grid gap-2"
          >
            {predefinedReasons.map((reason) => (
              <div key={reason} className="flex items-center space-x-2 rtl:space-x-reverse">
                <RadioGroupItem value={reason} id={`reason-${reason}`} />
                <Label htmlFor={`reason-${reason}`}>{reason}</Label>
              </div>
            ))}
          </RadioGroup>

          {selectedReason === "سبب آخر (يرجى التحديد)" && (
            <div className="grid gap-1.5 mt-2">
              <Label htmlFor="custom-reason">سبب مخصص</Label>
              <Textarea
                id="custom-reason"
                placeholder="اكتب سبب الإلغاء هنا..."
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                className="resize-y"
                rows={3}
              />
            </div>
          )}

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
                "تأكيد الإلغاء"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CancellationReasonDialog;