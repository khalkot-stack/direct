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

    // Check user status from app_metadata
    const userStatus = user.app_metadata?.status;
    if (userStatus === 'pending_review') {
      toast.info("حسابك قيد المراجعة. يرجى الانتظار حتى يتم تفعيله.");
      navigate("/auth"); // Redirect to auth page if pending review
      return;
    }

    if (!profile) {
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
  // Also ensure user status is not 'pending_review'
  if (user && user.app_metadata?.status !== 'pending_review' && profile && allowedRoles.includes(profile.user_type)) {
    return <>{children}</>;
  }

  return null; // Or a fallback UI if not authorized/loading
};

export default ProtectedRoute;