import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import AuthPage from "./pages/AuthPage";
import PassengerDashboard from "./pages/PassengerDashboard";
import DriverDashboard from "./pages/DriverDashboard";
import RequestRidePage from "./pages/RequestRidePage";
import FindRidesPage from "./pages/FindRidesPage";
import HelpPage from "./pages/HelpPage";
import PassengerRequestsPage from "./pages/PassengerRequestsPage";
import RideDetailsPage from "./pages/RideDetailsPage";
import AdminDashboard from "./pages/AdminDashboard";
import OverviewPage from "./pages/admin/OverviewPage";
import UserManagementPage from "./pages/admin/UserManagementPage";
import RideManagementPage from "./pages/admin/RideManagementPage";
import SettingsPage from "./pages/admin/SettingsPage";
import DriverAcceptedRidesPage from "./pages/DriverAcceptedRidesPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import NotificationsPage from "./pages/NotificationsPage";
import UserSettingsPage from "./pages/UserSettingsPage";
import DriverProfileSettingsPage from "./pages/DriverProfileSettingsPage";
import ReportsPage from "./pages/ReportsPage";
import UserProfileEditPage from "./pages/UserProfileEditPage";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "./components/ProtectedRoute";
import UserLayout from "./components/UserLayout"; // New import

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/help" element={<HelpPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          
          {/* Protected Routes for Passenger and Driver (common layout) */}
          <Route element={<ProtectedRoute allowedRoles={["passenger", "driver"]} />}>
            <Route element={<UserLayout />}>
              <Route path="/passenger-dashboard" element={<PassengerDashboard />} />
              <Route path="/request-ride" element={<RequestRidePage />} />
              <Route path="/passenger-requests" element={<PassengerRequestsPage />} />
              
              <Route path="/driver-dashboard" element={<DriverDashboard />} />
              <Route path="/find-rides" element={<FindRidesPage />} />
              <Route path="/driver-dashboard/accepted-rides" element={<DriverAcceptedRidesPage />} />
              
              {/* Common pages for both passenger and driver */}
              <Route path="/ride-details/:rideId" element={<RideDetailsPage />} />
              <Route path="/notifications" element={<NotificationsPage />} />
              <Route path="/user-settings" element={<UserSettingsPage />} />
              <Route path="/driver-settings" element={<DriverProfileSettingsPage />} /> {/* Driver specific setting, but under common layout */}
              <Route path="/reports" element={<ReportsPage />} />
              <Route path="/user-profile-edit" element={<UserProfileEditPage />} />
            </Route>
          </Route>

          {/* Protected Routes for Admin (without UserLayout/BottomNavigationBar) */}
          <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
            <Route path="/admin-dashboard" element={<AdminDashboard />}>
              <Route index element={<OverviewPage />} />
              <Route path="users" element={<UserManagementPage />} />
              <Route path="rides" element={<RideManagementPage />} />
              <Route path="settings" element={<SettingsPage />} />
            </Route>
          </Route>

          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;