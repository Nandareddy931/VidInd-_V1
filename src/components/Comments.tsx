import { useEffect, useState, useCallback } from "react";
import { Link } from "@tanstack/react-router";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Send, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { formatDistanceToNow } from "date-fns";

type CommentRow = {
  id: string;
  video_id: string;
  user_id: string;
  content: string;
  created_at: string;
};

type CommentWithProfile = CommentRow & {
  display_name: string | null;
  avatar_url: string | null;
};

export function Comments({ videoId }: { videoId: string }) {
  const { user, isAuthenticated } = useAuth();
  const [comments, setComments] = useState<CommentWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [posting, setPosting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { data: rows } = await supabase
      .from("comments")
      .select("id, video_id, user_id, content, created_at")
      .eq("video_id", videoId)
      .order("created_at", { ascending: false })
      .limit(200);

    const list = (rows ?? []) as CommentRow[];
    const ids = Array.from(new Set(list.map((c) => c.user_id)));
    let profMap: Record<string, { display_name: string | null; avatar_url: string | null }> = {};
    if (ids.length) {
      const { data: profs } = await supabase
        .from("profiles")
        .select("user_id, display_name, avatar_url")
        .in("user_id", ids);
      profMap = Object.fromEntries(
        (profs ?? []).map((p) => [p.user_id, { display_name: p.display_name, avatar_url: p.avatar_url }]),
      );
    }
    setComments(
      list.map((c) => ({
        ...c,
        display_name: profMap[c.user_id]?.display_name ?? null,
        avatar_url: profMap[c.user_id]?.avatar_url ?? null,
      })),
    );
    setLoading(false);
  }, [videoId]);

  useEffect(() => {
    load();
  }, [load]);

  // Realtime updates
  useEffect(() => {
    const channel = supabase
      .channel(`comments:${videoId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "comments", filter: `video_id=eq.${videoId}` },
        () => load(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [videoId, load]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const content = text.trim();
    if (!content) return;
    if (!isAuthenticated || !user) {
      toast.error("Sign in to comment");
      return;
    }
    setPosting(true);
    // Optimistic
    const optimistic: CommentWithProfile = {
      id: `tmp-${Date.now()}`,
      video_id: videoId,
      user_id: user.id,
      content,
      created_at: new Date().toISOString(),
      display_name: (user.user_metadata?.display_name as string) ?? user.email?.split("@")[0] ?? "You",
      avatar_url: null,
    };
    setComments((c) => [optimistic, ...c]);
    setText("");

    const { error } = await supabase
      .from("comments")
      .insert({ video_id: videoId, user_id: user.id, content });
    setPosting(false);
    if (error) {
      setComments((c) => c.filter((x) => x.id !== optimistic.id));
      toast.error("Couldn't post comment");
    }
  };

  const remove = async (id: string) => {
    const prev = comments;
    setComments((c) => c.filter((x) => x.id !== id));
    const { error } = await supabase.from("comments").delete().eq("id", id);
    if (error) {
      setComments(prev);
      toast.error("Couldn't delete comment");
    }
  };

  return (
    <section className="mt-6">
      <h2 className="text-base font-bold mb-3">
        Comments • {loading ? "…" : comments.length}
      </h2>

      <form onSubmit={submit} className="flex items-center gap-3 rounded-full glass px-3 py-2">
        <Avatar className="h-8 w-8">
          <AvatarFallback className="bg-gradient-primary text-white text-xs font-bold">
            {(user?.email?.[0] ?? "Y").toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={isAuthenticated ? "Add a comment..." : "Sign in to comment"}
          disabled={!isAuthenticated || posting}
          className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={!text.trim() || posting || !isAuthenticated}
          aria-label="Send comment"
          className="h-8 w-8 rounded-full bg-gradient-primary text-white flex items-center justify-center hover:opacity-90 transition-smooth disabled:opacity-40"
        >
          {posting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </button>
      </form>

      <div className="mt-5 space-y-5">
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading comments…</p>
        ) : comments.length === 0 ? (
          <p className="text-sm text-muted-foreground">Be the first to comment.</p>
        ) : (
          comments.map((c) => (
            <div key={c.id} className="flex gap-3 group">
              <Link
                to="/channel/$userId"
                params={{ userId: c.user_id }}
                className="shrink-0"
              >
                <Avatar className="h-9 w-9">
                  {c.avatar_url ? <AvatarImage src={c.avatar_url} alt="" /> : null}
                  <AvatarFallback className="bg-gradient-primary text-white text-xs font-bold">
                    {(c.display_name?.[0] ?? "U").toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </Link>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="font-semibold text-foreground">
                    {c.display_name ?? "User"}
                  </span>
                  <span>{timeAgo(c.created_at)}</span>
                </div>
                <p className="mt-1 text-sm text-foreground/90 whitespace-pre-wrap break-words">
                  {c.content}
                </p>
              </div>
              {user?.id === c.user_id && (
                <button
                  onClick={() => remove(c.id)}
                  aria-label="Delete comment"
                  className="opacity-0 group-hover:opacity-100 transition-smooth h-8 w-8 rounded-full hover:text-destructive flex items-center justify-center"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </section>
  );
}

function timeAgo(iso: string): string {
  try {
    return formatDistanceToNow(new Date(iso), { addSuffix: true });
  } catch {
    return "";
  }
}
