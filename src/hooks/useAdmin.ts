import { supabase } from "@/integrations/supabase/client";

export async function checkAdmin() {
    const { data: sessionData } = await supabase.auth.getSession();
    const user = sessionData.session?.user;

    if (!user) return false;

    const { data, error } = await supabase
        .from("profiles")
        .select("role")
        .eq("user_id", user.id)
        .single();

    if (error) return false;

    return (data as { role?: string }).role === "admin";
}