import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { BarChart3, CreditCard, ImageIcon, LayoutDashboard, Megaphone, Plus } from "lucide-react";
import { adsSupabase } from "@/integrations/supabase/adsClient";

export const Route = createFileRoute("/ads/")({ component: AdsPanel });

type Ad = {
    id: string;
    campaign_name: string;
    business_name: string;
    ad_type: string;
    media_url: string;
    target_state: string | null;
    target_language: string | null;
    target_category: string | null;
    budget: number;
    spent: number;
    status: string;
    created_at: string;
};

function AdsPanel() {
    const [ads, setAds] = useState<Ad[]>([]);

    useEffect(() => {
        adsSupabase
            .from("ad_campaigns")
            .select("*")
            .order("created_at", { ascending: false })
            .then(({ data, error }) => {
                if (error) return console.error(error);
                setAds((data || []) as Ad[]);
            });
    }, []);

    const totalSpend = ads.reduce((sum, ad) => sum + Number(ad.spent || 0), 0);

    return (
        <div className="min-h-screen bg-[#f7f8fc] text-slate-900">
            <div className="flex">
                <aside className="min-h-screen w-64 bg-[#071225] p-5 text-white">
                    <h1 className="text-2xl font-bold">VidInd Ads</h1>
                    <p className="text-sm text-slate-300">Advertiser Panel</p>

                    <nav className="mt-8 space-y-2 text-sm">
                        {[
                            [LayoutDashboard, "Dashboard"],
                            [Megaphone, "My Campaigns"],
                            [Plus, "Create Campaign"],
                            [BarChart3, "Reports & Analytics"],
                            [CreditCard, "Billing & Payments"],
                            [ImageIcon, "Ad Creatives"],
                        ].map(([Icon, text]: any, i) => (
                            <Link
                                key={text}
                                to={i === 2 ? "/ads/create" : "/ads"}
                                className={`flex items-center gap-3 rounded-xl px-4 py-3 ${i === 0 ? "bg-purple-600" : "hover:bg-white/10"}`}
                            >
                                <Icon size={18} /> {text}
                            </Link>
                        ))}
                    </nav>

                    <div className="mt-64 rounded-2xl bg-white/10 p-5 text-center">
                        <div className="text-3xl">👑</div>
                        <h3 className="mt-2 font-bold text-yellow-300">Advertise with VidInd</h3>
                        <p className="mt-2 text-xs text-slate-300">Reach engaged viewers across India.</p>
                    </div>
                </aside>

                <main className="flex-1 p-6">
                    <header className="flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-bold">Welcome back, Advertiser 👋</h2>
                            <p className="text-sm text-slate-500">Manage your ad campaigns and track performance</p>
                        </div>

                        <Link
                            to="/ads/create"
                        >
                            + Create New Ad Campaign
                        </Link>
                    </header>

                    <div className="mt-8 grid gap-5 md:grid-cols-4">
                        {[
                            ["Total Campaigns", ads.length],
                            ["Total Impressions", "0"],
                            ["Total Clicks", "0"],
                            ["Total Spend", `₹${totalSpend}`],
                        ].map(([title, value]) => (
                            <div key={title} className="rounded-2xl border bg-white p-5 shadow-sm">
                                <p className="text-sm text-slate-500">{title}</p>
                                <h3 className="mt-3 text-3xl font-bold">{value}</h3>
                            </div>
                        ))}
                    </div>

                    <section className="mt-6 grid gap-5 lg:grid-cols-[1fr_350px]">
                        <div className="rounded-2xl border bg-white p-5 shadow-sm">
                            <div className="mb-4 flex items-center justify-between">
                                <h3 className="text-lg font-bold">My Ad Campaigns</h3>
                                <select className="rounded-lg border px-3 py-2 text-sm">
                                    <option>All Status</option>
                                </select>
                            </div>

                            <div className="space-y-4">
                                {ads.length === 0 && <p className="text-sm text-slate-500">No ads yet. Create your first campaign.</p>}

                                {ads.map((ad) => (
                                    <div key={ad.id} className="flex gap-4 rounded-xl border p-3">
                                        <img src={ad.media_url} className="h-24 w-40 rounded-lg object-cover" />

                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-2">
                                                <h4 className="font-bold">{ad.campaign_name}</h4>
                                                <span className="rounded-md bg-purple-100 px-2 py-1 text-xs text-purple-700">{ad.ad_type}</span>
                                            </div>

                                            <p className="mt-1 text-xs text-slate-500">{ad.business_name}</p>
                                            <p className="mt-2 text-xs text-slate-500">
                                                {ad.target_state || "India"} • {ad.target_language || "All Languages"} • {ad.target_category || "All Categories"}
                                            </p>
                                        </div>

                                        <div className="text-right text-sm">
                                            <p className="font-bold">₹{ad.spent || 0}</p>
                                            <span className="mt-2 inline-block rounded-md bg-yellow-100 px-2 py-1 text-xs text-yellow-700">
                                                {ad.status}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <aside className="space-y-5">
                            <div className="rounded-2xl border bg-white p-5 shadow-sm">
                                <h3 className="font-bold">Performance Overview</h3>
                                <div className="mt-6 h-40 rounded-xl bg-purple-50 p-4 text-purple-600">Chart coming next</div>
                            </div>

                            <div className="rounded-2xl border bg-white p-5 shadow-sm">
                                <h3 className="font-bold">Account Balance</h3>
                                <h2 className="mt-4 text-3xl font-bold">₹0</h2>
                                <button className="mt-4 w-full rounded-xl bg-purple-600 p-3 font-semibold text-white">Add Funds</button>
                            </div>
                        </aside>
                    </section>
                </main>
            </div>
        </div>
    );
}