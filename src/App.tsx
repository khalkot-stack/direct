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
import RideDetailsPage from "./pages/RideDetailsPage"; // Import the new page
import AdminDashboard from "./pages/AdminDashboard";
import OverviewPage from "./pages/admin/OverviewPage";
import UserManagementPage from "./pages/admin/UserManagementPage";
import RideManagementPage from "./pages/admin/RideManagementPage";
import SettingsPage from "./pages/admin/SettingsPage";
import NotFound from "./pages/NotFound";

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
          <Route path="/passenger-dashboard" element={<PassengerDashboard />} />
          <Route path="/driver-dashboard" element={<DriverDashboard />} />
          <Route path="/request-ride" element={<RequestRidePage />} />
          <Route path="/find-rides" element={<FindRidesPage />} />
          <Route path="/help" element={<HelpPage />} />
          <Route path="/passenger-requests" element={<PassengerRequestsPage />} />
          <Route path="/ride-details/:rideId" element={<RideDetailsPage />} /> {/* New route */}
          
          {/* Admin Dashboard and its nested routes */}
          <Route path="/admin-dashboard" element={<AdminDashboard />}>
            <Route index element={<OverviewPage />} />
            <Route path="users" element={<UserManagementPage />} />
            <Route path="rides" element={<RideManagementPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>

          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;