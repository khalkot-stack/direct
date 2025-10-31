"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";
import { Profile } from "@/types/supabase"; // Import Profile type for status

interface UserStatusBadgeProps {
  status: Profile['status'];
}

const UserStatusBadge: React.FC<UserStatusBadgeProps> = ({ status }) => {
  switch (status) {
    case "active":
      return <Badge variant="default" className="bg-green-500 hover:bg-green-500/80">نشط</Badge>;
    case "suspended":
      return <Badge variant="secondary" className="bg-yellow-500 hover:bg-yellow-500/80">معلق</Badge>;
    case "banned":
      return <Badge variant="destructive">محظور</Badge>;
    default:
      return <Badge variant="outline">غير معروف</Badge>;
  }
};

export default UserStatusBadge;