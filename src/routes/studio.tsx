import { createFileRoute, redirect } from "@tanstack/react-router";
import { StudioLayout } from "@/components/StudioLayout";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/studio")({
  head: () => ({ meta: [{ title: "Pori Studio — Vidind" }] }),
  beforeLoad: async () => {
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      throw redirect({ to: "/login" });
    }
  },
  component: StudioLayout,
});
