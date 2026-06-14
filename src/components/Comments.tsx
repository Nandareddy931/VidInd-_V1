import { useEffect, useState, useCallback } from "react";
import { Link } from "@tanstack/react-router";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Send, 
  Trash2, 
  Loader2, 
  Heart, 
  Reply, 
  MoreVertical, 
  Pin, 
  Flag, 
  UserX, 
  CheckCircle,
  MessageSquare
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { formatDistanceToNow } from "date-fns";
import { containsBadWords } from "@/lib/bad-words";

type CommentRow = {
  id: string;
  video_id: string;
  user_id: string;
  parent_comment_id: string | null;
  comment_text: string;
  likes_count: number;
  is_pinned: boolean;
  is_hidden: boolean;
  is_reported: boolean;
  is_reviewed: boolean;
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
  const [videoOwnerId, setVideoOwnerId] = useState<string | null>(null);
  
  // Reply and menu states
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [replying, setReplying] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [likedCommentIds, setLikedCommentIds] = useState<Set<string>>(new Set());

  const loadVideoDetails = useCallback(async () => {
    const { data } = await supabase
      .from("videos")
      .select("user_id")
      .eq("id", videoId)
      .single();
    if (data) {
      setVideoOwnerId(data.user_id);
    }
  }, [videoId]);

  const load = useCallback(async () => {
    setLoading(true);
    // Fetch comments
    const { data: rows } = await supabase
      .from("comments")
      .select(`
        id,
        video_id,
        user_id,
        parent_comment_id,
        comment_text,
        likes_count,
        is_pinned,
        is_hidden,
        is_reported,
        is_reviewed,
        created_at,
        profiles:user_id (
          display_name,
          avatar_url
        )
      `)
      .eq("video_id", videoId)
      .order("created_at", { ascending: false });

    const list = (rows ?? []).map((r: any) => ({
      id: r.id,
      video_id: r.video_id,
      user_id: r.user_id,
      parent_comment_id: r.parent_comment_id,
      comment_text: r.comment_text,
      likes_count: Number(r.likes_count ?? 0),
      is_pinned: !!r.is_pinned,
      is_hidden: !!r.is_hidden,
      is_reported: !!r.is_reported,
      is_reviewed: !!r.is_reviewed,
      created_at: r.created_at,
      display_name: r.profiles?.display_name ?? null,
      avatar_url: r.profiles?.avatar_url ?? null,
    })) as CommentWithProfile[];

    setComments(list);

    // Fetch current user likes
    if (user) {
      const { data: likes } = await supabase
        .from("comment_likes")
        .select("comment_id")
        .eq("user_id", user.id);
      if (likes) {
        setLikedCommentIds(new Set(likes.map((l) => l.comment_id)));
      }
    }
    setLoading(false);
  }, [videoId, user]);

  useEffect(() => {
    loadVideoDetails();
    load();
  }, [load, loadVideoDetails]);

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
    const cleanText = text.trim();
    if (!cleanText) return;
    if (!isAuthenticated || !user) {
      toast.error("Sign in to comment");
      return;
    }
    setPosting(true);

    // Bad words detection
    const hasBadWords = containsBadWords(cleanText);

    // Insert comment
    const { error } = await supabase.from("comments").insert({
      video_id: videoId,
      user_id: user.id,
      comment_text: cleanText,
      is_hidden: hasBadWords,
      is_reported: hasBadWords,
    });

    setPosting(false);
    if (error) {
      toast.error("Couldn't post comment");
    } else {
      setText("");
      if (hasBadWords) {
        toast.warning("Your comment was flagged by the automated filter and is pending moderator review.", {
          duration: 5000,
        });
      } else {
        toast.success("Comment posted!");
      }
      load();
    }
  };

  const submitReply = async (parentId: string) => {
    const cleanText = replyText.trim();
    if (!cleanText) return;
    if (!isAuthenticated || !user) {
      toast.error("Sign in to reply");
      return;
    }
    setReplying(true);

    // Bad words detection
    const hasBadWords = containsBadWords(cleanText);

    const { error } = await supabase.from("comments").insert({
      video_id: videoId,
      user_id: user.id,
      parent_comment_id: parentId,
      comment_text: cleanText,
      is_hidden: hasBadWords,
      is_reported: hasBadWords,
    });

    setReplying(false);
    if (error) {
      toast.error("Couldn't post reply");
    } else {
      setReplyText("");
      setReplyingToId(null);
      if (hasBadWords) {
        toast.warning("Your reply was flagged and is pending creator review.");
      } else {
        toast.success("Reply posted!");
      }
      load();
    }
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("comments").delete().eq("id", id);
    if (error) {
      toast.error("Couldn't delete comment");
    } else {
      toast.success("Comment deleted");
      load();
    }
    setActiveMenuId(null);
  };

  const toggleLike = async (commentId: string) => {
    if (!isAuthenticated || !user) {
      toast.error("Sign in to like comments");
      return;
    }
    const liked = likedCommentIds.has(commentId);
    const updatedLikes = new Set(likedCommentIds);

    if (liked) {
      updatedLikes.delete(commentId);
      setLikedCommentIds(updatedLikes);
      setComments((prev) =>
        prev.map((c) => (c.id === commentId ? { ...c, likes_count: Math.max(0, c.likes_count - 1) } : c))
      );
      await supabase.from("comment_likes").delete().eq("comment_id", commentId).eq("user_id", user.id);
    } else {
      updatedLikes.add(commentId);
      setLikedCommentIds(updatedLikes);
      setComments((prev) =>
        prev.map((c) => (c.id === commentId ? { ...c, likes_count: c.likes_count + 1 } : c))
      );
      await supabase.from("comment_likes").insert({ comment_id: commentId, user_id: user.id });
    }
  };

  const reportComment = async (commentId: string) => {
    const { error } = await supabase
      .from("comments")
      .update({ is_reported: true })
      .eq("id", commentId);
    if (error) {
      toast.error("Couldn't report comment");
    } else {
      toast.success("Comment reported for moderation");
    }
    setActiveMenuId(null);
  };

  const blockUser = async (commenterId: string) => {
    if (!user) return;
    const { error } = await supabase.from("blocked_users").insert({
      blocker_id: user.id,
      blocked_id: commenterId,
    });
    if (error) {
      toast.error("Couldn't block user");
    } else {
      toast.success("User blocked. Future comments from this user will be hidden.");
      load();
    }
    setActiveMenuId(null);
  };

  const togglePin = async (comment: CommentWithProfile) => {
    const currentPinned = comment.is_pinned;
    if (currentPinned) {
      await supabase.from("comments").update({ is_pinned: false }).eq("id", comment.id);
      toast.success("Comment unpinned");
    } else {
      // Unpin all other comments on this video, then pin this one
      await supabase.from("comments").update({ is_pinned: false }).eq("video_id", videoId);
      await supabase.from("comments").update({ is_pinned: true }).eq("id", comment.id);
      toast.success("Comment pinned");
    }
    load();
    setActiveMenuId(null);
  };

  const markReviewed = async (commentId: string) => {
    const { error } = await supabase.from("comments").update({ is_reviewed: true }).eq("id", commentId);
    if (error) {
      toast.error("Error updating comment");
    } else {
      toast.success("Comment marked as reviewed");
      load();
    }
    setActiveMenuId(null);
  };

  // Close active dropdown menu when clicking outside
  useEffect(() => {
    const handleOutsideClick = () => setActiveMenuId(null);
    window.addEventListener("click", handleOutsideClick);
    return () => window.removeEventListener("click", handleOutsideClick);
  }, []);

  // Filter top level comments, sorting pinned first, then newest first
  const topLevelComments = comments
    .filter((c) => !c.parent_comment_id)
    .sort((a, b) => {
      if (a.is_pinned && !b.is_pinned) return -1;
      if (!a.is_pinned && b.is_pinned) return 1;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

  const getReplies = (parentId: string) => {
    return comments
      .filter((c) => c.parent_comment_id === parentId)
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  };

  const isCreator = user && videoOwnerId === user.id;

  const renderCommentCard = (c: CommentWithProfile, isReply = false) => {
    const hasLiked = likedCommentIds.has(c.id);
    const commentReplies = getReplies(c.id);
    const isCommentOwner = user && c.user_id === user.id;
    const commentUserIsCreator = videoOwnerId === c.user_id;

    return (
      <div key={c.id} className={`flex gap-3 group relative ${isReply ? "mt-3 pl-8 md:pl-10" : "mt-5"}`}>
        <Link to="/channel/$userId" params={{ userId: c.user_id }} className="shrink-0">
          <Avatar className={isReply ? "h-7 w-7" : "h-9 w-9"}>
            {c.avatar_url ? <AvatarImage src={c.avatar_url} alt="" /> : null}
            <AvatarFallback className="bg-gradient-primary text-white text-xs font-bold">
              {(c.display_name?.[0] ?? "U").toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </Link>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
            <span className="font-semibold text-foreground truncate max-w-[150px]">
              {c.display_name ?? "User"}
            </span>
            {commentUserIsCreator && (
              <span className="px-1.5 py-0.5 rounded bg-accent/10 border border-accent/20 text-[9px] font-bold text-accent uppercase tracking-wider leading-none">
                Creator
              </span>
            )}
            {c.is_pinned && (
              <span className="flex items-center gap-1 text-[10px] text-accent font-semibold">
                <Pin className="h-3 w-3 fill-accent shrink-0" />
                Pinned
              </span>
            )}
            <span>{timeAgo(c.created_at)}</span>
          </div>

          <p className="mt-1 text-sm text-foreground/90 whitespace-pre-wrap break-words">
            {c.comment_text}
          </p>

          <div className="mt-2 flex items-center gap-4 text-xs">
            <button
              onClick={() => toggleLike(c.id)}
              className={`flex items-center gap-1.5 transition-smooth ${
                hasLiked ? "text-primary font-semibold" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Heart className={`h-4 w-4 ${hasLiked ? "fill-primary text-primary" : ""}`} />
              <span className="tabular-nums">{c.likes_count}</span>
            </button>

            {!isReply && isAuthenticated && (
              <button
                onClick={() => {
                  setReplyingToId(replyingToId === c.id ? null : c.id);
                  setReplyText("");
                }}
                className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-smooth"
              >
                <Reply className="h-4 w-4" />
                <span>Reply</span>
              </button>
            )}
          </div>

          {/* Reply Form */}
          {replyingToId === c.id && (
            <div className="mt-3 flex items-center gap-2">
              <input
                type="text"
                placeholder="Write a reply..."
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                disabled={replying}
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-accent"
                onKeyDown={(e) => {
                  if (e.key === "Enter") submitReply(c.id);
                }}
              />
              <button
                onClick={() => submitReply(c.id)}
                disabled={!replyText.trim() || replying}
                className="p-1.5 rounded-xl bg-gradient-primary text-white hover:opacity-90 disabled:opacity-40"
              >
                {replying ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
              </button>
            </div>
          )}

          {/* Render Replies */}
          {!isReply && commentReplies.length > 0 && (
            <div className="space-y-1">
              {commentReplies.map((reply) => renderCommentCard(reply, true))}
            </div>
          )}
        </div>

        {/* Dropdown Options Menu */}
        {isAuthenticated && (
          <div className="shrink-0 relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setActiveMenuId(activeMenuId === c.id ? null : c.id);
              }}
              className="h-8 w-8 rounded-full hover:bg-white/5 text-muted-foreground hover:text-foreground flex items-center justify-center transition-smooth"
            >
              <MoreVertical className="h-4 w-4" />
            </button>

            {activeMenuId === c.id && (
              <div
                onClick={(e) => e.stopPropagation()}
                className="absolute right-0 mt-1 w-44 glass-strong shadow-elevated rounded-xl border border-glass-border p-1 z-30 animate-scale-in text-xs"
              >
                {/* Pin comment options for Creator (top-level only) */}
                {isCreator && !isReply && (
                  <button
                    onClick={() => togglePin(c)}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-white/5 text-left text-foreground transition-smooth"
                  >
                    <Pin className="h-3.5 w-3.5 text-accent" />
                    <span>{c.is_pinned ? "Unpin Comment" : "Pin Comment"}</span>
                  </button>
                )}

                {/* Mark as reviewed for Creator */}
                {isCreator && !c.is_reviewed && (
                  <button
                    onClick={() => markReviewed(c.id)}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-white/5 text-left text-foreground transition-smooth"
                  >
                    <CheckCircle className="h-3.5 w-3.5 text-success" />
                    <span>Mark Reviewed</span>
                  </button>
                )}

                {/* Report option for viewers (not own comment) */}
                {!isCommentOwner && (
                  <button
                    onClick={() => reportComment(c.id)}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-white/5 text-left text-foreground transition-smooth"
                  >
                    <Flag className="h-3.5 w-3.5 text-warning" />
                    <span>Report Comment</span>
                  </button>
                )}

                {/* Block user for Creator (not own comment) */}
                {isCreator && !isCommentOwner && (
                  <button
                    onClick={() => blockUser(c.user_id)}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-white/5 text-left text-foreground transition-smooth"
                  >
                    <UserX className="h-3.5 w-3.5 text-destructive" />
                    <span>Block User</span>
                  </button>
                )}

                {/* Delete option for Owner or Creator */}
                {(isCommentOwner || isCreator) && (
                  <button
                    onClick={() => remove(c.id)}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-white/5 text-left text-destructive transition-smooth"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Delete Comment</span>
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <section className="mt-6 border-t border-glass-border pt-6">
      <div className="flex items-center gap-2 mb-4">
        <MessageSquare className="h-5 w-5 text-accent" />
        <h2 className="text-base font-bold">
          Comments • {loading ? "…" : comments.length}
        </h2>
      </div>

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
          placeholder={isAuthenticated ? "Add a public comment..." : "Sign in to comment"}
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

      <div className="mt-5 divide-y divide-glass-border/30">
        {loading ? (
          <p className="text-sm text-muted-foreground py-4">Loading comments…</p>
        ) : topLevelComments.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center bg-white/2 rounded-2xl border border-glass-border">
            No comments yet. Be the first to comment.
          </p>
        ) : (
          <div className="space-y-4 pb-4">
            {topLevelComments.map((c) => renderCommentCard(c))}
          </div>
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
