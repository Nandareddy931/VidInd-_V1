import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AuthLayout } from "@/components/AuthLayout";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Mail, Lock, User } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Field } from "./login";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/signup")({
  head: () => ({ meta: [{ title: "Sign up — Vidind" }] }),
  component: SignupPage,
});

function SignupPage() {
  const navigate = useNavigate();
  const [agree, setAgree] = useState(false);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!agree) return;
    if (password.length < 8) return toast.error("Password must be at least 8 characters");
    if (password !== confirm) return toast.error("Passwords do not match");

    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: { display_name: name },
      },
    });
    setLoading(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    // If email confirmation is OFF, session is returned and the user is signed in.
    if (data.session) {
      toast.success("Account created — you're in!");
      navigate({ to: "/" });
    } else {
      toast.success("Check your email to verify your account");
      navigate({ to: "/verify-email" });
    }
  };

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Join the next-gen video community"
      footer={<>Already a member? <Link to="/login" className="text-accent font-semibold hover:underline">Sign in</Link></>}
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <Field id="name" label="Full name" icon={<User className="h-4 w-4" />} placeholder="Jane Doe" required value={name} onChange={(e) => setName(e.target.value)} />
        <Field id="email" label="Email" icon={<Mail className="h-4 w-4" />} type="email" placeholder="you@vidind.com" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
        <Field id="password" label="Password" icon={<Lock className="h-4 w-4" />} type="password" placeholder="••••••••" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" />
        <Field id="confirm" label="Confirm password" icon={<Lock className="h-4 w-4" />} type="password" placeholder="••••••••" required minLength={8} value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" />

        <label className="flex items-start gap-2 text-xs text-muted-foreground cursor-pointer">
          <Checkbox checked={agree} onCheckedChange={(v) => setAgree(Boolean(v))} className="mt-0.5" />
          <span>
            I agree to the <a className="text-accent hover:underline">Terms of Service</a> and{" "}
            <a className="text-accent hover:underline">Privacy Policy</a>.
          </span>
        </label>

        <Button type="submit" disabled={!agree || loading} className="w-full h-11 rounded-full bg-gradient-primary border-0 text-white font-semibold hover:opacity-90 glow-primary disabled:opacity-50">
          {loading ? "Creating…" : "Create account"}
        </Button>
      </form>
    </AuthLayout>
  );
}
