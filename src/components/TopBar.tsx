import { Link, useNavigate } from "@tanstack/react-router";
import { Search, Bell, Plus, Menu, LogOut, User as UserIcon, Upload } from "lucide-react";
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

export function TopBar() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

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
      <div className="flex items-center gap-3 px-4 md:px-6 py-3">
        <div className="md:hidden">
          <Logo size="sm" />
        </div>
        <Button variant="ghost" size="icon" className="hidden md:inline-flex">
          <Menu className="h-5 w-5" />
        </Button>

        <div className="flex-1 max-w-2xl mx-auto">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="search"
              placeholder="Search videos, creators, sounds…"
              className="w-full h-10 md:h-11 pl-11 pr-4 rounded-full glass border border-glass-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/30 transition-smooth"
            />
          </div>
        </div>

        <div className="hidden md:flex items-center gap-2">
          <Button asChild className="bg-gradient-primary hover:opacity-90 text-white border-0 rounded-full glow-primary">
            <Link to="/upload"><Plus className="h-4 w-4 mr-1" /> Create</Link>
          </Button>
          <Button variant="ghost" size="icon" className="rounded-full relative">
            <Bell className="h-5 w-5" />
            <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-accent glow-accent" />
          </Button>
        </div>

        {isAuthenticated ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="shrink-0 rounded-full focus:outline-none focus:ring-2 focus:ring-primary/50">
                <Avatar className="h-9 w-9 ring-2 ring-primary/50 hover:ring-accent transition-smooth">
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
          <Button asChild variant="outline" className="rounded-full border-primary/40 hover:bg-primary/10">
            <Link to="/login">Sign in</Link>
          </Button>
        )}
      </div>
    </header>
  );
}
