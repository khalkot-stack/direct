import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase"; // Import supabase client

const AuthPage = () => {
  const [userType, setUserType] = useState<"passenger" | "driver">("passenger");
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [registerName, setRegisterName] = useState("");
  const [registerPhone, setRegisterPhone] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [loading, setLoading] = useState(false); // State for loading indicator
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({
      email: loginEmail,
      password: loginPassword,
    });
    setLoading(false);

    if (error) {
      toast.error(`فشل تسجيل الدخول: ${error.message}`);
    } else if (data.user) {
      toast.success("تم تسجيل الدخول بنجاح!");
      // You might want to store userType in Supabase user metadata or a separate table
      // For now, we'll use the local state to decide redirection
      if (userType === "passenger") {
        navigate("/passenger-dashboard");
      } else {
        navigate("/driver-dashboard");
      }
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email: registerEmail,
      password: registerPassword,
      options: {
        data: {
          full_name: registerName,
          phone_number: registerPhone,
          user_type: userType, // Store user type in metadata
        },
      },
    });
    setLoading(false);

    if (error) {
      toast.error(`فشل التسجيل: ${error.message}`);
    } else if (data.user) {
      toast.success("تم التسجيل بنجاح! يرجى تفعيل حسابك عبر البريد الإلكتروني.");
      // Optionally redirect to login or a verification message page
      // For now, we'll just show the toast.
    }
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
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
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
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
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
                <Button type="submit" className="w-full bg-green-500 hover:bg-green-600 text-white mt-6" disabled={loading}>
                  {loading ? "جاري تسجيل الدخول..." : "تسجيل الدخول"}
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
                    value={registerName}
                    onChange={(e) => setRegisterName(e.target.value)}
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
                    value={registerPhone}
                    onChange={(e) => setRegisterPhone(e.target.value)}
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
                    value={registerEmail}
                    onChange={(e) => setRegisterEmail(e.target.value)}
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
                    value={registerPassword}
                    onChange={(e) => setRegisterPassword(e.target.value)}
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
                <Button type="submit" className="w-full bg-green-500 hover:bg-green-600 text-white mt-6" disabled={loading}>
                  {loading ? "جاري إنشاء الحساب..." : "إنشاء حساب"}
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