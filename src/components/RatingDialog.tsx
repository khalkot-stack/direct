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
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface RatingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (rating: number, comment: string) => void;
  initialRating?: number;
  initialComment?: string;
  targetUserName: string; // The name of the user being rated
}

const RatingDialog: React.FC<RatingDialogProps> = ({
  open,
  onOpenChange,
  onSave,
  initialRating = 0,
  initialComment = "",
  targetUserName,
}) => {
  const [rating, setRating] = useState(initialRating);
  const [comment, setComment] = useState(initialComment);
  const [hoverRating, setHoverRating] = useState(0);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setRating(initialRating);
    setComment(initialComment);
  }, [initialRating, initialComment, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      toast.error("الرجاء اختيار تقييم بالنجوم.");
      return;
    }
    setIsSaving(true);
    await onSave(rating, comment);
    setIsSaving(false);
    onOpenChange(false); // Close dialog after saving
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>تقييم {targetUserName}</DialogTitle>
          <DialogDescription>
            شارك تجربتك بتقييم من 1 إلى 5 نجوم واكتب تعليقًا.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="flex justify-center gap-1 mb-4">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={cn(
                  "h-8 w-8 cursor-pointer transition-colors",
                  (hoverRating || rating) >= star
                    ? "fill-yellow-400 text-yellow-400"
                    : "fill-gray-300 text-gray-300 dark:fill-gray-600 dark:text-gray-600",
                )}
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
              />
            ))}
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="comment">تعليق (اختياري)</Label>
            <Textarea
              id="comment"
              placeholder="اكتب تعليقك هنا..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="resize-y"
            />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? "جاري الحفظ..." : "حفظ التقييم"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default RatingDialog;