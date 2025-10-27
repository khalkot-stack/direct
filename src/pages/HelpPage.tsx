"use client";

import React from "react";
import { Card, CardContent, CardDescription } from "@/components/ui/card";
import PageHeader from "@/components/PageHeader"; // Import PageHeader

const HelpPage = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-950 p-4">
      <Card className="w-full max-w-2xl bg-white dark:bg-gray-900 shadow-lg rounded-lg">
        <div className="p-6"> {/* Added padding to the div containing PageHeader */}
          <PageHeader
            title="تعرف على المزيد حول DIRECT"
            description="كل ما تحتاج معرفته عن تطبيقنا"
            backPath="/"
          />
        </div>
        <CardContent className="space-y-6 text-right">
          <section>
            <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">ما هو DIRECT؟</h3>
            <p className="text-gray-700 dark:text-gray-300">
              تطبيق DIRECT هو منصة رقمية مبتكرة تربط بين الركاب والسائقين في جميع محافظات المملكة الأردنية الهاشمية، لتجعل تجربة التنقل أكثر سهولة، سرعة، أمانًا، وموثوقية.
            </p>
          </section>

          <section>
            <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">كيف يعمل؟</h3>
            <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-1">
              <li><span className="font-medium">للركاب:</span> يمكنك طلب رحلة بسهولة عن طريق تحديد موقع الانطلاق والوجهة وعدد الركاب.</li>
              <li><span className="font-medium">للسائقين:</span> يمكنك تصفح طلبات الرحلات المتاحة وقبول الرحلات التي تناسبك.</li>
            </ul>
          </section>

          <section>
            <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">ميزاتنا</h3>
            <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-1">
              <li><span className="font-medium">سهولة الاستخدام:</span> واجهة بسيطة وبديهية لطلب وقبول الرحلات.</li>
              <li><span className="font-medium">الأمان والموثوقية:</span> نضمن لك رحلات آمنة مع سائقين موثوقين.</li>
              <li><span className="font-medium">توفير التكاليف:</span> نظام مشاركة الرحلات (Carpooling) يقلل من التكاليف.</li>
              <li><span className="font-medium">تقليل الازدحام:</span> نساهم في حل مشكلة الازدحام المروري في المدن.</li>
            </ul>
          </section>

          <section>
            <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">تواصل معنا</h3>
            <p className="text-gray-700 dark:text-gray-300">
              إذا كان لديك أي أسئلة أو استفسارات، لا تتردد في التواصل مع فريق الدعم لدينا عبر البريد الإلكتروني: <a href="mailto:support@direct.com" className="text-blue-500 hover:underline">support@direct.com</a>
            </p>
          </section>
        </CardContent>
      </Card>
    </div>
  );
};

export default HelpPage;