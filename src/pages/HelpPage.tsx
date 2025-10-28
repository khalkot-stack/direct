"use client";

import React from "react";
import { Card, CardContent, CardDescription } from "@/components/ui/card";
import PageHeader from "@/components/PageHeader"; // Import PageHeader
import { Info, Workflow, Star, Mail } from "lucide-react"; // Import new icons
import AppHeader from "@/components/AppHeader"; // Import AppHeader

const HelpPage = () => {
  return (
    <div className="min-h-screen flex flex-col items-center bg-gray-100 dark:bg-gray-950 p-4">
      <AppHeader /> {/* Global App Header */}
      <div className="flex-1 flex flex-col w-full"> {/* Removed items-center justify-center */}
        <Card className="w-full max-w-2xl bg-white dark:bg-gray-900 shadow-lg rounded-lg">
          <div className="p-6">
            <PageHeader
              title="تعرف على المزيد حول DIRECT"
              description="كل ما تحتاج معرفته عن تطبيقنا"
              backPath="/"
            />
          </div>
          <CardContent className="space-y-6 text-right">
            <section className="flex items-start gap-4"> {/* Added flex container for icon and text */}
              <Info className="h-6 w-6 text-primary shrink-0 mt-1" /> {/* Icon */}
              <div>
                <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">ما هو DIRECT؟</h3>
                <p className="text-gray-700 dark:text-gray-300">
                  تطبيق DIRECT هو منصة رقمية مبتكرة تربط بين الركاب والسائقين في جميع محافظات المملكة الأردنية الهاشمية، لتجعل تجربة التنقل أكثر سهولة، سرعة، أمانًا، وموثوقية.
                </p>
              </div>
            </section>

            <section className="flex items-start gap-4"> {/* Added flex container for icon and text */}
              <Workflow className="h-6 w-6 text-primary shrink-0 mt-1" /> {/* Icon */}
              <div>
                <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">كيف يعمل؟</h3>
                <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-1">
                  <li><span className="font-medium">للركاب:</span> يمكنك طلب رحلة بسهولة عن طريق تحديد موقع الانطلاق والوجهة وعدد الركاب.</li>
                  <li><span className="font-medium">للسائقين:</span> يمكنك تصفح طلبات الرحلات المتاحة وقبول الرحلات التي تناسبك.</li>
                </ul>
              </div>
            </section>

            <section className="flex items-start gap-4"> {/* Added flex container for icon and text */}
              <Star className="h-6 w-6 text-primary shrink-0 mt-1" /> {/* Icon */}
              <div>
                <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">ميزاتنا</h3>
                <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-1">
                  <li><span className="font-medium">سهولة الاستخدام:</span> واجهة بسيطة وبديهية لطلب وقبول الرحلات.</li>
                  <li><span className="font-medium">الأمان والموثوقية:</span> نضمن لك رحلات آمنة مع سائقين موثوقين.</li>
                  <li><span className="font-medium">توفير التكاليف:</span> نظام مشاركة الرحلات (Carpooling) يقلل من التكاليف.</li>
                  <li><span className="font-medium">تقليل الازدحام:</span> نساهم في حل مشكلة الازدحام المروري في المدن.</li>
                </ul>
              </div>
            </section>

            <section className="flex items-start gap-4"> {/* Added flex container for icon and text */}
              <Mail className="h-6 w-6 text-primary shrink-0 mt-1" /> {/* Icon */}
              <div>
                <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">تواصل معنا</h3>
                <p className="text-gray-700 dark:text-gray-300">
                  إذا كان لديك أي أسئلة أو استفسارات، لا تتردد في التواصل مع فريق الدعم لدينا عبر البريد الإلكتروني: <a href="mailto:support@direct.com" className="text-primary hover:underline dark:text-primary">support@direct.com</a>
                </p>
              </div>
            </section>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default HelpPage;