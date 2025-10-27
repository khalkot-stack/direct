"use client";

import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import IndexPage from './pages/Index';
import AuthPage from './pages/AuthPage';
import PassengerDashboard from './pages/PassengerDashboard';
import DriverDashboard from './pages/DriverDashboard';
import PassengerRequestsPage from './pages/PassengerRequestsPage';
import RequestRidePage from './pages/RequestRidePage';
import FindRidesPage from './pages/FindRidesPage';
import DriverAcceptedRidesPage from './pages/DriverAcceptedRidesPage';
import RideDetailsPage from './pages/RideDetailsPage';
import ProfileSettingsPage from './pages/ProfileSettingsPage'; // New unified profile page
import AppSettingsPage from './pages/AppSettingsPage'; // New unified app settings page
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
import ReportsPage from './pages/ReportsPage';
import NotificationsPage from './pages/NotificationsPage';
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

            {/* Protected User Routes (Passenger & Driver) */}
            <Route element={<ProtectedRoute allowedRoles={["passenger", "driver"]}><UserLayout /></ProtectedRoute>}>
              <Route path="passenger-dashboard" element={<PassengerDashboard />} />
              <Route path="passenger-dashboard/request-ride" element={<RequestRidePage />} />
              <Route path="passenger-dashboard/my-rides" element={<PassengerRequestsPage />} />
              
              <Route path="driver-dashboard" element={<DriverDashboard />} />
              <Route path="driver-dashboard/find-rides" element={<FindRidesPage />} />
              <Route path="driver-dashboard/accepted-rides" element={<DriverAcceptedRidesPage />} />
              
              {/* Unified Profile & App Settings */}
              <Route path="profile-settings" element={<ProfileSettingsPage />} />
              <Route path="app-settings" element={<AppSettingsPage />} />
              <Route path="reports" element={<ReportsPage />} /> {/* Still direct access for now */}
              <Route path="notifications" element={<NotificationsPage />} /> {/* Still direct access for now */}
              
              <Route path="ride-details/:rideId" element={<RideDetailsPage />} />
            </Route>

            {/* Protected Admin Routes */}
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