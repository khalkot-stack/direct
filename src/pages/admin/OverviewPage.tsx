"use client";

import React, { useState, useEffect, useCallback } from "react";
import PageHeader from "@/components/PageHeader";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Users, Car, DollarSign, Star, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { Badge } from "@/components/ui/badge";
import { useUser } from "@/context/UserContext";
import { ProfileDetails, Ride } from "@/types/supabase"; // Import shared types

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
  description?: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon: Icon, color, description }) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      <Icon className={`h-4 w-4 text-muted-foreground ${color}`} />
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
      {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
    </CardContent>
  </Card>
);

interface RecentRide extends Omit<Ride, 'passenger_profiles' | 'driver_profiles'> {
  passenger_profiles: ProfileDetails | null;
  driver_profiles: ProfileDetails | null;
}

const OverviewPage: React.FC = () => {
  const { user, loading: userLoading } = useUser();
  const [totalUsers, setTotalUsers] = useState<number | null>(null);
  const [completedRides, setCompletedRides] = useState<number | null>(null);
  const [totalRevenue, setTotalRevenue] = useState<number | null>(null);
  const [averageRating, setAverageRating] = useState<number | null>(null);
  const [recentRides, setRecentRides] = useState<RecentRide[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  const fetchOverviewData = useCallback(async () => {
    setLoadingData(true);
    try {
      // Fetch total users
      const { count: usersCount, error: usersError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });
      if (usersError) throw usersError;
      setTotalUsers(usersCount);

      // Fetch completed rides
      const { count: completedRidesCount, error: completedRidesError } = await supabase
        .from('rides')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'completed');
      if (completedRidesError) throw completedRidesError;
      setCompletedRides(completedRidesCount);

      // Fetch average rating
      const { data: ratingsData, error: ratingsError } = await supabase
        .from('ratings')
        .select('rating');
      if (ratingsError) throw ratingsError;
      if (ratingsData && ratingsData.length > 0) {
        const sumRatings = ratingsData.reduce((sum, r) => sum + r.rating, 0);
        setAverageRating(parseFloat((sumRatings / ratingsData.length).toFixed(1)));
      } else {
        setAverageRating(0);
      }

      // Fetch recent rides
      const { data: recentRidesData, error: recentRidesError } = await supabase
        .from('rides')
        .select(`
          id,
          pickup_location,
          destination,
          status,
          passenger_profiles:passenger_id(full_name),
          driver_profiles:driver_id(full_name)
        `)
        .order('created_at', { ascending: false })
        .limit(5);
      if (recentRidesError) throw recentRidesError;
      setRecentRides(recentRidesData as RecentRide[]);

      // Placeholder for revenue calculation (requires more complex logic, e.g., ride prices)
      setTotalRevenue(0); // For now, set to 0 or implement actual calculation
    } catch (error: any) {
      toast.error(`فشل جلب بيانات النظرة العامة: ${error.message}`);
      console.error("Error fetching overview data:", error);
    } finally {
      setLoadingData(false);
    }
  }, []);

  useEffect(() => {
    if (!userLoading && user) {
      fetchOverviewData();
    } else if (!userLoading && !user) {
      setLoadingData(false);
    }
  }, [userLoading, user, fetchOverviewData]);

  const revenueData = [
    { name: "يناير", total: 4000 },
    { name: "فبراير", total: 3000 },
    { name: "مارس", total: 5000 },
    { name: "أبريل", total: 4500 },
    { name: "مايو", total: 6000 },
    { name: "يونيو", total: 5500 },
    { name: "يوليو", total: 7000 },
  ];

  if (userLoading || loadingData) {
    return (
      <div className="container mx-auto p-4 flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="sr-only">جاري تحميل بيانات النظرة العامة...</span>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <PageHeader title="نظرة عامة على لوحة المدير" description="عرض ملخص سريع لأداء النظام." showBackButton={false} />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="إجمالي المستخدمين" value={totalUsers !== null ? totalUsers : "N/A"} icon={Users} color="text-blue-500" description="+20.1% من الشهر الماضي" />
        <StatCard title="الرحلات المكتملة" value={completedRides !== null ? completedRides : "N/A"} icon={Car} color="text-green-500" description="+15.5% من الشهر الماضي" />
        <StatCard title="إجمالي الإيرادات" value={`SAR ${totalRevenue !== null ? totalRevenue.toLocaleString() : "N/A"}`} icon={DollarSign} color="text-yellow-500" description="+10.0% من الشهر الماضي" />
        <StatCard title="متوسط التقييم" value={averageRating !== null ? averageRating : "N/A"} icon={Star} color="text-purple-500" description="بناءً على تقييمات السائقين والركاب" />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7 mt-6">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>نظرة عامة على الإيرادات</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueData}>
                  <XAxis
                    dataKey="name"
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `SAR ${value}`}
                  />
                  <CartesianGrid vertical={false} stroke="hsl(var(--border))" />
                  <Tooltip
                    cursor={{ fill: 'hsl(var(--accent))', opacity: 0.2 }}
                    contentStyle={{
                      backgroundColor: 'hsl(var(--popover))',
                      borderColor: 'hsl(var(--border))',
                      borderRadius: 'var(--radius)',
                    }}
                    labelStyle={{ color: 'hsl(var(--foreground))' }}
                    itemStyle={{ color: 'hsl(var(--foreground))' }}
                    formatter={(value: number) => [`SAR ${value.toLocaleString()}`, 'الإجمالي']}
                  />
                  <Bar
                    dataKey="total"
                    fill="hsl(var(--primary))"
                    radius={[4, 4, 0, 0]}
                    className="fill-primary"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>الرحلات الأخيرة</CardTitle>
          </CardHeader>
          <CardContent>
            {recentRides.length === 0 ? (
              <div className="text-center text-gray-500 dark:text-gray-400">لا توجد رحلات حديثة.</div>
            ) : (
              <div className="space-y-4">
                {recentRides.map((ride) => (
                  <div key={ride.id} className="flex items-center">
                    <div className="h-9 w-9 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 dark:bg-gray-700 dark:text-gray-300 text-xs font-bold">
                      {ride.pickup_location.charAt(0).toUpperCase()}{ride.destination.charAt(0).toUpperCase()}
                    </div>
                    <div className="ml-4 space-y-1">
                      <p className="text-sm font-medium leading-none">رحلة من {ride.pickup_location} إلى {ride.destination}</p>
                      <p className="text-sm text-muted-foreground">
                        الراكب: {ride.passenger_profiles?.full_name || 'غير معروف'}، السائق: {ride.driver_profiles?.full_name || 'غير معروف'}
                      </p>
                    </div>
                    <div className="ml-auto font-medium">
                      <Badge variant={ride.status === 'completed' ? 'default' : 'secondary'}>
                        {ride.status === 'pending' ? 'قيد الانتظار' : ride.status === 'accepted' ? 'مقبولة' : ride.status === 'completed' ? 'مكتملة' : 'ملغاة'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default OverviewPage;