import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { adsSupabase } from "../integrations/supabase/adsClient";
import { DateRange } from "hls.js";

export const Route = createFileRoute("/ads/create")({ component: AdsCreate });

function AdsCreate() {
    const [loading, setLoading] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [form, setForm] = useState({
        business_name: "",
        campaign_name: "",
        ad_title: "",
        ad_description: "",
        ad_type: "pre_roll",
        target_state: "",
        target_language: "",
        target_category: "",
        budget: "",
    });

    const change = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
        setForm({ ...form, [e.target.name]: e.target.value });

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file) return alert("Upload ad media");

        setLoading(true);
        try {
            const path = `${Date.now()}-${file.name}`;
            const { error: upErr } = await adsSupabase.storage.from("ad-creatives").upload(path, file);
            if (upErr) throw upErr;

            const { data: url } = adsSupabase.storage.from("ad-creatives").getPublicUrl(path);

            const { data: campaign, error: cErr } = await adsSupabase
                .from("ad_campaigns")
                .insert({
                    ...form,
                    budget: Number(form.budget),
                    media_url: url.publicUrl,
                    status: "pending_review",
                })
                .select("id")
                .single();

            if (cErr) throw cErr;

            const { error: crErr } = await adsSupabase.from("ad_creatives").insert({
                campaign_id: campaign.id,
                media_url: url.publicUrl,
                media_type: file.type,
            });

            if (crErr) throw crErr;

            alert("Ad submitted for admin review");
        } catch (err: any) {
            console.error("Ad submit error:", err);
            alert(err?.message || JSON.stringify(err) || "Failed to submit ad");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0b111d] p-6 text-white">
            <form onSubmit={submit} className="mx-auto max-w-2xl space-y-4 rounded-2xl bg-white/5 p-6">
                <h1 className="text-2xl font-bold">Create VidInd Ad</h1>

                <input name="business_name" onChange={change} placeholder="Business name" required className="w-full rounded-xl p-3 text-black" />
                <input name="campaign_name" onChange={change} placeholder="Campaign name" required className="w-full rounded-xl p-3 text-black" />
                <input name="ad_title" onChange={change} placeholder="Ad title" required className="w-full rounded-xl p-3 text-black" />
                <textarea name="ad_description" onChange={change} placeholder="Ad description" className="w-full rounded-xl p-3 text-black" />

                <select name="ad_type" onChange={change} className="w-full rounded-xl p-3 text-black">
                    <option value="pre_roll">Pre-roll</option>
                    <option value="mid_roll">Mid-roll</option>
                    <option value="banner">Banner</option>
                </select>

                <input type="file" accept="video/*,image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} required />

                <input name="target_state" onChange={change} placeholder="Target state" className="w-full rounded-xl p-3 text-black" />
                <input name="target_language" onChange={change} placeholder="Target language" className="w-full rounded-xl p-3 text-black" />
                <input name="target_category" onChange={change} placeholder="Target category" className="w-full rounded-xl p-3 text-black" />
                <input name="budget" type="number" onChange={change} placeholder="Budget ₹" required className="w-full rounded-xl p-3 text-black" />

                <button disabled={loading} className="w-full rounded-xl bg-purple-600 p-3 font-bold disabled:opacity-60">
                    {loading ? "Submitting..." : "Submit for Review"}
                </button>
            </form>
        </div>
    );
}