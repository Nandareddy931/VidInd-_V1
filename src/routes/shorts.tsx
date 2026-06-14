import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { AppLayout } from "@/components/AppLayout";
import { Film, PlayCircle } from "lucide-react";

export const Route = createFileRoute("/shorts")({
  head: () => ({
    meta: [
      { title: "Clips— Vidind" },
      { name: "description", content: "Endless vertical short videos. Swipe, like, share." },
    ],
  }),
  component: ShortsPage,
});

function ShortsPage() {
  return (
    <AppLayout>
      <h1 className="sr-only">Clips</h1>
      <div className="mx-auto max-w-md">
        <div className="glass rounded-3xl p-10 text-center">
          <div className="mx-auto h-14 w-14 rounded-2xl bg-gradient-primary flex items-center justify-center glow-primary">
            <Film className="h-7 w-7 text-white" />
          </div>
          <h2 className="mt-4 text-lg font-bold">No clips yet</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Upload a vertical video to get started.
          </p>
          <Link
            to="/upload"
            className="mt-5 inline-flex items-center gap-2 rounded-full bg-gradient-primary px-5 py-2.5 text-sm font-semibold text-white glow-primary hover:opacity-90 transition-smooth"
          >
            <PlayCircle className="h-4 w-4" /> Upload a clip
          </Link>
        </div>
      </div>
    </AppLayout>
  );
}
