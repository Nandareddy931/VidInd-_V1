import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { BarChart3, Users, Video, Eye, Heart, MessageSquare } from "lucide-react";

export const Route = createFileRoute("/admin/analytics")({
    component: AdminAnalytics,
});

function AdminAnalytics() {
    const [stats, setStats] = useState({
        users: 0,
        videos: 0,
        views: 0,
        likes: 0,
        comments: 0,
        subscriptions: 0,
    });

    useEffect(() => {
        async function loadAnalytics() {
            const [users, videos, views, likes, comments, subscriptions] =
                await Promise.all([
                    supabase.from("profiles").select("*", { count: "exact", head: true }),
                    supabase.from("videos").select("*", { count: "exact", head: true }),
                    supabase.from("video_views").select("*", { count: "exact", head: true }),
                    supabase.from("likes").select("*", { count: "exact", head: true }),
                    supabase.from("comments").select("*", { count: "exact", head: true }),
                    supabase.from("subscriptions").select("*", { count: "exact", head: true }),
                ]);

            setStats({
                users: users.count || 0,
                videos: videos.count || 0,
                views: views.count || 0,
                likes: likes.count || 0,
                comments: comments.count || 0,
                subscriptions: subscriptions.count || 0,
            });
        }

        loadAnalytics();
    }, []);

    const cards = [
        { label: "Users", value: stats.users, icon: Users },
        { label: "Videos", value: stats.videos, icon: Video },
        { label: "Views", value: stats.views, icon: Eye },
        { label: "Likes", value: stats.likes, icon: Heart },
        { label: "Comments", value: stats.comments, icon: MessageSquare },
        { label: "Subscriptions", value: stats.subscriptions, icon: BarChart3 },
    ];

    return (
        <div>
            <h1 className="text-3xl font-bold mb-2">Platform Analytics</h1>
            <p className="text-slate-400 mb-8">
                Track VidInd growth, engagement, and creator activity.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {cards.map((card) => {
                    const Icon = card.icon;

                    return (
                        <div
                            key={card.label}
                            className="rounded-2xl border border-white/10 bg-white/5 p-6"
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-slate-400 text-sm">{card.label}</p>
                                    <h2 className="text-4xl font-bold mt-2">{card.value}</h2>
                                </div>

                                <div className="h-14 w-14 rounded-2xl bg-purple-600 flex items-center justify-center">
                                    <Icon />
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-6">
                <h2 className="text-xl font-bold mb-4">Growth Chart</h2>

                <div className="h-72 flex items-center justify-center text-slate-500 border border-dashed border-white/10 rounded-xl">
                    Advanced chart will be added later
                </div>
            </div>
        </div>
    );
}