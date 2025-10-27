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
import { Search } from "lucide-react";

interface RideSearchCriteria {
  pickupLocation?: string;
  destination?: string;
  passengersCount?: number;
}

interface RideSearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSearch: (criteria: RideSearchCriteria) => void;
  initialCriteria?: RideSearchCriteria;
}

const RideSearchDialog: React.FC<RideSearchDialogProps> = ({
  open,
  onOpenChange,
  onSearch,
  initialCriteria,
}) => {
  const [pickupLocation, setPickupLocation] = useState(initialCriteria?.pickupLocation || "");
  const [destination, setDestination] = useState(initialCriteria?.destination || "");
  const [passengersCount, setPassengersCount] = useState<string>(
    initialCriteria?.passengersCount ? String(initialCriteria.passengersCount) : ""
  );

  useEffect(() => {
    if (open) {
      setPickupLocation(initialCriteria?.pickupLocation || "");
      setDestination(initialCriteria?.destination || "");
      setPassengersCount(initialCriteria?.passengersCount ? String(initialCriteria.passengersCount) : "");
    }
  }, [open, initialCriteria]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const criteria: RideSearchCriteria = {};
    if (pickupLocation) criteria.pickupLocation = pickupLocation;
    if (destination) criteria.destination = destination;
    if (passengersCount && !isNaN(parseInt(passengersCount))) {
      criteria.passengersCount = parseInt(passengersCount);
    }
    onSearch(criteria);
    onOpenChange(false);
  };

  const handleClear = () => {
    setPickupLocation("");
    setDestination("");
    setPassengersCount("");
    onSearch({}); // Clear search results
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>البحث عن رحلات</DialogTitle>
          <DialogDescription>
            أدخل معايير البحث للعثور على الرحلات المناسبة.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid gap-1.5">
            <Label htmlFor="pickup-location">موقع الانطلاق</Label>
            <Input
              id="pickup-location"
              type="text"
              placeholder="مثال: عمان"
              value={pickupLocation}
              onChange={(e) => setPickupLocation(e.target.value)}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="destination">الوجهة</Label>
            <Input
              id="destination"
              type="text"
              placeholder="مثال: إربد"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="passengers-count">عدد الركاب</Label>
            <Input
              id="passengers-count"
              type="number"
              min="1"
              placeholder="مثال: 2"
              value={passengersCount}
              onChange={(e) => setPassengersCount(e.target.value)}
            />
          </div>
          <DialogFooter className="flex flex-col sm:flex-row sm:justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={handleClear}>
              مسح البحث
            </Button>
            <Button type="submit" className="bg-primary hover:bg-primary-dark text-primary-foreground">
              <Search className="h-4 w-4 ml-2 rtl:mr-2" />
              بحث
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default RideSearchDialog;