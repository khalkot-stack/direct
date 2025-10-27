import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { MadeWithDyad } from "@/components/made-with-dyad";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"; // Import Card components
import { ShieldCheck, DollarSign, TrafficCone, Zap } from "lucide-react"; // Import new icons

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col items-center bg-gradient-to-br from-gray-900 to-primary-dark text-white p-4 text-center">
      {/* Logo Container at the top */}
      <div className="w-full flex justify-center pt-8 pb-4">
        <div className="bg-white p-4 rounded-lg shadow-lg">
          <img src="/assets/images/دايركت.png" alt="DIRECT Logo" className="mx-auto h-16 mb-4" />
        </div>
      </div>

      <div className="max-w-3xl mx-auto flex-1 flex flex-col justify-center">
        <p className="text-2xl md:text-3xl mb-8 font-light">
          وسيلتك الذكية للتنقل داخل الأردن
        </p>
        <p className="text-lg md:text-xl mb-10 text-gray-300 leading-relaxed">
          تطبيق DIRECT هو منصة رقمية مبتكرة تربط بين الركاب والسائقين في جميع
          محافظات المملكة الأردنية الهاشمية، لتجعل تجربة التنقل أكثر سهولة،
          سرعة، أمانًا، وموثوقية.
        </p>

        <div className="flex flex-col sm:flex-row justify-center gap-4 mb-12">
          <Link to="/auth">
            <Button className="bg-primary hover:bg-primary-dark text-primary-foreground text-lg px-8 py-6 rounded-lg shadow-lg transition-all duration-300 transform hover:scale-105">
              ابدأ الآن
            </Button>
          </Link>
          <Link to="/help">
            <Button
              variant="outline"
              className="text-primary border-primary hover:bg-primary hover:text-primary-foreground text-lg px-8 py-6 rounded-lg shadow-lg transition-all duration-300 transform hover:scale-105"
            >
              تعرف على المزيد
            </Button>
          </Link>
        </div>

        {/* New Feature Highlights Section */}
        <section className="mt-12 mb-8">
          <h3 className="text-3xl font-bold mb-8 text-white">لماذا تختار DIRECT؟</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-lg transition-transform duration-200 ease-in-out hover:scale-[1.02]">
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
            <Card className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-lg transition-transform duration-200 ease-in-out hover:scale-[1.02]">
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
            <Card className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-lg transition-transform duration-200 ease-in-out hover:scale-[1.02]">
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
            <Card className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-lg transition-transform duration-200 ease-in-out hover:scale-[1.02]">
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
          </div>
        </section>

        <div className="text-gray-200 text-sm mt-8">
          <p>
            💡 يوفر تطبيق DIRECT نظامًا ذكيًا للمشاركة في الرحلات (Carpooling)،
            يخفض التكاليف ويزيد من الكفاءة ويحد من الازدحام المروري.
          </p>
        </div>
      </div>
      <MadeWithDyad />
    </div>
  );
};

export default Index;