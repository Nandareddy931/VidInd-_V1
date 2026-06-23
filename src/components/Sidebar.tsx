import { Link, useLocation } from "@tanstack/react-router";
import {
  Home,
  Flame,
  Users,
  Library,
  History,
  Clock,
  Trophy,
  Gift,
  LayoutDashboard,
  Clapperboard,
  Play,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { checkAdmin } from "@/hooks/useAdmin";

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

function Section({
  items,
  title,
}: {
  items: { to: string; icon: typeof Home; label: string }[];
  title?: string;
}) {
  const { pathname } = useLocation();

  return (
    <div className="space-y-1">
      {title && (
        <>
          <p className="hidden lg:block px-3 pt-4 pb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {title}
          </p>
          <div className="lg:hidden mt-3 mb-1 h-px bg-white/8 mx-2" />
        </>
      )}

      {items.map(({ to, icon: Icon, label }) => {
        const active = pathname === to;

        return (
          <Link
            key={to}
            to={to}
            title={label}
            className={cn(
              "flex items-center justify-center lg:justify-start gap-3 rounded-xl px-2 lg:px-3 py-2.5 text-sm font-medium transition-smooth",
              active
                ? "bg-gradient-primary text-white glow-primary"
                : "text-foreground/75 hover:text-foreground hover:bg-white/5"
            )}
          >
            <Icon className="h-5 w-5 shrink-0" />
            <span className="hidden lg:inline truncate">{label}</span>
          </Link>
        );
      })}
    </div>
  );
}

function AdminSidebarButton() {
  const { pathname } = useLocation();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    checkAdmin().then(setIsAdmin);
  }, []);

  if (!isAdmin) return null;

  const active = pathname.startsWith("/admin");

  return (
    <Link
      to="/admin"
      title="Admin Panel"
      className={cn(
        "flex items-center justify-center lg:justify-start gap-3 rounded-xl px-2 lg:px-3 py-2.5 text-sm font-medium transition-smooth",
        active
          ? "bg-gradient-primary text-white glow-primary"
          : "text-purple-300 hover:text-white hover:bg-purple-500/20"
      )}
    >
      <ShieldCheck className="h-5 w-5 shrink-0" />
      <span className="hidden lg:inline truncate">Admin Panel</span>
    </Link>
  );
}

export function Sidebar() {
  return (
    <aside className="hidden md:flex flex-col w-16 lg:w-60 shrink-0 sticky top-0 h-screen border-r border-glass-border glass-strong transition-all duration-300 overflow-hidden p-3 lg:p-4">
      <div className="mb-4 flex justify-center lg:justify-start">
        <Link to="/" className="flex items-center gap-2 group">
          <span className="relative h-9 w-9 rounded-xl bg-gradient-primary flex items-center justify-center glow-primary transition-smooth group-hover:scale-105 shrink-0">
            <Play className="h-[45%] w-[45%] fill-white text-white" />
          </span>
          <span className="hidden lg:block font-extrabold tracking-tight text-xl gradient-text">
            Vidind
          </span>
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto overflow-x-hidden">
        <Section items={main} />
        <Section items={lib} title="You" />
        <Section items={more as unknown as typeof main} title="Explore" />

        <div className="space-y-1">
          <AdminSidebarButton />
        </div>
      </nav>

      <p className="hidden lg:block px-3 pt-4 text-[11px] text-muted-foreground">
        © 2026 Vidind — Discover. Watch. Create.
      </p>
    </aside>
  );
}