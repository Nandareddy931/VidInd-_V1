import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Users, Video, MessageSquare, Eye, Flag } from "lucide-react";

export const Route = createFileRoute("/admin/")({
    component: AdminDashboard,
});

function AdminDashboard() {
    const [stats, setStats] = useState({
        users: 0,
        videos: 0,
        comments: 0,
        views: 0,
        reports: 0,
    });

    useEffect(() => {
        async function loadStats() {
            const [
                usersRes,
                videosRes,
                commentsRes,
                viewsRes,
                reportsRes,
            ] = await Promise.all([
                supabase.from("profiles").select("*", { count: "exact", head: true }),
                supabase.from("videos").select("*", { count: "exact", head: true }),
                supabase.from("comments").select("*", { count: "exact", head: true }),
                supabase.from("video_views").select("*", { count: "exact", head: true }),
                supabase.from("comments").select("*", { count: "exact", head: true }).eq("is_reported", true),
            ]);

            setStats({
                users: usersRes.count || 0,
                videos: videosRes.count || 0,
                comments: commentsRes.count || 0,
                views: viewsRes.count || 0,
                reports: reportsRes.count || 0,
            });
        }

        loadStats();
    }, []);

    const cards = [
        { title: "Total Users", value: stats.users, icon: Users },
        { title: "Total Videos", value: stats.videos, icon: Video },
        { title: "Total Comments", value: stats.comments, icon: MessageSquare },
        { title: "Total Views", value: stats.views, icon: Eye },
        { title: "Reports", value: stats.reports, icon: Flag },
    ];

    return (
        <div>
            <h1 className="text-3xl font-bold mb-2">Dashboard Overview</h1>
            <p className="text-slate-400 mb-8">
                Welcome back. Here is what is happening on VidInd.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-5">
                {cards.map((card) => {
                    const Icon = card.icon;

                    return (
                        <div
                            key={card.title}
                            className="rounded-2xl border border-white/10 bg-white/5 p-5"
                        >
                            <div className="h-12 w-12 rounded-full bg-purple-600 flex items-center justify-center mb-5">
                                <Icon />
                            </div>

                            <p className="text-slate-400 text-sm">{card.title}</p>
                            <h2 className="text-3xl font-bold mt-2">{card.value}</h2>
                        </div>
                    );
                })}
            </div>

            <div className="mt-8 grid grid-cols-1 xl:grid-cols-2 gap-6">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
                    <h2 className="text-xl font-bold mb-4">Platform Overview</h2>
                    <div className="h-72 flex items-center justify-center text-slate-500">
                        Chart coming next
                    </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
                    <h2 className="text-xl font-bold mb-4">System Status</h2>

                    {["Database", "Storage", "Authentication", "Admin Panel"].map(
                        (item) => (
                            <div
                                key={item}
                                className="flex justify-between border-b border-white/10 py-4"
                            >
                                <span>{item}</span>
                                <span className="text-green-400">Operational</span>
                            </div>
                        )
                    )}
                </div>
            </div>
        </div>
    );
}