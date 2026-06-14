import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Eye, Users, Video as VideoIcon, Calendar } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { VideoCard, VideoCardSkeleton } from "@/components/VideoCard";
import { SubscribeButton } from "@/components/SubscribeButton";
import { supabase } from "@/integrations/supabase/client";
import { useMyVideos, dbVideoToCard } from "@/hooks/use-videos";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/channel/$userId")({
  head: () => ({ meta: [{ title: "Channel — Vidind" }] }),
  component: ChannelPage,
});

type Profile = {
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  subscribers_count: number;
  created_at: string;
};

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return `${n}`;
}

function ChannelPage() {
  const { userId } = Route.useParams();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [tab, setTab] = useState<"videos" | "about">("videos");
  const [subDelta, setSubDelta] = useState(0);

  const { videos, loading: videosLoading } = useMyVideos(userId);

  useEffect(() => {
    let active = true;
    setProfileLoading(true);
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("user_id, display_name, avatar_url, subscribers_count, created_at")
        .eq("user_id", userId)
        .maybeSingle();
      if (active) {
        setProfile(data as Profile | null);
        setProfileLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [userId]);

  const displayName = profile?.display_name || "Vidind Creator";
  const handle = displayName.toLowerCase().replace(/\s+/g, "");
  const initial = (displayName[0] ?? "V").toUpperCase();
  const subscribers = Math.max(0, (profile?.subscribers_count ?? 0) + subDelta);
  const totalViews = videos.reduce((s, v) => s + (v.views ?? 0), 0);
  const joined = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString(undefined, {
        year: "numeric",
        month: "long",
      })
    : "—";

  return (
    <AppLayout>
      {/* Banner */}
      <div className="relative h-28 sm:h-32 md:h-48 lg:h-56 rounded-2xl md:rounded-3xl bg-gradient-hero overflow-hidden glow-primary">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_40%,oklch(0.78_0.17_300/0.45),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_70%,oklch(0.78_0.17_215/0.35),transparent_60%)]" />
      </div>

      {/* Header */}
      <div className="px-2 md:px-4 mt-3 sm:mt-4 md:mt-6">
        <div className="flex flex-col md:flex-row md:items-center gap-3 sm:gap-4 md:gap-6">
          <Avatar className="h-20 w-20 sm:h-24 sm:w-24 md:h-32 md:w-32 ring-4 ring-background shadow-elevated -mt-12 sm:-mt-16 md:-mt-20">
            {profile?.avatar_url && <AvatarImage src={profile.avatar_url} alt={displayName} />}
            <AvatarFallback className="bg-gradient-primary text-white text-3xl font-bold">
              {initial}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            {profileLoading ? (
              <div className="space-y-2">
                <div className="h-7 w-48 skeleton rounded" />
                <div className="h-4 w-64 skeleton rounded" />
              </div>
            ) : (
              <>
                <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold truncate">{displayName}</h1>
                <p className="text-muted-foreground text-sm mt-1">
                  @{handle} • {formatCount(subscribers)}{" "}
                  {subscribers === 1 ? "subscriber" : "subscribers"} • {videos.length}{" "}
                  {videos.length === 1 ? "video" : "videos"}
                </p>
              </>
            )}

            <div className="mt-4 hidden md:block">
              <SubscribeButton
                creatorId={userId}
                onCountChange={(d) => setSubDelta((s) => s + d)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-8 border-b border-glass-border">
        <div className="flex gap-6 px-2 md:px-4">
          {(["videos", "about"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                "py-3 text-sm font-medium capitalize transition-smooth border-b-2",
                tab === t
                  ? "border-primary text-foreground font-bold"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <section className="mt-6 px-2 md:px-4 pb-28 md:pb-8">
        {tab === "videos" ? (
          videosLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5">
              {Array.from({ length: 4 }).map((_, i) => (
                <VideoCardSkeleton key={i} />
              ))}
            </div>
          ) : videos.length === 0 ? (
            <div className="glass rounded-3xl p-10 text-center">
              <div className="mx-auto h-16 w-16 rounded-full bg-gradient-primary flex items-center justify-center glow-primary">
                <VideoIcon className="h-8 w-8 text-white" />
              </div>
              <h3 className="mt-4 text-lg font-bold">No videos yet</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                This channel hasn't uploaded any videos.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5">
              {videos.map((v, i) => (
                <VideoCard key={v.id} video={dbVideoToCard(v, displayName)} index={i} />
              ))}
            </div>
          )
        ) : (
          <div className="grid gap-4 md:grid-cols-3">
            <div className="glass rounded-2xl p-5 md:col-span-2">
              <h3 className="font-bold text-lg">Description</h3>
              <p className="mt-2 text-sm text-foreground/80 leading-relaxed">
                Welcome to {displayName}'s channel on Vidind — futuristic videos, sharp edits and
                neon dreams. Subscribe to see new uploads in your feed.
              </p>
              <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" /> Joined {joined}
              </div>
            </div>
            <div className="grid gap-3">
              <StatCard icon={<Users className="h-4 w-4" />} label="Subscribers" value={formatCount(subscribers)} />
              <StatCard icon={<Eye className="h-4 w-4" />} label="Total views" value={formatCount(totalViews)} />
              <StatCard icon={<VideoIcon className="h-4 w-4" />} label="Videos" value={String(videos.length)} />
            </div>
          </div>
        )}
      </section>

      {/* Mobile sticky subscribe */}
      <div className="md:hidden fixed bottom-20 left-0 right-0 z-30 px-4">
        <div className="glass rounded-full p-2 shadow-elevated flex items-center justify-between gap-3">
          <Link
            to="/channel/$userId"
            params={{ userId }}
            className="flex items-center gap-2 min-w-0 pl-1"
          >
            <Avatar className="h-8 w-8">
              {profile?.avatar_url && <AvatarImage src={profile.avatar_url} alt={displayName} />}
              <AvatarFallback className="bg-gradient-primary text-white text-xs font-bold">
                {initial}
              </AvatarFallback>
            </Avatar>
            <span className="truncate text-sm font-semibold">{displayName}</span>
          </Link>
          <SubscribeButton
            creatorId={userId}
            size="sm"
            onCountChange={(d) => setSubDelta((s) => s + d)}
          />
        </div>
      </div>
    </AppLayout>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="glass rounded-2xl p-4 flex items-center gap-3">
      <div className="h-9 w-9 rounded-full bg-gradient-primary flex items-center justify-center text-white glow-primary">
        {icon}
      </div>
      <div>
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="font-bold">{value}</div>
      </div>
    </div>
  );
}
