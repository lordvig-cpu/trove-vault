import { supabase } from './supabase';

/** Largest image accepted for upload. */
export const IMAGE_UPLOAD_MAX_BYTES = 10 * 1024 * 1024;

/** Accepted image types and the file extension used for each (never trust the user's filename). */
const IMAGE_EXTENSIONS: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/avif': 'avif',
};

/** Value for a file input's `accept` attribute. */
export const IMAGE_UPLOAD_ACCEPT = Object.keys(IMAGE_EXTENSIONS).join(',');

/** A user-facing reason the file cannot be uploaded, or null when it is fine. */
export function validateImageFile(file: File): string | null {
  if (!(file.type in IMAGE_EXTENSIONS)) {
    return 'Please choose a JPEG, PNG, WebP, GIF or AVIF image.';
  }
  if (file.size > IMAGE_UPLOAD_MAX_BYTES) {
    const mb = (file.size / (1024 * 1024)).toFixed(1);
    return `That image is ${mb} MB. The limit is ${IMAGE_UPLOAD_MAX_BYTES / (1024 * 1024)} MB.`;
  }
  return null;
}

export async function uploadItemImage(file: File): Promise<string> {
  const problem = validateImageFile(file);
  if (problem) throw new Error(problem);

  // Generate a clean, unique file path: timestamp_random.ext
  const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${IMAGE_EXTENSIONS[file.type]}`;
  const filePath = `uploads/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('item-images')
    .upload(filePath, file, {
      cacheControl: '3600',
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    throw uploadError;
  }

  // Get the public URL
  const { data } = supabase.storage.from('item-images').getPublicUrl(filePath);
  return data.publicUrl;
}
