import { createFileRoute, Link } from "@tanstack/react-router";
import { AuthLayout } from "@/components/AuthLayout";
import { Button } from "@/components/ui/button";
import { Mail } from "lucide-react";
import { Field } from "./login";
import { useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({ meta: [{ title: "Forgot password — Vidind" }] }),
  component: ForgotPage,
});

function ForgotPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    setSent(true);
    toast.success("Reset link sent — check your inbox");
  };

  return (
    <AuthLayout
      title="Reset your password"
      subtitle={sent ? "We've sent a reset link to your email" : "We'll send a reset link to your email"}
      footer={<><Link to="/login" className="text-accent font-semibold hover:underline">← Back to login</Link></>}
    >
      <form className="space-y-4" onSubmit={onSubmit}>
        <Field id="email" label="Email" icon={<Mail className="h-4 w-4" />} type="email" placeholder="you@vidind.com" required value={email} onChange={(e) => setEmail(e.target.value)} />
        <Button type="submit" disabled={loading || sent} className="w-full h-11 rounded-full bg-gradient-primary border-0 text-white font-semibold hover:opacity-90 glow-primary">
          {loading ? "Sending…" : sent ? "Link sent" : "Send reset link"}
        </Button>
      </form>
    </AuthLayout>
  );
}
