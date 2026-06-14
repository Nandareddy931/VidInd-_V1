import { Link, useNavigate } from "@tanstack/react-router";
import { Search, Bell, Plus, LogOut, User as UserIcon, Upload, X } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Logo } from "./Logo";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth, signOut } from "@/hooks/use-auth";
import { toast } from "sonner";
import { useState } from "react";

export function TopBar() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [searchOpen, setSearchOpen] = useState(false);

  const displayName =
    (user?.user_metadata?.display_name as string | undefined) ??
    user?.email?.split("@")[0] ??
    "";
  const initial = (displayName[0] ?? "V").toUpperCase();

  const handleSignOut = async () => {
    await signOut();
    toast.success("Signed out");
    navigate({ to: "/" });
  };

  return (
    <header className="sticky top-0 z-40 glass-strong border-b border-glass-border">
      <div className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 md:px-5 lg:px-6 py-2.5 md:py-3">

        {/* Mobile logo — hidden when search is open */}
        {!searchOpen && (
          <div className="md:hidden shrink-0">
            <Logo size="sm" />
          </div>
        )}

        {/* Mobile full-screen search overlay */}
        {searchOpen ? (
          <div className="flex flex-1 items-center gap-2 md:hidden">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                autoFocus
                type="search"
                placeholder="Search videos, creators…"
                className="w-full h-10 pl-10 pr-4 rounded-full glass border border-glass-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/30 transition-smooth"
              />
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full shrink-0"
              onClick={() => setSearchOpen(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        ) : (
          /* Search icon on mobile */
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden rounded-full ml-auto"
            onClick={() => setSearchOpen(true)}
            aria-label="Open search"
          >
            <Search className="h-5 w-5" />
          </Button>
        )}

        {/* Desktop/tablet search bar */}
        <div className="hidden md:flex flex-1 max-w-xl lg:max-w-2xl mx-auto">
          <div className="relative group w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="search"
              placeholder="Search videos, creators, sounds…"
              className="w-full h-10 lg:h-11 pl-11 pr-4 rounded-full glass border border-glass-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/30 transition-smooth"
            />
          </div>
        </div>

        {/* Actions — tablet+ */}
        {!searchOpen && (
          <div className="hidden md:flex items-center gap-2 shrink-0">
            <Button asChild className="bg-gradient-primary hover:opacity-90 text-white border-0 rounded-full glow-primary text-sm px-3 lg:px-4 h-9 lg:h-10">
              <Link to="/upload"><Plus className="h-4 w-4 mr-1" /><span className="hidden lg:inline">Create</span></Link>
            </Button>
            <Button variant="ghost" size="icon" className="rounded-full relative h-9 w-9 lg:h-10 lg:w-10">
              <Bell className="h-5 w-5" />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-accent glow-accent" />
            </Button>
          </div>
        )}

        {/* Avatar / Sign in */}
        {!searchOpen && (
          isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="shrink-0 rounded-full focus:outline-none focus:ring-2 focus:ring-primary/50">
                  <Avatar className="h-8 w-8 md:h-9 md:w-9 ring-2 ring-primary/50 hover:ring-accent transition-smooth">
                    <AvatarFallback className="bg-gradient-primary text-white text-sm font-bold">
                      {initial}
                    </AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 glass-strong border-glass-border">
                <DropdownMenuLabel className="flex flex-col">
                  <span className="font-semibold truncate">{displayName}</span>
                  <span className="text-xs text-muted-foreground truncate">{user?.email}</span>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/profile" className="cursor-pointer"><UserIcon className="h-4 w-4 mr-2" /> Your profile</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/upload" className="cursor-pointer"><Upload className="h-4 w-4 mr-2" /> Upload video</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-destructive focus:text-destructive">
                  <LogOut className="h-4 w-4 mr-2" /> Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button asChild variant="outline" className="rounded-full border-primary/40 hover:bg-primary/10 text-sm h-9 px-4">
              <Link to="/login">Sign in</Link>
            </Button>
          )
        )}
      </div>
    </header>
  );
}
