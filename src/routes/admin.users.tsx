import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Search, Ban, CheckCircle, BadgeCheck } from "lucide-react";
import { toast } from "sonner";
const PAGE_SIZE = 10;
export const Route = createFileRoute("/admin/users")({
    component: AdminUsers,
});

type UserProfile = {
    id: string;
    user_id: string;
    display_name: string | null;
    handle: string | null;
    avatar_url: string | null;
    role?: string | null;
    is_banned?: boolean | null;
    created_at: string;
    is_verified?: boolean | null;
};

function AdminUsers() {
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(false);

    async function loadUsers(nextPage = page) {
        setLoading(true);

        const from = nextPage * PAGE_SIZE;
        const to = from + PAGE_SIZE - 1;

        let query = supabase
            .from("profiles")
            .select("*", { count: "exact" })
            .order("created_at", { ascending: false })
            .range(from, to);

        if (search.trim()) {
            query = query.or(
                `display_name.ilike.%${search}%,handle.ilike.%${search}%`
            );
        }

        const { data, error, count } = await query;

        if (!error && data) {
            setUsers(data as UserProfile[]);
            setHasMore(count ? to + 1 < count : false);
        }

        setLoading(false);
    }

    async function toggleBan(user: UserProfile) {
        const { error } = await supabase
            .from("profiles")
            .update({ is_banned: !user.is_banned } as any)
            .eq("id", user.id);

        if (error) {
            toast.error("Failed to update user");
            return;
        }

        toast.success(user.is_banned ? "User unbanned" : "User banned");
        loadUsers();
    }
    async function toggleVerified(user: UserProfile) {
        const { error } = await supabase
            .from("profiles")
            .update({ is_verified: !user.is_verified } as any)
            .eq("id", user.id);

        if (error) {
            toast.error("Failed to update verification");
            return;
        }

        toast.success(user.is_verified ? "Verification removed" : "Creator verified");
        loadUsers();
    }

    useEffect(() => {
        loadUsers();
    }, []);

    return (
        <div>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-3xl font-bold">Users Management</h1>
                    <p className="text-slate-400">
                        Manage VidInd users, creators, and banned accounts.
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
                                loadUsers(0);
                            }
                        }}
                        placeholder="Search users..."
                        className="w-full rounded-xl bg-white/5 border border-white/10 py-3 pl-10 pr-4 outline-none focus:border-purple-500"
                    />
                </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
                <div className="grid grid-cols-5 gap-4 px-5 py-4 text-sm text-slate-400 border-b border-white/10">
                    <div>User</div>
                    <div>Handle</div>
                    <div>Role</div>
                    <div>Status</div>
                    <div>Action</div>
                </div>

                {loading ? (
                    <div className="p-8 text-center text-slate-400">Loading users...</div>
                ) : users.length === 0 ? (
                    <div className="p-8 text-center text-slate-400">No users found.</div>
                ) : (
                    users.map((user) => (
                        <div
                            key={user.id}
                            className="grid grid-cols-5 gap-4 px-5 py-4 items-center border-b border-white/10 hover:bg-white/5"
                        >
                            <div className="flex items-center gap-3">
                                <img
                                    src={
                                        user.avatar_url ||
                                        "https://api.dicebear.com/7.x/initials/svg?seed=User"
                                    }
                                    className="h-10 w-10 rounded-full object-cover"
                                />
                                <div>
                                    <p className="font-medium">
                                        {user.display_name || "Unnamed User"}
                                    </p>
                                    <p className="text-xs text-slate-500">{user.user_id}</p>
                                </div>
                            </div>

                            <div className="text-slate-300">
                                @{user.handle || "no-handle"}
                            </div>

                            <div>
                                <span className="rounded-full bg-purple-500/20 text-purple-300 px-3 py-1 text-sm">
                                    {user.role || "user"}
                                </span>
                            </div>

                            <div>
                                {user.is_banned ? (
                                    <span className="rounded-full bg-red-500/20 text-red-400 px-3 py-1 text-sm">
                                        Banned
                                    </span>
                                ) : (
                                    <span className="rounded-full bg-green-500/20 text-green-400 px-3 py-1 text-sm">
                                        Active
                                    </span>
                                )}
                            </div>

                            <div className="flex flex-col gap-2">
                                <button
                                    onClick={() => toggleVerified(user)}
                                    className={`flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm ${user.is_verified
                                        ? "bg-blue-500/20 text-blue-400"
                                        : "bg-white/5 text-slate-300"
                                        }`}
                                >
                                    <BadgeCheck size={16} />
                                    {user.is_verified ? "Verified" : "Verify"}
                                </button>

                                <button
                                    onClick={() => toggleBan(user)}
                                    className={`flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm ${user.is_banned
                                        ? "bg-green-500/20 text-green-400"
                                        : "bg-red-500/20 text-red-400"
                                        }`}
                                >
                                    {user.is_banned ? (
                                        <>
                                            <CheckCircle size={16} />
                                            Unban
                                        </>
                                    ) : (
                                        <>
                                            <Ban size={16} />
                                            Ban
                                        </>
                                    )}
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
                            loadUsers(newPage);
                        }}
                        className="rounded-xl bg-white/5 px-4 py-2 hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        Previous
                    </button>

                    <span className="font-medium">Page {page + 1}</span>

                    <button
                        disabled={!hasMore}
                        onClick={() => {
                            const newPage = page + 1;
                            setPage(newPage);
                            loadUsers(newPage);
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