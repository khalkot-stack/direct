import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const PassengerDashboard = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <Card className="w-full max-w-2xl bg-white dark:bg-gray-800 shadow-lg rounded-lg text-center">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-gray-900 dark:text-white">
            لوحة تحكم الراكب
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-lg text-gray-700 dark:text-gray-300">
            مرحباً بك أيها الراكب! من هنا يمكنك طلب الرحلات وإدارة طلباتك.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link to="/request-ride">
              <Button className="bg-green-500 hover:bg-green-600 text-white text-lg px-6 py-3 rounded-lg shadow-md">
                طلب رحلة جديدة
              </Button>
            </Link>
            <Link to="/passenger-requests"> {/* Updated link */}
              <Button variant="outline" className="text-green-500 border-green-500 hover:bg-green-500 hover:text-white text-lg px-6 py-3 rounded-lg shadow-md">
                عرض طلباتي
              </Button>
            </Link>
          </div>
          <Link to="/" className="text-blue-500 hover:underline dark:text-blue-400">
            العودة للصفحة الرئيسية
          </Link>
        </CardContent>
      </Card>
    </div>
  );
};

export default PassengerDashboard;