import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Search, EyeOff, Eye, Trash2, Video } from "lucide-react";
import { toast } from "sonner";
export const Route = createFileRoute("/admin/videos")({
    component: AdminVideos,
});
const PAGE_SIZE = 10;


type AdminVideo = {
    id: string;
    title: string | null;
    description: string | null;
    thumbnail_url: string | null;
    video_url: string | null;
    user_id: string;
    views_count?: number | null;
    likes_count?: number | null;
    comments_count?: number | null;
    is_hidden?: boolean | null;
    created_at: string;
};

function AdminVideos() {
    const [videos, setVideos] = useState<AdminVideo[]>([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(false);
    async function loadVideos(nextPage = page) {
        setLoading(true);

        const from = nextPage * PAGE_SIZE;
        const to = from + PAGE_SIZE - 1;

        let query = supabase
            .from("videos")
            .select("*", { count: "exact" })
            .order("created_at", { ascending: false })
            .range(from, to);

        if (search.trim()) {
            query = query.ilike("title", `%${search}%`);
        }

        const { data, error, count } = await query;

        if (!error && data) {
            setVideos(data as AdminVideo[]);
            setHasMore(count ? to + 1 < count : false);
        }

        setLoading(false);
    }

    async function toggleHide(video: AdminVideo) {
        const { error } = await supabase
            .from("videos")
            .update({ is_hidden: !video.is_hidden } as any)
            .eq("id", video.id);

        if (error) {
            toast.error("Failed to update video");
            return;
        }

        toast.success(video.is_hidden ? "Video unhidden" : "Video hidden");
        loadVideos();
    }

    async function deleteVideo(videoId: string) {
        const confirmDelete = window.confirm(
            "Are you sure you want to delete this video?"
        );

        if (!confirmDelete) return;

        const { error } = await supabase.from("videos").delete().eq("id", videoId);

        if (error) {
            toast.error("Failed to delete video");
            return;
        }

        toast.success("Video deleted successfully");
        loadVideos();
    }

    useEffect(() => {
        loadVideos();
    }, []);

    return (
        <div>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-3xl font-bold">Videos Management</h1>
                    <p className="text-slate-400">
                        Review, hide, unhide, and delete platform videos.
                    </p>
                </div>

                <div className="relative w-full md:w-80">
                    <Search className="absolute left-3 top-3 text-slate-400" size={18} />
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") {
                                setPage(0);
                                loadVideos(0);
                            }
                        }}
                        placeholder="Search videos..."
                        className="w-full rounded-xl bg-white/5 border border-white/10 py-3 pl-10 pr-4 outline-none focus:border-purple-500"
                    />
                </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
                <div className="grid grid-cols-6 gap-4 px-5 py-4 text-sm text-slate-400 border-b border-white/10">
                    <div className="col-span-2">Video</div>
                    <div>Views</div>
                    <div>Likes</div>
                    <div>Status</div>
                    <div>Actions</div>
                </div>

                {loading ? (
                    <div className="p-8 text-center text-slate-400">
                        Loading videos...
                    </div>
                ) : videos.length === 0 ? (
                    <div className="p-8 text-center text-slate-400">No videos found.</div>
                ) : (
                    videos.map((video) => (
                        <div
                            key={video.id}
                            className="grid grid-cols-6 gap-4 px-5 py-4 items-center border-b border-white/10 hover:bg-white/5"
                        >
                            <div className="col-span-2 flex items-center gap-3">
                                <div className="h-16 w-28 rounded-xl bg-black/40 overflow-hidden flex items-center justify-center">
                                    {video.thumbnail_url ? (
                                        <img
                                            src={video.thumbnail_url}
                                            className="h-full w-full object-cover"
                                        />
                                    ) : (
                                        <Video className="text-slate-500" />
                                    )}
                                </div>

                                <div>
                                    <p className="font-medium line-clamp-1">
                                        {video.title || "Untitled Video"}
                                    </p>
                                    <p className="text-xs text-slate-500 line-clamp-1">
                                        {video.description || "No description"}
                                    </p>
                                </div>
                            </div>

                            <div>{video.views_count || 0}</div>
                            <div>{video.likes_count || 0}</div>

                            <div>
                                {video.is_hidden ? (
                                    <span className="rounded-full bg-red-500/20 text-red-400 px-3 py-1 text-sm">
                                        Hidden
                                    </span>
                                ) : (
                                    <span className="rounded-full bg-green-500/20 text-green-400 px-3 py-1 text-sm">
                                        Public
                                    </span>
                                )}
                            </div>

                            <div className="flex gap-2">
                                <button
                                    onClick={() => toggleHide(video)}
                                    className="rounded-xl bg-purple-500/20 text-purple-300 p-2 hover:bg-purple-500/30"
                                    title={video.is_hidden ? "Unhide" : "Hide"}
                                >
                                    {video.is_hidden ? <Eye size={17} /> : <EyeOff size={17} />}
                                </button>

                                <button
                                    onClick={() => deleteVideo(video.id)}
                                    className="rounded-xl bg-red-500/20 text-red-400 p-2 hover:bg-red-500/30"
                                    title="Delete"
                                >
                                    <Trash2 size={17} />
                                </button>
                            </div>
                        </div>
                    ))
                )}
                <div className="flex items-center justify-between border-t border-white/10 px-5 py-4 text-sm text-slate-400">
                    <button
                        disabled={page === 0}
                        onClick={() => {
                            const newPage = page - 1;
                            setPage(newPage);
                            loadVideos(newPage);
                        }}
                        className="rounded-xl bg-white/5 px-4 py-2 hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        Previous
                    </button>

                    <span className="font-medium">
                        Page {page + 1}
                    </span>

                    <button
                        disabled={!hasMore}
                        onClick={() => {
                            const newPage = page + 1;
                            setPage(newPage);
                            loadVideos(newPage);
                        }}
                        className="rounded-xl bg-white/5 px-4 py-2 hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        Next
                    </button>
                </div>
            </div>
        </div>
    );
}