import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import LogoutButton from "@/components/LogoutButton";
import BottomNavigationBar from "@/components/BottomNavigationBar"; // Import BottomNavigationBar
import { Home, Search, CalendarDays, Bell, Settings } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

const DriverDashboard = () => {
  const isMobile = useIsMobile();

  const driverNavItems = [
    { name: "الرئيسية", href: "/driver-dashboard", icon: Home },
    { name: "البحث", href: "/find-rides", icon: Search },
    { name: "رحلاتي", href: "/driver-dashboard/accepted-rides", icon: CalendarDays },
    { name: "الإشعارات", href: "/notifications", icon: Bell },
    { name: "الإعدادات", href: "/user-settings", icon: Settings },
  ];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 p-4 pb-20 md:pb-4">
      <Card className="w-full max-w-2xl bg-white dark:bg-gray-800 shadow-lg rounded-lg text-center">
        <CardHeader>
          <img src="/assets/images/دايركت.png" alt="DIRECT Logo" className="mx-auto h-16 mb-4" />
          <CardTitle className="text-3xl font-bold text-gray-900 dark:text-white">
            لوحة تحكم السائق
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-lg text-gray-700 dark:text-gray-300">
            مرحباً بك أيها السائق! من هنا يمكنك البحث عن الركاب وقبول الطلبات.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link to="/find-rides">
              <Button className="bg-primary hover:bg-primary-dark text-primary-foreground text-lg px-6 py-3 rounded-lg shadow-md">
                البحث عن ركاب
              </Button>
            </Link>
            <Link to="/driver-dashboard/accepted-rides">
              <Button variant="outline" className="text-primary border-primary hover:bg-primary hover:text-primary-foreground text-lg px-6 py-3 rounded-lg shadow-md">
                عرض طلباتي المقبولة
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
      <BottomNavigationBar navItems={driverNavItems} />
    </div>
  );
};

export default DriverDashboard;