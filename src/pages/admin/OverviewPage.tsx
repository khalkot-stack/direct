"use client";

import React from "react";
import PageHeader from "@/components/PageHeader";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Users, Car, DollarSign, Star } from "lucide-react";

const OverviewPage: React.FC = () => {
  // Placeholder data for demonstration
  const stats = [
    { title: "إجمالي المستخدمين", value: "1,234", icon: Users, color: "text-blue-500" },
    { title: "الرحلات المكتملة", value: "567", icon: Car, color: "text-green-500" },
    { title: "إجمالي الإيرادات", value: "SAR 12,345", icon: DollarSign, color: "text-yellow-500" },
    { title: "متوسط التقييم", value: "4.8", icon: Star, color: "text-purple-500" },
  ];

  return (
    <div className="container mx-auto p-4">
      <PageHeader title="نظرة عامة على لوحة المدير" description="عرض ملخص سريع لأداء النظام." />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className={ `h-4 w-4 text-muted-foreground ${stat.color}` } />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {/* Placeholder for change over time */}
                +20.1% من الشهر الماضي
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7 mt-6">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>نظرة عامة على الإيرادات</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            {/* Placeholder for a chart */}
            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
              مخطط الإيرادات هنا
            </div>
          </CardContent>
        </Card>
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>الرحلات الأخيرة</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Placeholder for recent rides list */}
            <div className="space-y-4">
              <div className="flex items-center">
                <div className="h-9 w-9 rounded-full bg-gray-200 flex items-center justify-center text-gray-600">R1</div>
                <div className="ml-4 space-y-1">
                  <p className="text-sm font-medium leading-none">رحلة من عمان إلى إربد</p>
                  <p className="text-sm text-muted-foreground">الراكب: أحمد، السائق: خالد</p>
                </div>
                <div className="ml-auto font-medium">SAR 30</div>
              </div>
              <div className="flex items-center">
                <div className="h-9 w-9 rounded-full bg-gray-200 flex items-center justify-center text-gray-600">R2</div>
                <div className="ml-4 space-y-1">
                  <p className="text-sm font-medium leading-none">رحلة من الزرقاء إلى العقبة</p>
                  <p className="text-sm text-muted-foreground">الراكب: سارة، السائق: علي</p>
                </div>
                <div className="ml-auto font-medium">SAR 120</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default OverviewPage;