import { createFileRoute, Link } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { useEffect, useState, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  MessageSquare,
  Search,
  Pin,
  Trash2,
  Eye,
  EyeOff,
  Check,
  UserX,
  Send,
  Loader2,
  Heart,
  TrendingUp,
  Flame,
  MessageCircle,
  Percent,
  Flag,
  CornerDownRight,
  ShieldAlert
} from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

export const Route = createFileRoute("/studio/comments")({
  head: () => ({ meta: [{ title: "Comments — Pori Studio" }] }),
  component: CommentsPage,
});

type CommentWithVideo = {
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
  video: {
    id: string;
    title: string;
    thumbnail_url: string | null;
  } | null;
  display_name: string;
  avatar_url: string | null;
};

type FilterType = "latest" | "most_liked" | "unanswered" | "reported";

function CommentsPage() {
  const { user } = useAuth();
  const [comments, setComments] = useState<CommentWithVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterType>("latest");

  // Quick reply state
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [submittingReply, setSubmittingReply] = useState(false);

  const loadComments = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    
    // Fetch comments on creator's videos (videos!inner matches video's user_id = creator)
    const { data, error } = await supabase
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
        videos!inner (
          id,
          title,
          thumbnail_url,
          user_id
        ),
        profiles:user_id (
          display_name,
          avatar_url
        )
      `)
      .eq("videos.user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Error loading comments");
      setLoading(false);
      return;
    }

    const list = (data ?? []).map((c: any) => ({
      id: c.id,
      video_id: c.video_id,
      user_id: c.user_id,
      parent_comment_id: c.parent_comment_id,
      comment_text: c.comment_text,
      likes_count: Number(c.likes_count ?? 0),
      is_pinned: !!c.is_pinned,
      is_hidden: !!c.is_hidden,
      is_reported: !!c.is_reported,
      is_reviewed: !!c.is_reviewed,
      created_at: c.created_at,
      video: c.videos ? {
        id: c.videos.id,
        title: c.videos.title,
        thumbnail_url: c.videos.thumbnail_url
      } : null,
      display_name: c.profiles?.display_name ?? "User",
      avatar_url: c.profiles?.avatar_url ?? null,
    })) as CommentWithVideo[];

    setComments(list);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    loadComments();
  }, [loadComments]);

  // Actions
  const handleReview = async (id: string) => {
    const { error } = await supabase
      .from("comments")
      .update({ is_reviewed: true })
      .eq("id", id);
    if (error) {
      toast.error("Couldn't update comment status");
    } else {
      toast.success("Comment marked as reviewed");
      loadComments();
    }
  };

  const handleToggleHide = async (c: CommentWithVideo) => {
    const nextState = !c.is_hidden;
    const { error } = await supabase
      .from("comments")
      .update({ is_hidden: nextState })
      .eq("id", c.id);
    if (error) {
      toast.error("Couldn't update comment visibility");
    } else {
      toast.success(nextState ? "Comment hidden from viewers" : "Comment is now visible");
      loadComments();
    }
  };

  const handleTogglePin = async (c: CommentWithVideo) => {
    const nextState = !c.is_pinned;
    if (nextState) {
      // Unpin all on this video first, then pin
      await supabase.from("comments").update({ is_pinned: false }).eq("video_id", c.video_id);
      await supabase.from("comments").update({ is_pinned: true }).eq("id", c.id);
      toast.success("Comment pinned to top of video");
    } else {
      await supabase.from("comments").update({ is_pinned: false }).eq("id", c.id);
      toast.success("Comment unpinned");
    }
    loadComments();
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to permanently delete this comment?")) return;
    const { error } = await supabase.from("comments").delete().eq("id", id);
    if (error) {
      toast.error("Couldn't delete comment");
    } else {
      toast.success("Comment deleted");
      loadComments();
    }
  };

  const handleBlockUser = async (commenterId: string, commenterName: string) => {
    if (!user) return;
    if (!window.confirm(`Are you sure you want to block ${commenterName}? All future comments from this user will be hidden automatically.`)) return;
    
    const { error } = await supabase.from("blocked_users").insert({
      blocker_id: user.id,
      blocked_id: commenterId,
    });
    if (error) {
      toast.error("Couldn't block user");
    } else {
      toast.success(`${commenterName} blocked successfully`);
      loadComments();
    }
  };

  const handlePostReply = async (comment: CommentWithVideo) => {
    if (!user || !replyText.trim()) return;
    setSubmittingReply(true);

    const { error } = await supabase.from("comments").insert({
      video_id: comment.video_id,
      user_id: user.id,
      parent_comment_id: comment.id,
      comment_text: replyText.trim(),
      is_reviewed: true // Creator replies are auto-reviewed
    });

    if (error) {
      toast.error("Couldn't post reply");
    } else {
      // Mark parent as reviewed when replied to
      await supabase.from("comments").update({ is_reviewed: true }).eq("id", comment.id);
      toast.success("Reply posted!");
      setReplyText("");
      setReplyingToId(null);
      loadComments();
    }
    setSubmittingReply(false);
  };

  // Analytics calculations
  const analytics = useMemo(() => {
    if (!user) return { total: 0, newToday: 0, topVideoTitle: "None", replyRate: 0 };
    
    // Filter to comments made by others on creator's videos
    const receivedComments = comments.filter(c => c.user_id !== user.id);
    const total = receivedComments.length;

    // New today
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);
    const newToday = receivedComments.filter(c => new Date(c.created_at) >= oneDayAgo).length;

    // Most commented video
    const videoCommentCounts: Record<string, { title: string; count: number }> = {};
    receivedComments.forEach((c) => {
      if (c.video) {
        if (!videoCommentCounts[c.video.id]) {
          videoCommentCounts[c.video.id] = { title: c.video.title, count: 0 };
        }
        videoCommentCounts[c.video.id].count++;
      }
    });
    let topVideoTitle = "No comments yet";
    let maxComments = 0;
    Object.values(videoCommentCounts).forEach((v) => {
      if (v.count > maxComments) {
        maxComments = v.count;
        topVideoTitle = `${v.title.slice(0, 24)}${v.title.length > 24 ? "..." : ""} (${v.count})`;
      }
    });

    // Reply Rate: percent of top-level comments by others that have a creator reply
    const topReceived = receivedComments.filter(c => !c.parent_comment_id);
    const creatorReplies = comments.filter(c => c.parent_comment_id && c.user_id === user.id);
    const repliedToIds = new Set(creatorReplies.map(r => r.parent_comment_id));
    const repliedCount = topReceived.filter(c => repliedToIds.has(c.id)).length;
    const replyRate = topReceived.length > 0 ? Math.round((repliedCount / topReceived.length) * 100) : 0;

    return { total, newToday, topVideoTitle, replyRate };
  }, [comments, user]);

  // Filtering comments
  const filteredComments = useMemo(() => {
    if (!user) return [];

    // Creator replies set to see unanswered
    const creatorReplies = comments.filter(c => c.parent_comment_id && c.user_id === user.id);
    const repliedToIds = new Set(creatorReplies.map(r => r.parent_comment_id));

    // Exclude creator's own comments from standard list
    let list = comments.filter(c => c.user_id !== user.id);

    // Apply Filter Tab
    if (activeFilter === "most_liked") {
      list = [...list].sort((a, b) => b.likes_count - a.likes_count);
    } else if (activeFilter === "unanswered") {
      list = list.filter(c => !c.parent_comment_id && !repliedToIds.has(c.id));
    } else if (activeFilter === "reported") {
      list = list.filter(c => c.is_reported);
    }

    // Apply Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (c) =>
          c.comment_text.toLowerCase().includes(q) ||
          c.display_name.toLowerCase().includes(q) ||
          (c.video && c.video.title.toLowerCase().includes(q))
      );
    }

    return list;
  }, [comments, activeFilter, searchQuery, user]);

  // Find replies for each comment (if creator wants to see thread in Pori Studio)
  const getRepliesForComment = (parentId: string) => {
    return comments.filter((c) => c.parent_comment_id === parentId);
  };

  return (
    <>
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold flex items-center gap-2">
          Comments
        </h1>
        <p className="text-muted-foreground text-sm">Review, reply, and moderate comments on your channel</p>
      </div>

      {/* Analytics Cards */}
      <div className="mt-5 grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="glass rounded-2xl p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
            <MessageCircle className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider leading-none mb-1">Total Received</p>
            <p className="text-2xl font-extrabold tabular-nums leading-none">{analytics.total}</p>
          </div>
        </div>

        <div className="glass rounded-2xl p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center shrink-0">
            <TrendingUp className="h-5 w-5 text-accent" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider leading-none mb-1">New Today</p>
            <p className="text-2xl font-extrabold tabular-nums leading-none">{analytics.newToday}</p>
          </div>
        </div>

        <div className="glass rounded-2xl p-4 flex items-center gap-3 col-span-2 lg:col-span-1">
          <div className="h-10 w-10 rounded-xl bg-warning/10 border border-warning/20 flex items-center justify-center shrink-0">
            <Percent className="h-5 w-5 text-warning" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider leading-none mb-1">Reply Rate</p>
            <p className="text-2xl font-extrabold tabular-nums leading-none">{analytics.replyRate}%</p>
          </div>
        </div>

        <div className="glass rounded-2xl p-4 flex items-center gap-3 col-span-2 lg:col-span-1">
          <div className="h-10 w-10 rounded-xl bg-success/10 border border-success/20 flex items-center justify-center shrink-0">
            <Flame className="h-5 w-5 text-success" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider leading-none mb-1">Top Video</p>
            <p className="text-sm font-extrabold truncate leading-tight mt-0.5">{analytics.topVideoTitle}</p>
          </div>
        </div>
      </div>

      {/* Toolbar: Search and Filters */}
      <div className="mt-6 flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search comments, users or videos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-2xl pl-10 pr-4 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:border-accent"
          />
        </div>

        {/* Filters */}
        <div className="flex gap-1 overflow-x-auto scrollbar-none rounded-xl bg-white/5 p-1 text-xs shrink-0 self-start md:self-auto">
          {[
            { value: "latest", label: "Latest" },
            { value: "most_liked", label: "Most Liked" },
            { value: "unanswered", label: "Unanswered" },
            { value: "reported", label: "Reported" }
          ].map((f) => (
            <button
              key={f.value}
              onClick={() => setActiveFilter(f.value as FilterType)}
              className={`px-3.5 py-2 rounded-lg font-medium whitespace-nowrap transition-smooth ${
                activeFilter === f.value ? "bg-gradient-primary text-white glow-primary" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Comments List */}
      <div className="mt-6 space-y-4">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-32 skeleton rounded-2xl" />
            ))}
          </div>
        ) : filteredComments.length === 0 ? (
          <div className="glass rounded-2xl py-12 text-center flex flex-col items-center justify-center p-6 border border-glass-border">
            <MessageSquare className="h-10 w-10 text-muted-foreground mb-3" />
            <h3 className="font-bold text-lg mb-1">No comments found</h3>
            <p className="text-muted-foreground text-sm max-w-sm">
              {searchQuery ? "Try checking your spelling or search terms." : "No comments yet. Comments from your videos will appear here."}
            </p>
          </div>
        ) : (
          filteredComments.map((c) => {
            const hasCreatorReplied = getRepliesForComment(c.id).some((r) => user && r.user_id === user.id);
            const parentCommentReplies = getRepliesForComment(c.id);

            return (
              <div key={c.id} className="glass rounded-2xl border border-glass-border p-4 transition-smooth hover:border-white/10 flex flex-col md:flex-row gap-4">
                {/* Left Side: Comment Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9 border border-white/10">
                      {c.avatar_url ? <AvatarImage src={c.avatar_url} alt="" /> : null}
                      <AvatarFallback className="bg-gradient-primary text-white text-xs font-bold">
                        {c.display_name[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm text-foreground truncate">{c.display_name}</span>
                        <span className="text-[10px] text-muted-foreground">{timeAgo(c.created_at)}</span>
                        
                        {/* Status Badges */}
                        {c.is_pinned && (
                          <span className="px-1.5 py-0.5 rounded bg-accent/10 border border-accent/20 text-[9px] text-accent font-bold uppercase tracking-wider flex items-center gap-0.5">
                            <Pin className="h-2.5 w-2.5 fill-accent" />
                            Pinned
                          </span>
                        )}
                        {c.is_hidden && (
                          <span className="px-1.5 py-0.5 rounded bg-destructive/10 border border-destructive/20 text-[9px] text-destructive font-bold uppercase tracking-wider flex items-center gap-0.5">
                            <EyeOff className="h-2.5 w-2.5" />
                            Hidden
                          </span>
                        )}
                        {c.is_reported && (
                          <span className="px-1.5 py-0.5 rounded bg-warning/10 border border-warning/20 text-[9px] text-warning font-bold uppercase tracking-wider flex items-center gap-0.5">
                            <ShieldAlert className="h-2.5 w-2.5" />
                            Reported
                          </span>
                        )}
                        {c.is_reviewed && (
                          <span className="px-1.5 py-0.5 rounded bg-success/10 border border-success/20 text-[9px] text-success font-bold uppercase tracking-wider flex items-center gap-0.5">
                            <Check className="h-2.5 w-2.5" />
                            Reviewed
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Comment Text */}
                  <p className="mt-2.5 text-sm text-foreground/90 whitespace-pre-wrap break-words leading-relaxed pl-1">
                    {c.comment_text}
                  </p>

                  {/* Inline thread showing creator replies */}
                  {parentCommentReplies.length > 0 && (
                    <div className="mt-3.5 space-y-2 border-l-2 border-white/5 pl-4">
                      {parentCommentReplies.map((reply) => {
                        const replyIsCreator = user && reply.user_id === user.id;
                        return (
                          <div key={reply.id} className="flex gap-2.5 items-start text-xs bg-white/2 rounded-xl p-2.5 border border-white/5">
                            <CornerDownRight className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
                            <Avatar className="h-5 w-5 shrink-0">
                              {reply.avatar_url ? <AvatarImage src={reply.avatar_url} /> : null}
                              <AvatarFallback className="bg-gradient-primary text-white text-[8px] font-bold">
                                {replyIsCreator ? "C" : "U"}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5 font-semibold">
                                <span>{replyIsCreator ? "You" : reply.user_id === c.user_id ? c.display_name : "User"}</span>
                                {replyIsCreator && (
                                  <span className="px-1.5 py-0.2 rounded bg-accent/10 border border-accent/20 text-[8px] text-accent font-bold uppercase">Creator</span>
                                )}
                                <span className="text-[10px] font-normal text-muted-foreground">{timeAgo(reply.created_at)}</span>
                              </div>
                              <p className="mt-1 text-foreground/80">{reply.comment_text}</p>
                            </div>
                            <button
                              onClick={() => handleDelete(reply.id)}
                              className="text-muted-foreground hover:text-destructive p-1 rounded hover:bg-white/5"
                              title="Delete reply"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Inline Quick Reply Field */}
                  {replyingToId === c.id ? (
                    <div className="mt-3.5 flex gap-2">
                      <input
                        type="text"
                        placeholder={`Reply to ${c.display_name}...`}
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        disabled={submittingReply}
                        className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3.5 py-2 text-xs placeholder:text-muted-foreground focus:outline-none focus:border-accent"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handlePostReply(c);
                        }}
                      />
                      <button
                        onClick={() => handlePostReply(c)}
                        disabled={!replyText.trim() || submittingReply}
                        className="px-3.5 rounded-xl bg-gradient-primary text-white text-xs hover:opacity-90 disabled:opacity-40 flex items-center justify-center gap-1.5 transition-smooth"
                      >
                        {submittingReply ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                        <span>Send</span>
                      </button>
                      <button
                        onClick={() => setReplyingToId(null)}
                        className="px-3 rounded-xl border border-white/10 text-muted-foreground text-xs hover:text-foreground hover:bg-white/5 transition-smooth"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div className="mt-3.5 flex items-center gap-3">
                      <button
                        onClick={() => {
                          setReplyingToId(c.id);
                          setReplyText("");
                        }}
                        className="text-xs bg-white/5 border border-white/5 hover:border-white/10 text-muted-foreground hover:text-foreground hover:bg-white/10 px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-smooth"
                      >
                        <CornerDownRight className="h-3.5 w-3.5" />
                        <span>{hasCreatorReplied ? "Reply Again" : "Reply"}</span>
                      </button>
                      
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Heart className="h-3.5 w-3.5" />
                        <span className="tabular-nums">{c.likes_count} likes</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Right Side: Video Thumbnail & Moderation Action Buttons */}
                <div className="flex flex-row md:flex-col items-center justify-between md:justify-center md:items-end gap-3 shrink-0 border-t md:border-t-0 md:border-l border-white/5 pt-3 md:pt-0 md:pl-4 min-w-[150px]">
                  {/* Video Thumbnail */}
                  {c.video && (
                    <Link to="/watch/$videoId" params={{ videoId: c.video.id }} className="flex items-center gap-2 group w-full md:w-auto text-left">
                      <div className="h-10 w-16 rounded-lg bg-black/40 overflow-hidden relative border border-white/5 shrink-0">
                        {c.video.thumbnail_url ? (
                          <img src={c.video.thumbnail_url} alt="" className="h-full w-full object-cover transition-smooth group-hover:scale-105" />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center text-[10px] text-muted-foreground bg-white/5">Video</div>
                        )}
                      </div>
                      <div className="min-w-0 max-w-[120px] md:max-w-[100px]">
                        <p className="text-[10px] font-bold text-foreground truncate group-hover:text-accent transition-smooth">{c.video.title}</p>
                        <p className="text-[8px] text-muted-foreground">Watch Video</p>
                      </div>
                    </Link>
                  )}

                  {/* Moderation Buttons */}
                  <div className="flex gap-1.5">
                    {/* Mark Reviewed */}
                    {!c.is_reviewed && (
                      <button
                        onClick={() => handleReview(c.id)}
                        className="h-8 w-8 rounded-lg bg-success/10 hover:bg-success/20 border border-success/20 hover:border-success/30 text-success flex items-center justify-center transition-smooth"
                        title="Mark as reviewed"
                      >
                        <Check className="h-4 w-4" />
                      </button>
                    )}

                    {/* Pin/Unpin */}
                    {!c.parent_comment_id && (
                      <button
                        onClick={() => handleTogglePin(c)}
                        className={`h-8 w-8 rounded-lg border flex items-center justify-center transition-smooth ${
                          c.is_pinned
                            ? "bg-accent text-accent-foreground border-accent font-semibold"
                            : "bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-foreground border-white/5 hover:border-white/10"
                        }`}
                        title={c.is_pinned ? "Unpin comment" : "Pin comment to top"}
                      >
                        <Pin className={`h-4 w-4 ${c.is_pinned ? "fill-accent-foreground" : ""}`} />
                      </button>
                    )}

                    {/* Hide/Unhide */}
                    <button
                      onClick={() => handleToggleHide(c)}
                      className={`h-8 w-8 rounded-lg border flex items-center justify-center transition-smooth ${
                        c.is_hidden
                          ? "bg-warning/15 border-warning/30 text-warning"
                          : "bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-foreground border-white/5 hover:border-white/10"
                      }`}
                      title={c.is_hidden ? "Show comment" : "Hide comment from viewers"}
                    >
                      {c.is_hidden ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                    </button>

                    {/* Block User */}
                    <button
                      onClick={() => handleBlockUser(c.user_id, c.display_name)}
                      className="h-8 w-8 rounded-lg bg-destructive/10 hover:bg-destructive/20 border border-destructive/20 hover:border-destructive/30 text-destructive flex items-center justify-center transition-smooth"
                      title="Block user"
                    >
                      <UserX className="h-4 w-4" />
                    </button>

                    {/* Delete */}
                    <button
                      onClick={() => handleDelete(c.id)}
                      className="h-8 w-8 rounded-lg bg-white/5 hover:bg-destructive/15 border border-white/5 hover:border-destructive/30 text-muted-foreground hover:text-destructive flex items-center justify-center transition-smooth"
                      title="Delete comment permanently"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </>
  );
}

function timeAgo(iso: string): string {
  try {
    return formatDistanceToNow(new Date(iso), { addSuffix: true });
  } catch {
    return "";
  }
}
