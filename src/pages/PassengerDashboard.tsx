import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import LogoutButton from "@/components/LogoutButton";
import BottomNavigationBar from "@/components/BottomNavigationBar"; // Import BottomNavigationBar
import { Home, MapPin, Car, Bell, Settings } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

const PassengerDashboard = () => {
  const isMobile = useIsMobile();

  const passengerNavItems = [
    { name: "الرئيسية", href: "/passenger-dashboard", icon: Home },
    { name: "الخريطة", href: "/request-ride", icon: MapPin }, // Using request-ride as map placeholder
    { name: "رحلاتي", href: "/passenger-requests", icon: Car },
    { name: "الإشعارات", href: "/notifications", icon: Bell },
    { name: "الإعدادات", href: "/user-settings", icon: Settings },
  ];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 p-4 pb-20 md:pb-4">
      <Card className="w-full max-w-2xl bg-white dark:bg-gray-800 shadow-lg rounded-lg text-center">
        <CardHeader>
          <img src="/assets/images/دايركت.png" alt="DIRECT Logo" className="mx-auto h-16 mb-4" />
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
              <Button className="bg-primary hover:bg-primary-dark text-primary-foreground text-lg px-6 py-3 rounded-lg shadow-md">
                طلب رحلة جديدة
              </Button>
            </Link>
            <Link to="/passenger-requests">
              <Button variant="outline" className="text-primary border-primary hover:bg-primary hover:text-primary-foreground text-lg px-6 py-3 rounded-lg shadow-md">
                عرض طلباتي
              </Button>
            </Link>
          </div>
          {!isMobile && (
            <div className="mt-6">
              <LogoutButton />
            </div>
          )}
          {!isMobile && (
            <Link to="/" className="text-blue-500 hover:underline dark:text-blue-400">
              العودة للصفحة الرئيسية
            </Link>
          )}
        </CardContent>
      </Card>
      <BottomNavigationBar navItems={passengerNavItems} />
    </div>
  );
};

export default PassengerDashboard;