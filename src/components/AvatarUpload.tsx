"use client";

import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, User, Camera } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface AvatarUploadProps {
  userId: string;
  initialAvatarUrl: string | null;
  onUploadSuccess: (newUrl: string) => void;
}

const AvatarUpload: React.FC<AvatarUploadProps> = ({
  userId,
  initialAvatarUrl,
  onUploadSuccess,
}) => {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(initialAvatarUrl);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setAvatarUrl(initialAvatarUrl);
  }, [initialAvatarUrl]);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0) {
      toast.error("الرجاء اختيار صورة لرفعها.");
      return;
    }

    const file = event.target.files[0];
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}.${fileExt}`;
    const filePath = `${userId}/${fileName}`; // Store in a user-specific folder

    setUploading(true);

    const { error: uploadError } = await supabase.storage
      .from('avatars') // Assuming a bucket named 'avatars'
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true, // Overwrite existing avatar
      });

    if (uploadError) {
      toast.error(`فشل رفع الصورة: ${uploadError.message}`);
      setUploading(false);
      return;
    }

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);

    if (!publicUrlData?.publicUrl) {
      toast.error("فشل الحصول على رابط الصورة.");
      setUploading(false);
      return;
    }

    const newAvatarUrl = publicUrlData.publicUrl;

    // Update profile table with new avatar URL
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ avatar_url: newAvatarUrl })
      .eq('id', userId);

    if (updateError) {
      toast.error(`فشل تحديث رابط الصورة في الملف الشخصي: ${updateError.message}`);
      setUploading(false);
      return;
    }

    setAvatarUrl(newAvatarUrl);
    onUploadSuccess(newAvatarUrl);
    toast.success("تم تحديث الصورة الشخصية بنجاح!");
    setUploading(false);
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <Avatar className="h-24 w-24 border-2 border-primary relative group cursor-pointer" onClick={handleClick}>
        <AvatarImage src={avatarUrl || undefined} alt="Avatar" className="object-cover" />
        <AvatarFallback className="bg-muted dark:bg-gray-700 text-muted-foreground">
          {uploading ? (
            <Loader2 className="h-8 w-8 animate-spin" />
          ) : (
            <User className="h-12 w-12" />
          )}
        </AvatarFallback>
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-full">
          <Camera className="h-8 w-8 text-white" />
        </div>
      </Avatar>
      <input
        type="file"
        id="avatar-upload"
        accept="image/*"
        onChange={handleFileChange}
        ref={fileInputRef}
        className="hidden"
        disabled={uploading}
      />
      <Button
        onClick={handleClick}
        disabled={uploading}
        variant="outline"
        className="flex items-center gap-2 text-primary border-primary hover:bg-primary hover:text-primary-foreground"
      >
        {uploading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin ml-2 rtl:mr-2" />
            جاري الرفع...
          </>
        ) : (
          <>
            تغيير الصورة الشخصية <Camera className="h-4 w-4 mr-2 rtl:ml-2" />
          </>
        )}
      </Button>
    </div>
  );
};

export default AvatarUpload;