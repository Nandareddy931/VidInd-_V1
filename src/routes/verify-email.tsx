import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AuthLayout } from "@/components/AuthLayout";
import { Button } from "@/components/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { useState, type FormEvent } from "react";

export const Route = createFileRoute("/verify-email")({
  head: () => ({ meta: [{ title: "Verify email — Vidind" }] }),
  component: VerifyPage,
});

function VerifyPage() {
  const navigate = useNavigate();
  const [otp, setOtp] = useState("");

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (otp.length === 6) navigate({ to: "/welcome" });
  };

  return (
    <AuthLayout
      title="Verify your email"
      subtitle="We sent a 6-digit code to your inbox"
    >
      <form onSubmit={onSubmit} className="space-y-6">
        <div className="flex justify-center">
          <InputOTP maxLength={6} value={otp} onChange={setOtp}>
            <InputOTPGroup>
              {Array.from({ length: 6 }).map((_, i) => (
                <InputOTPSlot key={i} index={i} className="h-12 w-11 text-lg glass border-glass-border" />
              ))}
            </InputOTPGroup>
          </InputOTP>
        </div>
        <Button type="submit" disabled={otp.length !== 6} className="w-full h-11 rounded-full bg-gradient-primary border-0 text-white font-semibold hover:opacity-90 glow-primary disabled:opacity-50">
          Verify & continue
        </Button>
        <p className="text-center text-xs text-muted-foreground">
          Didn't get a code? <button type="button" className="text-accent hover:underline">Resend</button>
        </p>
      </form>
    </AuthLayout>
  );
}
