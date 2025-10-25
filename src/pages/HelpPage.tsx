"use client";

import React from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";

const HelpPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-950 p-4">
      <Card className="w-full max-w-2xl bg-white dark:bg-gray-900 shadow-lg rounded-lg">
        <CardHeader className="text-center">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/")}
            className="absolute top-4 right-4 rtl:left-4 rtl:right-auto"
          >
            <ChevronLeft className="h-6 w-6" />
            <span className="sr-only">العودة</span>
          </Button>
          <CardTitle className="text-3xl font-bold text-gray-900 dark:text-white">
            تعرف على المزيد حول DIRECT
          </CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-400">
            كل ما تحتاج معرفته عن تطبيقنا
          </CardDescription>
        </CardHeader>
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