import { Link, useLocation } from "@tanstack/react-router";
import { Home, Flame, Users, Library, History, Clock, Trophy, Gift, LayoutDashboard, Clapperboard } from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "./Logo";

const main = [
  { to: "/", icon: Home, label: "Home" },
  { to: "/shorts", icon: Clapperboard, label: "Shorts" },
  { to: "/trending", icon: Flame, label: "Trending" },
  { to: "/subscriptions", icon: Users, label: "Subscriptions" },
];

const lib = [
  { to: "/library", icon: Library, label: "Library" },
  { to: "/history", icon: History, label: "History" },
  { to: "/watch-later", icon: Clock, label: "Watch later" },
];

const more = [
  { to: "/leaderboard", icon: Trophy, label: "Leaderboard" },
  { to: "/rewards", icon: Gift, label: "Rewards" },
  { to: "/studio", icon: LayoutDashboard, label: "Pori Studio" },
] as const;

function Section({ items, title }: { items: { to: string; icon: typeof Home; label: string }[]; title?: string }) {
  const { pathname } = useLocation();
  return (
    <div className="space-y-1">
      {title && <p className="px-3 pt-4 pb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</p>}
      {items.map(({ to, icon: Icon, label }) => {
        const active = pathname === to;
        return (
          <Link
            key={to}
            to={to}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-smooth",
              active
                ? "bg-gradient-primary text-white glow-primary"
                : "text-foreground/75 hover:text-foreground hover:bg-white/5"
            )}
          >
            <Icon className="h-5 w-5 shrink-0" />
            <span>{label}</span>
          </Link>
        );
      })}
    </div>
  );
}

export function Sidebar() {
  return (
    <aside className="hidden md:flex flex-col w-60 shrink-0 sticky top-0 h-screen p-4 border-r border-glass-border glass-strong">
      <div className="px-1 mb-2">
        <Logo />
      </div>
      <nav className="flex-1 overflow-y-auto pr-1">
        <Section items={main} />
        <Section items={lib} title="You" />
        <Section items={more as unknown as typeof main} title="Explore" />
      </nav>
      <p className="px-3 pt-4 text-[11px] text-muted-foreground">
        © 2026 Vidind — Discover. Watch. Create.
      </p>
    </aside>
  );
}
