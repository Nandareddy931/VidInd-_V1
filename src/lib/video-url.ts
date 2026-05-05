import { supabase } from "@/integrations/supabase/client";

/**
 * Extract the object path within the `videos` bucket from a stored URL.
 * Stored URLs may be public (legacy) or signed; both contain `/videos/<path>`.
 * Returns null if the URL doesn't reference the videos bucket.
 */
export function extractVideosPath(url: string): string | null {
  if (!url) return null;
  const marker = "/object/";
  const i = url.indexOf(marker);
  if (i === -1) return null;
  // .../object/{public|sign}/videos/<path>?token=...
  const rest = url.slice(i + marker.length);
  const parts = rest.split("/");
  // parts[0] = "public" | "sign", parts[1] = bucket
  const bucketIdx = parts[0] === "public" || parts[0] === "sign" ? 1 : 0;
  if (parts[bucketIdx] !== "videos") return null;
  const pathWithQuery = parts.slice(bucketIdx + 1).join("/");
  return pathWithQuery.split("?")[0] || null;
}

/**
 * Resolve a stored video URL to a playable URL. Since the `videos` bucket is
 * private, this creates a short-lived signed URL. Falls back to the original
 * URL if the path can't be parsed (e.g. external URLs).
 */
export async function resolveVideoUrl(
  storedUrl: string,
  expiresInSeconds = 60 * 60,
): Promise<string> {
  const path = extractVideosPath(storedUrl);
  if (!path) return storedUrl;
  const { data, error } = await supabase.storage
    .from("videos")
    .createSignedUrl(path, expiresInSeconds);
  if (error || !data?.signedUrl) return storedUrl;
  return data.signedUrl;
}
