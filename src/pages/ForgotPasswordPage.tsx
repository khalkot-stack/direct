"use client";

import React, { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      toast.error(`فشل إرسال رابط إعادة التعيين: ${error.message}`);
      console.error("Error sending password reset link:", error);
    } else {
      setMessage("تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني. الرجاء التحقق من صندوق الوارد الخاص بك.");
      toast.success("تم إرسال رابط إعادة تعيين كلمة المرور!");
    }
    setLoading(false);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-950 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold text-primary dark:text-primary-light">
            نسيت كلمة المرور
          </CardTitle>
          <CardDescription>
            أدخل بريدك الإلكتروني وسنرسل لك رابطًا لإعادة تعيين كلمة المرور.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleResetPassword} className="space-y-4">
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
            <Button type="submit" className="w-full bg-primary hover:bg-primary-dark text-primary-foreground" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin ml-2 rtl:mr-2" />
                  جاري الإرسال...
                </>
              ) : (
                "إعادة تعيين كلمة المرور"
              )}
            </Button>
          </form>
          {message && (
            <p className="mt-4 text-center text-sm text-green-600 dark:text-green-400">
              {message}
            </p>
          )}
          <div className="mt-4 text-center text-sm">
            <Link to="/auth" className="text-primary hover:underline">
              العودة إلى تسجيل الدخول
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ForgotPasswordPage;