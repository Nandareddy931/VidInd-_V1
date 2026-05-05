import { createFileRoute, Link } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { useMyVideos, type DbVideo } from "@/hooks/use-videos";
import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  MoreVertical,
  Pencil,
  Trash2,
  ImageIcon,
  ExternalLink,
  X,
  Upload as UploadIcon,
  Loader2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/studio/content")({
  head: () => ({ meta: [{ title: "Content — Pori Studio" }] }),
  component: ContentManager,
});

function formatViews(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

function timeAgo(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function ContentManager() {
  const { user } = useAuth();
  const { videos, loading } = useMyVideos(user?.id);
  const [list, setList] = useState<DbVideo[] | null>(null);
  const data = list ?? videos;

  const [editing, setEditing] = useState<DbVideo | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<DbVideo | null>(null);

  // Sync local list with hook data
  if (list === null && videos.length > 0) {
    setList(videos);
  }

  async function handleDelete(v: DbVideo) {
    const prev = data;
    setList((l) => (l ?? []).filter((x) => x.id !== v.id));
    setConfirmDelete(null);

    // Delete file from storage (best effort)
    try {
      const url = v.video_url;
      const idx = url.indexOf("/videos/");
      if (idx >= 0) {
        const path = url.slice(idx + "/videos/".length);
        await supabase.storage.from("videos").remove([path]);
      }
      if (v.thumbnail_url) {
        const t = v.thumbnail_url;
        const ti = t.indexOf("/thumbnails/");
        if (ti >= 0) await supabase.storage.from("thumbnails").remove([t.slice(ti + "/thumbnails/".length)]);
      }
    } catch {
      /* ignore storage errors */
    }

    const { error } = await supabase.from("videos").delete().eq("id", v.id);
    if (error) {
      toast.error("Failed to delete video");
      setList(prev);
      return;
    }
    toast.success("Video deleted");
  }

  function handleUpdated(updated: DbVideo) {
    setList((l) => (l ?? []).map((x) => (x.id === updated.id ? updated : x)));
  }

  return (
    <>
      <div className="flex items-end justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold">Your content</h1>
          <p className="text-muted-foreground text-sm">Manage and edit your uploads</p>
        </div>
        <Link
          to="/upload"
          className="inline-flex items-center gap-2 rounded-full bg-gradient-primary px-4 py-2 text-sm font-semibold text-white glow-primary hover:opacity-90 transition-smooth"
        >
          <UploadIcon className="h-4 w-4" /> Upload
        </Link>
      </div>

      {loading && data.length === 0 ? (
        <div className="mt-5 grid gap-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="glass rounded-2xl p-3 flex gap-3">
              <div className="h-20 w-32 rounded-lg skeleton" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-3/4 rounded skeleton" />
                <div className="h-3 w-1/2 rounded skeleton" />
              </div>
            </div>
          ))}
        </div>
      ) : data.length === 0 ? (
        <div className="mt-5 glass rounded-3xl p-10 text-center">
          <h3 className="text-lg font-bold">No videos yet</h3>
          <p className="mt-1 text-sm text-muted-foreground">Upload to get started</p>
          <Link
            to="/upload"
            className="mt-5 inline-flex items-center gap-2 rounded-full bg-gradient-primary px-5 py-2.5 text-sm font-semibold text-white glow-primary"
          >
            <UploadIcon className="h-4 w-4" /> Upload a video
          </Link>
        </div>
      ) : (
        <div className="mt-5 grid gap-3">
          {data.map((v) => (
            <div
              key={v.id}
              className="glass rounded-2xl p-3 flex gap-3 hover:bg-white/5 transition-smooth animate-fade-in"
            >
              <button
                onClick={() => setEditing(v)}
                className="relative shrink-0 group"
                aria-label="Change thumbnail"
              >
                {v.thumbnail_url ? (
                  <img
                    src={v.thumbnail_url}
                    alt=""
                    className="h-20 w-32 rounded-lg object-cover"
                  />
                ) : (
                  <div className="h-20 w-32 rounded-lg bg-gradient-hero flex items-center justify-center">
                    <ImageIcon className="h-6 w-6 text-white/70" />
                  </div>
                )}
                <span className="absolute inset-0 rounded-lg bg-black/50 opacity-0 group-hover:opacity-100 transition-smooth flex items-center justify-center text-xs text-white">
                  Change
                </span>
              </button>
              <div className="flex-1 min-w-0">
                <p className="font-semibold line-clamp-1">{v.title}</p>
                <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{v.description || "No description"}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {formatViews(v.views ?? 0)} views • {timeAgo(v.created_at)}
                </p>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className="h-9 w-9 rounded-full hover:bg-white/10 flex items-center justify-center text-muted-foreground"
                    aria-label="Actions"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="glass-strong">
                  <DropdownMenuItem onClick={() => setEditing(v)}>
                    <Pencil className="h-4 w-4 mr-2" /> Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/watch/$videoId" params={{ videoId: v.id }}>
                      <ExternalLink className="h-4 w-4 mr-2" /> View
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setConfirmDelete(v)}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" /> Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <VideoEditorModal
          video={editing}
          userId={user?.id ?? ""}
          onClose={() => setEditing(null)}
          onSaved={(v) => {
            handleUpdated(v);
            setEditing(null);
          }}
        />
      )}

      <AlertDialog open={!!confirmDelete} onOpenChange={(o) => !o && setConfirmDelete(null)}>
        <AlertDialogContent className="glass-strong border-glass-border">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this video?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes the video, its file, and thumbnail. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => confirmDelete && handleDelete(confirmDelete)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function VideoEditorModal({
  video,
  userId,
  onClose,
  onSaved,
}: {
  video: DbVideo;
  userId: string;
  onClose: () => void;
  onSaved: (v: DbVideo) => void;
}) {
  const [title, setTitle] = useState(video.title);
  const [description, setDescription] = useState(video.description ?? "");
  const [thumbPreview, setThumbPreview] = useState<string | null>(video.thumbnail_url);
  const [thumbFile, setThumbFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function pickFile(file: File) {
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image");
      return;
    }
    setThumbFile(file);
    setThumbPreview(URL.createObjectURL(file));
  }

  async function save() {
    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }
    setSaving(true);
    try {
      let thumbnail_url = video.thumbnail_url;
      if (thumbFile) {
        const ext = thumbFile.name.split(".").pop() || "jpg";
        const path = `${userId}/${video.id}-${Date.now()}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from("thumbnails")
          .upload(path, thumbFile, { upsert: true, contentType: thumbFile.type });
        if (upErr) throw upErr;
        const { data: pub } = supabase.storage.from("thumbnails").getPublicUrl(path);
        thumbnail_url = pub.publicUrl;
      }

      const { data, error } = await supabase
        .from("videos")
        .update({ title: title.trim(), description: description.trim() || null, thumbnail_url })
        .eq("id", video.id)
        .select("*")
        .single();
      if (error) throw error;

      toast.success("Saved");
      onSaved(data as DbVideo);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-end md:items-center justify-center bg-black/60 backdrop-blur-sm p-0 md:p-4 animate-fade-in">
      <div className="glass-strong w-full md:max-w-lg rounded-t-3xl md:rounded-3xl shadow-elevated max-h-[90vh] overflow-y-auto animate-slide-up">
        <div className="sticky top-0 z-10 glass-strong flex items-center justify-between px-5 py-3 border-b border-glass-border">
          <h2 className="font-bold">Edit video</h2>
          <button
            onClick={onClose}
            className="h-9 w-9 rounded-full hover:bg-white/10 flex items-center justify-center"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Thumbnail */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Thumbnail
            </label>
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                const f = e.dataTransfer.files?.[0];
                if (f) pickFile(f);
              }}
              onClick={() => inputRef.current?.click()}
              className={`mt-2 relative cursor-pointer rounded-xl border-2 border-dashed overflow-hidden transition-smooth aspect-video ${
                dragOver ? "border-accent bg-accent/5" : "border-glass-border hover:border-accent/50"
              }`}
            >
              {thumbPreview ? (
                <img src={thumbPreview} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full flex flex-col items-center justify-center text-muted-foreground gap-1">
                  <ImageIcon className="h-7 w-7" />
                  <p className="text-xs">Drop image or click to upload</p>
                </div>
              )}
              <input
                ref={inputRef}
                type="file"
                accept="image/*"
                hidden
                onChange={(e) => e.target.files?.[0] && pickFile(e.target.files[0])}
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={200}
              className="mt-2 w-full glass rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              maxLength={2000}
              className="mt-2 w-full glass rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            />
          </div>
        </div>

        <div className="sticky bottom-0 glass-strong px-5 py-3 border-t border-glass-border flex gap-2 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-full text-sm hover:bg-white/5 transition-smooth"
          >
            Cancel
          </button>
          <button
            onClick={save}
            disabled={saving}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-gradient-primary text-white text-sm font-semibold glow-primary disabled:opacity-60"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
