"use client";

import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useUser } from "@/context/UserContext";

interface ProtectedRouteProps {
  allowedRoles: ("passenger" | "driver" | "admin")[];
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles, children }) => {
  const navigate = useNavigate();
  const { user, profile, loading } = useUser();

  useEffect(() => {
    if (loading) return;

    if (!user) {
      toast.warning("الرجاء تسجيل الدخول للوصول إلى هذه الصفحة.");
      navigate("/auth");
      return;
    }

    if (!profile) {
      // This case should ideally not happen if profile creation in UserProvider works,
      // but as a fallback, we can assume a default role or redirect.
      // For now, let's assume if user exists but no profile, it's an issue.
      toast.error("فشل جلب معلومات الملف الشخصي. الرجاء المحاولة مرة أخرى.");
      navigate("/auth");
      return;
    }

    const userRole = profile.user_type;

    if (userRole && allowedRoles.includes(userRole)) {
      // User is authorized, do nothing
    } else {
      toast.error("ليس لديك الصلاحيات الكافية للوصول إلى هذه الصفحة.");
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
  }, [loading, user, profile, allowedRoles, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-950">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="sr-only">جاري التحميل...</span>
      </div>
    );
  }

  // Only render children if user is loaded, exists, has a profile, and is authorized
  if (user && profile && allowedRoles.includes(profile.user_type)) {
    return <>{children}</>;
  }

  return null; // Or a fallback UI if not authorized/loading
};

export default ProtectedRoute;