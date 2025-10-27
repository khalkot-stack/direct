"use client";

import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import IndexPage from './pages/Index';
import AuthPage from './pages/AuthPage';
import PassengerDashboard from './pages/PassengerDashboard';
import DriverDashboard from './pages/DriverDashboard';
import MyRidesPage from './pages/MyRidesPage';
// import RequestRidePage from './pages/RequestRidePage'; // Removed import
import FindRidesPage from './pages/FindRidesPage';
import AcceptedRidesPage from './pages/AcceptedRidesPage';
import RideDetailsPage from './pages/RideDetailsPage';
import DriverProfilePage from './pages/DriverProfilePage';
import PassengerProfilePage from './pages/PassengerProfilePage';
import { Toaster } from "@/components/ui/sonner";
import BottomNavigationBar from './components/BottomNavigationBar';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <Router>
      <div className="flex flex-col min-h-screen">
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<IndexPage />} />
            <Route path="/auth" element={<AuthPage />} />

            {/* Passenger Routes */}
            <Route path="/passenger-dashboard" element={<ProtectedRoute><PassengerDashboard /></ProtectedRoute>} />
            <Route path="/passenger-dashboard/my-rides" element={<ProtectedRoute><MyRidesPage /></ProtectedRoute>} />
            {/* <Route path="/request-ride" element={<ProtectedRoute><RequestRidePage /></ProtectedRoute>} /> Removed route */}
            <Route path="/passenger-dashboard/profile" element={<ProtectedRoute><PassengerProfilePage /></ProtectedRoute>} />

            {/* Driver Routes */}
            <Route path="/driver-dashboard" element={<ProtectedRoute><DriverDashboard /></ProtectedRoute>} />
            <Route path="/driver-dashboard/find-rides" element={<ProtectedRoute><FindRidesPage /></ProtectedRoute>} />
            <Route path="/driver-dashboard/accepted-rides" element={<ProtectedRoute><AcceptedRidesPage /></ProtectedRoute>} />
            <Route path="/ride-details/:rideId" element={<ProtectedRoute><RideDetailsPage /></ProtectedRoute>} />
            <Route path="/driver-dashboard/profile" element={<ProtectedRoute><DriverProfilePage /></ProtectedRoute>} />
          </Routes>
        </main>
        <BottomNavigationBar />
        <Toaster richColors />
      </div>
    </Router>
  );
}

export default App;