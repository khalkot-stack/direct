"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Car, DollarSign } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const data = [
  { name: 'يناير', users: 400, rides: 240 },
  { name: 'فبراير', users: 300, rides: 139 },
  { name: 'مارس', users: 200, rides: 980 },
  { name: 'أبريل', users: 278, rides: 390 },
  { name: 'مايو', users: 189, rides: 480 },
  { name: 'يونيو', users: 239, rides: 380 },
  { name: 'يوليو', users: 349, rides: 430 },
];

const OverviewPage = () => {
  const [totalUsers, setTotalUsers] = useState<number | null>(null);
  const [totalRides, setTotalRides] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchOverviewData = useCallback(async () => {
    setLoading(true);
    // Fetch total users
    const { count: usersCount, error: usersError } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    if (usersError) {
      toast.error(`فشل جلب عدد المستخدمين: ${usersError.message}`);
      console.error("Error fetching user count:", usersError);
    } else {
      setTotalUsers(usersCount);
    }

    // Fetch total rides
    const { count: ridesCount, error: ridesError } = await supabase
      .from('rides')
      .select('*', { count: 'exact', head: true });

    if (ridesError) {
      toast.error(`فشل جلب عدد الرحلات: ${ridesError.message}`);
      console.error("Error fetching ride count:", ridesError);
    } else {
      setTotalRides(ridesCount);
    }
    setLoading(false);
  }, []);

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
            <div className="text-2xl font-bold">5,200 دينار</div> {/* Static for now */}
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
                data={data}
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
          <ul className="space-y-2 text-gray-700 dark:text-gray-300">
            <li>- مستخدم جديد "علياء" سجلت كراكب.</li>
            <li>- سائق "محمد" أكمل رحلة إلى العقبة.</li>
            <li>- تم تحديث إعدادات النظام.</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default OverviewPage;