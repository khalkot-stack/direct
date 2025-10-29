"use client";

import { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "next-themes";
import { supabase } from "@/lib/supabase";
import { Loader2 } from "lucide-react"; // Import Loader2

// Layouts
import MainLayout from "@/components/MainLayout";
import ProtectedRoute from "@/components/ProtectedRoute";

// Pages
import Index from "@/pages/Index";
import AuthPage from "@/pages/AuthPage";
import ForgotPasswordPage from "@/pages/ForgotPasswordPage";
import ResetPasswordPage from "@/pages/ResetPasswordPage";
import AppSettingsPage from "@/pages/AppSettingsPage";
import ProfileSettingsPage from "@/pages/ProfileSettingsPage";
import HelpPage from "@/pages/HelpPage";
import AboutUsPage from "@/pages/AboutUsPage";
import NotFound from "@/pages/NotFound";

// Passenger Pages
import PassengerDashboard from "@/pages/PassengerDashboard";
import RequestRidePage from "@/pages/RequestRidePage";
import PassengerMyRidesPage from "@/pages/PassengerMyRidesPage";
import PassengerTrackingPage from "@/pages/PassengerTrackingPage";

// Driver Pages
import DriverDashboard from "@/pages/DriverDashboard";
import FindRidesPage from "@/pages/FindRidesPage";
import DriverAcceptedRidesPage from "@/pages/DriverAcceptedRidesPage";

// Admin Pages
import AdminDashboard from "@/pages/AdminDashboard";
import OverviewPage from "@/pages/admin/OverviewPage";
import UserManagementPage from "@/pages/admin/UserManagementPage";
import RideManagementPage from "@/pages/admin/RideManagementPage";
import AdminSettingsPage from "@/pages/admin/SettingsPage";

function App() {
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    const checkUserSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        // No need to set userRole state here, ProtectedRoute handles it
      }
      setInitialLoading(false);
    };

    checkUserSession();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        // No need to set userRole state here
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-950">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="sr-only">جاري تحميل التطبيق...</span>
      </div>
    );
  }

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/help" element={<HelpPage />} />
          <Route path="/about-us" element={<AboutUsPage />} />

          {/* Routes with MainLayout (for Passenger/Driver) */}
          <Route element={<MainLayout />}>
            <Route path="/app-settings" element={<ProtectedRoute allowedRoles={["passenger", "driver", "admin"]}><AppSettingsPage /></ProtectedRoute>} />
            <Route path="/profile-settings" element={<ProtectedRoute allowedRoles={["passenger", "driver", "admin"]}><ProfileSettingsPage /></ProtectedRoute>} />

            {/* Passenger Routes */}
            <Route path="/passenger-dashboard" element={<ProtectedRoute allowedRoles={["passenger"]}><PassengerDashboard /></ProtectedRoute>} />
            <Route path="/passenger-dashboard/request-ride" element={<ProtectedRoute allowedRoles={["passenger"]}><RequestRidePage /></ProtectedRoute>} />
            <Route path="/passenger-dashboard/my-rides" element={<ProtectedRoute allowedRoles={["passenger"]}><PassengerMyRidesPage /></ProtectedRoute>} />
            <Route path="/passenger-dashboard/track-ride" element={<ProtectedRoute allowedRoles={["passenger"]}><PassengerTrackingPage /></ProtectedRoute>} />

            {/* Driver Routes */}
            <Route path="/driver-dashboard" element={<ProtectedRoute allowedRoles={["driver"]}><DriverDashboard /></ProtectedRoute>} />
            <Route path="/driver-dashboard/find-rides" element={<ProtectedRoute allowedRoles={["driver"]}><FindRidesPage /></ProtectedRoute>} />
            <Route path="/driver-dashboard/accepted-rides" element={<ProtectedRoute allowedRoles={["driver"]}><DriverAcceptedRidesPage /></ProtectedRoute>} />
          </Route>

          {/* Admin Routes with UserLayout (Sidebar) */}
          <Route path="/admin-dashboard" element={<ProtectedRoute allowedRoles={["admin"]}><AdminDashboard /></ProtectedRoute>}>
            <Route index element={<OverviewPage />} />
            <Route path="users" element={<UserManagementPage />} />
            <Route path="rides" element={<RideManagementPage />} />
            <Route path="settings" element={<AdminSettingsPage />} />
          </Route>

          {/* Catch-all for 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
      <Toaster />
    </ThemeProvider>
  );
}

export default App;