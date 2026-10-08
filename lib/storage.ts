import { supabase } from './supabase';

const IMAGE_BUCKET = 'item-images';

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

export interface UploadedImage {
  /** Public URL to store on the item. */
  url: string;
  /** Storage path, needed to remove the file again if a later step fails. */
  path: string;
}

export async function uploadItemImage(file: File): Promise<UploadedImage> {
  const problem = validateImageFile(file);
  if (problem) throw new Error(problem);

  // Generate a clean, unique file path: timestamp_random.ext
  const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${IMAGE_EXTENSIONS[file.type]}`;
  const path = `uploads/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from(IMAGE_BUCKET)
    .upload(path, file, {
      cacheControl: '3600',
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    throw uploadError;
  }

  const { data } = supabase.storage.from(IMAGE_BUCKET).getPublicUrl(path);
  return { url: data.publicUrl, path };
}

/** Best-effort removal of uploaded images (after a failed save, or once an item no longer uses them). */
export async function removeItemImage(...paths: string[]): Promise<void> {
  if (paths.length === 0) return;
  const { error } = await supabase.storage.from(IMAGE_BUCKET).remove(paths);
  if (error) console.error('Could not remove uploaded images:', paths, error);
}

/** The storage path of an image this app uploaded, from its public URL; null for any other URL (an
 *  image hosted elsewhere is not ours to delete). */
export function imagePathFromUrl(url: unknown): string | null {
  if (typeof url !== 'string') return null;
  const marker = `/storage/v1/object/public/${IMAGE_BUCKET}/`;
  const at = url.indexOf(marker);
  if (at < 0) return null;
  const path = decodeURIComponent(url.slice(at + marker.length).split(/[?#]/)[0]);
  return path.startsWith('uploads/') ? path : null;
}
