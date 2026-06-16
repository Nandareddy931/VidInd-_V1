import { supabase } from "@/integrations/supabase/client";

export async function toggleSubscribe(creatorId: string) {
    const { data, error } = await supabase.rpc("toggle_subscribe", {
        creator_id_input: creatorId,
    });

    if (error) throw error;

    return data as {
        subscribed: boolean;
        subscribers_count: number;
    };
}

export async function checkSubscribed(userId: string, creatorId: string) {
    const { data, error } = await supabase
        .from("subscriptions")
        .select("id")
        .eq("subscriber_id", userId)
        .eq("creator_id", creatorId)
        .maybeSingle();

    if (error) throw error;

    return !!data;
}