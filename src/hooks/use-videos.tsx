import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Video } from "@/lib/mock-data";

export type DbVideo = {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  category: string | null;
  video_url: string;
  thumbnail_url: string | null;
  visibility: string;
  views: number;
  created_at: string;
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  const w = Math.floor(d / 7);
  if (w < 5) return `${w}w ago`;
  const mo = Math.floor(d / 30);
  return `${mo}mo ago`;
}

function formatViews(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M views`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K views`;
  return `${n} views`;
}

export function dbVideoToCard(v: DbVideo, channelName?: string): Video & { videoUrl: string } {
  const name = channelName || "You";
  return {
    id: v.id,
    title: v.title,
    thumbnail: v.thumbnail_url || "",
    channel: name,
    channelInitial: (name[0] ?? "U").toUpperCase(),
    views: formatViews(v.views ?? 0),
    time: timeAgo(v.created_at),
    duration: "",
    badge: "New",
    category: v.category || "All",
    videoUrl: v.video_url,
  };
}

/** Fetch all public videos (newest first). */
export function usePublicVideos() {
  const [videos, setVideos] = useState<DbVideo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      const { data, error } = await supabase
        .from("videos")
        .select("*")
        .eq("visibility", "public")
        .order("created_at", { ascending: false })
        .limit(60);
      if (!active) return;
      if (!error && data) setVideos(data as DbVideo[]);
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, []);

  return { videos, loading };
}

/** Fetch the signed-in user's videos. */
export function useMyVideos(userId?: string) {
  const [videos, setVideos] = useState<DbVideo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setVideos([]);
      setLoading(false);
      return;
    }
    let active = true;
    setLoading(true);
    (async () => {
      const { data, error } = await supabase
        .from("videos")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
      if (!active) return;
      if (!error && data) setVideos(data as DbVideo[]);
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [userId]);

  return { videos, loading };
}
