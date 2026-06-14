import { Link, useLocation } from "@tanstack/react-router";
import { Home, Clapperboard, Plus, Users, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

type NavItem = { to: string; icon: typeof Home; label: string; center?: boolean };
const items: NavItem[] = [
  { to: "/", icon: Home, label: "Home" },
  { to: "/shorts", icon: Clapperboard, label: "Clips" },
  { to: "/upload", icon: Plus, label: "Upload", center: true },
  { to: "/subscriptions", icon: Users, label: "Subs" },
  { to: "/settings", icon: Settings, label: "Settings" },
];

export function BottomNav() {
  const { pathname } = useLocation();
  return (
    /* Only visible on mobile — sidebar handles tablet and desktop navigation */
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-50 px-3 pb-safe-area-inset-bottom pb-3 pt-2 pointer-events-none">
      <div className="glass-strong pointer-events-auto rounded-2xl shadow-elevated flex items-center justify-around px-1 py-1.5">
        {items.map(({ to, icon: Icon, label, center }) => {
          const active = pathname === to;
          if (center) {
            return (
              <Link
                key={to}
                to={to}
                aria-label={label}
                className="relative -mt-7 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-primary text-white glow-primary animate-pulse-glow transition-smooth active:scale-95 touch-manipulation"
              >
                <Icon className="h-7 w-7" strokeWidth={2.5} />
              </Link>
            );
          }
          return (
            <Link
              key={to}
              to={to}
              aria-label={label}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 px-4 py-2 rounded-xl transition-smooth touch-manipulation min-w-[52px]",
                active ? "text-accent" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon
                className={cn(
                  "h-5 w-5",
                  active && "drop-shadow-[0_0_8px_oklch(0.78_0.17_215)]"
                )}
              />
              <span className="text-[10px] font-medium leading-none mt-0.5">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
