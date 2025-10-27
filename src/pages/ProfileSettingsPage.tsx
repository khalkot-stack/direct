"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  Session,
  createClientComponentClient,
} from "@supabase/auth-helpers-nextjs";
import { Database } from "../lib/database.types";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Switch } from "../components/ui/switch";

type Profiles = Database["public"]["Tables"]["profiles"]["Row"];

export default function ProfileSettingsPage({
  session,
}: {
  session: Session | null;
}) {
  const supabase = createClientComponentClient<Database>();
  const [loading, setLoading] = useState(true);
  const [fullname, setFullname] = useState<Profiles["full_name"]>(null);
  const [username, setUsername] = useState<Profiles["username"]>(null);
  const [website, setWebsite] = useState<Profiles["website"]>(null);
  const [avatar_url, setAvatarUrl] = useState<Profiles["avatar_url"]>(null);
  const [isDriver, setIsDriver] = useState<Profiles["is_driver"]>(false);
  const [carModel, setCarModel] = useState<Profiles["car_model"]>(null);
  const [carColor, setCarColor] = useState<Profiles["car_color"]>(null);
  const [licensePlate, setLicensePlate] =
    useState<Profiles["license_plate"]>(null);

  const user = session?.user;

  const getProfile = useCallback(async () => {
    try {
      setLoading(true);

      const { data, error, status } = await supabase
        .from("profiles")
        .select(`full_name, username, website, avatar_url, is_driver, car_model, car_color, license_plate`)
        .eq("id", user?.id)
        .single();

      if (error && status !== 406) {
        throw error;
      }

      if (data) {
        setFullname(data.full_name);
        setUsername(data.username);
        setWebsite(data.website);
        setAvatarUrl(data.avatar_url);
        setIsDriver(data.is_driver);
        setCarModel(data.car_model);
        setCarColor(data.car_color);
        setLicensePlate(data.license_plate);
      }
    } catch (error) {
      toast.error("Error loading user profile!");
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [user, supabase]);

  useEffect(() => {
    getProfile();
  }, [getProfile]);

  async function updateProfile({
    username,
    website,
    avatar_url,
    is_driver,
    car_model,
    car_color,
    license_plate,
  }: {
    username: Profiles["username"];
    website: Profiles["website"];
    avatar_url: Profiles["avatar_url"];
    is_driver: Profiles["is_driver"];
    car_model: Profiles["car_model"];
    car_color: Profiles["car_color"];
    license_plate: Profiles["license_plate"];
  }) {
    try {
      setLoading(true);

      const { error } = await supabase.from("profiles").upsert({
        id: user?.id as string,
        full_name: fullname,
        username,
        website,
        avatar_url,
        is_driver,
        car_model,
        car_color,
        license_plate,
        updated_at: new Date().toISOString(),
      });
      if (error) throw error;
      toast.success("Profile updated!");
    } catch (error) {
      toast.error("Error updating the profile!");
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  const handleAvatarChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0) {
      toast.error("You must select an image to upload.");
      return;
    }

    const file = event.target.files[0];
    const fileExt = file.name.split(".").pop();
    const filePath = `${user?.id}/${Math.random()}.${fileExt}`;

    try {
      setLoading(true);
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      const { data: publicUrlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      if (publicUrlData) {
        setAvatarUrl(publicUrlData.publicUrl);
        await updateProfile({
          username,
          website,
          avatar_url: publicUrlData.publicUrl,
          is_driver: isDriver,
          car_model: carModel,
          car_color: carColor,
          license_plate: licensePlate,
        });
      }
    } catch (error) {
      toast.error("Error uploading avatar: " + (error as Error).message);
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-xl shadow-lg">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            إعدادات الملف الشخصي
          </h2>
        </div>
        <div className="flex flex-col items-center space-y-4">
          <Avatar className="h-24 w-24">
            <AvatarImage src={avatar_url || "https://github.com/shadcn.png"} />
            <AvatarFallback>CN</AvatarFallback>
          </Avatar>
          <Input
            id="avatar-upload"
            type="file"
            accept="image/*"
            onChange={handleAvatarChange}
            className="hidden"
          />
          <Label htmlFor="avatar-upload" className="cursor-pointer">
            <Button asChild>
              <span>تغيير الصورة الرمزية</span>
            </Button>
          </Label>
        </div>
        <div className="space-y-4">
          <div className="grid w-full items-center gap-1.5">
            <Label htmlFor="email">البريد الإلكتروني</Label>
            <Input id="email" type="text" value={user?.email} disabled />
          </div>
          <div className="grid w-full items-center gap-1.5">
            <Label htmlFor="fullName">الاسم الكامل</Label>
            <Input
              id="fullName"
              type="text"
              value={fullname || ""}
              onChange={(e) => setFullname(e.target.value)}
            />
          </div>
          <div className="grid w-full items-center gap-1.5">
            <Label htmlFor="username">اسم المستخدم</Label>
            <Input
              id="username"
              type="text"
              value={username || ""}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          <div className="grid w-full items-center gap-1.5">
            <Label htmlFor="website">الموقع الإلكتروني</Label>
            <Input
              id="website"
              type="url"
              value={website || ""}
              onChange={(e) => setWebsite(e.target.value)}
            />
          </div>
          <div className="flex items-center justify-between space-x-2">
            <Label htmlFor="is-driver">هل أنت سائق؟</Label>
            <Switch
              id="is-driver"
              checked={isDriver}
              onCheckedChange={setIsDriver}
            />
          </div>

          {isDriver && (
            <>
              <div className="grid w-full items-center gap-1.5">
                <Label htmlFor="car-model">موديل السيارة</Label>
                <Input
                  id="car-model"
                  type="text"
                  value={carModel || ""}
                  onChange={(e) => setCarModel(e.target.value)}
                />
              </div>
              <div className="grid w-full items-center gap-1.5">
                <Label htmlFor="car-color">لون السيارة</Label>
                <Input
                  id="car-color"
                  type="text"
                  value={carColor || ""}
                  onChange={(e) => setCarColor(e.target.value)}
                />
              </div>
              <div className="grid w-full items-center gap-1.5">
                <Label htmlFor="license-plate">رقم اللوحة</Label>
                <Input
                  id="license-plate"
                  type="text"
                  value={licensePlate || ""}
                  onChange={(e) => setLicensePlate(e.target.value)}
                />
              </div>
            </>
          )}

          <Button
            className="w-full"
            onClick={() =>
              updateProfile({
                username,
                website,
                avatar_url,
                is_driver: isDriver,
                car_model: carModel,
                car_color: carColor,
                license_plate: licensePlate,
              })
            }
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              "تحديث الملف الشخصي"
            )}
          </Button>
          <Button
            className="w-full"
            variant="outline"
            onClick={() => supabase.auth.signOut()}
          >
            تسجيل الخروج
          </Button>
        </div>
      </div>
    </div>
  );
}