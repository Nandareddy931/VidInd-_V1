import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Bell, BellRing, Check } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface SubscribeButtonProps {
  creatorId: string;
  initialSubscribed?: boolean;
  onCountChange?: (delta: number) => void;
  size?: "sm" | "default" | "lg";
  className?: string;
}

export function SubscribeButton({
  creatorId,
  initialSubscribed = false,
  onCountChange,
  size = "default",
  className,
}: SubscribeButtonProps) {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [subscribed, setSubscribed] = useState(initialSubscribed);
  const [notify, setNotify] = useState(false);
  const [pending, setPending] = useState(false);

  // Sync subscription status whenever the viewer or creator changes
  useEffect(() => {
    let active = true;
    (async () => {
      if (!user || !creatorId) {
        setSubscribed(false);
        return;
      }
      const { data } = await supabase
        .from("subscriptions")
        .select("id")
        .eq("creator_id", creatorId)
        .eq("subscriber_id", user.id)
        .maybeSingle();
      if (active) setSubscribed(!!data);
    })();
    return () => {
      active = false;
    };
  }, [user, creatorId]);

  const isSelf = user?.id === creatorId;

  const handleClick = async () => {
    if (!isAuthenticated || !user) {
      toast.error("Sign in to subscribe");
      navigate({ to: "/login" });
      return;
    }

    if (isSelf) {
      toast.error("You can't subscribe to yourself");
      return;
    }

    if (pending) return;

    const oldSubscribed = subscribed;
    setPending(true);

    try {
      const { data, error } = await supabase.rpc("toggle_subscribe", {
        creator_id_input: creatorId,
      });

      if (error) throw error;

      const result = data as {
        subscribed: boolean;
        subscribers_count: number;
      };

      setSubscribed(result.subscribed);

      if (result.subscribed !== oldSubscribed) {
        onCountChange?.(result.subscribed ? 1 : -1);
      }

      if (result.subscribed) {
        toast.success("Subscribed", {
          description: "You'll see new videos in your feed.",
        });
      } else {
        setNotify(false);
        toast.success("Unsubscribed");
      }
    } catch (error: any) {
      setSubscribed(oldSubscribed);
      toast.error(error.message || "Subscribe failed");
    } finally {
      setPending(false);
    }
  };

  return (
    <div className={cn("inline-flex items-center gap-2", className)}>
      <Button
        onClick={handleClick}
        size={size}
        className={cn(
          "rounded-full font-semibold transition-all duration-200",
          subscribed
            ? "bg-secondary text-foreground hover:bg-secondary/80 border border-glass-border"
            : "bg-gradient-primary text-white border-0 hover:opacity-90 glow-primary",
        )}
      >
        {subscribed ? (
          <>
            <Check className="h-4 w-4" /> Subscribed
          </>
        ) : (
          "Subscribe"
        )}
      </Button>
      {subscribed && (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setNotify((n) => !n)}
          className="rounded-full glass h-9 w-9"
          aria-label="Toggle notifications"
        >
          {notify ? (
            <BellRing className="h-4 w-4 text-primary" />
          ) : (
            <Bell className="h-4 w-4" />
          )}
        </Button>
      )}
    </div>
  );
}
