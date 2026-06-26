import { createClient } from "@supabase/supabase-js";

export const adsSupabase = createClient(
    import.meta.env.VITE_ADS_SUPABASE_URL,
    import.meta.env.VITE_ADS_SUPABASE_ANON_KEY
);