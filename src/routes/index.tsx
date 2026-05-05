import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { CategoryChips } from "@/components/CategoryChips";
import { VideoCard, VideoCardSkeleton } from "@/components/VideoCard";
import { usePublicVideos, dbVideoToCard } from "@/hooks/use-videos";
import heroBanner from "@/assets/hero-banner.jpg";
import { Sparkles, TrendingUp, PlayCircle, Film } from "lucide-react";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Vidind — Discover. Watch. Create. Grow." },
      { name: "description", content: "Vidind is a futuristic video-sharing platform with shorts, creator rewards, and a global leaderboard." },
      { property: "og:title", content: "Vidind — Discover. Watch. Create. Grow." },
      { property: "og:description", content: "Stream trending videos, watch shorts, and grow as a creator on Vidind." },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  const { videos: dbVideos, loading } = usePublicVideos();
  const [active, setActive] = useState("All");

  const allVideos = useMemo(
    () => dbVideos.map((v) => dbVideoToCard(v)),
    [dbVideos],
  );

  const filtered = useMemo(() => {
    if (active === "All") return allVideos;
    if (active === "Trending") return allVideos.filter((v) => v.badge === "Trending");
    return allVideos.filter((v) => v.category === active);
  }, [active, allVideos]);

  const highlight = allVideos[0];

  return (
    <AppLayout>
      {/* Hero banner — desktop only */}
      <section className="hidden md:block relative overflow-hidden rounded-3xl mb-8 shadow-elevated animate-fade-in">
        <img src={heroBanner} alt="" className="absolute inset-0 h-full w-full object-cover opacity-60" />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/70 to-transparent" />
        <div className="relative px-10 py-14 max-w-2xl">
          <span className="inline-flex items-center gap-2 rounded-full glass px-3 py-1 text-xs font-medium text-accent">
            <Sparkles className="h-3 w-3" /> Welcome to Vidind
          </span>
          <h1 className="mt-4 text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight">
            Discover. Watch. <span className="gradient-text">Create. Grow.</span>
          </h1>
          <p className="mt-3 text-base text-muted-foreground max-w-md">
            The next-gen video platform built for creators and viewers who want more than just another feed.
          </p>
          <div className="mt-6 flex gap-3">
            <Link
              to="/upload"
              className="inline-flex items-center gap-2 rounded-full bg-gradient-primary px-5 py-2.5 text-sm font-semibold text-white glow-primary hover:opacity-90 transition-smooth"
            >
              <PlayCircle className="h-4 w-4" /> Start creating
            </Link>
            <Link
              to="/trending"
              className="inline-flex items-center gap-2 rounded-full glass px-5 py-2.5 text-sm font-semibold text-foreground hover:border-accent transition-smooth"
            >
              <TrendingUp className="h-4 w-4" /> What's trending
            </Link>
          </div>
        </div>
      </section>

      {/* Categories */}
      <CategoryChips active={active} onChange={setActive} />

      {/* Highlighted video by Vidind */}
      {highlight && (
        <section className="mt-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-accent" /> Highlighted by Vidind
            </h2>
            <span className="hidden sm:inline-flex items-center gap-1 rounded-full glass px-3 py-1 text-xs font-medium text-accent">
              Editor's pick
            </span>
          </div>
          <div className="relative rounded-3xl p-[1px] bg-gradient-primary glow-primary animate-fade-in">
            <div className="rounded-3xl bg-background p-3 sm:p-4">
              <div className="max-w-md mx-auto sm:max-w-xl">
                <VideoCard video={highlight} />
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Recommended */}
      <section className="mt-8">
        <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" /> Recommended for you
        </h2>
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {Array.from({ length: 8 }).map((_, i) => <VideoCardSkeleton key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyFeed />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filtered.map((v, i) => <VideoCard key={v.id} video={v} index={i} />)}
          </div>
        )}
      </section>
    </AppLayout>
  );
}

function EmptyFeed() {
  return (
    <div className="glass rounded-3xl p-10 text-center">
      <div className="mx-auto h-14 w-14 rounded-2xl bg-gradient-primary flex items-center justify-center glow-primary">
        <Film className="h-7 w-7 text-white" />
      </div>
      <h3 className="mt-4 text-lg font-bold">No videos yet</h3>
      <p className="mt-1 text-sm text-muted-foreground">Be the first to upload and grow on Vidind.</p>
      <Link
        to="/upload"
        className="mt-5 inline-flex items-center gap-2 rounded-full bg-gradient-primary px-5 py-2.5 text-sm font-semibold text-white glow-primary hover:opacity-90 transition-smooth"
      >
        <PlayCircle className="h-4 w-4" /> Upload a video
      </Link>
    </div>
  );
}
