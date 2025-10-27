"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription } from "@/components/ui/card";
import { Bell, Loader2, CheckCircle2 } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import EmptyState from "@/components/EmptyState";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  read_at: string | null;
  created_at: string;
}

const NotificationsPage = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [markingAsRead, setMarkingAsRead] = useState(false);

  const fetchNotifications = useCallback(async (currentUserId: string) => {
    setLoading(true);
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', currentUserId)
      .order('created_at', { ascending: false });

    if (error) {
      toast.error(`فشل جلب الإشعارات: ${error.message}`);
      console.error("Error fetching notifications:", error);
    } else {
      setNotifications(data as Notification[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    const getUserAndFetchNotifications = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        fetchNotifications(user.id);
      } else {
        toast.error("الرجاء تسجيل الدخول لعرض إشعاراتك.");
      }
    };
    getUserAndFetchNotifications();

    // Optional: Realtime subscription for new notifications
    const channel = supabase
      .channel('notifications_channel')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
        (payload) => {
          toast.info(`إشعار جديد: ${payload.new.title}`);
          if (userId) fetchNotifications(userId); // Re-fetch notifications
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchNotifications, userId]);

  const handleMarkAllAsRead = async () => {
    if (!userId) return;
    setMarkingAsRead(true);
    const unreadNotificationIds = notifications.filter(n => !n.read_at).map(n => n.id);

    if (unreadNotificationIds.length === 0) {
      toast.info("لا توجد إشعارات غير مقروءة.");
      setMarkingAsRead(false);
      return;
    }

    const { error } = await supabase
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .in('id', unreadNotificationIds);

    if (error) {
      toast.error(`فشل تحديد الإشعارات كمقروءة: ${error.message}`);
      console.error("Error marking notifications as read:", error);
    } else {
      toast.success("تم تحديد جميع الإشعارات كمقروءة.");
      if (userId) fetchNotifications(userId); // Refresh notifications
    }
    setMarkingAsRead(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-950">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="sr-only">جاري تحميل الإشعارات...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-950 p-4">
      <Card className="w-full max-w-md bg-white dark:bg-gray-900 shadow-lg rounded-lg">
        <div className="p-6">
          <PageHeader
            title="الإشعارات"
            description="جميع التنبيهات والتحديثات الخاصة بك"
          />
        </div>
        <CardContent className="space-y-4">
          {notifications.length > 0 ? (
            <>
              <Button
                onClick={handleMarkAllAsRead}
                disabled={markingAsRead || notifications.every(n => n.read_at !== null)}
                className="w-full bg-secondary hover:bg-secondary-foreground text-secondary-foreground hover:text-primary-foreground transition-transform duration-200 ease-in-out hover:scale-[1.01]"
              >
                {markingAsRead ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin ml-2 rtl:mr-2" />
                    جاري التحديد...
                  </>
                ) : (
                  <>
                    تحديد الكل كمقروء <CheckCircle2 className="h-4 w-4 mr-2 rtl:ml-2" />
                  </>
                )}
              </Button>
              <ScrollArea className="h-[300px] w-full rounded-md border dark:border-gray-700 p-4">
                <div className="space-y-3">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={cn(
                        "p-3 rounded-md border",
                        notification.read_at
                          ? "bg-muted/50 dark:bg-gray-800 border-muted dark:border-gray-700 text-muted-foreground"
                          : "bg-background dark:bg-gray-700 border-primary/50 dark:border-primary/30 text-foreground font-medium",
                      )}
                    >
                      <p className="text-sm font-semibold">{notification.title}</p>
                      <p className="text-xs mt-1">{notification.message}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                        {new Date(notification.created_at).toLocaleString('ar-SA', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </>
          ) : (
            <EmptyState
              icon={Bell}
              title="لا توجد إشعارات جديدة"
              description="عندما يكون لديك إشعارات، ستظهر هنا."
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default NotificationsPage;