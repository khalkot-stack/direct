"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Car, DollarSign } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

// Static data for chart for now, as dynamic aggregation is more complex
const chartData = [
  { name: 'يناير', users: 400, rides: 240 },
  { name: 'فبراير', users: 300, rides: 139 },
  { name: 'مارس', users: 200, rides: 980 },
  { name: 'أبريل', users: 278, rides: 390 },
  { name: 'مايو', users: 189, rides: 480 },
  { name: 'يونيو', users: 239, rides: 380 },
  { name: 'يوليو', users: 349, rides: 430 },
];

interface Activity {
  id: string;
  type: 'user_registered' | 'ride_requested' | 'ride_accepted' | 'ride_completed' | 'ride_cancelled';
  description: string;
  created_at: string;
}

// Define an interface for the raw data returned by Supabase select with joins for rides
interface SupabaseJoinedRideData {
  id: string;
  pickup_location: string;
  destination: string;
  status: "pending" | "accepted" | "completed" | "cancelled";
  created_at: string;
  profiles_passenger: Array<{ full_name: string }> | null;
  profiles_driver: Array<{ full_name: string }> | null;
}

const OverviewPage = () => {
  const [totalUsers, setTotalUsers] = useState<number | null>(null);
  const [totalRides, setTotalRides] = useState<number | null>(null);
  const [latestActivities, setLatestActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOverviewData = useCallback(async () => {
    setLoading(true);
    let hasError = false;

    // Fetch total users using the new security invoker function for admins
    const { data: allProfiles, error: profilesError } = await supabase.rpc('get_all_profiles_for_admin');

    if (profilesError) {
      toast.error(`فشل جلب عدد المستخدمين: ${profilesError.message}`);
      console.error("Error fetching user count:", profilesError);
      hasError = true;
    } else {
      setTotalUsers(allProfiles?.length || 0);
      // Filter new users from allProfiles if needed for activities, or fetch separately
      const newUsers = (allProfiles || [])
        .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 5);

      let activities: Activity[] = [];
      activities = activities.concat(newUsers.map((user: any) => ({
        id: user.id,
        type: 'user_registered',
        description: `مستخدم جديد "${user.full_name}" سجل.`,
        created_at: user.created_at,
      })));
      setLatestActivities(activities); // Temporarily set to only new users, will combine later
    }

    // Fetch total rides
    const { count: ridesCount, error: ridesError } = await supabase
      .from('rides')
      .select('*', { count: 'exact', head: true });

    if (ridesError) {
      toast.error(`فشل جلب عدد الرحلات: ${ridesError.message}`);
      console.error("Error fetching ride count:", ridesError);
      hasError = true;
    } else {
      setTotalRides(ridesCount);
    }

    // Fetch recent ride activities
    const { data: recentRides, error: recentRidesError } = await supabase
      .from('rides')
      .select(`
        id,
        pickup_location,
        destination,
        status,
        created_at,
        profiles_passenger:passenger_id (full_name),
        profiles_driver:driver_id (full_name)
      `)
      .order('created_at', { ascending: false })
      .limit(5);

    if (recentRidesError) {
      toast.error(`فشل جلب أنشطة الرحلات الأخيرة: ${recentRidesError.message}`);
      console.error("Error fetching recent rides:", recentRidesError);
      hasError = true;
    }

    let combinedActivities: Activity[] = latestActivities; // Start with user activities

    if (recentRides) {
      combinedActivities = combinedActivities.concat(recentRides.map((ride: SupabaseJoinedRideData) => {
        let description = '';
        const passengerName = ride.profiles_passenger?.[0]?.full_name || 'راكب';
        const driverName = ride.profiles_driver?.[0]?.full_name || 'سائق';

        switch (ride.status) {
          case 'pending':
            description = `تم طلب رحلة جديدة من "${ride.pickup_location}" إلى "${ride.destination}" بواسطة "${passengerName}".`;
            break;
          case 'accepted':
            description = `تم قبول رحلة من "${ride.pickup_location}" إلى "${ride.destination}" بواسطة "${driverName}".`;
            break;
          case 'completed':
            description = `تم إكمال رحلة من "${ride.pickup_location}" إلى "${ride.destination}" بواسطة "${driverName}".`;
            break;
          case 'cancelled':
            description = `تم إلغاء رحلة من "${ride.pickup_location}" إلى "${ride.destination}".`;
            break;
          default:
            description = `نشاط رحلة: ${ride.status} من "${ride.pickup_location}" إلى "${ride.destination}".`;
        }
        return {
          id: ride.id,
          type: `ride_${ride.status}` as Activity['type'],
          description,
          created_at: ride.created_at,
        };
      }));
    }

    // Sort all activities by created_at descending and take top 5
    combinedActivities.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    setLatestActivities(combinedActivities.slice(0, 5));

    setLoading(false);
  }, [latestActivities]); // Added latestActivities to dependencies to ensure it's updated before combining

  useEffect(() => {
    fetchOverviewData();
  }, [fetchOverviewData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="sr-only">جاري تحميل البيانات...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">نظرة عامة</h2>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي المستخدمين</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUsers !== null ? totalUsers : "N/A"}</div>
            <p className="text-xs text-muted-foreground">+20% عن الشهر الماضي</p> {/* Static for now */}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">الرحلات المكتملة</CardTitle>
            <Car className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalRides !== null ? totalRides : "N/A"}</div>
            <p className="text-xs text-muted-foreground">+15% عن الشهر الماضي</p> {/* Static for now */}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">الإيرادات</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">5,200 دينار</div> {/* Static for now, requires 'price' column in 'rides' table */}
            <p className="text-xs text-muted-foreground">+10% عن الشهر الماضي</p> {/* Static for now */}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>إحصائيات شهرية</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData} // Static data for now, requires complex aggregation queries for dynamic data
                margin={{
                  top: 5,
                  right: 10,
                  left: 10,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="users" fill="hsl(var(--primary))" name="المستخدمون" />
                <Bar dataKey="rides" fill="hsl(var(--secondary))" name="الرحلات" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>أحدث الأنشطة</CardTitle>
        </CardHeader>
        <CardContent>
          {latestActivities.length > 0 ? (
            <ul className="space-y-2 text-gray-700 dark:text-gray-300 text-right">
              {latestActivities.map((activity) => (
                <li key={activity.id} className="border-b last:border-b-0 pb-2 last:pb-0">
                  <p className="text-sm font-medium">{activity.description}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {new Date(activity.created_at).toLocaleString('ar-SA', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-center text-gray-500 dark:text-gray-400">لا توجد أنشطة حديثة.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default OverviewPage;