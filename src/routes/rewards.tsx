import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/AppLayout";
import { Coins, Gift, Sparkles } from "lucide-react";

export const Route = createFileRoute("/rewards")({
  head: () => ({ meta: [{ title: "Rewards — Vidind" }] }),
  component: RewardsPage,
});

function RewardsPage() {
  return (
    <AppLayout>
      <div className="flex items-center gap-3">
        <span className="h-12 w-12 rounded-2xl bg-gradient-primary flex items-center justify-center glow-primary">
          <Gift className="h-6 w-6 text-white" />
        </span>
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold">Rewards & Coupons</h1>
          <p className="text-sm text-muted-foreground">Earn coins, unlock perks</p>
        </div>
      </div>

      {/* <div className="mt-6 rounded-3xl bg-gradient-primary p-6 md:p-8 glow-primary shadow-elevated relative overflow-hidden">
        <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-accent/30 blur-3xl" />
        <div className="relative flex items-center justify-between flex-wrap gap-4">
          <div>
            <p className="text-white/80 text-sm font-medium flex items-center gap-2">
              <Sparkles className="h-4 w-4" /> Vidind Coins
            </p>
            <p className="text-4xl md:text-5xl font-extrabold text-white tabular-nums">0</p>
            <p className="text-white/80 text-sm mt-1">Start watching and creating to earn</p>
          </div>
          <Coins className="h-20 w-20 text-white/40 animate-float" />
        </div>
      </div> */}

      <div className="mt-8 glass rounded-3xl p-10 text-center max-w-xl mx-auto">
        <h3 className="text-lg font-bold">Rewards coming soon</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          We're building a coin and rewards system. Stay tuned for perks, coupons, and creator payouts.
        </p>
      </div>
    </AppLayout>
  );
}
