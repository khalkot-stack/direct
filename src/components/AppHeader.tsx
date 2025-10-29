"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface AppHeaderProps {
  className?: string;
}

const AppHeader: React.FC<AppHeaderProps> = ({ className }) => {
  const [userName, setUserName] = useState<string | null>(null);
  const [userAvatar, setUserAvatar] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserProfile = useCallback(async () => {
    setLoading(true);
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      setUserName(null);
      setUserAvatar(null);
      setLoading(false);
      return;
    }

    const { data, error, status } = await supabase
      .from('profiles')
      .select('full_name, avatar_url')
      .eq('id', user.id)
      .single();

    if (error && status !== 406) { // 406 means no rows found, which is fine if profile doesn't exist yet
      console.error("Error fetching user profile for header:", error);
      setUserName(null);
      setUserAvatar(null);
    } else if (data) {
      setUserName(data.full_name);
      setUserAvatar(data.avatar_url);
    } else { // No data found (status 406) or other non-critical error
      setUserName(user.email?.split('@')[0] || 'مستخدم'); // Fallback to email part or 'مستخدم'
      setUserAvatar(null);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchUserProfile();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        fetchUserProfile();
      } else {
        setUserName(null);
        setUserAvatar(null);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [fetchUserProfile]);

  return (
    <header className={cn("sticky top-0 z-50 w-full bg-white dark:bg-gray-900 border-b dark:border-gray-700 p-4 flex items-center justify-between shadow-sm", className)}>
      <div className="flex items-center gap-3">
        <Link to="/">
          {/* Placeholder for logo */}
          <span className="text-xl font-bold text-primary dark:text-primary-light">DIRECT</span>
        </Link>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      ) : userName ? (
        <Link to="/profile-settings" className="flex items-center gap-2 cursor-pointer hover:opacity-90 transition-opacity">
          <span className="text-sm font-medium text-gray-800 dark:text-white hidden sm:block">{userName}</span>
          <Avatar className="h-9 w-9 border-2 border-primary">
            <AvatarImage src={userAvatar || undefined} alt="User Avatar" />
            <AvatarFallback className="bg-muted dark:bg-gray-700 text-muted-foreground">
              {userName.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </Link>
      ) : (
        <Link to="/auth">
          <Button variant="outline" size="sm" className="text-primary border-primary hover:bg-primary hover:text-primary-foreground">
            تسجيل الدخول
          </Button>
        </Link>
      )}
    </header>
  );
};

export default AppHeader;