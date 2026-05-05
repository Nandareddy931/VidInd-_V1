import { createFileRoute, Link } from "@tanstack/react-router";
import { AuthLayout } from "@/components/AuthLayout";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/welcome")({
  head: () => ({ meta: [{ title: "Welcome to Vidind" }] }),
  component: () => (
    <AuthLayout title="You're all set!" subtitle="Welcome to the Vidind community">
      <div className="flex flex-col items-center text-center">
        <div className="h-20 w-20 rounded-full bg-gradient-primary flex items-center justify-center glow-primary animate-pulse-glow">
          <CheckCircle2 className="h-10 w-10 text-white" />
        </div>
        <p className="mt-6 text-sm text-muted-foreground max-w-xs">
          Your account is ready. Start exploring trending creators or upload your first video.
        </p>
        <Button asChild className="mt-6 w-full h-11 rounded-full bg-gradient-primary border-0 text-white font-semibold hover:opacity-90 glow-primary">
          <Link to="/">Go to Vidind</Link>
        </Button>
      </div>
    </AuthLayout>
  ),
});
