"use client";

import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, Car, History, User, Bell, Settings, BarChart, Loader2, MapPin } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const DriverDashboard = () => {
  const navigate = useNavigate();
  const [driverName, setDriverName] = useState('السائق');
  const [driverAvatar, setDriverAvatar] = useState('');
  const [loading, setLoading] = useState(true);
  const [driverId, setDriverId] = useState<string | null>(null);
  const [isUpdatingLocation, setIsUpdatingLocation] = useState(false);

  useEffect(() => {
    const fetchDriverProfile = async () => {
      setLoading(true);
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError || !user) {
        toast.error("فشل جلب معلومات المستخدم. الرجاء تسجيل الدخول.");
        navigate('/auth');
        setLoading(false);
        return;
      }
      setDriverId(user.id);

      let currentProfile;
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('full_name, avatar_url, user_type, current_lat, current_lng') // Include new location columns
        .eq('id', user.id)
        .single();

      if (profileError && profileError.code === 'PGRST116') { // No profile found
        console.warn("No profile found for user, attempting to create one based on auth metadata.");
        const { data: newProfile, error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            full_name: user.user_metadata.full_name || 'السائق',
            email: user.email,
            user_type: user.user_metadata.user_type || 'driver', // Default to driver if not explicitly set in metadata
            phone_number: user.user_metadata.phone_number || null,
            status: 'active', // Default status
          })
          .select('full_name, avatar_url, user_type, current_lat, current_lng') // Include new location columns
          .single();

        if (insertError) {
          toast.error(`فشل إنشاء ملف تعريف السائق: ${insertError.message}`);
          console.error("Error creating driver profile:", insertError);
          navigate('/auth');
          setLoading(false);
          return;
        } else if (newProfile) {
          currentProfile = newProfile;
          toast.success("تم إنشاء ملف تعريف السائق بنجاح.");
        }
      } else if (profileError) { // Other types of errors fetching profile
        toast.error(`فشل جلب ملف تعريف السائق: ${profileError.message}`);
        console.error("Error fetching driver profile:", profileError);
        navigate('/auth');
        setLoading(false);
        return;
      } else if (profile) {
        currentProfile = profile;
      }

      if (currentProfile) {
        setDriverName(currentProfile.full_name || 'السائق');
        setDriverAvatar(currentProfile.avatar_url || '');

        // Double-check user_type from the profile table
        if (currentProfile.user_type !== 'driver') {
          toast.error("ليس لديك الصلاحيات الكافية للوصول إلى لوحة تحكم السائق.");
          // Redirect based on actual role or to home
          if (currentProfile.user_type === 'passenger') {
            navigate('/passenger-dashboard');
          } else if (currentProfile.user_type === 'admin') {
            navigate('/admin-dashboard');
          } else {
            navigate('/');
          }
          setLoading(false);
          return;
        }
      }
      setLoading(false);
    };

    fetchDriverProfile();
  }, [navigate]);

  const handleUpdateLocation = async () => {
    if (!driverId) {
      toast.error("خطأ: معرف السائق غير موجود.");
      return;
    }
    setIsUpdatingLocation(true);

    // Simulate a random location update near Amman
    const newLat = 31.9539 + (Math.random() - 0.5) * 0.05; // +/- 0.025 degrees
    const newLng = 35.9106 + (Math.random() - 0.5) * 0.05;

    const { error } = await supabase
      .from('profiles')
      .update({ current_lat: newLat, current_lng: newLng })
      .eq('id', driverId);

    if (error) {
      toast.error(`فشل تحديث الموقع: ${error.message}`);
      console.error("Error updating driver location:", error);
    } else {
      toast.success("تم تحديث موقعك بنجاح!");
    }
    setIsUpdatingLocation(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-950">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="sr-only">جاري تحميل لوحة تحكم السائق...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-50 p-4 sm:p-6 pb-20">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3 rtl:space-x-reverse">
            <Avatar className="h-12 w-12 border-2 border-primary">
              <AvatarImage src={driverAvatar} alt={driverName} />
              <AvatarFallback>{driverName.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl font-bold">مرحباً، {driverName}!</h1>
              <p className="text-gray-600 dark:text-gray-400">لوحة تحكم السائق</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={() => navigate('/notifications')}>
            <Bell className="h-6 w-6 text-gray-700 dark:text-gray-300" />
            <span className="sr-only">الإشعارات</span>
          </Button>
        </div>

        <div className="mb-8 flex flex-col sm:flex-row gap-4">
            <Link to="/driver-dashboard/find-rides" className="flex-1 transition-transform duration-200 ease-in-out hover:scale-[1.01]">
              <Button className="w-full bg-primary hover:bg-primary-dark text-primary-foreground text-lg px-6 py-3 rounded-lg shadow-md flex items-center justify-center gap-2">
                <Search className="h-5 w-5" />
                البحث عن ركاب
              </Button>
            </Link>
            <Button
              onClick={handleUpdateLocation}
              disabled={isUpdatingLocation}
              className="flex-1 bg-blue-500 hover:bg-blue-600 text-white text-lg px-6 py-3 rounded-lg shadow-md flex items-center justify-center gap-2 transition-transform duration-200 ease-in-out hover:scale-[1.01]"
            >
              {isUpdatingLocation ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin ml-2 rtl:mr-2" />
                  جاري تحديث الموقع...
                </>
              ) : (
                <>
                  تحديث موقعي <MapPin className="h-5 w-5" />
                </>
              )}
            </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          <Card className="hover:shadow-lg transition-shadow duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">الرحلات المتاحة</CardTitle>
              <Car className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">5</div> {/* Placeholder data */}
              <p className="text-xs text-muted-foreground">رحلات جديدة تنتظرك</p>
            </CardContent>
          </Card>
          <Card className="hover:shadow-lg transition-shadow duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">الرحلات المكتملة</CardTitle>
              <History className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">120</div> {/* Placeholder data */}
              <p className="text-xs text-muted-foreground">إجمالي الرحلات المكتملة</p>
            </CardContent>
          </Card>
          <Card className="hover:shadow-lg transition-shadow duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">التقييم</CardTitle>
              <BarChart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">4.8 <span className="text-sm font-normal">/ 5</span></div> {/* Placeholder data */}
              <p className="text-xs text-muted-foreground">متوسط تقييم الركاب</p>
            </CardContent>
          </Card>
        </div>

        <h2 className="text-xl font-semibold mb-4">إجراءات سريعة</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <Link to="/driver-dashboard/accepted-rides" className="transition-transform duration-200 ease-in-out hover:scale-[1.01]">
            <Card className="flex flex-col items-center justify-center p-4 text-center hover:bg-gray-100 dark:hover:bg-gray-800">
              <History className="h-8 w-8 mb-2 text-blue-500" />
              <p className="text-sm font-medium">رحلاتي المقبولة</p>
            </Card>
          </Link>
          <Link to="/profile-settings" className="transition-transform duration-200 ease-in-out hover:scale-[1.01]">
            <Card className="flex flex-col items-center justify-center p-4 text-center hover:bg-gray-100 dark:hover:bg-gray-800">
              <User className="h-8 w-8 mb-2 text-green-500" />
              <p className="text-sm font-medium">ملفي الشخصي</p>
            </Card>
          </Link>
          <Link to="/app-settings" className="transition-transform duration-200 ease-in-out hover:scale-[1.01]">
            <Card className="flex flex-col items-center justify-center p-4 text-center hover:bg-gray-100 dark:hover:bg-gray-800">
              <Settings className="h-8 w-8 mb-2 text-purple-500" />
              <p className="text-sm font-medium">الإعدادات</p>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default DriverDashboard;