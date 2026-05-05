import { createFileRoute, Link } from "@tanstack/react-router";
import { AppLayout } from "@/components/AppLayout";
import { History as HistoryIcon, PlayCircle } from "lucide-react";

export const Route = createFileRoute("/history")({
  head: () => ({ meta: [{ title: "History — Vidind" }] }),
  component: () => (
    <AppLayout>
      <h1 className="text-2xl md:text-3xl font-extrabold">History</h1>
      <p className="text-muted-foreground">Videos you've watched recently</p>
      <div className="mt-8 glass rounded-3xl p-10 text-center max-w-xl mx-auto">
        <div className="mx-auto h-14 w-14 rounded-2xl bg-gradient-primary flex items-center justify-center glow-primary">
          <HistoryIcon className="h-7 w-7 text-white" />
        </div>
        <h3 className="mt-4 text-lg font-bold">No watch history yet</h3>
        <p className="mt-1 text-sm text-muted-foreground">Videos you watch will show up here.</p>
        <Link
          to="/"
          className="mt-5 inline-flex items-center gap-2 rounded-full bg-gradient-primary px-5 py-2.5 text-sm font-semibold text-white glow-primary hover:opacity-90 transition-smooth"
        >
          <PlayCircle className="h-4 w-4" /> Browse videos
        </Link>
      </div>
    </AppLayout>
  ),
});
