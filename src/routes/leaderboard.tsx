import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/AppLayout";
import { Trophy } from "lucide-react";

export const Route = createFileRoute("/leaderboard")({
  head: () => ({
    meta: [
      { title: "Leaderboard — Vidind" },
      { name: "description", content: "Top creators climbing the Vidind leaderboard." },
    ],
  }),
  component: LeaderboardPage,
});

function LeaderboardPage() {
  return (
    <AppLayout>
      <div className="flex items-center gap-3">
        <span className="h-12 w-12 rounded-2xl bg-gradient-primary flex items-center justify-center glow-primary">
          <Trophy className="h-6 w-6 text-white" />
        </span>
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold">Creator Leaderboard</h1>
          <p className="text-sm text-muted-foreground">This month's top performers</p>
        </div>
      </div>

      <div className="mt-8 glass rounded-3xl p-10 text-center max-w-xl mx-auto">
        <h3 className="text-lg font-bold">Leaderboard coming soon</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Once creators start racking up views and subscribers, the top performers will show up here.
        </p>
      </div>
    </AppLayout>
  );
}
