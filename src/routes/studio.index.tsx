import { createFileRoute, Link } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { useChannel } from "@/hooks/use-channel";
import { useMyVideos } from "@/hooks/use-videos";
import { Eye, Users, Clock, Film, TrendingUp } from "lucide-react";
import { useMemo, useState } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

export const Route = createFileRoute("/studio/")({
  head: () => ({ meta: [{ title: "Dashboard — Pori Studio" }] }),
  component: StudioDashboard,
});

function formatNum(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
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
    <div className="glass rounded-2xl p-4 md:p-5 hover-lift">
      <div className="flex items-center justify-between">
        <Icon className="h-5 w-5 text-accent" />
      </div>
      <p className="mt-3 text-xs text-muted-foreground">{label}</p>
      <p className="text-xl md:text-2xl font-extrabold tabular-nums">{value}</p>
      {hint && <p className="text-[11px] text-muted-foreground mt-0.5">{hint}</p>}
    </div>
  );
}

function StudioDashboard() {
  const { user } = useAuth();
  const { channel } = useChannel(user?.id);
  const { videos, loading } = useMyVideos(user?.id);
  const [range, setRange] = useState<7 | 30>(7);

  const totals = useMemo(() => {
    const totalViews = videos.reduce((s, v) => s + (v.views ?? 0), 0);
    const totalLikes = videos.reduce((s, v) => s + ((v as { likes_count?: number }).likes_count ?? 0), 0);
    return { totalViews, totalLikes, totalVideos: videos.length };
  }, [videos]);

  // Build chart from created_at distribution as a simple proxy for daily activity.
  const chartData = useMemo(() => {
    const days = range;
    const buckets: Record<string, number> = {};
    const today = new Date();
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const key = d.toISOString().slice(5, 10);
      buckets[key] = 0;
    }
    for (const v of videos) {
      const key = new Date(v.created_at).toISOString().slice(5, 10);
      if (key in buckets) buckets[key] += v.views ?? 0;
    }
    return Object.entries(buckets).map(([date, views]) => ({ date, views }));
  }, [videos, range]);

  const recent = useMemo(
    () => [...videos].sort((a, b) => (b.views ?? 0) - (a.views ?? 0)).slice(0, 5),
    [videos],
  );

  return (
    <>
      <div className="flex items-end justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold">Dashboard</h1>
          <p className="text-muted-foreground text-sm">
            Welcome back{channel?.display_name ? `, ${channel.display_name}` : ""} 👋
          </p>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <StatCard icon={Eye} label="Total views" value={formatNum(totals.totalViews)} />
        <StatCard icon={Users} label="Subscribers" value={formatNum(channel?.subscribers_count ?? 0)} />
        <StatCard icon={Clock} label="Watch time" value="—" hint="Coming soon" />
        <StatCard icon={Film} label="Videos" value={formatNum(totals.totalVideos)} />
      </div>

      {/* Chart */}
      <div className="mt-6 glass rounded-2xl p-4 md:p-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-sm font-semibold">Views over time</p>
            <p className="text-xs text-muted-foreground">Distributed by upload date</p>
          </div>
          <div className="flex gap-1 rounded-xl bg-white/5 p-1 text-xs">
            {[7, 30].map((d) => (
              <button
                key={d}
                onClick={() => setRange(d as 7 | 30)}
                className={`px-3 py-1.5 rounded-lg transition-smooth ${
                  range === d ? "bg-gradient-primary text-white" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {d}d
              </button>
            ))}
          </div>
        </div>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <defs>
                <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="oklch(0.62 0.24 285)" />
                  <stop offset="100%" stopColor="oklch(0.78 0.17 215)" />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(1 0 0 / 8%)" />
              <XAxis dataKey="date" tick={{ fill: "oklch(0.7 0.02 260)", fontSize: 11 }} />
              <YAxis tick={{ fill: "oklch(0.7 0.02 260)", fontSize: 11 }} />
              <Tooltip
                contentStyle={{
                  background: "oklch(0.18 0.03 265)",
                  border: "1px solid oklch(1 0 0 / 8%)",
                  borderRadius: 12,
                  color: "white",
                }}
              />
              <Line type="monotone" dataKey="views" stroke="url(#lineGrad)" strokeWidth={3} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent / top videos */}
      <h2 className="mt-8 text-lg font-bold">Top videos</h2>
      {loading ? (
        <div className="mt-3 grid gap-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="glass rounded-2xl p-3 flex gap-3">
              <div className="h-16 w-28 rounded-lg skeleton" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-3/4 rounded skeleton" />
                <div className="h-3 w-1/2 rounded skeleton" />
              </div>
            </div>
          ))}
        </div>
      ) : recent.length === 0 ? (
        <div className="mt-3 glass rounded-3xl p-10 text-center">
          <h3 className="text-lg font-bold">No uploads yet</h3>
          <p className="mt-1 text-sm text-muted-foreground">Upload your first video to see analytics.</p>
          <Link
            to="/upload"
            className="mt-5 inline-flex items-center gap-2 rounded-full bg-gradient-primary px-5 py-2.5 text-sm font-semibold text-white glow-primary"
          >
            Upload a video
          </Link>
        </div>
      ) : (
        <div className="mt-3 glass rounded-2xl overflow-hidden">
          {recent.map((v, i) => (
            <Link
              key={v.id}
              to="/watch/$videoId"
              params={{ videoId: v.id }}
              className={`flex items-center gap-3 p-3 ${
                i !== recent.length - 1 ? "border-b border-glass-border" : ""
              } hover:bg-white/5 transition-smooth`}
            >
              {v.thumbnail_url ? (
                <img src={v.thumbnail_url} alt="" loading="lazy" className="h-16 w-28 rounded-lg object-cover" />
              ) : (
                <div className="h-16 w-28 rounded-lg bg-gradient-hero" />
              )}
              <div className="flex-1 min-w-0">
                <p className="font-semibold line-clamp-1">{v.title}</p>
                <p className="text-xs text-muted-foreground">{formatNum(v.views ?? 0)} views</p>
              </div>
              <span className="hidden sm:inline-flex items-center gap-1 text-xs text-success">
                <TrendingUp className="h-3.5 w-3.5" /> Top
              </span>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
