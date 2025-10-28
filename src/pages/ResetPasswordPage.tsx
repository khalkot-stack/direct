"use client";

import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { Loader2 } from "lucide-react";
import PageHeader from "@/components/PageHeader"; // Import PageHeader
import AppHeader from "@/components/AppHeader"; // Import AppHeader

const ResetPasswordPage: React.FC = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionLoading, setSessionLoading] = useState(true);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error || !session) {
        toast.error("رابط إعادة تعيين كلمة المرور غير صالح أو انتهت صلاحيته. يرجى طلب رابط جديد.");
        navigate("/forgot-password");
      }
      setSessionLoading(false);
    };

    checkSession();
  }, [navigate]);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error("كلمتا المرور غير متطابقتين.");
      return;
    }
    if (password.length < 6) {
      toast.error("يجب أن تتكون كلمة المرور من 6 أحرف على الأقل.");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({
      password: password,
    });
    setLoading(false);

    if (error) {
      toast.error(`فشل إعادة تعيين كلمة المرور: ${error.message}`);
    } else {
      toast.success("تم إعادة تعيين كلمة المرور بنجاح! يمكنك الآن تسجيل الدخول بكلمة المرور الجديدة.");
      navigate("/auth");
    }
  };

  if (sessionLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center bg-gray-100 dark:bg-gray-950">
        <AppHeader /> {/* Global App Header */}
        <div className="flex-1 flex items-center justify-center w-full pt-16"> {/* Added pt-16 for fixed header */}
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="sr-only">جاري التحقق من الجلسة...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center bg-gray-100 dark:bg-gray-950 p-4">
      <AppHeader /> {/* Global App Header */}
      <div className="flex-1 flex items-center justify-center w-full pt-16"> {/* Added pt-16 for fixed header */}
        <Card className="w-full max-w-md bg-white dark:bg-gray-900 shadow-lg rounded-lg">
          <div className="p-6"> {/* Added padding to the div containing PageHeader */}
            <PageHeader
              title="إعادة تعيين كلمة المرور"
              description="أدخل كلمة مرورك الجديدة"
              backPath="/auth"
            />
          </div>
          <CardContent>
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <Label htmlFor="password">كلمة المرور الجديدة</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="********"
                  required
                  className="mt-1"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="confirm-password">تأكيد كلمة المرور الجديدة</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  placeholder="********"
                  required
                  className="mt-1"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
              <Button type="submit" className="w-full bg-primary hover:bg-primary-dark text-primary-foreground mt-6 transition-transform duration-200 ease-in-out hover:scale-[1.01]" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin ml-2 rtl:mr-2" />
                    جاري إعادة التعيين...
                  </>
                ) : (
                  "إعادة تعيين كلمة المرور"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ResetPasswordPage;