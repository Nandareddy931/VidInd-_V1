import { Link } from "@tanstack/react-router";
import { Play } from "lucide-react";

export function Logo({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const dims = size === "sm" ? "h-8 w-8" : size === "lg" ? "h-12 w-12" : "h-9 w-9";
  const text = size === "sm" ? "text-lg" : size === "lg" ? "text-3xl" : "text-xl";
  return (
    <Link to="/" className="flex items-center gap-2 group">
      <span className={`relative ${dims} rounded-xl bg-gradient-primary flex items-center justify-center glow-primary transition-smooth group-hover:scale-105`}>
        <Play className="h-1/2 w-1/2 fill-white text-white" />
      </span>
      <span className={`font-extrabold tracking-tight ${text} gradient-text`}>Vidind</span>
    </Link>
  );
}
