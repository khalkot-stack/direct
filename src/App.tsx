"use client";

import { BrowserRouter as Router, Routes, Route } from "react-router-dom"; // Removed useEffect, useState
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "next-themes";
// import { supabase } from "@/lib/supabase"; // Removed unused import

// Context
import { UserProvider } from "@/context/UserContext";

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
import AdminLoginPage from "@/pages/AdminLoginPage";

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
  // initialLoading is now handled by UserProvider
  // useEffect for auth listener is now handled by UserProvider

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <Router>
        <UserProvider> {/* Wrap the entire application with UserProvider */}
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/admin-login" element={<AdminLoginPage />} />
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
        </UserProvider>
      </Router>
      <Toaster />
    </ThemeProvider>
  );
}

export default App;