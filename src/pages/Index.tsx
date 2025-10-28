"use client";

import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { MadeWithDyad } from "@/components/made-with-dyad";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldCheck, DollarSign, TrafficCone, Zap } from "lucide-react";
import AppHeader from "@/components/AppHeader";

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col items-center bg-gradient-to-br from-gray-900 to-primary-dark text-white p-4 text-center overflow-hidden">
      <AppHeader />
      
      <div className="max-w-4xl mx-auto flex-1 flex flex-col justify-center pb-8"> {/* Removed pt-16 */}
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
          DIRECT: وسيلتك الذكية للتنقل
        </h1>
        <p className="text-lg md:text-xl mb-8 text-gray-300 leading-relaxed max-w-2xl mx-auto">
          منصة رقمية مبتكرة تربط بين الركاب والسائقين في جميع محافظات المملكة الأردنية الهاشمية، لتجعل تجربة التنقل أكثر سهولة، سرعة، أمانًا، وموثوقية.
        </p>

        <div className="flex flex-col sm:flex-row justify-center gap-4 mb-12">
          <Link to="/auth">
            <Button className="bg-primary hover:bg-primary-dark text-primary-foreground text-lg px-8 py-6 rounded-lg shadow-lg transition-all duration-300 transform hover:scale-105">
              ابدأ الآن
            </Button>
          </Link>
          <Link to="/about-us">
            <Button
              variant="outline"
              className="text-primary border-primary hover:bg-primary hover:text-primary-foreground text-lg px-8 py-6 rounded-lg shadow-lg transition-all duration-300 transform hover:scale-105"
            >
              لماذا DIRECT؟
            </Button>
          </Link>
        </div>

        {/* Features Section */}
        <section className="w-full max-w-4xl mx-auto mt-12">
          <h2 className="text-3xl font-bold mb-8 text-white">ميزاتنا الرئيسية</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="bg-white/10 text-white border-white/20 shadow-lg transition-transform duration-200 ease-in-out hover:scale-[1.03] hover:bg-white/20">
              <CardHeader className="flex flex-col items-center text-center">
                <Zap className="h-10 w-10 text-primary mb-3" />
                <CardTitle className="text-xl">سهولة الاستخدام</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-200">
                  واجهة بسيطة وبديهية لطلب وقبول الرحلات بسرعة.
                </p>
              </CardContent>
            </Card>
            <Card className="bg-white/10 text-white border-white/20 shadow-lg transition-transform duration-200 ease-in-out hover:scale-[1.03] hover:bg-white/20">
              <CardHeader className="flex flex-col items-center text-center">
                <ShieldCheck className="h-10 w-10 text-primary mb-3" />
                <CardTitle className="text-xl">الأمان والموثوقية</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-200">
                  نضمن لك رحلات آمنة مع سائقين موثوقين ومعتمدين.
                </p>
              </CardContent>
            </Card>
            <Card className="bg-white/10 text-white border-white/20 shadow-lg transition-transform duration-200 ease-in-out hover:scale-[1.03] hover:bg-white/20">
              <CardHeader className="flex flex-col items-center text-center">
                <DollarSign className="h-10 w-10 text-primary mb-3" />
                <CardTitle className="text-xl">توفير التكاليف</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-200">
                  نظام مشاركة الرحلات يقلل من تكاليف التنقل بشكل كبير.
                </p>
              </CardContent>
            </Card>
            <Card className="bg-white/10 text-white border-white/20 shadow-lg transition-transform duration-200 ease-in-out hover:scale-[1.03] hover:bg-white/20">
              <CardHeader className="flex flex-col items-center text-center">
                <TrafficCone className="h-10 w-10 text-primary mb-3" />
                <CardTitle className="text-xl">تقليل الازدحام</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-200">
                  نساهم في حل مشكلة الازدحام المروري في المدن.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        <div className="text-gray-200 text-sm mt-12">
          <Link to="/help" className="text-blue-300 hover:underline">
            تعرف على المزيد حول DIRECT
          </Link>
        </div>
      </div>
      <MadeWithDyad />
    </div>
  );
};

export default Index;