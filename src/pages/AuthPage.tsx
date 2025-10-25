import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";

const AuthPage = () => {
  const [userType, setUserType] = useState<"passenger" | "driver">("passenger");
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate login
    toast.success("تم تسجيل الدخول بنجاح!");
    if (userType === "passenger") {
      navigate("/passenger-dashboard");
    } else {
      navigate("/driver-dashboard");
    }
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate registration
    toast.success("تم التسجيل بنجاح! يرجى تفعيل حسابك عبر البريد الإلكتروني.");
    // After registration, typically redirect to login or a verification page
    // For now, let's redirect to login tab
    // You might want to add actual form handling and API calls here
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-950 p-4">
      <Card className="w-full max-w-md bg-white dark:bg-gray-900 shadow-lg rounded-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold text-gray-900 dark:text-white">
            مرحباً بك في DIRECT
          </CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-400">
            سجل الدخول أو أنشئ حسابًا جديدًا
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="login">تسجيل الدخول</TabsTrigger>
              <TabsTrigger value="register">إنشاء حساب</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <Label htmlFor="login-email">البريد الإلكتروني</Label>
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="example@email.com"
                    required
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="login-password">كلمة المرور</Label>
                  <Input
                    id="login-password"
                    type="password"
                    placeholder="********"
                    required
                    className="mt-1"
                  />
                </div>
                <RadioGroup
                  defaultValue="passenger"
                  onValueChange={(value: "passenger" | "driver") =>
                    setUserType(value)
                  }
                  className="flex justify-center space-x-4 rtl:space-x-reverse mt-4"
                >
                  <div className="flex items-center space-x-2 rtl:space-x-reverse">
                    <RadioGroupItem value="passenger" id="passenger-login" />
                    <Label htmlFor="passenger-login">راكب</Label>
                  </div>
                  <div className="flex items-center space-x-2 rtl:space-x-reverse">
                    <RadioGroupItem value="driver" id="driver-login" />
                    <Label htmlFor="driver-login">سائق</Label>
                  </div>
                </RadioGroup>
                <Button type="submit" className="w-full bg-green-500 hover:bg-green-600 text-white mt-6">
                  تسجيل الدخول
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="register">
              <form onSubmit={handleRegister} className="space-y-4">
                <div>
                  <Label htmlFor="register-name">الاسم</Label>
                  <Input
                    id="register-name"
                    type="text"
                    placeholder="اسمك الكامل"
                    required
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="register-phone">رقم الهاتف</Label>
                  <Input
                    id="register-phone"
                    type="tel"
                    placeholder="07xxxxxxxxx"
                    required
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="register-email">البريد الإلكتروني</Label>
                  <Input
                    id="register-email"
                    type="email"
                    placeholder="example@email.com"
                    required
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="register-password">كلمة المرور</Label>
                  <Input
                    id="register-password"
                    type="password"
                    placeholder="********"
                    required
                    className="mt-1"
                  />
                </div>
                <RadioGroup
                  defaultValue="passenger"
                  onValueChange={(value: "passenger" | "driver") =>
                    setUserType(value)
                  }
                  className="flex justify-center space-x-4 rtl:space-x-reverse mt-4"
                >
                  <div className="flex items-center space-x-2 rtl:space-x-reverse">
                    <RadioGroupItem value="passenger" id="passenger-register" />
                    <Label htmlFor="passenger-register">راكب</Label>
                  </div>
                  <div className="flex items-center space-x-2 rtl:space-x-reverse">
                    <RadioGroupItem value="driver" id="driver-register" />
                    <Label htmlFor="driver-register">سائق</Label>
                  </div>
                </RadioGroup>
                <Button type="submit" className="w-full bg-green-500 hover:bg-green-600 text-white mt-6">
                  إنشاء حساب
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default AuthPage;