import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { useMyVideos } from "@/hooks/use-videos";
import { useChannel } from "@/hooks/use-channel";
import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export const Route = createFileRoute("/studio/analytics")({
  head: () => ({ meta: [{ title: "Analytics — Pori Studio" }] }),
  component: AnalyticsPage,
});

type Range = 7 | 28 | 90;

function bucketByDay(videos: { created_at: string; views: number | null }[], days: number) {
  const buckets: Record<string, number> = {};
  const today = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    buckets[d.toISOString().slice(5, 10)] = 0;
  }
  for (const v of videos) {
    const k = new Date(v.created_at).toISOString().slice(5, 10);
    if (k in buckets) buckets[k] += v.views ?? 0;
  }
  return Object.entries(buckets).map(([date, views]) => ({ date, views }));
}

function AnalyticsPage() {
  const { user } = useAuth();
  const { channel } = useChannel(user?.id);
  const { videos, loading } = useMyVideos(user?.id);
  const [range, setRange] = useState<Range>(28);

  const data = useMemo(() => bucketByDay(videos, range), [videos, range]);

  const top = useMemo(
    () => [...videos].sort((a, b) => (b.views ?? 0) - (a.views ?? 0)).slice(0, 5),
    [videos],
  );

  const totals = useMemo(() => {
    const v = videos.reduce((s, x) => s + (x.views ?? 0), 0);
    const l = videos.reduce(
      (s, x) => s + ((x as { likes_count?: number }).likes_count ?? 0),
      0,
    );
    const er = v > 0 ? Math.min(100, (l / v) * 100) : 0;
    return { v, l, er };
  }, [videos]);

  return (
    <>
      <div className="flex items-end justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold">Analytics</h1>
          <p className="text-muted-foreground text-sm">Channel and video performance</p>
        </div>
        <div className="flex gap-1 rounded-xl bg-white/5 p-1 text-xs">
          {[7, 28, 90].map((d) => (
            <button
              key={d}
              onClick={() => setRange(d as Range)}
              className={`px-3 py-1.5 rounded-lg transition-smooth ${
                range === d ? "bg-gradient-primary text-white" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {d}d
            </button>
          ))}
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 lg:grid-cols-3 gap-3">
        <div className="glass rounded-2xl p-4">
          <p className="text-xs text-muted-foreground">Views</p>
          <p className="text-2xl font-extrabold tabular-nums">{totals.v.toLocaleString()}</p>
        </div>
        <div className="glass rounded-2xl p-4">
          <p className="text-xs text-muted-foreground">Likes</p>
          <p className="text-2xl font-extrabold tabular-nums">{totals.l.toLocaleString()}</p>
        </div>
        <div className="glass rounded-2xl p-4 col-span-2 lg:col-span-1">
          <p className="text-xs text-muted-foreground">Engagement rate</p>
          <p className="text-2xl font-extrabold tabular-nums">{totals.er.toFixed(1)}%</p>
        </div>
      </div>

      {/* Views graph */}
      <div className="mt-6 glass rounded-2xl p-4 md:p-5">
        <p className="text-sm font-semibold mb-3">Views</p>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="viewsGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="oklch(0.62 0.24 285)" stopOpacity={0.6} />
                  <stop offset="100%" stopColor="oklch(0.62 0.24 285)" stopOpacity={0} />
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
              <Area
                type="monotone"
                dataKey="views"
                stroke="oklch(0.78 0.17 215)"
                strokeWidth={2}
                fill="url(#viewsGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Subscribers */}
      <div className="mt-4 glass rounded-2xl p-4 md:p-5">
        <p className="text-sm font-semibold mb-1">Subscribers</p>
        <p className="text-3xl font-extrabold gradient-text tabular-nums">
          {(channel?.subscribers_count ?? 0).toLocaleString()}
        </p>
        <p className="text-xs text-muted-foreground mt-1">Total subscribers</p>
      </div>

      {/* Top videos chart */}
      <div className="mt-4 glass rounded-2xl p-4 md:p-5">
        <p className="text-sm font-semibold mb-3">Top videos</p>
        {loading ? (
          <div className="h-40 skeleton rounded-xl" />
        ) : top.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">No data yet — upload your first video.</p>
        ) : (
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={top.map((v) => ({ name: v.title.slice(0, 16), views: v.views ?? 0 }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(1 0 0 / 8%)" />
                <XAxis dataKey="name" tick={{ fill: "oklch(0.7 0.02 260)", fontSize: 11 }} />
                <YAxis tick={{ fill: "oklch(0.7 0.02 260)", fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    background: "oklch(0.18 0.03 265)",
                    border: "1px solid oklch(1 0 0 / 8%)",
                    borderRadius: 12,
                    color: "white",
                  }}
                />
                <Bar dataKey="views" fill="oklch(0.62 0.24 285)" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </>
  );
}
