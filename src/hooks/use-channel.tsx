import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export type Channel = {
  id: string;
  user_id: string;
  display_name: string | null;
  handle: string | null;
  description: string | null;
  avatar_url: string | null;
  banner_url: string | null;
  subscribers_count: number;
};

export function useChannel(userId?: string) {
  const [channel, setChannel] = useState<Channel | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!userId) {
      setChannel(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data } = await supabase
      .from("profiles")
      .select("id,user_id,display_name,handle,description,avatar_url,banner_url,subscribers_count")
      .eq("user_id", userId)
      .maybeSingle();
    setChannel((data as Channel) ?? null);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { channel, loading, refresh, setChannel };
}
