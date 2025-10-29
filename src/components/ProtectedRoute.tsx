"use client";

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  allowedRoles: ("passenger" | "driver" | "admin")[];
  children: React.ReactNode; // Added children prop
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles, children }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
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

      const user = session.user;
      // Read user_type from user_metadata (which is raw_user_meta_data in auth.users)
      const userRole = user?.user_metadata?.user_type;

      if (userRole && allowedRoles.includes(userRole)) {
        setIsAuthorized(true);
      } else {
        toast.error("ليس لديك الصلاحيات الكافية للوصول إلى هذه الصفحة.");
        // Redirect to a default dashboard or home based on actual role if available, or auth page
        if (userRole === "passenger") {
          navigate("/passenger-dashboard");
        } else if (userRole === "driver") {
          navigate("/driver-dashboard");
        } else if (userRole === "admin") {
          navigate("/admin-dashboard");
        } else {
          navigate("/");
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, [allowedRoles, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-950">
        <Loader2 className="h-8 w-8 animate-spin text-green-500" />
        <span className="sr-only">جاري التحميل...</span>
      </div>
    );
  }

  return isAuthorized ? <>{children}</> : null; // Render children if authorized
};

export default ProtectedRoute;