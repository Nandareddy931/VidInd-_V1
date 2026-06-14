import { createFileRoute, Link } from "@tanstack/react-router";
import { AppLayout } from "@/components/AppLayout";
import { VideoCard, VideoCardSkeleton } from "@/components/VideoCard";
import { usePublicVideos, dbVideoToCard } from "@/hooks/use-videos";
import { Flame, PlayCircle } from "lucide-react";
import { useMemo } from "react";

export const Route = createFileRoute("/trending")({
  head: () => ({ meta: [{ title: "Trending — Vidind" }] }),
  component: TrendingPage,
});

function TrendingPage() {
  const { videos: dbVideos, loading } = usePublicVideos();
  // Real "trending" = sort by views desc.
  const items = useMemo(
    () =>
      [...dbVideos]
        .sort((a, b) => (b.views ?? 0) - (a.views ?? 0))
        .map((v) => dbVideoToCard(v)),
    [dbVideos],
  );

  return (
    <AppLayout>
      <div className="flex items-center gap-3">
        <span className="h-12 w-12 rounded-2xl bg-gradient-primary flex items-center justify-center glow-primary">
          <Flame className="h-6 w-6 text-white" />
        </span>
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold">Trending now</h1>
          <p className="text-sm text-muted-foreground">What everyone's watching today</p>
        </div>
      </div>
      {loading ? (
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-5">
          {Array.from({ length: 8 }).map((_, i) => <VideoCardSkeleton key={i} />)}
        </div>
      ) : items.length === 0 ? (
        <div className="mt-8 glass rounded-3xl p-10 text-center">
          <h3 className="text-lg font-bold">Nothing trending yet</h3>
          <p className="mt-1 text-sm text-muted-foreground">Upload your first video to start the wave.</p>
          <Link
            to="/upload"
            className="mt-5 inline-flex items-center gap-2 rounded-full bg-gradient-primary px-5 py-2.5 text-sm font-semibold text-white glow-primary hover:opacity-90 transition-smooth"
          >
            <PlayCircle className="h-4 w-4" /> Upload a video
          </Link>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-5">
          {items.map((v, i) => <VideoCard key={v.id} video={v} index={i} />)}
        </div>
      )}
    </AppLayout>
  );
}
