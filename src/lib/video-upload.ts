import { supabase } from "@/integrations/supabase/client";

const MAX_BYTES = 4 * 1024 * 1024 * 1024; // 4GB

export type VideoUploadMetadata = {
  videoFile: File;
  thumbnailFile?: File | null;
  title: string;
  description?: string;
  category?: string;
  visibility?: "public" | "private";
};

export type UploadResponse =
  | { success: true; video_id: string; video_url: string; message: string }
  | { success: false; error: string };

/**
 * 1. Validate video file type and size.
 */
export function validateVideoFile(file: File): { valid: boolean; error?: string } {
  const allowedExtensions = ["mp4", "webm", "mov"];
  const ext = file.name.split(".").pop()?.toLowerCase();

  const isAllowedType =
    file.type.startsWith("video/") || (ext && allowedExtensions.includes(ext));
  if (!isAllowedType) {
    return {
      valid: false,
      error: "Invalid file format. Only MP4, WebM, and MOV videos are allowed.",
    };
  }

  if (file.size > MAX_BYTES) {
    return { valid: false, error: "File exceeds the maximum limit of 4GB." };
  }

  return { valid: true };
}

/**
 * 2. Check current logged-in user.
 */
export async function getCurrentUser() {
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();
  if (error || !session?.user) {
    throw new Error("Login required");
  }
  return session.user;
}

/**
 * Helper to make a filename safe for storage paths.
 */
function getSafeFileName(fileName: string): string {
  const ext = fileName.split(".").pop() ?? "";
  const base = fileName.substring(0, fileName.lastIndexOf(".")) || fileName;
  const safeBase = base.replace(/[^a-zA-Z0-9_-]/g, "_");
  return `${safeBase}.${ext}`;
}

/**
 * 3. Upload video to Supabase Storage in "videos" bucket.
 * Path structure: {userId}/{timestamp}-{safeFileName}
 */
export async function uploadVideoFile(
  file: File,
  userId: string,
  abortSignal?: AbortSignal
): Promise<{ path: string; url: string }> {
  const timestamp = Date.now();
  const safeName = getSafeFileName(file.name);
  const storagePath = `${userId}/${timestamp}-${safeName}`;

  const { error } = await supabase.storage.from("videos").upload(storagePath, file, {
    cacheControl: "3600",
    upsert: false,
    contentType: file.type,
    // @ts-ignore – abortSignal is supported at runtime but not in the type definition
    abortSignal,
  });

  if (error) {
    throw new Error(`Video upload failed: ${error.message}`);
  }

  const { data: pub } = supabase.storage.from("videos").getPublicUrl(storagePath);
  if (!pub?.publicUrl) {
    throw new Error("Failed to get public URL for uploaded video");
  }

  return { path: storagePath, url: pub.publicUrl };
}

/**
 * 4. Upload thumbnail to Supabase Storage in "thumbnails" bucket.
 */
export async function uploadThumbnailFile(
  file: File,
  userId: string,
  abortSignal?: AbortSignal
): Promise<{ path: string; url: string }> {
  const timestamp = Date.now();
  const safeName = getSafeFileName(file.name);
  const storagePath = `${userId}/${timestamp}-${safeName}`;

  const { error } = await supabase.storage
    .from("thumbnails")
    .upload(storagePath, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type,
      // @ts-ignore – abortSignal is supported at runtime but not in the type definition
      abortSignal,
    });

  if (error) {
    throw new Error(`Thumbnail upload failed: ${error.message}`);
  }

  const { data: pub } = supabase.storage.from("thumbnails").getPublicUrl(storagePath);
  if (!pub?.publicUrl) {
    throw new Error("Failed to get public URL for uploaded thumbnail");
  }

  return { path: storagePath, url: pub.publicUrl };
}

/**
 * 5. Save video metadata to the `videos` table.
 *    Uses only the columns defined in the current DB schema (types.ts).
 */
export async function saveVideoMetadata(data: {
  user_id: string;
  title: string;
  description?: string | null;
  video_url: string;
  thumbnail_url?: string | null;
  category?: string | null;
  visibility?: string;
}) {
  const { data: inserted, error } = await supabase
    .from("videos")
    .insert({
      user_id: data.user_id,
      title: data.title,
      description: data.description || null,
      video_url: data.video_url,
      thumbnail_url: data.thumbnail_url || null,
      category: data.category || null,
      visibility: data.visibility || "public",
    })
    .select("id, video_url")
    .single();

  if (error) {
    throw new Error(`Failed to save video metadata: ${error.message}`);
  }

  return inserted;
}

/**
 * 6. Full upload orchestration: auth → validate → upload file → save metadata.
 */
export async function uploadVideoWithMetadata({
  videoFile,
  thumbnailFile,
  title,
  description,
  category,
  visibility = "public",
}: VideoUploadMetadata): Promise<UploadResponse> {
  try {
    // Auth check
    const user = await getCurrentUser();
    const userId = user.id;

    // File validation
    const validation = validateVideoFile(videoFile);
    if (!validation.valid) {
      throw new Error(validation.error || "Invalid file format");
    }

    // Upload video
    const videoUpload = await uploadVideoFile(videoFile, userId);

    // Upload thumbnail if provided
    let thumbnailUrl: string | null = null;
    if (thumbnailFile) {
      const thumbUpload = await uploadThumbnailFile(thumbnailFile, userId);
      thumbnailUrl = thumbUpload.url;
    }

    // Save to DB
    const saved = await saveVideoMetadata({
      user_id: userId,
      title,
      description,
      video_url: videoUpload.url,
      thumbnail_url: thumbnailUrl,
      category,
      visibility,
    });

    return {
      success: true,
      video_id: saved.id,
      video_url: videoUpload.url,
      message: "Video uploaded successfully",
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || "Unknown error during upload",
    };
  }
}
