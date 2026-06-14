import { Link, Outlet, useLocation } from "@tanstack/react-router";
import { LayoutDashboard, Film, BarChart3, DollarSign, Settings, ArrowLeft, Play, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";

type StudioItem = { to: string; label: string; icon: typeof LayoutDashboard; exact?: boolean };
const items: StudioItem[] = [
  { to: "/studio", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/studio/content", label: "Content", icon: Film },
  { to: "/studio/comments", label: "Comments", icon: MessageSquare },
  { to: "/studio/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/studio/monetization", label: "Monetization", icon: DollarSign },
  { to: "/studio/settings", label: "Settings", icon: Settings },
];

function isActive(pathname: string, to: string, exact?: boolean) {
  return exact ? pathname === to : pathname === to || pathname.startsWith(to + "/");
}

export function StudioLayout() {
  const { pathname } = useLocation();

  return (
    <div className="flex min-h-screen w-full">
      {/* Desktop/tablet sidebar — icon-only on md, full on lg */}
      <aside className="hidden md:flex flex-col w-16 lg:w-60 shrink-0 sticky top-0 h-screen border-r border-glass-border glass-strong transition-all duration-300 overflow-hidden p-3 lg:p-4">
        {/* Logo */}
        <div className="mb-4 flex justify-center lg:justify-start">
          <Link to="/" className="flex items-center gap-2 group">
            <span className="relative h-9 w-9 rounded-xl bg-gradient-primary flex items-center justify-center glow-primary transition-smooth group-hover:scale-105 shrink-0">
              <Play className="h-[45%] w-[45%] fill-white text-white" />
            </span>
            <span className="hidden lg:block font-extrabold tracking-tight text-xl gradient-text">Vidind</span>
          </Link>
        </div>
        <div className="flex justify-center lg:justify-start mb-3">
          <span className="text-[10px] lg:text-xs font-bold uppercase tracking-wider text-accent">Studio</span>
        </div>

        <nav className="flex-1 mt-1 space-y-1">
          {items.map(({ to, label, icon: Icon, exact }) => {
            const active = isActive(pathname, to, exact);
            return (
              <Link
                key={to}
                to={to}
                title={label}
                className={cn(
                  "flex items-center justify-center lg:justify-start gap-3 rounded-xl px-2 lg:px-3 py-2.5 text-sm font-medium transition-smooth",
                  active
                    ? "bg-gradient-primary text-white glow-primary"
                    : "text-foreground/75 hover:text-foreground hover:bg-white/5",
                )}
              >
                <Icon className="h-5 w-5 shrink-0" />
                <span className="hidden lg:inline truncate">{label}</span>
              </Link>
            );
          })}
        </nav>

        <Link
          to="/"
          title="Back to Vidind"
          className="flex items-center justify-center lg:justify-start gap-2 rounded-xl px-2 lg:px-3 py-2 text-xs text-muted-foreground hover:text-foreground transition-smooth"
        >
          <ArrowLeft className="h-4 w-4 shrink-0" />
          <span className="hidden lg:inline">Back to Vidind</span>
        </Link>
      </aside>

      <div className="flex-1 min-w-0 flex flex-col">
        {/* Mobile top bar */}
        <header className="md:hidden sticky top-0 z-40 glass-strong border-b border-glass-border px-4 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-sm text-muted-foreground">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="flex items-center gap-2">
            <Link to="/" className="flex items-center gap-1.5 group">
              <span className="relative h-7 w-7 rounded-lg bg-gradient-primary flex items-center justify-center shrink-0">
                <Play className="h-[45%] w-[45%] fill-white text-white" />
              </span>
              <span className="font-extrabold tracking-tight text-base gradient-text">Vidind</span>
            </Link>
            <span className="text-[10px] font-bold uppercase tracking-wider text-accent">Studio</span>
          </div>
          <div className="w-6" />
        </header>

        <main className="flex-1 px-3 sm:px-4 md:px-5 lg:px-8 py-4 lg:py-5 pb-28 md:pb-8 max-w-6xl w-full mx-auto">
          <Outlet />
        </main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-50 px-3 pb-3 pt-2 pointer-events-none">
        <div className="glass-strong pointer-events-auto rounded-2xl shadow-elevated flex items-center justify-around px-1 py-1.5">
          {items.map(({ to, label, icon: Icon, exact }) => {
            const active = isActive(pathname, to, exact);
            return (
              <Link
                key={to}
                to={to}
                aria-label={label}
                className={cn(
                  "flex flex-col items-center justify-center gap-0.5 px-2 py-1.5 rounded-xl transition-smooth flex-1 touch-manipulation",
                  active ? "text-accent" : "text-muted-foreground",
                )}
              >
                <Icon className={cn("h-5 w-5", active && "drop-shadow-[0_0_8px_oklch(0.78_0.17_215)]")} />
                <span className="text-[10px] font-medium leading-none mt-0.5">{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
