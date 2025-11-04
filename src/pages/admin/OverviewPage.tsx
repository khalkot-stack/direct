"use client";

import React, { useState, useEffect, useCallback } from "react";
import PageHeader from "@/components/PageHeader";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Users, Car, DollarSign, Star, Loader2 } from "lucide-react";
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
import { Ride } from "@/types/supabase";
import supabaseService from "@/services/supabaseService"; // Import the new service

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

interface MonthlyRevenueData {
  name: string;
  total: number;
}

const OverviewPage: React.FC = () => {
  const { user, loading: userLoading } = useUser();
  const [totalUsers, setTotalUsers] = useState<number | null>(null);
  const [completedRidesCount, setCompletedRidesCount] = useState<number | null>(null);
  const [totalRevenue, setTotalRevenue] = useState<number | null>(null);
  const [averageRating, setAverageRating] = useState<number | null>(null);
  const [recentRides, setRecentRides] = useState<Ride[]>([]);
  const [monthlyRevenueData, setMonthlyRevenueData] = useState<MonthlyRevenueData[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  const fetchOverviewData = useCallback(async () => {
    if (!user?.id) return;

    setLoadingData(true);
    try {
      const {
        totalUsers,
        completedRidesCount,
        totalRevenue,
        averageRating,
        recentRides,
        monthlyRevenueData,
      } = await supabaseService.getOverviewStats();

      setTotalUsers(totalUsers);
      setCompletedRidesCount(completedRidesCount);
      setTotalRevenue(totalRevenue);
      setAverageRating(averageRating);
      setRecentRides(recentRides);
      setMonthlyRevenueData(monthlyRevenueData);

    } catch (error: any) {
      toast.error(`فشل جلب بيانات النظرة العامة: ${error.message}`);
      console.error("Error fetching overview data:", error);
    } finally {
      setLoadingData(false);
    }
  }, [user]);

  useEffect(() => {
    if (!userLoading && user) {
      fetchOverviewData();
    } else if (!userLoading && !user) {
      setLoadingData(false);
    }
  }, [userLoading, user, fetchOverviewData]);

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
        <StatCard title="الرحلات المكتملة" value={completedRidesCount !== null ? completedRidesCount : "N/A"} icon={Car} color="text-green-500" description="+15.5% من الشهر الماضي" />
        <StatCard title="إجمالي الإيرادات" value={`JOD ${totalRevenue !== null ? totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "N/A"}`} icon={DollarSign} color="text-yellow-500" description="+10.0% من الشهر الماضي" />
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
                <BarChart data={monthlyRevenueData}>
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
                    tickFormatter={(value) => `JOD ${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
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
                    formatter={(value: number) => [`JOD ${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 'الإجمالي']}
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