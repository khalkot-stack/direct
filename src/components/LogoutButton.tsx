"use client";

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

const LogoutButton: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signOut();
    setLoading(false);

    if (error) {
      toast.error(`فشل تسجيل الخروج: ${error.message}`);
    } else {
      toast.success("تم تسجيل الخروج بنجاح.");
      navigate("/auth"); // Redirect to auth page after logout
    }
  };

  return (
    <Button
      variant="outline"
      onClick={handleLogout}
      disabled={loading}
      className="w-full flex items-center gap-2 text-red-500 border-red-500 hover:bg-red-500 hover:text-white"
    >
      {loading ? "جاري تسجيل الخروج..." : "تسجيل الخروج"}
      <LogOut className="h-4 w-4" />
    </Button>
  );
};

export default LogoutButton;