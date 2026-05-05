import { Link, Outlet, useLocation } from "@tanstack/react-router";
import { LayoutDashboard, Film, BarChart3, DollarSign, Settings, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "./Logo";

type StudioItem = { to: string; label: string; icon: typeof LayoutDashboard; exact?: boolean };
const items: StudioItem[] = [
  { to: "/studio", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/studio/content", label: "Content", icon: Film },
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
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-60 shrink-0 sticky top-0 h-screen p-4 border-r border-glass-border glass-strong">
        <div className="px-1 mb-2 flex items-center gap-2">
          <Logo />
          <span className="text-xs font-bold uppercase tracking-wider text-accent">Studio</span>
        </div>
        <nav className="flex-1 mt-2 space-y-1">
          {items.map(({ to, label, icon: Icon, exact }) => {
            const active = isActive(pathname, to, exact);
            return (
              <Link
                key={to}
                to={to}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-smooth",
                  active
                    ? "bg-gradient-primary text-white glow-primary"
                    : "text-foreground/75 hover:text-foreground hover:bg-white/5",
                )}
              >
                <Icon className="h-5 w-5 shrink-0" />
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>
        <Link
          to="/"
          className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs text-muted-foreground hover:text-foreground transition-smooth"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Vidind
        </Link>
      </aside>

      <div className="flex-1 min-w-0 flex flex-col">
        {/* Mobile top bar */}
        <header className="md:hidden sticky top-0 z-40 glass-strong border-b border-glass-border px-4 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-sm text-muted-foreground">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="flex items-center gap-2">
            <Logo />
            <span className="text-[10px] font-bold uppercase tracking-wider text-accent">Studio</span>
          </div>
          <div className="w-6" />
        </header>

        <main className="flex-1 px-4 md:px-6 lg:px-8 py-5 pb-28 md:pb-8 max-w-6xl w-full mx-auto">
          <Outlet />
        </main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-50 px-3 pb-3 pt-2 pointer-events-none">
        <div className="glass-strong pointer-events-auto rounded-2xl shadow-elevated flex items-center justify-around px-1 py-2">
          {items.map(({ to, label, icon: Icon, exact }) => {
            const active = isActive(pathname, to, exact);
            return (
              <Link
                key={to}
                to={to}
                aria-label={label}
                className={cn(
                  "flex flex-col items-center justify-center gap-0.5 px-2 py-1.5 rounded-xl transition-smooth flex-1",
                  active ? "text-accent" : "text-muted-foreground",
                )}
              >
                <Icon className={cn("h-5 w-5", active && "drop-shadow-[0_0_8px_oklch(0.78_0.17_215)]")} />
                <span className="text-[10px] font-medium">{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
