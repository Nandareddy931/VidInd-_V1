import { createFileRoute, Link } from "@tanstack/react-router";
import { AppLayout } from "@/components/AppLayout";
import { useAuth } from "@/hooks/use-auth";
import { useMyVideos, dbVideoToCard } from "@/hooks/use-videos";
import { Eye, ThumbsUp, Film, PlayCircle } from "lucide-react";
import { useMemo } from "react";

export const Route = createFileRoute("/dashboard")({
  head: () => ({ meta: [{ title: "Creator Studio — Vidind" }] }),
  component: DashboardPage,
});

function formatNum(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

function DashboardPage() {
  const { user } = useAuth();
  const { videos, loading } = useMyVideos(user?.id);

  const totals = useMemo(() => {
    const totalViews = videos.reduce((sum, v) => sum + (v.views ?? 0), 0);
    const totalVideos = videos.length;
    return { totalViews, totalVideos };
  }, [videos]);

  const top = useMemo(
    () =>
      [...videos]
        .sort((a, b) => (b.views ?? 0) - (a.views ?? 0))
        .slice(0, 5)
        .map((v) => dbVideoToCard(v)),
    [videos],
  );

  return (
    <AppLayout>
      <h1 className="text-2xl md:text-3xl font-extrabold">Creator Studio</h1>
      <p className="text-muted-foreground">Your channel at a glance</p>

      {/* Stats — real values from your videos */}
      <div className="mt-6 grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard icon={Eye} label="Total views" value={formatNum(totals.totalViews)} />
        <StatCard icon={Film} label="Videos" value={formatNum(totals.totalVideos)} />
        <StatCard icon={ThumbsUp} label="Likes" value="—" hint="Coming soon" />
      </div>

      {/* Top videos */}
      <h2 className="mt-8 text-lg font-bold">Your top videos</h2>
      {loading ? (
        <div className="mt-3 glass rounded-2xl p-6 text-sm text-muted-foreground">Loading…</div>
      ) : top.length === 0 ? (
        <div className="mt-3 glass rounded-3xl p-10 text-center">
          <h3 className="text-lg font-bold">No uploads yet</h3>
          <p className="mt-1 text-sm text-muted-foreground">Upload your first video to see analytics here.</p>
          <Link
            to="/upload"
            className="mt-5 inline-flex items-center gap-2 rounded-full bg-gradient-primary px-5 py-2.5 text-sm font-semibold text-white glow-primary hover:opacity-90 transition-smooth"
          >
            <PlayCircle className="h-4 w-4" /> Upload a video
          </Link>
        </div>
      ) : (
        <div className="mt-3 glass rounded-2xl overflow-hidden">
          {top.map((v, i) => (
            <Link
              key={v.id}
              to="/watch/$videoId"
              params={{ videoId: v.id }}
              className={`flex items-center gap-4 p-3 ${i !== top.length - 1 && "border-b border-glass-border"} hover:bg-white/5 transition-smooth`}
            >
              {v.thumbnail ? (
                <img src={v.thumbnail} alt="" loading="lazy" className="h-16 w-28 rounded-lg object-cover" />
              ) : (
                <div className="h-16 w-28 rounded-lg bg-gradient-hero" />
              )}
              <div className="flex-1 min-w-0">
                <p className="font-semibold line-clamp-1">{v.title}</p>
                <p className="text-xs text-muted-foreground">{v.views} • {v.time}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </AppLayout>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="glass rounded-2xl p-5 hover-lift">
      <Icon className="h-6 w-6 text-accent" />
      <p className="mt-3 text-xs text-muted-foreground">{label}</p>
      <p className="text-2xl font-extrabold tabular-nums">{value}</p>
      {hint && <p className="text-[11px] text-muted-foreground mt-1">{hint}</p>}
    </div>
  );
}
