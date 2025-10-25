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
import DriverAcceptedRidesPage from "./pages/DriverAcceptedRidesPage"; // Import the new page
import NotFound from "./pages/NotFound";
import ProtectedRoute from "./components/ProtectedRoute"; // Import ProtectedRoute

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
          <Route path="/ride-details/:rideId" element={<RideDetailsPage />} />

          {/* Protected Routes for Passenger */}
          <Route element={<ProtectedRoute allowedRoles={["passenger"]} />}>
            <Route path="/passenger-dashboard" element={<PassengerDashboard />} />
            <Route path="/request-ride" element={<RequestRidePage />} />
            <Route path="/passenger-requests" element={<PassengerRequestsPage />} />
          </Route>

          {/* Protected Routes for Driver */}
          <Route element={<ProtectedRoute allowedRoles={["driver"]} />}>
            <Route path="/driver-dashboard" element={<DriverDashboard />} />
            <Route path="/find-rides" element={<FindRidesPage />} />
            <Route path="/driver-dashboard/accepted-rides" element={<DriverAcceptedRidesPage />} /> {/* New route */}
          </Route>

          {/* Protected Routes for Admin */}
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