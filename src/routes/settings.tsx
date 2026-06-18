import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  LogOut,
  User as UserIcon,
  Clapperboard,
  Loader2,
  Shield,
  Megaphone,
} from "lucide-react";
import { useAuth, signOut } from "@/hooks/use-auth";

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ title: "Settings — Vidind" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  const navigate = useNavigate();
  const { user, loading: authLoading, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) navigate({ to: "/login" });
  }, [authLoading, isAuthenticated, navigate]);

  const onSignOut = async () => {
    await signOut();
    navigate({ to: "/login" });
  };

  if (authLoading || !user) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="mx-auto max-w-2xl">
        <div className="flex items-center gap-3">
          <Link
            to="/profile"
            className="h-9 w-9 rounded-full glass flex items-center justify-center hover:text-accent transition-smooth"
            aria-label="Back"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>

          <h1 className="text-xl md:text-2xl font-extrabold">Settings</h1>
        </div>

        <section className="mt-6 glass rounded-3xl p-2">
          <SettingsLink
            to="/profile"
            icon={<UserIcon className="h-5 w-5" />}
            title="Your Channel"
            subtitle="View your public VidInd channel"
          />

          <Separator className="my-1 bg-glass-border" />

          <SettingsLink
            to="/studio"
            icon={<Clapperboard className="h-5 w-5" />}
            title="Creator Studio"
            subtitle="Manage videos, analytics and subscribers"
          />

          <Separator className="my-1 bg-glass-border" />

          <SettingsLink
            to="/admin"
            icon={<Shield className="h-5 w-5" />}
            title="Admin Panel"
            subtitle="Manage users, videos, reports and platform control"
          />

          <Separator className="my-1 bg-glass-border" />

          <SettingsLink
            to="/ads"
            icon={<Megaphone className="h-5 w-5" />}
            title="VidInd Ads"
            subtitle="Create campaigns, manage ads and view performance"
          />
        </section>

        <section className="mt-6">
          <Button
            onClick={onSignOut}
            variant="outline"
            className="w-full rounded-full border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
          >
            <LogOut className="h-4 w-4 mr-2" /> Sign out
          </Button>
        </section>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Vidind • v1.0
        </p>
      </div>
    </AppLayout>
  );
}

function SettingsLink({
  to,
  icon,
  title,
  subtitle,
}: {
  to: string;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <Link
      to={to}
      className="flex items-center gap-3 px-3 py-3 rounded-2xl hover:bg-glass-bg transition-smooth"
    >
      <div className="h-10 w-10 rounded-xl bg-gradient-primary/20 text-accent flex items-center justify-center">
        {icon}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold">{title}</p>
        <p className="text-xs text-muted-foreground truncate">{subtitle}</p>
      </div>
    </Link>
  );
}