import { supabase } from './supabase';

export async function uploadItemImage(file: File): Promise<string> {
  // Generate a clean, unique file path: timestamp_filename.ext
  const fileExt = file.name.split('.').pop();
  const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
  const filePath = `uploads/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('item-images')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (uploadError) {
    throw uploadError;
  }

  // Get the public URL
  const { data } = supabase.storage.from('item-images').getPublicUrl(filePath);
  return data.publicUrl;
}