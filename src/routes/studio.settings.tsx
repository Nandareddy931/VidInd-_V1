import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { useChannel } from "@/hooks/use-channel";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Camera, ImageIcon, Loader2 } from "lucide-react";

export const Route = createFileRoute("/studio/settings")({
  head: () => ({ meta: [{ title: "Settings — Pori Studio" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  const { user } = useAuth();
  const { channel, refresh, loading } = useChannel(user?.id);

  const [name, setName] = useState("");
  const [handle, setHandle] = useState("");
  const [description, setDescription] = useState("");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  const avatarInput = useRef<HTMLInputElement>(null);
  const bannerInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (channel) {
      setName(channel.display_name ?? "");
      setHandle(channel.handle ?? "");
      setDescription(channel.description ?? "");
      setAvatarPreview(channel.avatar_url);
      setBannerPreview(channel.banner_url);
    }
  }, [channel]);

  const handleLocked = !!channel?.handle;

  function pickAvatar(file: File) {
    if (!file.type.startsWith("image/")) return toast.error("Choose an image");
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  }
  function pickBanner(file: File) {
    if (!file.type.startsWith("image/")) return toast.error("Choose an image");
    setBannerFile(file);
    setBannerPreview(URL.createObjectURL(file));
  }

  async function uploadTo(bucket: "avatars" | "banners", file: File) {
    if (!user) throw new Error("Not signed in");
    const ext = file.name.split(".").pop() || "jpg";
    const path = `${user.id}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage
      .from(bucket)
      .upload(path, file, { upsert: true, contentType: file.type });
    if (error) throw error;
    return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
  }

  async function save() {
    if (!user) return;
    if (!name.trim()) return toast.error("Channel name is required");
    if (handle && !/^[a-zA-Z0-9_]{3,30}$/.test(handle))
      return toast.error("Handle: 3-30 chars, letters/numbers/underscore");

    setSaving(true);
    try {
      let avatar_url = channel?.avatar_url ?? null;
      let banner_url = channel?.banner_url ?? null;

      if (avatarFile) avatar_url = await uploadTo("avatars", avatarFile);
      if (bannerFile) banner_url = await uploadTo("banners", bannerFile);

      const update = {
        display_name: name.trim(),
        description: description.trim() || null,
        avatar_url,
        banner_url,
        ...(!handleLocked && handle ? { handle: handle.toLowerCase() } : {}),
      };

      const { error } = await supabase.from("profiles").update(update).eq("user_id", user.id);
      if (error) throw error;

      toast.success("Channel updated");
      setAvatarFile(null);
      setBannerFile(null);
      await refresh();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Save failed";
      toast.error(msg.includes("duplicate") ? "Handle already taken" : msg);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <>
        <h1 className="text-2xl md:text-3xl font-extrabold">Settings</h1>
        <div className="mt-5 space-y-3">
          <div className="h-40 skeleton rounded-2xl" />
          <div className="h-32 skeleton rounded-2xl" />
        </div>
      </>
    );
  }

  return (
    <>
      <h1 className="text-2xl md:text-3xl font-extrabold">Channel settings</h1>
      <p className="text-muted-foreground text-sm">Customize how your channel appears</p>

      {/* Banner */}
      <div className="mt-5 glass rounded-2xl overflow-hidden">
        <div
          onClick={() => bannerInput.current?.click()}
          className="relative h-36 md:h-48 cursor-pointer group bg-gradient-hero"
        >
          {bannerPreview && (
            <img src={bannerPreview} alt="" className="absolute inset-0 h-full w-full object-cover" />
          )}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-smooth flex items-center justify-center">
            <span className="inline-flex items-center gap-2 rounded-full glass-strong px-3 py-1.5 text-xs">
              <ImageIcon className="h-3.5 w-3.5" /> Change banner
            </span>
          </div>
          <input
            ref={bannerInput}
            type="file"
            accept="image/*"
            hidden
            onChange={(e) => e.target.files?.[0] && pickBanner(e.target.files[0])}
          />
        </div>

        {/* Avatar overlap */}
        <div className="px-5 pb-5 -mt-10 flex items-end gap-4">
          <button
            onClick={() => avatarInput.current?.click()}
            className="relative h-20 w-20 md:h-24 md:w-24 rounded-full ring-4 ring-background bg-gradient-primary flex items-center justify-center text-white text-2xl font-extrabold overflow-hidden group"
          >
            {avatarPreview ? (
              <img src={avatarPreview} alt="" className="h-full w-full object-cover" />
            ) : (
              (name?.[0] ?? "U").toUpperCase()
            )}
            <span className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-smooth flex items-center justify-center">
              <Camera className="h-5 w-5" />
            </span>
            <input
              ref={avatarInput}
              type="file"
              accept="image/*"
              hidden
              onChange={(e) => e.target.files?.[0] && pickAvatar(e.target.files[0])}
            />
          </button>
          <div className="pb-1 min-w-0">
            <p className="font-bold truncate">{name || "Your channel"}</p>
            <p className="text-xs text-muted-foreground truncate">
              {handle ? `@${handle}` : "Set your @handle"}
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="mt-4 glass rounded-2xl p-5 space-y-4">
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Channel name
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={50}
            className="mt-2 w-full glass rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            Handle
            {handleLocked && <span className="text-[10px] text-warning">(set once)</span>}
          </label>
          <div className="mt-2 flex items-center glass rounded-xl px-4 focus-within:ring-2 focus-within:ring-primary">
            <span className="text-muted-foreground text-sm">@</span>
            <input
              value={handle}
              onChange={(e) => setHandle(e.target.value.replace(/[^a-zA-Z0-9_]/g, ""))}
              readOnly={handleLocked}
              maxLength={30}
              placeholder="yourname"
              className="flex-1 bg-transparent py-2.5 text-sm focus:outline-none disabled:opacity-60"
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            maxLength={500}
            placeholder="Tell viewers about your channel"
            className="mt-2 w-full glass rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
          />
          <p className="mt-1 text-[11px] text-muted-foreground text-right">{description.length}/500</p>
        </div>
      </div>

      {/* Sticky save bar */}
      <div className="sticky bottom-20 md:bottom-4 mt-4 z-30">
        <div className="glass-strong rounded-2xl p-3 flex items-center justify-end gap-2 shadow-elevated">
          <button
            onClick={save}
            disabled={saving}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-gradient-primary text-white text-sm font-semibold glow-primary disabled:opacity-60 transition-smooth hover:opacity-90"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            Save changes
          </button>
        </div>
      </div>
    </>
  );
}
