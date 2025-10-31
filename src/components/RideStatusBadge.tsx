"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";
import { Ride } from "@/types/supabase"; // Import Ride type for status

interface RideStatusBadgeProps {
  status: Ride['status'];
}

const RideStatusBadge: React.FC<RideStatusBadgeProps> = ({ status }) => {
  switch (status) {
    case "pending":
      return <Badge variant="secondary" className="bg-blue-500 hover:bg-blue-500/80">قيد الانتظار</Badge>;
    case "accepted":
      return <Badge variant="default" className="bg-green-500 hover:bg-green-500/80">مقبولة</Badge>;
    case "completed":
      return <Badge variant="default" className="bg-purple-500 hover:bg-purple-500/80">مكتملة</Badge>;
    case "cancelled":
      return <Badge variant="destructive">ملغاة</Badge>;
    default:
      return <Badge variant="outline">غير معروف</Badge>;
  }
};

export default RideStatusBadge;