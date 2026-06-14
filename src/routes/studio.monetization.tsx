import { createFileRoute } from "@tanstack/react-router";
import { Lock, Sparkles, Users, Clock } from "lucide-react";

export const Route = createFileRoute("/studio/monetization")({
  head: () => ({ meta: [{ title: "Monetization — Pori Studio" }] }),
  component: MonetizationPage,
});

function MonetizationPage() {
  return (
    <>
      <h1 className="text-2xl md:text-3xl font-extrabold">Monetization</h1>
      <p className="text-muted-foreground text-sm">Earn from your content on Vidind</p>

      <div className="mt-6 glass rounded-3xl p-8 md:p-12 text-center relative overflow-hidden">
        <div
          aria-hidden
          className="absolute inset-0 opacity-30 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse at center, oklch(0.62 0.24 285 / 40%), transparent 60%)",
          }}
        />
        <div className="relative">
          <div className="mx-auto h-20 w-20 rounded-full bg-gradient-primary flex items-center justify-center glow-primary animate-pulse-glow">
            <Lock className="h-9 w-9 text-white" />
          </div>
          <h2 className="mt-6 text-2xl md:text-3xl font-extrabold gradient-text">
            Monetization coming soon 🚀
          </h2>
          <p className="mt-2 text-muted-foreground max-w-md mx-auto">
            Better earnings for new creators than any other platform.
          </p>

        </div>
      </div>
    </>
  );
}
