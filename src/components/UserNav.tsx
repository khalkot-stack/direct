"use client";

import React, { useState } from "react"; // Removed useEffect, useCallback
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Loader2, User, Settings, LogOut, LifeBuoy } from "lucide-react";
import { toast } from "sonner";
import { useUser } from "@/context/UserContext";

const UserNav: React.FC = () => {
  const { user, profile, loading: userLoading } = useUser(); // Removed fetchUserProfile
  const navigate = useNavigate();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    const { error } = await supabase.auth.signOut();
    setIsLoggingOut(false);

    if (error) {
      toast.error(`فشل تسجيل الخروج: ${error.message}`);
    } else {
      toast.success("تم تسجيل الخروج بنجاح.");
      navigate("/auth");
    }
  };

  if (userLoading) {
    return (
      <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }

  if (!user || !profile) {
    return (
      <Link to="/auth">
        <Button variant="outline" size="sm" className="text-primary border-primary hover:bg-primary hover:text-primary-foreground">
          تسجيل الدخول
        </Button>
      </Link>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-9 w-9 rounded-full">
          <Avatar className="h-9 w-9 border-2 border-primary">
            <AvatarImage src={profile.avatar_url || undefined} alt="User Avatar" />
            <AvatarFallback className="bg-muted dark:bg-gray-700 text-muted-foreground">
              {profile.full_name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{profile.full_name || user.email?.split('@')[0]}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {profile.email || user.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <Link to="/profile-settings" className="flex items-center">
              <User className="h-4 w-4 ml-2 rtl:mr-2" />
              <span>الملف الشخصي</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link to="/app-settings" className="flex items-center">
              <Settings className="h-4 w-4 ml-2 rtl:mr-2" />
              <span>الإعدادات</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link to="/help" className="flex items-center">
              <LifeBuoy className="h-4 w-4 ml-2 rtl:mr-2" />
              <span>المساعدة</span>
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout} disabled={isLoggingOut} className="text-red-500 focus:bg-red-50 focus:text-red-600 dark:focus:bg-red-900/20 dark:focus:text-red-400">
          <LogOut className="h-4 w-4 ml-2 rtl:mr-2" />
          <span>تسجيل الخروج</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default UserNav;