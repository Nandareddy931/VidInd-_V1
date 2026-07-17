import { adsSupabase } from "@/integrations/supabase/adsClient";

export async function getAdForVideo(category?: string | null) {
    let query = adsSupabase
        .from("ad_campaigns")
        .select("*")
        .eq("status", "active")
        .order("priority", { ascending: false })
        .limit(1);

    if (category) {
        query = query.or(
            `placement_type.eq.all_videos,and(placement_type.eq.category,placement_category.eq.${category})`
        );
    } else {
        query = query.eq("placement_type", "all_videos");
    }

    const { data, error } = await query.maybeSingle();

    if (error) {
        console.error("Ad delivery error:", error);
        return null;
    }

    return data;
}