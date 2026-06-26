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
  channel_name?: string | null;
  channel_avatar?: string | null;
  is_verified?: boolean | null;
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

export function dbVideoToCard(
  v: DbVideo,
  overrideChannelName?: string,
): Video & { videoUrl: string; channelAvatar?: string } {
  const name = overrideChannelName || v.channel_name || "VidInd Creator";

  return {
    id: v.id,
    title: v.title,
    thumbnail: v.thumbnail_url ?? "",
    channel: name,
    channelInitial: (name[0] ?? "V").toUpperCase(),
    channelAvatar: v.channel_avatar ?? "",
    views: formatViews(v.views ?? 0),
    time: timeAgo(v.created_at),
    duration: "",
    category: v.category || "All",
    isVerified: !!v.is_verified,
    videoUrl: v.video_url,
  };
}

export function usePublicVideos() {
  const [videos, setVideos] = useState<DbVideo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    (async () => {
      const { data: videoData, error: videoError } = await supabase
        .from("videos")
        .select("*")
        .eq("visibility", "public")
        .order("created_at", { ascending: false })
        .limit(60);

      if (!active) return;

      if (videoError || !videoData) {
        console.error("Videos error:", videoError);
        setVideos([]);
        setLoading(false);
        return;
      }

      const userIds = [...new Set(videoData.map((v: any) => v.user_id))];

      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("user_id, channel_name, avatar_url, is_verified")
        .in("user_id", userIds);

      if (profileError) {
        console.error("Profiles error:", profileError);
      }

      const profileMap = new Map(
        (profileData || []).map((p: any) => [p.user_id, p])
      );

      const finalVideos = videoData.map((video: any) => {
        const profile = profileMap.get(video.user_id);

        return {
          ...video,
          channel_name: profile?.channel_name,
          channel_avatar: profile?.avatar_url || null,
          is_verified: profile?.is_verified || false,
        };
      });

      setVideos(finalVideos as unknown as DbVideo[]);
      setLoading(false);
    })();

    return () => {
      active = false;
    };
  }, []);

  return { videos, loading };
}

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

      if (!error && data) {
        setVideos(data as unknown as DbVideo[]);
      }

      setLoading(false);
    })();

    return () => {
      active = false;
    };
  }, [userId]);

  return { videos, loading };
}