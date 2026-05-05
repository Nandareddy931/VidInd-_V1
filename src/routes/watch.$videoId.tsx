import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { VideoPlayer } from "@/components/VideoPlayer";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import type { Video } from "@/lib/mock-data";
import { supabase } from "@/integrations/supabase/client";
import { dbVideoToCard, type DbVideo } from "@/hooks/use-videos";
import { useVideoEngagement } from "@/hooks/use-engagement";
import { resolveVideoUrl } from "@/lib/video-url";
import {
  ArrowLeft,
  MoreVertical,
  Captions,
  Bell,
  ThumbsUp,
  ThumbsDown,
  Share2,
  Download,
  Bookmark,
  Send,
} from "lucide-react";
import { Comments } from "@/components/Comments";

export const Route = createFileRoute("/watch/$videoId")({
  head: ({ params }) => ({
    meta: [
      { title: `Watch — Vidind` },
      { name: "description", content: `Watch video ${params.videoId} on Vidind.` },
    ],
  }),
  errorComponent: ({ error, reset }) => {
    const router = useRouter();
    return (
      <AppLayout>
        <div className="mx-auto max-w-md text-center py-16">
          <p className="text-destructive font-semibold">Couldn't load video</p>
          <p className="text-sm text-muted-foreground mt-1">{error.message}</p>
          <Button
            className="mt-4"
            onClick={() => {
              router.invalidate();
              reset();
            }}
          >
            Retry
          </Button>
        </div>
      </AppLayout>
    );
  },
  notFoundComponent: () => (
    <AppLayout>
      <div className="mx-auto max-w-md text-center py-16">
        <h1 className="text-xl font-bold">Video not found</h1>
        <Link to="/" className="text-accent text-sm mt-2 inline-block">
          ← Back to home
        </Link>
      </div>
    </AppLayout>
  ),
  component: WatchPage,
});

type WatchVideo = Video & { videoUrl?: string; description?: string; creatorId?: string };

function WatchPage() {
  const { videoId } = Route.useParams();
  const [dbVideo, setDbVideo] = useState<WatchVideo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    (async () => {
      const { data } = await supabase
        .from("videos")
        .select("*")
        .eq("id", videoId)
        .maybeSingle();
      if (!active) return;
      if (data) {
        const row = data as DbVideo;
        const card = dbVideoToCard(row);
        // Resolve to a signed URL since the videos bucket is private.
        const playable = await resolveVideoUrl(row.video_url);
        if (!active) return;
        setDbVideo({
          ...card,
          videoUrl: playable,
          description: row.description ?? "",
          creatorId: row.user_id,
        });
      } else {
        setDbVideo(null);
      }
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [videoId]);

  const [upNext, setUpNext] = useState<Video[]>([]);
  useEffect(() => {
    let active = true;
    (async () => {
      const { data } = await supabase
        .from("videos")
        .select("*")
        .eq("visibility", "public")
        .neq("id", videoId)
        .order("created_at", { ascending: false })
        .limit(8);
      if (!active) return;
      if (data) setUpNext((data as DbVideo[]).map((v) => dbVideoToCard(v)));
      else setUpNext([]);
    })();
    return () => {
      active = false;
    };
  }, [videoId]);

  const video: WatchVideo | undefined = dbVideo ?? undefined;

  if (loading) {
    return (
      <AppLayout>
        <WatchSkeleton />
      </AppLayout>
    );
  }

  if (!video) {
    return (
      <AppLayout>
        <div className="text-center py-16">
          <h1 className="text-xl font-bold">Video not found</h1>
          <Link to="/" className="text-accent text-sm mt-2 inline-block">
            ← Back to home
          </Link>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <WatchContent video={video} upNext={upNext} />
    </AppLayout>
  );
}

function WatchContent({ video, upNext }: { video: WatchVideo; upNext: Video[] }) {
  const [disliked, setDisliked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [autoplay, setAutoplay] = useState(true);

  const {
    liked,
    likesCount,
    toggleLike,
    subscribed,
    subscribersCount,
    toggleSubscribe,
    viewsCount,
    recordView,
  } = useVideoEngagement(video.id, video.creatorId);

  // Throttle progress checks — only call recordView when threshold could be met.
  const lastCheckRef = useRef(0);
  const handleWatchProgress = (watched: number, duration: number) => {
    const now = Date.now();
    if (now - lastCheckRef.current < 1000) return;
    lastCheckRef.current = now;
    if (watched >= 5 || (duration > 0 && watched / duration >= 0.3)) {
      recordView(watched, duration);
    }
  };

  // Demo source — falls back to a public sample if no real URL.
  const src =
    video.videoUrl ??
    "https://vjs.zencdn.net/v/oceans.mp4";

  return (
    <div className="mx-auto w-full max-w-2xl lg:max-w-6xl lg:grid lg:grid-cols-[1fr_360px] lg:gap-6">
      <div className="min-w-0">
        {/* Player wrapper with overlay top bar */}
        <div className="relative">
          <div className="absolute inset-x-0 top-0 z-20 flex items-center justify-between px-3 py-2 bg-gradient-to-b from-black/60 to-transparent rounded-t-2xl pointer-events-none">
            <div className="flex items-center gap-2 pointer-events-auto">
              <Link
                to="/"
                className="h-9 w-9 rounded-full glass flex items-center justify-center text-white hover:text-accent transition-smooth"
                aria-label="Back"
              >
                <ArrowLeft className="h-4 w-4" />
              </Link>
              <span className="text-sm font-bold text-white tracking-wide">Vidind</span>
            </div>
            <div className="flex items-center gap-1 pointer-events-auto">
              <button
                aria-label="Captions"
                className="h-9 w-9 rounded-full glass flex items-center justify-center text-white hover:text-accent transition-smooth"
              >
                <Captions className="h-4 w-4" />
              </button>
              <button
                aria-label="More options"
                className="h-9 w-9 rounded-full glass flex items-center justify-center text-white hover:text-accent transition-smooth"
              >
                <MoreVertical className="h-4 w-4" />
              </button>
            </div>
          </div>

          <VideoPlayer
            src={src}
            poster={video.thumbnail || undefined}
            onWatchProgress={handleWatchProgress}
          />
        </div>

        {/* Title + meta */}
        <div className="mt-4">
          <h1 className="text-lg md:text-2xl font-extrabold leading-tight">
            {video.title}
          </h1>
          <p className="mt-1 text-xs md:text-sm text-muted-foreground">
            {formatCount(viewsCount)} views • {video.time}{" "}
            <span className="text-accent">#vidind #neon #cyberpunk</span>
          </p>
        </div>

        {/* Channel row */}
        <div className="mt-4 flex items-center justify-between gap-3">
          {video.creatorId ? (
            <Link
              to="/channel/$userId"
              params={{ userId: video.creatorId }}
              className="flex items-center gap-3 min-w-0 group"
            >
              <Avatar className="h-11 w-11 ring-2 ring-primary/40 transition-smooth group-hover:ring-accent">
                <AvatarFallback className="bg-gradient-primary text-white font-bold">
                  {video.channelInitial}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="font-semibold truncate group-hover:text-accent transition-smooth">
                  {video.channel}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatCount(subscribersCount)} subscribers
                </p>
              </div>
            </Link>
          ) : (
            <div className="flex items-center gap-3 min-w-0">
              <Avatar className="h-11 w-11 ring-2 ring-primary/40">
                <AvatarFallback className="bg-gradient-primary text-white font-bold">
                  {video.channelInitial}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="font-semibold truncate">{video.channel}</p>
                <p className="text-xs text-muted-foreground">
                  {formatCount(subscribersCount)} subscribers
                </p>
              </div>
            </div>
          )}
          <div className="flex items-center gap-2 shrink-0">
            <Button
              onClick={toggleSubscribe}
              className={
                subscribed
                  ? "rounded-full bg-secondary text-secondary-foreground hover:bg-secondary/80"
                  : "rounded-full bg-gradient-primary text-white border-0 glow-primary hover:opacity-90"
              }
            >
              {subscribed ? "Subscribed" : "Subscribe"}
            </Button>
            <button
              aria-label="Notifications"
              className="h-9 w-9 rounded-full glass flex items-center justify-center hover:text-accent transition-smooth"
            >
              <Bell className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Action row */}
        <div className="mt-4 flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
          <ActionPill
            active={liked}
            onClick={() => {
              if (disliked) setDisliked(false);
              toggleLike();
            }}
            icon={<ThumbsUp className="h-4 w-4" />}
            label={formatCount(likesCount)}
          />
          <ActionPill
            active={disliked}
            onClick={() => {
              setDisliked((v) => !v);
              if (liked) toggleLike();
            }}
            icon={<ThumbsDown className="h-4 w-4" />}
            label="Dislike"
          />
          <ActionPill icon={<Share2 className="h-4 w-4" />} label="Share" />
          <ActionPill icon={<Download className="h-4 w-4" />} label="Download" />
          <ActionPill
            active={saved}
            onClick={() => setSaved((v) => !v)}
            icon={<Bookmark className="h-4 w-4" />}
            label={saved ? "Saved" : "Save"}
          />
        </div>

        {/* Description */}
        <div className="mt-4 rounded-2xl glass p-4 text-sm">
          <p className="font-semibold text-xs text-muted-foreground">
            {formatCount(viewsCount)} views • {video.time}
          </p>
          <p
            className={`mt-2 text-foreground/90 whitespace-pre-line ${
              expanded ? "" : "line-clamp-2"
            }`}
          >
            {video.description ||
              "Welcome to Vidind — the next-gen video platform built for creators and viewers who want more than just another feed. Drop a like, subscribe, and let us know what you want to see next.\n\nTimestamps, links and credits below."}
          </p>
          <button
            onClick={() => setExpanded((e) => !e)}
            className="mt-2 text-accent text-xs font-semibold hover:underline"
          >
            {expanded ? "Show less" : "...more"}
          </button>
        </div>

        <Comments videoId={video.id} />
      </div>

      {/* Up next */}
      <aside className="mt-8 lg:mt-0">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold">Up next</h2>
          <label className="flex items-center gap-2 text-xs text-muted-foreground">
            Autoplay
            <Switch checked={autoplay} onCheckedChange={setAutoplay} />
          </label>
        </div>
        <div className="space-y-3">
          {upNext.length === 0 ? (
            <p className="text-sm text-muted-foreground">No other videos yet.</p>
          ) : (
            upNext.map((v) => <UpNextItem key={v.id} video={v} />)
          )}
        </div>
      </aside>
    </div>
  );
}

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}
function ActionPill({
  icon,
  label,
  active,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-smooth ${
        active
          ? "bg-gradient-primary text-white glow-primary border-0"
          : "glass hover:text-accent"
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

function UpNextItem({ video }: { video: Video }) {
  return (
    <Link
      to="/watch/$videoId"
      params={{ videoId: video.id }}
      className="flex gap-3 group"
    >
      <div className="relative w-40 shrink-0 aspect-video rounded-xl overflow-hidden glass">
        {video.thumbnail ? (
          <img
            src={video.thumbnail}
            alt=""
            loading="lazy"
            className="h-full w-full object-cover transition-smooth group-hover:scale-105"
          />
        ) : (
          <div className="h-full w-full bg-gradient-hero" />
        )}
        {video.duration && (
          <span className="absolute bottom-1 right-1 rounded-md bg-black/70 px-1.5 py-0.5 text-[10px] font-medium text-white backdrop-blur">
            {video.duration}
          </span>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="line-clamp-2 text-sm font-semibold leading-snug group-hover:text-accent transition-smooth">
          {video.title}
        </h3>
        <p className="mt-1 text-xs text-muted-foreground truncate">
          {video.channel}
        </p>
        <p className="text-xs text-muted-foreground">{video.views}</p>
      </div>
    </Link>
  );
}

function WatchSkeleton() {
  return (
    <div className="mx-auto w-full max-w-2xl lg:max-w-6xl lg:grid lg:grid-cols-[1fr_360px] lg:gap-6">
      <div>
        <Skeleton className="aspect-video w-full rounded-2xl" />
        <Skeleton className="mt-4 h-6 w-3/4" />
        <Skeleton className="mt-2 h-4 w-1/2" />
        <div className="mt-4 flex gap-3">
          <Skeleton className="h-11 w-11 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-3 w-1/4" />
          </div>
        </div>
      </div>
      <div className="mt-8 lg:mt-0 space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex gap-3">
            <Skeleton className="w-40 aspect-video rounded-xl" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
