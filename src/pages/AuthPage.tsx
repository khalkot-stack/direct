"use client";

import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const AuthPage: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (isLogin) {
      // Login
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        toast.error(`فشل تسجيل الدخول: ${error.message}`);
      } else {
        toast.success("تم تسجيل الدخول بنجاح!");
        // Redirect based on user role after successful login
        const { data: { user } } = await supabase.auth.getUser();
        const userRole = user?.user_metadata?.user_type;
        if (userRole === "passenger") {
          navigate("/passenger-dashboard");
        } else if (userRole === "driver") {
          navigate("/driver-dashboard");
        } else if (userRole === "admin") {
          navigate("/admin-dashboard");
        } else {
          navigate("/"); // Default fallback
        }
      }
    } else {
      // Register
      if (!fullName || !email || !password) {
        toast.error("الرجاء ملء جميع الحقول المطلوبة.");
        setLoading(false);
        return;
      }
      if (password.length < 6) {
        toast.error("يجب أن تتكون كلمة المرور من 6 أحرف على الأقل.");
        setLoading(false);
        return;
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            phone_number: phoneNumber,
            user_type: "passenger", // Default to passenger for new registrations
            status: "active",
          },
        },
      });

      if (error) {
        toast.error(`فشل التسجيل: ${error.message}`);
      } else if (data.user) {
        toast.success("تم التسجيل بنجاح! الرجاء التحقق من بريدك الإلكتروني لتفعيل الحساب.");
        setIsLogin(true); // Switch to login form after successful registration
        setEmail("");
        setPassword("");
        setFullName("");
        setPhoneNumber("");
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
          <form onSubmit={handleAuth} className="space-y-4">
            {!isLogin && (
              <div className="grid gap-2">
                <Label htmlFor="full-name">الاسم الكامل</Label>
                <Input
                  id="full-name"
                  type="text"
                  placeholder="أحمد محمد"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>
            )}
            <div className="grid gap-2">
              <Label htmlFor="email">البريد الإلكتروني</Label>
              <Input
                id="email"
                type="email"
                placeholder="example@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">كلمة المرور</Label>
              <Input
                id="password"
                type="password"
                placeholder="********"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {!isLogin && (
              <div className="grid gap-2">
                <Label htmlFor="phone-number">رقم الهاتف (اختياري)</Label>
                <Input
                  id="phone-number"
                  type="tel"
                  placeholder="07XXXXXXXX"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                />
              </div>
            )}
            <Button type="submit" className="w-full bg-primary hover:bg-primary-dark text-primary-foreground" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin ml-2 rtl:mr-2" />
                  جاري التحميل...
                </>
              ) : isLogin ? (
                "تسجيل الدخول"
              ) : (
                "إنشاء حساب"
              )}
            </Button>
          </form>
          <div className="mt-4 text-center text-sm">
            {isLogin ? (
              <>
                ليس لديك حساب؟{" "}
                <Link to="#" onClick={() => setIsLogin(false)} className="text-primary hover:underline">
                  إنشاء حساب
                </Link>
              </>
            ) : (
              <>
                لديك حساب بالفعل؟{" "}
                <Link to="#" onClick={() => setIsLogin(true)} className="text-primary hover:underline">
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