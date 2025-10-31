"use client";

import React, { useState } from "react";
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

const loginSchema = z.object({
  email: z.string().email({ message: "الرجاء إدخال بريد إلكتروني صالح." }),
  password: z.string().min(6, { message: "يجب أن تتكون كلمة المرور من 6 أحرف على الأقل." }),
});

const registerSchema = z.object({
  fullName: z.string().min(2, { message: "الاسم الكامل مطلوب." }),
  email: z.string().email({ message: "الرجاء إدخال بريد إلكتروني صالح." }),
  password: z.string().min(6, { message: "يجب أن تتكون كلمة المرور من 6 أحرف على الأقل." }),
  phoneNumber: z.string().optional(),
});

type LoginFormInputs = z.infer<typeof loginSchema>;
type RegisterFormInputs = z.infer<typeof registerSchema>;

const AuthPage: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
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
    },
  });

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
        const userRole = user?.user_metadata?.user_type;
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
    } else {
      const { fullName, email, password, phoneNumber } = values as RegisterFormInputs;
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            phone_number: phoneNumber,
            user_type: "passenger",
            status: "active",
          },
        },
      });

      if (error) {
        toast.error(`فشل التسجيل: ${error.message}`);
      } else if (data.user) {
        toast.success("تم التسجيل بنجاح! الرجاء التحقق من بريدك الإلكتروني لتفعيل الحساب.");
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
            <form onSubmit={registerForm.handleSubmit(handleAuth)} className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="full-name">الاسم الكامل</Label>
                <Input
                  id="full-name"
                  type="text"
                  placeholder="أحمد محمد"
                  {...registerForm.register("fullName")}
                />
                {registerForm.formState.errors.fullName && (
                  <p className="text-red-500 text-sm">{registerForm.formState.errors.fullName.message}</p>
                )}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">البريد الإلكتروني</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="example@email.com"
                  {...registerForm.register("email")}
                />
                {registerForm.formState.errors.email && (
                  <p className="text-red-500 text-sm">{registerForm.formState.errors.email.message}</p>
                )}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">كلمة المرور</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="********"
                  {...registerForm.register("password")}
                />
                {registerForm.formState.errors.password && (
                  <p className="text-red-500 text-sm">{registerForm.formState.errors.password.message}</p>
                )}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="phone-number">رقم الهاتف (اختياري)</Label>
                <Input
                  id="phone-number"
                  type="tel"
                  placeholder="07XXXXXXXX"
                  {...registerForm.register("phoneNumber")}
                />
              </div>
              <Button type="submit" className="w-full bg-primary hover:bg-primary-dark text-primary-foreground" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin ml-2 rtl:mr-2" />
                    جاري التحميل...
                  </>
                ) : (
                  "إنشاء حساب"
                )}
              </Button>
            </form>
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