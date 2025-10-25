import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { MadeWithDyad } from "@/components/made-with-dyad";

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-900 to-black text-white p-4 text-center">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-5xl md:text-6xl font-bold mb-6 text-green-400">
          DIRECT
        </h1>
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
            <Button className="bg-green-500 hover:bg-green-600 text-white text-lg px-8 py-6 rounded-lg shadow-lg transition-all duration-300 transform hover:scale-105">
              ابدأ الآن
            </Button>
          </Link>
          <Link to="/help">
            <Button
              variant="outline"
              className="text-green-400 border-green-400 hover:bg-green-400 hover:text-black text-lg px-8 py-6 rounded-lg shadow-lg transition-all duration-300 transform hover:scale-105"
            >
              تعرف على المزيد
            </Button>
          </Link>
        </div>

        <div className="text-gray-400 text-sm mt-8">
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