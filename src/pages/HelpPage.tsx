"use client";

import React from "react";
import PageHeader from "@/components/PageHeader";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, Phone, MapPin } from "lucide-react";

const HelpPage: React.FC = () => {
  const faqItems = [
    {
      question: "كيف يمكنني طلب رحلة؟",
      answer: "يمكنك طلب رحلة من خلال النقر على زر 'طلب رحلة' في لوحة تحكم الراكب، ثم إدخال موقع الانطلاق والوجهة وعدد الركاب."
    },
    {
      question: "كيف أصبح سائقًا؟",
      answer: "للتسجيل كسائق، يجب عليك إنشاء حساب، ثم تحديث نوع المستخدم الخاص بك إلى 'سائق' في إعدادات الملف الشخصي وتقديم المستندات المطلوبة (إذا كانت هناك)."
    },
    {
      question: "ماذا أفعل إذا واجهت مشكلة في التطبيق؟",
      answer: "إذا واجهت أي مشكلة، يرجى محاولة إعادة تشغيل التطبيق. إذا استمرت المشكلة، يمكنك التواصل مع فريق الدعم الفني عبر البريد الإلكتروني أو الهاتف الموضح أدناه."
    },
    {
      question: "كيف يتم حساب تكلفة الرحلة؟",
      answer: "تعتمد تكلفة الرحلة على المسافة والوقت ونوع المركبة وأي رسوم إضافية قد تنطبق. سيتم عرض التكلفة التقديرية قبل تأكيد الرحلة."
    },
  ];

  return (
    <div className="container mx-auto p-4">
      <PageHeader title="المساعدة والدعم" description="ابحث عن إجابات لأسئلتك الشائعة أو تواصل معنا." backPath="/" />

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>الأسئلة الشائعة</CardTitle>
          <CardDescription>إجابات سريعة على استفساراتك.</CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            {faqItems.map((item, index) => (
              <AccordionItem value={`item-${index}`} key={index}>
                <AccordionTrigger className="text-right">{item.question}</AccordionTrigger>
                <AccordionContent className="text-right">
                  {item.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>تواصل معنا</CardTitle>
          <CardDescription>نحن هنا لمساعدتك.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-3 rtl:space-x-reverse">
            <Mail className="h-5 w-5 text-primary" />
            <p className="text-gray-700 dark:text-gray-300">support@direct.com</p>
          </div>
          <div className="flex items-center space-x-3 rtl:space-x-reverse">
            <Phone className="h-5 w-5 text-primary" />
            <p className="text-gray-700 dark:text-gray-300">+962 7XXXXXXXX</p>
          </div>
          <div className="flex items-center space-x-3 rtl:space-x-reverse">
            <MapPin className="h-5 w-5 text-primary" />
            <p className="text-gray-700 dark:text-gray-300">عمان، الأردن</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default HelpPage;