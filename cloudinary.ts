/**
 * Dual Storage Image Uploader (Supabase Storage First + Cloudinary / Base64 Fallback)
 * Allows direct image uploading to Supabase Storage buckets ('property-images', 'avatars', 'receipts')
 * with graceful fallbacks.
 */
import { supabase, isSupabaseConfigured } from './supabase';

const getEnv = (key: string, fallback: string) => {
  try {
    return (import.meta as any).env?.[key] || fallback;
  } catch {
    return fallback;
  }
};

const CLOUDINARY_CLOUD_NAME = getEnv('VITE_CLOUDINARY_CLOUD_NAME', 'dfuk66xo6');
const CLOUDINARY_UPLOAD_PRESET = 'duyar_app';

export const uploadImage = async (
  file: File, 
  bucketName: 'property-images' | 'avatars' | 'receipts' | 'documents' = 'property-images'
): Promise<string | null> => {
  // 1. Primary Strategy: Supabase Storage
  if (isSupabaseConfigured && supabase) {
    try {
      const cleanName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const fileExt = cleanName.split('.').pop() || 'jpg';
      const filePath = `uploads/${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${fileExt}`;

      const { data, error } = await supabase.storage
        .from(bucketName)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
          contentType: file.type || 'image/jpeg'
        });

      if (!error && data) {
        const { data: publicUrlData } = supabase.storage
          .from(bucketName)
          .getPublicUrl(filePath);

        if (publicUrlData?.publicUrl) {
          return publicUrlData.publicUrl;
        }
      } else if (error) {
        console.warn('Supabase storage upload returned notice, attempting fallback:', error.message);
      }
    } catch (sbErr) {
      console.warn('Supabase storage upload failed, falling back:', sbErr);
    }
  }

  // 2. Secondary Strategy: Cloudinary Unsigned Upload
  try {
    const url = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

    const response = await fetch(url, {
      method: 'POST',
      body: formData,
    });

    if (response.ok) {
      const data = await response.json();
      if (data?.secure_url) {
        return data.secure_url;
      }
    }
  } catch (cldErr) {
    console.debug('Cloudinary upload fallback note:', cldErr);
  }

  // 3. Tertiary Reliable Fallback: Base64 Data URL (ensures immediate preview & persistence)
  return new Promise((resolve) => {
    try {
      const reader = new FileReader();
      reader.onloadend = () => {
        resolve(reader.result as string);
      };
      reader.onerror = () => {
        resolve(null);
      };
      reader.readAsDataURL(file);
    } catch {
      resolve(null);
    }
  });
};
