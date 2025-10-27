"use client";

import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Car, History, User, Loader2 } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import RequestRidePage from "./RequestRidePage"; // Import the RequestRidePage component

const PassengerDashboard = () => {
  const navigate = useNavigate();
  const [userName, setUserName] = useState("راكب");
  const [loading, setLoading] = useState(true);
  const [showRequestRideForm, setShowRequestRideForm] = useState(false); // New state for form visibility

  useEffect(() => {
    const fetchUserProfile = async () => {
      setLoading(true);
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError || !user) {
        toast.error("الرجاء تسجيل الدخول للوصول إلى لوحة التحكم.");
        navigate("/auth");
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error("Error fetching user profile:", error);
        toast.error("فشل جلب معلومات المستخدم.");
      } else if (data) {
        setUserName(data.full_name || "راكب");
      }
      setLoading(false);
    };

    fetchUserProfile();
  }, [navigate]);

  const handleRideRequested = () => {
    setShowRequestRideForm(false); // Hide the form
    navigate("/passenger-dashboard/my-rides"); // Navigate to my rides page
  };

  const handleCancelRequest = () => {
    setShowRequestRideForm(false); // Hide the form
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-950">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="sr-only">جاري تحميل لوحة تحكم الراكب...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-950 p-4">
      <Card className="w-full max-w-md bg-white dark:bg-gray-900 shadow-lg rounded-lg">
        <div className="p-6">
          <PageHeader
            title={`أهلاً بك، ${userName}`}
            description="لوحة تحكم الراكب الخاصة بك"
          />
        </div>
        <CardContent className="space-y-6">
          {showRequestRideForm ? (
            <RequestRidePage
              isEmbedded={true}
              onRideRequested={handleRideRequested}
              onCancel={handleCancelRequest}
            />
          ) : (
            <>
              <div className="grid grid-cols-1 gap-4">
                <Button
                  onClick={() => setShowRequestRideForm(true)} // Show the form on click
                  className="w-full bg-primary hover:bg-primary-dark text-primary-foreground text-lg px-6 py-3 rounded-lg shadow-md flex items-center justify-center gap-2 transition-transform duration-200 ease-in-out hover:scale-[1.01]"
                >
                  <MapPin className="h-5 w-5" />
                  طلب رحلة جديدة
                </Button>
                <Link to="/passenger-dashboard/my-rides" className="transition-transform duration-200 ease-in-out hover:scale-[1.01]">
                  <Button variant="outline" className="w-full text-primary border-primary hover:bg-primary hover:text-primary-foreground text-lg px-6 py-3 rounded-lg shadow-md flex items-center justify-center gap-2">
                    <History className="h-5 w-5" />
                    رحلاتي
                  </Button>
                </Link>
                <Link to="/passenger-dashboard/profile" className="transition-transform duration-200 ease-in-out hover:scale-[1.01]">
                  <Button variant="outline" className="w-full text-primary border-primary hover:bg-primary hover:text-primary-foreground text-lg px-6 py-3 rounded-lg shadow-md flex items-center justify-center gap-2">
                    <User className="h-5 w-5" />
                    ملفي الشخصي
                  </Button>
                </Link>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PassengerDashboard;