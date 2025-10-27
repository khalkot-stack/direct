import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase"; // Import supabase client
import { Loader2 } from "lucide-react";

const AuthPage = () => {
  const [userType, setUserType] = useState<"passenger" | "driver" | "admin">("passenger");
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [registerName, setRegisterName] = useState("");
  const [registerPhone, setRegisterPhone] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [loading, setLoading] = useState(true); // State for initial auth check
  const [authActionLoading, setAuthActionLoading] = useState(false); // State for login/register buttons
  const navigate = useNavigate();

  useEffect(() => {
    const checkUserSession = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (session) {
        const userRole = session.user?.user_metadata?.user_type;
        if (userRole === "passenger") {
          navigate("/passenger-dashboard");
        } else if (userRole === "driver") {
          navigate("/driver-dashboard");
        } else if (userRole === "admin") {
          navigate("/admin-dashboard");
        } else {
          navigate("/"); // Fallback if user_type is not defined
        }
      }
      setLoading(false);
    };

    checkUserSession();

    // Listen for auth state changes
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        const userRole = session.user?.user_metadata?.user_type;
        if (userRole === "passenger") {
          navigate("/passenger-dashboard");
        } else if (userRole === "driver") {
          navigate("/driver-dashboard");
        } else if (userRole === "admin") {
          navigate("/admin-dashboard");
        } else {
          navigate("/");
        }
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthActionLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({
      email: loginEmail,
      password: loginPassword,
    });
    setAuthActionLoading(false);

    if (error) {
      toast.error(`فشل تسجيل الدخول: ${error.message}`);
    } else if (data.user) {
      toast.success("تم تسجيل الدخول بنجاح!");
      // Redirection is handled by the useEffect auth state listener
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthActionLoading(true);
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
    setAuthActionLoading(false);

    if (error) {
      toast.error(`فشل التسجيل: ${error.message}`);
    } else if (data.user) {
      toast.success("تم التسجيل بنجاح! يرجى تفعيل حسابك عبر البريد الإلكتروني.");
      // Redirection is handled by the useEffect auth state listener
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-950">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="sr-only">جاري التحميل...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-950 p-4">
      <Card className="w-full max-w-md bg-white dark:bg-gray-900 shadow-lg rounded-lg">
        <CardHeader className="text-center">
          <img src="/assets/images/دايركت.png" alt="DIRECT Logo" className="mx-auto h-16 mb-4" />
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
                  onValueChange={(value: "passenger" | "driver" | "admin") =>
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
                  <div className="flex items-center space-x-2 rtl:space-x-reverse">
                    <RadioGroupItem value="admin" id="admin-login" />
                    <Label htmlFor="admin-login">مدير</Label>
                  </div>
                </RadioGroup>
                <Button type="submit" className="w-full bg-primary hover:bg-primary-dark text-primary-foreground mt-6 transition-transform duration-200 ease-in-out hover:scale-[1.01]" disabled={authActionLoading}>
                  {authActionLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin ml-2 rtl:mr-2" />
                      جاري تسجيل الدخول...
                    </>
                  ) : (
                    "تسجيل الدخول"
                  )}
                </Button>
                <div className="mt-4 text-center text-sm">
                  <Link to="/forgot-password" className="text-blue-500 hover:underline dark:text-blue-400">
                    نسيت كلمة المرور؟
                  </Link>
                </div>
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
                  onValueChange={(value: "passenger" | "driver" | "admin") =>
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
                  <div className="flex items-center space-x-2 rtl:space-x-reverse">
                    <RadioGroupItem value="admin" id="admin-register" />
                    <Label htmlFor="admin-register">مدير</Label>
                  </div>
                </RadioGroup>
                <Button type="submit" className="w-full bg-primary hover:bg-primary-dark text-primary-foreground mt-6 transition-transform duration-200 ease-in-out hover:scale-[1.01]" disabled={authActionLoading}>
                  {authActionLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin ml-2 rtl:mr-2" />
                      جاري إنشاء الحساب...
                    </>
                  ) : (
                    "إنشاء حساب"
                  )}
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