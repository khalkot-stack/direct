"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import PageHeader from "@/components/PageHeader";
import { ShieldCheck, DollarSign, TrafficCone, Zap } from "lucide-react";
import AppHeader from "@/components/AppHeader"; // Import AppHeader

const AboutUsPage: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col items-center bg-gray-100 dark:bg-gray-950 p-4">
      <AppHeader /> {/* Global App Header */}
      <div className="flex-1 flex flex-col w-full"> {/* Removed items-center justify-center */}
        <Card className="w-full max-w-3xl bg-white dark:bg-gray-900 shadow-lg rounded-lg">
          <div className="p-6">
            <PageHeader
              title="لماذا تختار DIRECT؟"
              description="اكتشف الميزات والفوائد التي نقدمها"
              backPath="/"
            />
          </div>
          <CardContent className="space-y-6 text-right">
            <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
              <Card className="bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm transition-transform duration-200 ease-in-out hover:scale-[1.01]">
                <CardHeader className="flex flex-col items-center text-center">
                  <Zap className="h-10 w-10 text-primary mb-3" />
                  <CardTitle className="text-xl">سهولة الاستخدام</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    واجهة بسيطة وبديهية لطلب وقبول الرحلات بسرعة.
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm transition-transform duration-200 ease-in-out hover:scale-[1.01]">
                <CardHeader className="flex flex-col items-center text-center">
                  <ShieldCheck className="h-10 w-10 text-primary mb-3" />
                  <CardTitle className="text-xl">الأمان والموثوقية</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    نضمن لك رحلات آمنة مع سائقين موثوقين ومعتمدين.
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm transition-transform duration-200 ease-in-out hover:scale-[1.01]">
                <CardHeader className="flex flex-col items-center text-center">
                  <DollarSign className="h-10 w-10 text-primary mb-3" />
                  <CardTitle className="text-xl">توفير التكاليف</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    نظام مشاركة الرحلات يقلل من تكاليف التنقل بشكل كبير.
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm transition-transform duration-200 ease-in-out hover:scale-[1.01]">
                <CardHeader className="flex flex-col items-center text-center">
                  <TrafficCone className="h-10 w-10 text-primary mb-3" />
                  <CardTitle className="text-xl">تقليل الازدحام</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    نساهم في حل مشكلة الازدحام المروري في المدن.
                  </p>
                </CardContent>
              </Card>
            </section>

            <div className="text-gray-700 dark:text-gray-300 text-base mt-8">
              <p>
                💡 يوفر تطبيق DIRECT نظامًا ذكيًا للمشاركة في الرحلات (Carpooling)،
                يخفض التكاليف ويزيد من الكفاءة ويحد من الازدحام المروري.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AboutUsPage;