"use client";

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Send, Loader2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import PageHeader from "@/components/PageHeader"; // Import PageHeader

const ReportsPage = () => {
  const navigate = useNavigate();
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject || !message) {
      toast.error("الرجاء ملء حقل الموضوع والرسالة.");
      return;
    }

    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      toast.error("الرجاء تسجيل الدخول لإرسال بلاغ.");
      setLoading(false);
      return;
    }

    console.log("Report submitted:", {
      userId: user.id,
      email: user.email,
      subject,
      message,
    });

    await new Promise(resolve => setTimeout(resolve, 1500));

    setLoading(false);
    toast.success("تم إرسال بلاغك بنجاح! سنتواصل معك قريباً.");
    setSubject("");
    setMessage("");
    navigate("/user-settings");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-950 p-4">
      <Card className="w-full max-w-md bg-white dark:bg-gray-900 shadow-lg rounded-lg">
        <div className="p-6"> {/* Added padding to the div containing PageHeader */}
          <PageHeader
            title="بلاغات وشكاوى"
            description="أرسل بلاغًا أو شكوى لفريق الدعم"
          />
        </div>
        <CardContent>
          <form onSubmit={handleSubmitReport} className="space-y-6">
            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="subject">الموضوع</Label>
              <Input
                id="subject"
                type="text"
                placeholder="موضوع البلاغ أو الشكوى"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="mt-1"
                required
              />
            </div>
            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="message">الرسالة</Label>
              <Textarea
                id="message"
                placeholder="اكتب تفاصيل بلاغك أو شكواك هنا..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="mt-1 resize-y min-h-[120px]"
                required
              />
            </div>
            <Button type="submit" className="w-full bg-red-500 hover:bg-red-600 text-white mt-6" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin ml-2 rtl:mr-2" />
                  جاري الإرسال...
                </>
              ) : (
                <>
                  إرسال البلاغ <Send className="h-4 w-4 mr-2 rtl:ml-2" />
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ReportsPage;