"use client";

import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, MapPin, Car, History, User, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

const BottomNavigationBar = () => {
  const location = useLocation();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserRole = async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Get user_type directly from app_metadata
        setUserRole(user.app_metadata?.user_type as string || null);
      } else {
        setUserRole(null);
      }
      setLoading(false);
    };

    fetchUserRole();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUserRole(session.user.app_metadata?.user_type as string || null);
      } else {
        setUserRole(null);
      }
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  const getNavItems = () => {
    if (loading) {
      return []; // Don't show items while loading role
    }
    if (userRole === 'passenger') {
      return [
        { name: 'الرئيسية', icon: Home, path: '/passenger-dashboard' },
        { name: 'طلب رحلة', icon: MapPin, path: '/passenger-dashboard/request-ride' },
        { name: 'رحلاتي', icon: History, path: '/passenger-dashboard/my-rides' },
        { name: 'الإعدادات', icon: Settings, path: '/app-settings' },
      ];
    } else if (userRole === 'driver') {
      return [
        { name: 'الرئيسية', icon: Home, path: '/driver-dashboard' },
        { name: 'البحث عن ركاب', icon: Car, path: '/driver-dashboard/find-rides' },
        { name: 'رحلاتي المقبولة', icon: History, path: '/driver-dashboard/accepted-rides' },
        { name: 'الإعدادات', icon: Settings, path: '/app-settings' },
      ];
    }
    // If user is not logged in or role is admin, this component should not be rendered by MainLayout.
    // However, as a fallback or for testing, we can return empty or default items.
    return [];
  };

  const navItems = getNavItems();

  // This component is now rendered conditionally by MainLayout, so no need for internal hide logic.
  // If it's rendered, it means the user is authenticated as passenger or driver.
  if (navItems.length === 0) {
    return null; // Should not happen if MainLayout is used correctly
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t dark:border-gray-700 shadow-lg z-50">
      <div className="max-w-md mx-auto flex justify-around h-16">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link to={item.path} key={item.name} className="flex-1 flex items-center justify-center">
              <Button
                variant="ghost"
                className={`flex flex-col items-center justify-center h-full w-full text-xs font-medium ${isActive ? 'text-primary dark:text-primary-foreground' : 'text-gray-500 dark:text-gray-400 hover:text-primary dark:hover:text-primary-foreground'}`}
              >
                <item.icon className="h-5 w-5 mb-1" />
                <span>{item.name}</span>
              </Button>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNavigationBar;