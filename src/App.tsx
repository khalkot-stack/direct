"use client";

import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "next-themes";

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
import PassengerHome from "@/pages/PassengerHome";
import PassengerMyRidesPage from "@/pages/PassengerMyRidesPage";

// Driver Pages
import DriverHome from "@/pages/DriverHome";
import DriverAcceptedRidesPage from "@/pages/DriverAcceptedRidesPage";
import DriverAvailableRidesPage from "@/pages/DriverAvailableRidesPage"; // Import the new page

// Admin Pages
import AdminDashboard from "@/pages/AdminDashboard";
import OverviewPage from "@/pages/admin/OverviewPage";
import UserManagementPage from "@/pages/admin/UserManagementPage";
import RideManagementPage from "@/pages/admin/RideManagementPage";
import AdminSettingsPage from "@/pages/admin/SettingsPage";

function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <Router>
        <UserProvider>
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
              <Route path="/passenger-dashboard" element={<ProtectedRoute allowedRoles={["passenger"]}><PassengerHome /></ProtectedRoute>} />
              <Route path="/passenger-dashboard/my-rides" element={<ProtectedRoute allowedRoles={["passenger"]}><PassengerMyRidesPage /></ProtectedRoute>} />

              {/* Driver Routes */}
              <Route path="/driver-dashboard" element={<ProtectedRoute allowedRoles={["driver"]}><DriverHome /></ProtectedRoute>} />
              <Route path="/driver-dashboard/accepted-rides" element={<ProtectedRoute allowedRoles={["driver"]}><DriverAcceptedRidesPage /></ProtectedRoute>} />
              <Route path="/driver-dashboard/available-rides" element={<ProtectedRoute allowedRoles={["driver"]}><DriverAvailableRidesPage /></ProtectedRoute>} /> {/* New route */}
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