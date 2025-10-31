"use client";

import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, History, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUser } from '@/context/UserContext';

const BottomNavigationBar = () => {
  const location = useLocation();
  const { profile, loading: userLoading } = useUser();
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    if (!userLoading) {
      setUserRole(profile?.user_type || null);
    }
  }, [userLoading, profile]);

  const getNavItems = () => {
    if (userLoading) {
      return [];
    }
    if (userRole === 'passenger') {
      return [
        { name: 'الرئيسية', icon: Home, path: '/passenger-dashboard' },
        { name: 'رحلاتي', icon: History, path: '/passenger-dashboard/my-rides' },
        { name: 'الإعدادات', icon: Settings, path: '/app-settings' },
      ];
    } else if (userRole === 'driver') {
      return [
        { name: 'الرئيسية', icon: Home, path: '/driver-dashboard' }, // Points to DriverHome
        { name: 'رحلاتي المقبولة', icon: History, path: '/driver-dashboard/accepted-rides' },
        { name: 'الإعدادات', icon: Settings, path: '/app-settings' },
      ];
    }
    return [];
  };

  const navItems = getNavItems();

  if (navItems.length === 0) {
    return null;
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
                className={`flex flex-col items-center justify-center h-full w-full text-xs font-medium ${isActive ? 'text-primary dark:text-primary-light' : 'text-gray-500 dark:text-gray-400 hover:text-primary dark:hover:text-primary-light'}`}
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