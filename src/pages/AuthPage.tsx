"use client";

import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SystemSetting } from "@/types/supabase"; // Import SystemSetting type

const loginSchema = z.object({
  email: z.string().email({ message: "الرجاء إدخال بريد إلكتروني صالح." }),
  password: z.string().min(6, { message: "يجب أن تتكون كلمة المرور من 6 أحرف على الأقل." }),
});

const registerSchema = z.object({
  fullName: z.string().min(2, { message: "الاسم الكامل مطلوب." }),
  email: z.string().email({ message: "الرجاء إدخال بريد إلكتروني صالح." }),
  password: z.string().min(6, { message: "يجب أن تتكون كلمة المرور من 6 أحرف على الأقل." }),
  phoneNumber: z.string().optional(),
  userType: z.enum(["passenger", "driver"], { message: "الرجاء اختيار نوع المستخدم." }), // Added userType
});

type LoginFormInputs = z.infer<typeof loginSchema>;
type RegisterFormInputs = z.infer<typeof registerSchema>;

const AuthPage: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [allowNewRegistrations, setAllowNewRegistrations] = useState(true);
  const [driverAutoApprove, setDriverAutoApprove] = useState(false);
  const navigate = useNavigate();

  const loginForm = useForm<LoginFormInputs>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const registerForm = useForm<RegisterFormInputs>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      phoneNumber: "",
      userType: "passenger", // Default to passenger
    },
  });

  useEffect(() => {
    const fetchSettings = async () => {
      const { data, error } = await supabase
        .from('settings')
        .select('key, value')
        .in('key', ['allow_new_registrations', 'driver_auto_approve']);

      if (error) {
        console.error("Error fetching settings:", error);
        toast.error("فشل جلب إعدادات التطبيق.");
      } else {
        const settingsMap = new Map(data.map(s => [s.key, s.value]));
        setAllowNewRegistrations(settingsMap.get('allow_new_registrations') === 'true');
        setDriverAutoApprove(settingsMap.get('driver_auto_approve') === 'true');
      }
    };
    fetchSettings();
  }, []);

  const handleAuth = async (values: LoginFormInputs | RegisterFormInputs) => {
    setLoading(true);

    if (isLogin) {
      const { email, password } = values as LoginFormInputs;
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        toast.error(`فشل تسجيل الدخول: ${error.message}`);
      } else {
        toast.success("تم تسجيل الدخول بنجاح!");
        const { data: { user } } = await supabase.auth.getUser();
        const userRole = user?.app_metadata?.user_type; // Check app_metadata for role
        const userStatus = user?.app_metadata?.status; // Check app_metadata for status

        if (userStatus === 'pending_review') {
          await supabase.auth.signOut(); // Log out user if status is pending_review
          toast.info("حسابك قيد المراجعة. يرجى الانتظار حتى يتم تفعيله.");
          navigate("/auth");
        } else if (userRole === "passenger") {
          navigate("/passenger-dashboard");
        } else if (userRole === "driver") {
          navigate("/driver-dashboard");
        } else if (userRole === "admin") {
          navigate("/admin-dashboard");
        } else {
          navigate("/");
        }
      }
    } else {
      const { fullName, email, password, phoneNumber, userType } = values as RegisterFormInputs;

      const initialStatus = (userType === 'driver' && !driverAutoApprove) ? 'pending_review' : 'active';

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            phone_number: phoneNumber,
            user_type: userType,
            status: initialStatus,
          },
        },
      });

      if (error) {
        toast.error(`فشل التسجيل: ${error.message}`);
      } else if (data.user) {
        if (initialStatus === 'pending_review') {
          toast.success("تم التسجيل بنجاح! حسابك قيد المراجعة وسيتم تفعيله قريباً.");
        } else {
          toast.success("تم التسجيل بنجاح! الرجاء التحقق من بريدك الإلكتروني لتفعيل الحساب.");
        }
        setIsLogin(true);
        registerForm.reset();
      }
    }
    setLoading(false);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-950 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold text-primary dark:text-primary-light">
            {isLogin ? "تسجيل الدخول" : "إنشاء حساب"}
          </CardTitle>
          <CardDescription>
            {isLogin ? "أدخل بياناتك للوصول إلى حسابك." : "املأ النموذج لإنشاء حساب جديد."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLogin ? (
            <form onSubmit={loginForm.handleSubmit(handleAuth)} className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="email">البريد الإلكتروني</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="example@email.com"
                  {...loginForm.register("email")}
                />
                {loginForm.formState.errors.email && (
                  <p className="text-red-500 text-sm">{loginForm.formState.errors.email.message}</p>
                )}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">كلمة المرور</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="********"
                  {...loginForm.register("password")}
                />
                {loginForm.formState.errors.password && (
                  <p className="text-red-500 text-sm">{loginForm.formState.errors.password.message}</p>
                )}
              </div>
              <Button type="submit" className="w-full bg-primary hover:bg-primary-dark text-primary-foreground" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin ml-2 rtl:mr-2" />
                    جاري التحميل...
                  </>
                ) : (
                  "تسجيل الدخول"
                )}
              </Button>
            </form>
          ) : (
            <Form {...registerForm}>
              <form onSubmit={registerForm.handleSubmit(handleAuth)} className="space-y-4">
                <FormField
                  control={registerForm.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel htmlFor="full-name">الاسم الكامل</FormLabel>
                      <FormControl>
                        <Input
                          id="full-name"
                          type="text"
                          placeholder="أحمد محمد"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={registerForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel htmlFor="email">البريد الإلكتروني</FormLabel>
                      <FormControl>
                        <Input
                          id="email"
                          type="email"
                          placeholder="example@email.com"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={registerForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel htmlFor="password">كلمة المرور</FormLabel>
                      <FormControl>
                        <Input
                          id="password"
                          type="password"
                          placeholder="********"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={registerForm.control}
                  name="phoneNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel htmlFor="phone-number">رقم الهاتف (اختياري)</FormLabel>
                      <FormControl>
                        <Input
                          id="phone-number"
                          type="tel"
                          placeholder="07XXXXXXXX"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={registerForm.control}
                  name="userType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel htmlFor="user-type">نوع المستخدم</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger id="user-type">
                            <SelectValue placeholder="اختر نوع المستخدم" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="passenger">راكب</SelectItem>
                          <SelectItem value="driver">سائق</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full bg-primary hover:bg-primary-dark text-primary-foreground" disabled={loading || !allowNewRegistrations}>
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin ml-2 rtl:mr-2" />
                      جاري التحميل...
                    </>
                  ) : (
                    "إنشاء حساب"
                  )}
                </Button>
                {!allowNewRegistrations && (
                  <p className="text-red-500 text-sm text-center mt-2">
                    التسجيلات الجديدة معطلة حاليًا.
                  </p>
                )}
              </form>
            </Form>
          )}
          <div className="mt-4 text-center text-sm">
            {isLogin ? (
              <>
                ليس لديك حساب؟{" "}
                <Link to="#" onClick={() => { setIsLogin(false); loginForm.reset(); }} className="text-primary hover:underline">
                  إنشاء حساب
                </Link>
              </>
            ) : (
              <>
                لديك حساب بالفعل؟{" "}
                <Link to="#" onClick={() => { setIsLogin(true); registerForm.reset(); }} className="text-primary hover:underline">
                  تسجيل الدخول
                </Link>
              </>
            )}
          </div>
          {isLogin && (
            <div className="mt-2 text-center text-sm">
              <Link to="/forgot-password" className="text-muted-foreground hover:underline">
                نسيت كلمة المرور؟
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AuthPage;