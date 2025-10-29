"use client";

import React from "react";
import PageHeader from "@/components/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Car, Users, Globe } from "lucide-react";

const AboutUsPage: React.FC = () => {
  return (
    <div className="container mx-auto p-4">
      <PageHeader title="عن DIRECT" description="تعرف على رؤيتنا وقيمنا." backPath="/" />

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>قصتنا</CardTitle>
          <CardDescription>كيف بدأنا وما الذي نسعى لتحقيقه.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
            تأسست DIRECT بهدف إحداث ثورة في قطاع النقل من خلال توفير حلول ذكية وموثوقة. نؤمن بأن التنقل يجب أن يكون سهلاً، آمنًا، ومتاحًا للجميع. منذ انطلاقنا، التزمنا بتقديم أفضل تجربة للمستخدمين، سواء كانوا ركابًا يبحثون عن رحلة مريحة أو سائقين يسعون لفرص عمل مرنة.
          </p>
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed mt-4">
            نحن نسعى جاهدين لبناء مجتمع يثق في خدماتنا، حيث تلتقي التكنولوجيا بالاحتياجات اليومية لخلق تجربة نقل سلسة وفعالة.
          </p>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>رؤيتنا</CardTitle>
          <CardDescription>مستقبل النقل الذكي.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
            أن نكون المزود الرائد لخدمات النقل الذكي في المنطقة، مع التركيز على الابتكار، الاستدامة، ورضا العملاء. نطمح إلى ربط المدن والمجتمعات بطرق تساهم في تحسين جودة الحياة وتقليل الازدحام البيئي.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>قيمنا</CardTitle>
          <CardDescription>ما الذي يوجه عملنا.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div className="flex flex-col items-center text-center">
            <Car className="h-8 w-8 text-primary mb-2" />
            <h4 className="font-semibold text-lg mb-1">الموثوقية</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">نلتزم بتقديم خدمة آمنة وفي الوقت المحدد.</p>
          </div>
          <div className="flex flex-col items-center text-center">
            <Users className="h-8 w-8 text-primary mb-2" />
            <h4 className="font-semibold text-lg mb-1">المجتمع</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">نبني علاقات قوية مع ركابنا وسائقينا.</p>
          </div>
          <div className="flex flex-col items-center text-center">
            <Globe className="h-8 w-8 text-primary mb-2" />
            <h4 className="font-semibold text-lg mb-1">الابتكار</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">نبحث دائمًا عن طرق جديدة لتحسين خدماتنا.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AboutUsPage;