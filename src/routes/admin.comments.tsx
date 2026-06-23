import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Search, EyeOff, Eye, Trash2, MessageSquare } from "lucide-react";
import { toast } from "sonner";
export const Route = createFileRoute("/admin/comments")({
    component: AdminComments,
});

type AdminComment = {
    id: string;
    video_id: string;
    user_id: string;
    comment_text: string;
    likes_count?: number | null;
    is_hidden?: boolean | null;
    created_at: string;
};

function AdminComments() {
    const [comments, setComments] = useState<AdminComment[]>([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);

    async function loadComments() {
        setLoading(true);

        let query = supabase
            .from("comments")
            .select("*")
            .order("created_at", { ascending: false });

        if (search.trim()) {
            query = query.ilike("comment_text", `%${search}%`);
        }

        const { data, error } = await query;

        if (!error && data) {
            setComments(data as AdminComment[]);
        }

        setLoading(false);
    }

    async function toggleHide(comment: AdminComment) {
        const { error } = await supabase
            .from("comments")
            .update({ is_hidden: !comment.is_hidden } as any)
            .eq("id", comment.id);

        if (error) {
            toast.error("Failed to update comment");
            return;
        }

        toast.success(comment.is_hidden ? "Comment unhidden" : "Comment hidden");
        loadComments();
    }

    async function deleteComment(commentId: string) {
        const confirmDelete = window.confirm(
            "Are you sure you want to delete this comment?"
        );

        if (!confirmDelete) return;

        const { error } = await supabase
            .from("comments")
            .delete()
            .eq("id", commentId);

        if (error) {
            toast.error("Failed to delete comment");
            return;
        }

        toast.success("Comment deleted successfully");
        loadComments();
    }

    useEffect(() => {
        loadComments();
    }, []);

    return (
        <div>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-3xl font-bold">Comments Management</h1>
                    <p className="text-slate-400">
                        Review, hide, unhide, and delete platform comments.
                    </p>
                </div>

                <div className="relative w-full md:w-80">
                    <Search className="absolute left-3 top-3 text-slate-400" size={18} />
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") loadComments();
                        }}
                        placeholder="Search comments..."
                        className="w-full rounded-xl bg-white/5 border border-white/10 py-3 pl-10 pr-4 outline-none focus:border-purple-500"
                    />
                </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
                <div className="grid grid-cols-6 gap-4 px-5 py-4 text-sm text-slate-400 border-b border-white/10">
                    <div className="col-span-2">Comment</div>
                    <div>Likes</div>
                    <div>Status</div>
                    <div>Video ID</div>
                    <div>Actions</div>
                </div>

                {loading ? (
                    <div className="p-8 text-center text-slate-400">
                        Loading comments...
                    </div>
                ) : comments.length === 0 ? (
                    <div className="p-8 text-center text-slate-400">
                        No comments found.
                    </div>
                ) : (
                    comments.map((comment) => (
                        <div
                            key={comment.id}
                            className="grid grid-cols-6 gap-4 px-5 py-4 items-center border-b border-white/10 hover:bg-white/5"
                        >
                            <div className="col-span-2 flex items-start gap-3">
                                <div className="h-10 w-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                                    <MessageSquare className="text-purple-300" size={18} />
                                </div>

                                <div>
                                    <p className="font-medium line-clamp-2">
                                        {comment.comment_text || "Empty comment"}
                                    </p>
                                    <p className="text-xs text-slate-500">
                                        User: {comment.user_id}
                                    </p>
                                </div>
                            </div>

                            <div>{comment.likes_count || 0}</div>

                            <div>
                                {comment.is_hidden ? (
                                    <span className="rounded-full bg-red-500/20 text-red-400 px-3 py-1 text-sm">
                                        Hidden
                                    </span>
                                ) : (
                                    <span className="rounded-full bg-green-500/20 text-green-400 px-3 py-1 text-sm">
                                        Public
                                    </span>
                                )}
                            </div>

                            <div className="text-xs text-slate-400 truncate">
                                {comment.video_id}
                            </div>

                            <div className="flex gap-2">
                                <button
                                    onClick={() => toggleHide(comment)}
                                    className="rounded-xl bg-purple-500/20 text-purple-300 p-2 hover:bg-purple-500/30"
                                    title={comment.is_hidden ? "Unhide" : "Hide"}
                                >
                                    {comment.is_hidden ? <Eye size={17} /> : <EyeOff size={17} />}
                                </button>

                                <button
                                    onClick={() => deleteComment(comment.id)}
                                    className="rounded-xl bg-red-500/20 text-red-400 p-2 hover:bg-red-500/30"
                                    title="Delete"
                                >
                                    <Trash2 size={17} />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}