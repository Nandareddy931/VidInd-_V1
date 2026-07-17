import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { adsSupabase } from "@/integrations/supabase/adsClient";

export const Route = createFileRoute("/admin/ads")({ component: AdminAds });

type Ad = {
    id: string;
    campaign_name: string;
    business_name: string;
    ad_type: string;
    media_url: string;
    budget: number;
    status: string;
    admin_note: string | null;
    placement_type: string | null;
    placement_category: string | null;
    placement_video_id: string | null;
    priority: string | null;
};

function AdminAds() {
    const [ads, setAds] = useState<Ad[]>([]);

    const loadAds = () =>
        adsSupabase
            .from("ad_campaigns")
            .select("*")
            .order("created_at", { ascending: false })
            .then(({ data, error }) => {
                if (error) console.error(error);
                else setAds((data || []) as Ad[]);
            });

    useEffect(() => {
        loadAds();
    }, []);

    const setStatus = async (id: string, status: string) => {

        const { error } = await adsSupabase
            .from("ad_campaigns")
            .update({ status })
            .eq("id", id);

        if (error) return alert(error.message);
        loadAds();
    };
    const updatePlacement = async (id: string, field: string, value: string) => {
        const { error } = await adsSupabase
            .from("ad_campaigns")
            .update({ [field]: value })
            .eq("id", id);

        if (error) return alert(error.message);
        loadAds();
    };

    return (
        <div className="min-h-screen bg-[#0b111d] p-6 text-white">
            <h1 className="text-2xl font-bold">Ads Approval</h1>
            <p className="text-sm text-slate-400">Approve, reject, pause advertiser ads.</p>

            <div className="mt-6 space-y-4">
                {ads.map((ad) => (
                    <div key={ad.id} className="rounded-2xl bg-white/5 p-4">
                        <div className="flex gap-4">
                            <img
                                src={ad.media_url}
                                className="h-24 w-40 rounded-xl object-cover"
                            />

                            <div className="flex-1">
                                <h2 className="font-bold">{ad.campaign_name}</h2>
                                <p className="text-sm text-slate-400">{ad.business_name}</p>
                                <p className="mt-2 text-sm">
                                    Type: {ad.ad_type} • Budget: ₹{ad.budget}
                                </p>
                                <p className="mt-1 text-sm text-yellow-300">
                                    Status: {ad.status}
                                </p>
                            </div>

                            <div className="flex flex-col gap-2">
                                <button
                                    onClick={() => setStatus(ad.id, "active")}
                                    className="rounded-lg bg-green-600 px-4 py-2 text-sm"
                                >
                                    Approve
                                </button>

                                <button
                                    onClick={() => setStatus(ad.id, "rejected")}
                                    className="rounded-lg bg-red-600 px-4 py-2 text-sm"
                                >
                                    Reject
                                </button>

                                <button
                                    onClick={() => setStatus(ad.id, "paused")}
                                    className="rounded-lg bg-slate-600 px-4 py-2 text-sm"
                                >
                                    Pause
                                </button>
                            </div>
                        </div>

                        <div className="mt-4 grid gap-3 md:grid-cols-3">
                            <div>
                                <label className="text-xs text-slate-400">Placement</label>
                                <select
                                    value={ad.placement_type || "all_videos"}
                                    onChange={(e) =>
                                        updatePlacement(ad.id, "placement_type", e.target.value)
                                    }
                                    className="mt-1 w-full rounded-lg bg-[#0b111d] p-2 text-sm text-white"
                                >
                                    <option value="all_videos">All Videos</option>
                                    <option value="category">Category</option>
                                    <option value="specific_video">Specific Video</option>
                                </select>
                            </div>

                            <div>
                                <label className="text-xs text-slate-400">Category</label>
                                <input
                                    value={ad.placement_category || ""}
                                    onChange={(e) =>
                                        updatePlacement(ad.id, "placement_category", e.target.value)
                                    }
                                    placeholder="Gaming / Education / Comedy"
                                    className="mt-1 w-full rounded-lg bg-[#0b111d] p-2 text-sm text-white"
                                />
                            </div>

                            <div>
                                <label className="text-xs text-slate-400">Priority</label>
                                <select
                                    value={ad.priority || "medium"}
                                    onChange={(e) =>
                                        updatePlacement(ad.id, "priority", e.target.value)
                                    }
                                    className="mt-1 w-full rounded-lg bg-[#0b111d] p-2 text-sm text-white"
                                >
                                    <option value="low">Low</option>
                                    <option value="medium">Medium</option>
                                    <option value="high">High</option>
                                </select>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}