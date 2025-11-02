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
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

const rideRequestSchema = z.object({
  pickupLocation: z.string().min(3, { message: "موقع الانطلاق مطلوب." }),
  destination: z.string().min(3, { message: "الوجهة مطلوبة." }),
  passengersCount: z.number().min(1, { message: "يجب أن يكون عدد الركاب واحدًا على الأقل." }).max(10, { message: "الحد الأقصى لعدد الركاب هو 10." }),
});

type RideRequestInputs = z.infer<typeof rideRequestSchema>;

interface RequestRideDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (values: RideRequestInputs) => Promise<void>;
  isSubmitting: boolean;
}

const RequestRideDialog: React.FC<RequestRideDialogProps> = ({
  open,
  onOpenChange,
  onSave,
  isSubmitting,
}) => {
  const form = useForm<RideRequestInputs>({
    resolver: zodResolver(rideRequestSchema),
    defaultValues: {
      pickupLocation: "",
      destination: "",
      passengersCount: 1,
    },
  });

  useEffect(() => {
    if (!open) {
      form.reset();
    }
  }, [open, form]);

  const handleSubmit = async (values: RideRequestInputs) => {
    await onSave(values);
    if (!isSubmitting) { // Only close if submission was successful and not still pending
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>طلب رحلة جديدة</DialogTitle>
          <DialogDescription>
            أدخل تفاصيل رحلتك وسنبحث لك عن سائق.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="grid gap-4 py-4">
            <FormField
              control={form.control}
              name="pickupLocation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>موقع الانطلاق</FormLabel>
                  <FormControl>
                    <Input placeholder="مثال: شارع الجامعة" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="destination"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>الوجهة</FormLabel>
                  <FormControl>
                    <Input placeholder="مثال: وسط البلد" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="passengersCount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>عدد الركاب</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="1"
                      max="10"
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
                إلغاء
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin ml-2 rtl:mr-2" />
                    جاري الطلب...
                  </>
                ) : (
                  "طلب الرحلة"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default RequestRideDialog;