import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Camera,
  LogOut,
  User as UserIcon,
  Clapperboard,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth, signOut } from "@/hooks/use-auth";
import { useChannel } from "@/hooks/use-channel";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ title: "Settings — Vidind" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  const navigate = useNavigate();
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const { channel, refresh } = useChannel(user?.id);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) navigate({ to: "/login" });
  }, [authLoading, isAuthenticated, navigate]);

  const [displayName, setDisplayName] = useState("");
  const [description, setDescription] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (channel) {
      setDisplayName(channel.display_name ?? "");
      setDescription(channel.description ?? "");
      setAvatarUrl(channel.avatar_url ?? null);
    }
  }, [channel]);

  const onPickAvatar = () => fileRef.current?.click();

  const onAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image");
      return;
    }
    setUploading(true);
    const ext = file.name.split(".").pop() || "jpg";
    const path = `${user.id}/${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: true, contentType: file.type });
    if (upErr) {
      setUploading(false);
      toast.error("Avatar upload failed");
      return;
    }
    const { data: pub } = supabase.storage.from("avatars").getPublicUrl(path);
    setAvatarUrl(pub.publicUrl);
    setUploading(false);
    toast.success("Avatar updated — don't forget to save");
  };

  const onSave = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        display_name: displayName.trim() || null,
        description: description.trim() || null,
        avatar_url: avatarUrl,
      })
      .eq("user_id", user.id);
    setSaving(false);
    if (error) {
      toast.error("Couldn't save changes");
      return;
    }
    toast.success("Profile saved");
    refresh();
  };

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

  const initial = (displayName[0] ?? user.email?.[0] ?? "V").toUpperCase();

  return (
    <AppLayout>
      <div className="mx-auto max-w-2xl">
        {/* Header */}
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

        {/* Profile section */}
        <section className="mt-6 glass rounded-3xl p-5 md:p-6">
          <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wide">
            Profile
          </h2>

          <div className="mt-4 flex items-center gap-4">
            <div className="relative">
              <Avatar className="h-20 w-20 ring-2 ring-primary/40">
                {avatarUrl ? <AvatarImage src={avatarUrl} alt="" /> : null}
                <AvatarFallback className="bg-gradient-primary text-white text-2xl font-bold">
                  {initial}
                </AvatarFallback>
              </Avatar>
              <button
                onClick={onPickAvatar}
                disabled={uploading}
                aria-label="Change avatar"
                className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full bg-gradient-primary text-white flex items-center justify-center shadow-elevated hover:opacity-90 transition-smooth disabled:opacity-60"
              >
                {uploading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Camera className="h-4 w-4" />
                )}
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                hidden
                onChange={onAvatarChange}
              />
            </div>
            <div className="min-w-0">
              <p className="font-semibold truncate">{user.email}</p>
              <p className="text-xs text-muted-foreground">
                {channel?.handle ? `@${channel.handle}` : "Set your display name below"}
              </p>
            </div>
          </div>

          <div className="mt-5 space-y-4">
            <div>
              <Label htmlFor="display_name">Display name</Label>
              <Input
                id="display_name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your channel name"
                maxLength={60}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="description">About</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Tell viewers about your channel"
                rows={3}
                maxLength={500}
                className="mt-1 resize-none"
              />
              <p className="mt-1 text-xs text-muted-foreground text-right">
                {description.length}/500
              </p>
            </div>

            <Button
              onClick={onSave}
              disabled={saving}
              className="w-full md:w-auto rounded-full bg-gradient-primary border-0 text-white hover:opacity-90 glow-primary"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving…
                </>
              ) : (
                "Save changes"
              )}
            </Button>
          </div>
        </section>

        {/* Quick links */}
        <section className="mt-6 glass rounded-3xl p-2">
          <SettingsLink
            to="/profile"
            icon={<UserIcon className="h-5 w-5" />}
            title="Your channel"
            subtitle="View your public profile"
          />
          <Separator className="my-1 bg-glass-border" />
          <SettingsLink
            to="/studio"
            icon={<Clapperboard className="h-5 w-5" />}
            title="Creator Studio"
            subtitle="Manage videos, analytics & more"
          />
        </section>

        {/* Sign out */}
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
