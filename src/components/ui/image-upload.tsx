"use client";

import { useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Upload, X, User } from "lucide-react";

interface ImageUploadProps {
  value?: string | null;
  onChange: (url: string) => void;
  size?: "sm" | "md" | "lg";
  label?: string;
}

export function ImageUpload({
  value,
  onChange,
  size = "md",
  label = "Upload Photo",
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const sizeMap = { sm: "h-12 w-12", md: "h-20 w-20", lg: "h-28 w-28" };
  const avatarSize = sizeMap[size];

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5MB");
      return;
    }

    setUploading(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const fileExt = file.name.split(".").pop();
      const fileName = `avatars/${user?.id ?? "user"}-${Date.now()}.${fileExt}`;

      const { data, error } = await supabase.storage
        .from("avatars")
        .upload(fileName, file, { upsert: true });

      if (error) {
        const reader = new FileReader();
        reader.onloadend = () => {
          onChange(reader.result as string);
          setUploading(false);
          toast.success("Photo uploaded");
        };
        reader.readAsDataURL(file);
        return;
      }

      const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(fileName);
      onChange(urlData.publicUrl);
      toast.success("Photo uploaded successfully");
    } catch {
      const reader = new FileReader();
      reader.onloadend = () => {
        onChange(reader.result as string);
        toast.success("Photo saved");
      };
      reader.readAsDataURL(file);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <div
        className={`${avatarSize} rounded-full overflow-hidden bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center cursor-pointer hover:border-blue-400 transition relative`}
        onClick={() => inputRef.current?.click()}
      >
        {value ? (
          <img src={value} alt="Avatar" className="w-full h-full object-cover" />
        ) : (
          <User
            className="text-gray-400"
            size={size === "lg" ? 40 : size === "md" ? 28 : 18}
          />
        )}
        {uploading && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center rounded-full">
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="text-xs px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg flex items-center gap-1 transition"
        >
          <Upload size={12} /> {uploading ? "Uploading..." : label}
        </button>
        {value && (
          <button
            type="button"
            onClick={() => onChange("")}
            className="text-xs px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg flex items-center gap-1 transition"
          >
            <X size={12} /> Remove
          </button>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
}
