import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { VideoCard, VideoCardSkeleton } from "@/components/VideoCard";
import { Settings, Upload, Share2, Play } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useMyVideos, dbVideoToCard } from "@/hooks/use-videos";

export const Route = createFileRoute("/profile")({
  head: () => ({ meta: [{ title: "Your channel — Vidind" }] }),
  component: ProfilePage,
});

function ProfilePage() {
  const navigate = useNavigate();
  const { user, loading: authLoading, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate({ to: "/login" });
    }
  }, [authLoading, isAuthenticated, navigate]);

  const { videos: myVideos, loading } = useMyVideos(user?.id);

  const displayName =
    (user?.user_metadata?.display_name as string | undefined) ??
    user?.email?.split("@")[0] ??
    "Your channel";
  const handle = user?.email?.split("@")[0] ?? "you";
  const initial = (displayName[0] ?? "V").toUpperCase();

  return (
    <AppLayout>
      {/* Channel banner */}
      <div className="relative h-32 md:h-52 rounded-3xl bg-gradient-hero overflow-hidden glow-primary">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,oklch(0.78_0.17_215/0.4),transparent_60%)]" />
      </div>

      {/* Channel header — YouTube-like layout */}
      <div className="px-2 md:px-4 mt-4 md:mt-6">
        <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-6">
          <Avatar className="h-24 w-24 md:h-32 md:w-32 ring-4 ring-background shadow-elevated -mt-16 md:-mt-20">
            <AvatarFallback className="bg-gradient-primary text-white text-3xl font-bold">
              {initial}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <h1 className="text-2xl md:text-3xl font-extrabold truncate">{displayName}</h1>
            <p className="text-muted-foreground text-sm mt-1">
              @{handle} • {myVideos.length} {myVideos.length === 1 ? "video" : "videos"}
            </p>
            <p className="mt-2 max-w-lg text-sm text-foreground/80">
              Welcome to your Vidind channel. Upload videos and they'll show up here and on the home feed.
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              <Button asChild className="bg-gradient-primary border-0 rounded-full text-white hover:opacity-90 glow-primary">
                <Link to="/upload"><Upload className="h-4 w-4 mr-1" /> Upload video</Link>
              </Button>
              <Button asChild variant="outline" className="rounded-full">
                <Link to="/dashboard"><Settings className="h-4 w-4 mr-1" /> Manage</Link>
              </Button>
              <Button variant="ghost" size="icon" className="rounded-full glass">
                <Share2 className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs (Videos shown by default — channel page) */}
      <div className="mt-8 border-b border-glass-border">
        <div className="flex gap-6 px-2 md:px-4">
          <button className="py-3 text-sm font-bold border-b-2 border-primary text-foreground">Videos</button>
          <button className="py-3 text-sm font-medium text-muted-foreground">Playlists</button>
          <button className="py-3 text-sm font-medium text-muted-foreground">About</button>
        </div>
      </div>

      {/* Uploaded videos grid */}
      <section className="mt-6 px-2 md:px-4">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {Array.from({ length: 4 }).map((_, i) => <VideoCardSkeleton key={i} />)}
          </div>
        ) : myVideos.length === 0 ? (
          <div className="glass rounded-3xl p-10 text-center">
            <div className="mx-auto h-16 w-16 rounded-full bg-gradient-primary flex items-center justify-center glow-primary">
              <Play className="h-8 w-8 text-white" />
            </div>
            <h3 className="mt-4 text-lg font-bold">No videos yet</h3>
            <p className="mt-1 text-sm text-muted-foreground">Upload your first video to start your channel.</p>
            <Button asChild className="mt-5 bg-gradient-primary border-0 rounded-full text-white hover:opacity-90 glow-primary">
              <Link to="/upload"><Upload className="h-4 w-4 mr-1" /> Upload now</Link>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {myVideos.map((v, i) => (
              <VideoCard key={v.id} video={dbVideoToCard(v, displayName)} index={i} />
            ))}
          </div>
        )}
      </section>
    </AppLayout>
  );
}
