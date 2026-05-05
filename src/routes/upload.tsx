import { useState, useRef, useEffect } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AppLayout } from "@/components/AppLayout";
import { Upload as UploadIcon, Film, X, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { categories } from "@/lib/mock-data";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/upload")({
  head: () => ({ meta: [{ title: "Upload — Vidind" }] }),
  component: UploadPage,
});

const MAX_BYTES = 4 * 1024 * 1024 * 1024; // 4GB

function UploadPage() {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const { user, loading: authLoading } = useAuth();
  const userId = user?.id ?? null;
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<string>("All");
  const [visibility, setVisibility] = useState<"public" | "private">("public");
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [done, setDone] = useState(false);

  // Redirect to login once we know there's no session
  useEffect(() => {
    if (!authLoading && !userId) {
      navigate({ to: "/login" });
    }
  }, [authLoading, userId, navigate]);

  useEffect(() => {
    if (!file) return setPreviewUrl(null);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const onPickFile = (f: File | null) => {
    if (!f) return;
    if (!f.type.startsWith("video/")) {
      toast.error("Please select a video file (MP4, MOV, WebM)");
      return;
    }
    if (f.size > MAX_BYTES) {
      toast.error("File too large. Max 4GB.");
      return;
    }
    setFile(f);
    if (!title) setTitle(f.name.replace(/\.[^.]+$/, ""));
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    onPickFile(e.dataTransfer.files?.[0] ?? null);
  };

  const reset = () => {
    setFile(null);
    setTitle("");
    setDescription("");
    setCategory("All");
    setVisibility("public");
    setProgress(0);
    setDone(false);
  };

  const handleUpload = async () => {
    if (!userId) {
      toast.error("Please log in to upload videos");
      navigate({ to: "/login" });
      return;
    }
    if (!file) return toast.error("Select a video file first");
    if (!title.trim()) return toast.error("Add a title");

    setUploading(true);
    setProgress(0);

    try {
      const ext = file.name.split(".").pop() ?? "mp4";
      const path = `${userId}/${crypto.randomUUID()}.${ext}`;

      const { error: upErr } = await supabase.storage
        .from("videos")
        .upload(path, file, {
          cacheControl: "3600",
          upsert: false,
          contentType: file.type,
        });

      if (upErr) throw upErr;
      setProgress(90);

      const { data: pub } = supabase.storage.from("videos").getPublicUrl(path);

      const { error: dbErr } = await supabase.from("videos").insert({
        user_id: userId,
        title: title.trim(),
        description: description.trim() || null,
        category,
        video_url: pub.publicUrl,
        visibility,
      });

      if (dbErr) throw dbErr;

      setProgress(100);
      setDone(true);
      toast.success("Video uploaded successfully!");
    } catch (err: any) {
      console.error(err);
      toast.error(err.message ?? "Upload failed");
      setProgress(0);
    } finally {
      setUploading(false);
    }
  };

  // Smooth fake progress while uploading (Supabase JS doesn't expose progress events)
  useEffect(() => {
    if (!uploading) return;
    const id = setInterval(() => {
      setProgress((p) => (p < 85 ? p + Math.random() * 6 : p));
    }, 400);
    return () => clearInterval(id);
  }, [uploading]);

  return (
    <AppLayout>
      <div className="mx-auto max-w-2xl">
        <h1 className="text-3xl font-extrabold tracking-tight">
          Create on <span className="gradient-text">Vidind</span>
        </h1>
        <p className="mt-1 text-muted-foreground">Drop your video — we'll handle the rest.</p>

        {!userId && (
          <div className="mt-4 rounded-2xl glass p-4 border border-accent/40 text-sm">
            You need to <button onClick={() => navigate({ to: "/login" })} className="text-accent underline">log in</button> to upload.
          </div>
        )}

        {done ? (
          <div className="mt-6 rounded-3xl glass-strong p-10 text-center">
            <CheckCircle2 className="mx-auto h-16 w-16 text-accent" />
            <h2 className="mt-4 text-2xl font-bold">Upload complete!</h2>
            <p className="mt-1 text-sm text-muted-foreground">Your video is live on Vidind.</p>
            <div className="mt-6 flex gap-3 justify-center">
              <Button onClick={reset} variant="outline" className="rounded-full">Upload another</Button>
              <Button onClick={() => navigate({ to: "/" })} className="rounded-full bg-gradient-primary border-0 text-white glow-primary">Go to feed</Button>
            </div>
          </div>
        ) : !file ? (
          <div
            onDrop={onDrop}
            onDragOver={(e) => e.preventDefault()}
            onClick={() => inputRef.current?.click()}
            className="mt-6 rounded-3xl glass-strong p-10 border-2 border-dashed border-primary/40 text-center hover:border-primary transition-smooth cursor-pointer"
          >
            <div className="mx-auto h-20 w-20 rounded-full bg-gradient-primary flex items-center justify-center glow-primary animate-pulse-glow">
              <UploadIcon className="h-10 w-10 text-white" />
            </div>
            <h2 className="mt-5 text-xl font-bold">Drag & drop your video</h2>
            <p className="mt-1 text-sm text-muted-foreground">MP4, MOV, WebM up to 4GB</p>
            <Button type="button" className="mt-5 bg-gradient-primary border-0 rounded-full px-6 text-white hover:opacity-90 glow-primary">
              Select file
            </Button>
            <input
              ref={inputRef}
              type="file"
              accept="video/*"
              className="hidden"
              onChange={(e) => onPickFile(e.target.files?.[0] ?? null)}
            />
          </div>
        ) : (
          <div className="mt-6 space-y-5">
            {/* Preview */}
            <div className="relative rounded-2xl overflow-hidden glass-strong">
              {previewUrl && (
                <video src={previewUrl} controls className="w-full max-h-80 bg-black" />
              )}
              <button
                onClick={() => !uploading && setFile(null)}
                disabled={uploading}
                className="absolute top-3 right-3 h-9 w-9 rounded-full glass flex items-center justify-center hover:bg-destructive/80 transition-smooth disabled:opacity-50"
                aria-label="Remove file"
              >
                <X className="h-4 w-4" />
              </button>
              <div className="absolute bottom-3 left-3 glass rounded-full px-3 py-1 text-xs flex items-center gap-2">
                <Film className="h-3.5 w-3.5 text-accent" />
                {file.name} · {(file.size / (1024 * 1024)).toFixed(1)} MB
              </div>
            </div>

            {/* Form */}
            <div className="rounded-2xl glass-strong p-5 space-y-4">
              <div>
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Give your video a catchy title"
                  maxLength={120}
                  disabled={uploading}
                  className="mt-1.5 rounded-xl"
                />
              </div>
              <div>
                <Label htmlFor="desc">Description</Label>
                <Textarea
                  id="desc"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Tell viewers about your video..."
                  rows={4}
                  maxLength={2000}
                  disabled={uploading}
                  className="mt-1.5 rounded-xl"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Category</Label>
                  <Select value={category} onValueChange={setCategory} disabled={uploading}>
                    <SelectTrigger className="mt-1.5 rounded-xl"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {categories.map((c) => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Visibility</Label>
                  <Select value={visibility} onValueChange={(v) => setVisibility(v as "public" | "private")} disabled={uploading}>
                    <SelectTrigger className="mt-1.5 rounded-xl"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="public">Public</SelectItem>
                      <SelectItem value="private">Private</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Progress */}
            {uploading || progress > 0 ? (
              <div className="rounded-2xl glass p-4 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    {uploading && <Loader2 className="h-4 w-4 animate-spin text-accent" />}
                    {uploading ? "Uploading..." : "Ready"}
                  </span>
                  <span className="font-semibold">{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} />
              </div>
            ) : null}

            <div className="flex gap-3">
              <Button
                onClick={() => setFile(null)}
                variant="outline"
                disabled={uploading}
                className="rounded-full flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpload}
                disabled={uploading || !userId}
                className="rounded-full flex-1 bg-gradient-primary border-0 text-white hover:opacity-90 glow-primary"
              >
                {uploading ? "Uploading..." : "Publish video"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
