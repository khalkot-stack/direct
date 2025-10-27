import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { MadeWithDyad } from "@/components/made-with-dyad";

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col items-center bg-gradient-to-br from-gray-900 to-primary-dark text-white p-4 text-center">
      {/* Logo Container at the top */}
      <div className="w-full flex justify-center pt-8 pb-4">
        <div className="bg-white p-4 rounded-lg shadow-lg">
          <img src="/assets/images/دايركت.png" alt="DIRECT Logo" className="h-24" />
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