"use client";

import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import IndexPage from './pages/Index';
import AuthPage from './pages/AuthPage';
import PassengerDashboard from './pages/PassengerDashboard';
import DriverDashboard from './pages/DriverDashboard';
import PassengerRequestsPage from './pages/PassengerRequestsPage';
// import RequestRidePage from './pages/RequestRidePage'; // Removed import
import FindRidesPage from './pages/FindRidesPage';
import DriverAcceptedRidesPage from './pages/DriverAcceptedRidesPage'; // Corrected import
import RideDetailsPage from './pages/RideDetailsPage';
import DriverProfileSettingsPage from './pages/DriverProfileSettingsPage'; // Corrected import
import PassengerProfilePage from './pages/PassengerProfilePage'; // Corrected import
import { Toaster } from "@/components/ui/sonner";
import BottomNavigationBar from './components/BottomNavigationBar';
import ProtectedRoute from './components/ProtectedRoute';
import AdminDashboard from './pages/AdminDashboard';
import OverviewPage from './pages/admin/OverviewPage';
import UserManagementPage from './pages/admin/UserManagementPage';
import RideManagementPage from './pages/admin/RideManagementPage';
import SettingsPage from './pages/admin/SettingsPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import UserSettingsPage from './pages/UserSettingsPage';
import ReportsPage from './pages/ReportsPage';
import NotificationsPage from './pages/NotificationsPage'; // Added missing import
import HelpPage from './pages/HelpPage';
import AboutUsPage from './pages/AboutUsPage';
import NotFound from './pages/NotFound';
import UserLayout from './components/UserLayout';


function App() {
  return (
    <Router>
      <div className="flex flex-col min-h-screen">
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<IndexPage />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/help" element={<HelpPage />} />
            <Route path="/about-us" element={<AboutUsPage />} />

            {/* User Layout for Passenger and Driver Dashboards */}
            <Route path="/" element={<ProtectedRoute allowedRoles={["passenger", "driver"]}><UserLayout /></ProtectedRoute>}>
              {/* Passenger Routes */}
              <Route path="passenger-dashboard" element={<ProtectedRoute allowedRoles={["passenger"]}><PassengerDashboard /></ProtectedRoute>} />
              <Route path="passenger-dashboard/my-rides" element={<ProtectedRoute allowedRoles={["passenger"]}><PassengerRequestsPage /></ProtectedRoute>} />
              <Route path="passenger-dashboard/profile" element={<ProtectedRoute allowedRoles={["passenger"]}><PassengerProfilePage /></ProtectedRoute>} />
              
              {/* Driver Routes */}
              <Route path="driver-dashboard" element={<ProtectedRoute allowedRoles={["driver"]}><DriverDashboard /></ProtectedRoute>} />
              <Route path="driver-dashboard/find-rides" element={<ProtectedRoute allowedRoles={["driver"]}><FindRidesPage /></ProtectedRoute>} />
              <Route path="driver-dashboard/accepted-rides" element={<ProtectedRoute allowedRoles={["driver"]}><DriverAcceptedRidesPage /></ProtectedRoute>} />
              <Route path="driver-dashboard/profile" element={<ProtectedRoute allowedRoles={["driver"]}><DriverProfileSettingsPage /></ProtectedRoute>} />
              
              {/* Shared User Settings */}
              <Route path="user-settings" element={<ProtectedRoute allowedRoles={["passenger", "driver"]}><UserSettingsPage /></ProtectedRoute>} />
              <Route path="driver-settings" element={<ProtectedRoute allowedRoles={["driver"]}><DriverProfileSettingsPage /></ProtectedRoute>} />
              <Route path="reports" element={<ProtectedRoute allowedRoles={["passenger", "driver"]}><ReportsPage /></ProtectedRoute>} />
              <Route path="notifications" element={<ProtectedRoute allowedRoles={["passenger", "driver"]}><NotificationsPage /></ProtectedRoute>} />
              <Route path="ride-details/:rideId" element={<ProtectedRoute allowedRoles={["passenger", "driver"]}><RideDetailsPage /></ProtectedRoute>} />
            </Route>

            {/* Admin Routes */}
            <Route path="/admin-dashboard" element={<ProtectedRoute allowedRoles={["admin"]}><AdminDashboard /></ProtectedRoute>}>
              <Route index element={<OverviewPage />} />
              <Route path="users" element={<UserManagementPage />} />
              <Route path="rides" element={<RideManagementPage />} />
              <Route path="settings" element={<SettingsPage />} />
            </Route>

            {/* Catch-all route for 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
        <BottomNavigationBar />
        <Toaster richColors />
      </div>
    </Router>
  );
}

export default App;