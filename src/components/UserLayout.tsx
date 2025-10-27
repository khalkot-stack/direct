"use client";

import React, { useEffect, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const UserLayout: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error) {
        toast.error(`خطأ في التحقق من الجلسة: ${error.message}`);
        navigate("/auth");
        return;
      }

      if (!session) {
        toast.warning("الرجاء تسجيل الدخول للوصول إلى هذه الصفحة.");
        navigate("/auth");
        return;
      }

      const role = session.user?.user_metadata?.user_type;
      setUserRole(role);
      setLoading(false);
    };

    checkUser();
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-950">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="sr-only">جاري التحميل...</span>
      </div>
    );
  }

  // UserLayout now simply renders the Outlet for its children routes
  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex-1">
        <Outlet />
      </div>
    </div>
  );
};

export default UserLayout;