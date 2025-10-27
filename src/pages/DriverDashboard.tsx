"use client";

import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, CalendarDays } from "lucide-react"; // Removed unused icons
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

const DriverDashboard = () => {
  const [userName, setUserName] = useState("أيها السائق");

  useEffect(() => {
    const fetchUserName = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error("Error fetching driver profile:", error);
          toast.error("فشل جلب اسم المستخدم.");
        } else if (profile) {
          setUserName(profile.full_name || "أيها السائق");
        }
      }
    };
    fetchUserName();
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center bg-gray-50 dark:bg-gray-900 p-4 pb-20 md:pb-4">
      <Card className="w-full max-w-2xl bg-white dark:bg-gray-800 shadow-lg rounded-lg text-center mt-4 md:mt-8"> {/* Adjusted mt-8 md:mt-12 to mt-4 md:mt-8 */}
        <CardHeader>
          <img src="/assets/images/دايركت.png" alt="DIRECT Logo" className="mx-auto h-16 mb-4" />
          <CardTitle className="text-3xl font-bold text-gray-900 dark:text-white">
            مرحباً بك يا {userName}!
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-lg text-gray-700 dark:text-gray-300">
            من هنا يمكنك البحث عن الركاب وقبول الطلبات.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Link to="/find-rides" className="transition-transform duration-200 ease-in-out hover:scale-[1.01]"> {/* Added hover effect */}
              <Button className="w-full bg-primary hover:bg-primary-dark text-primary-foreground text-lg px-6 py-3 rounded-lg shadow-md flex items-center justify-center gap-2">
                <Search className="h-5 w-5" />
                البحث عن ركاب
              </Button>
            </Link>
            <Link to="/driver-dashboard/accepted-rides" className="transition-transform duration-200 ease-in-out hover:scale-[1.01]"> {/* Added hover effect */}
              <Button variant="outline" className="w-full text-primary border-primary hover:bg-primary hover:text-primary-foreground text-lg px-6 py-3 rounded-lg shadow-md flex items-center justify-center gap-2">
                <CalendarDays className="h-5 w-5" />
                عرض طلباتي المقبولة
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DriverDashboard;