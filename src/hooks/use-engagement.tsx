import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

/**
 * Engagement hook for a single video: like state + counts, subscription
 * state + counts, and a one-shot `recordView` that satisfies the
 * "5s OR 30%" rule. Optimistic UI throughout.
 */
export function useVideoEngagement(
  videoId: string,
  creatorId?: string,
  initialViews: number = 0,
) {
  const { user, isAuthenticated } = useAuth();
  const [likesCount, setLikesCount] = useState(0);
  const [liked, setLiked] = useState(false);
  const [subscribersCount, setSubscribersCount] = useState(0);
  const [subscribed, setSubscribed] = useState(false);
  const [viewsCount, setViewsCount] = useState(initialViews || 0);

  useEffect(() => {
    if (typeof initialViews === "number" && initialViews > 0) {
      setViewsCount(initialViews);
    }
  }, [initialViews]);

  // Initial fetch — counts + my interaction state
  useEffect(() => {
    if (!videoId) return;
    let active = true;
    (async () => {
      const [{ data: video }, likeRow, subRow] = await Promise.all([
        supabase
          .from("videos")
          .select("likes_count, views, user_id")
          .eq("id", videoId)
          .maybeSingle(),
        user
          ? supabase
            .from("likes")
            .select("id")
            .eq("video_id", videoId)
            .eq("user_id", user.id)
            .maybeSingle()
          : Promise.resolve({ data: null } as { data: null }),
        user && creatorId
          ? supabase
            .from("subscriptions")
            .select("id")
            .eq("creator_id", creatorId)
            .eq("subscriber_id", user.id)
            .maybeSingle()
          : Promise.resolve({ data: null } as { data: null }),
      ]);

      if (!active) return;
      if (video) {
        setLikesCount(Number(video.likes_count ?? 0));
        setViewsCount(Number(video.views ?? (video as any).views_count ?? initialViews ?? 0));
      }
      setLiked(!!likeRow?.data);
      setSubscribed(!!subRow?.data);

      if (creatorId) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("subscribers_count")
          .eq("user_id", creatorId)
          .maybeSingle();
        if (active && profile) {
          setSubscribersCount(Number(profile.subscribers_count ?? 0));
        }
      }
    })();
    return () => {
      active = false;
    };
  }, [videoId, user, creatorId, initialViews]);

  const toggleLike = useCallback(async () => {
    if (!isAuthenticated || !user) {
      toast.error("Sign in to like videos");
      return;
    }
    const next = !liked;
    setLiked(next);
    setLikesCount((c) => Math.max(0, c + (next ? 1 : -1)));

    if (next) {
      const { error } = await supabase
        .from("likes")
        .insert({ video_id: videoId, user_id: user.id });
      if (error && error.code !== "23505") {
        setLiked(false);
        setLikesCount((c) => Math.max(0, c - 1));
        toast.error("Couldn't like video");
      }
    } else {
      const { error } = await supabase
        .from("likes")
        .delete()
        .eq("video_id", videoId)
        .eq("user_id", user.id);
      if (error) {
        setLiked(true);
        setLikesCount((c) => c + 1);
        toast.error("Couldn't remove like");
      }
    }
  }, [isAuthenticated, user, liked, videoId]);

  const toggleSubscribe = useCallback(async () => {
    if (!isAuthenticated || !user) {
      toast.error("Sign in to subscribe");
      return;
    }
    if (!creatorId) return;
    if (creatorId === user.id) {
      toast.error("You can't subscribe to yourself");
      return;
    }
    const next = !subscribed;
    setSubscribed(next);
    setSubscribersCount((c) => Math.max(0, c + (next ? 1 : -1)));

    if (next) {
      const { error } = await supabase
        .from("subscriptions")
        .insert({ creator_id: creatorId, subscriber_id: user.id });
      if (error && error.code !== "23505") {
        setSubscribed(false);
        setSubscribersCount((c) => Math.max(0, c - 1));
        toast.error("Couldn't subscribe");
      }
    } else {
      const { error } = await supabase
        .from("subscriptions")
        .delete()
        .eq("creator_id", creatorId)
        .eq("subscriber_id", user.id);
      if (error) {
        setSubscribed(true);
        setSubscribersCount((c) => c + 1);
        toast.error("Couldn't unsubscribe");
      }
    }
  }, [isAuthenticated, user, subscribed, creatorId]);

  /**
   * Record a view exactly once per mount, only if the watch condition is
   * satisfied (≥5s watched OR ≥30% of duration).
   */
  const recordView = useCallback(
    async (watchTimeSec: number, durationSec: number) => {
      const valid =
        watchTimeSec >= 5 ||
        (durationSec > 0 && watchTimeSec / durationSec >= 0.3);

      if (!valid || !videoId) return;

      console.log("🎯 Recording view:", {
        videoId,
        watched: watchTimeSec,
        duration: durationSec,
      });

      const device =
        typeof navigator !== "undefined" &&
          /Mobi|Android/i.test(navigator.userAgent)
          ? "mobile"
          : "desktop";

      // 1. Store view event
      const { error: viewError } = await supabase
        .from("video_views")
        .insert({
          video_id: videoId,
          user_id: user?.id ?? null,
          watch_time: Math.round(watchTimeSec),
          device,
        });

      if (viewError) {
        console.error("❌ video_views insert failed:", viewError);
        return;
      }

      // 2. Increment videos.views using RPC
      const { data, error: countError } = await supabase.rpc(
        "increment_video_views",
        {
          p_video_id: videoId,
        }
      );

      console.log("🟢 RPC RESULT:", { data, countError });

      if (countError) {
        console.error("🔴 RPC FAILED:", countError);
        return;
      }

      // 3. Update UI immediately
      setViewsCount((current) => current + 1);

      console.log("✅ View counted successfully:", videoId);
    },
    [videoId, user]
  );

  return {
    likesCount,
    liked,
    toggleLike,
    subscribersCount,
    subscribed,
    toggleSubscribe,
    viewsCount,
    recordView,
  };
}
