import { videos, type Video } from "@/lib/mock-data";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Link } from "@tanstack/react-router";
import VerifiedBadge from "@/components/VerifiedBadge";

export function VideoCard({ video, index = 0 }: { video: Video; index?: number }) {
  return (
    <Link
      to="/watch/$videoId"
      params={{ videoId: video.id }}
      className="group block cursor-pointer animate-slide-up"
      style={{ animationDelay: `${Math.min(index * 60, 400)}ms` }}
    >
      <div className="relative overflow-hidden rounded-xl sm:rounded-2xl glass shadow-card hover-lift">
        <div className="aspect-video overflow-hidden bg-gradient-hero">
          {video.thumbnail ? (
            <img
              src={video.thumbnail}
              alt={video.title}
              loading="lazy"
              className="h-full w-full object-cover transition-smooth group-hover:scale-105"
              onError={(e) => {
                e.currentTarget.style.display = "none";
                const fallback = e.currentTarget.nextElementSibling as HTMLElement | null;
                if (fallback) fallback.style.display = "flex";
              }}
            />
          ) : null}
          <div
            className="h-full w-full flex items-center justify-center text-white/80 text-4xl font-extrabold"
            style={{ display: video.thumbnail ? "none" : "flex" }}
          >
            {video.channelInitial}
          </div>
        </div>
        {/* duration */}
        {video.duration && (
          <span className="absolute bottom-2 right-2 rounded-md bg-black/70 px-1.5 py-0.5 text-xs font-medium text-white backdrop-blur">
            {video.duration}
          </span>
        )}
        {video.badge && (
          <Badge
            className={`absolute top-2 left-2 border-0 backdrop-blur ${video.badge === "Trending"
              ? "bg-gradient-primary text-white glow-primary"
              : video.badge === "Live"
                ? "bg-destructive text-white"
                : "bg-accent text-accent-foreground"
              }`}
          >
            {video.badge}
          </Badge>
        )}
      </div>

      <div className="mt-2 sm:mt-3 flex gap-2 sm:gap-3">
        <Avatar className="h-8 w-8 sm:h-9 sm:w-9 ring-1 ring-primary/40">
          {video.channelAvatar ? (
            <AvatarImage src={video.channelAvatar} alt={video.channel} />
          ) : null}

          <AvatarFallback className="bg-gradient-primary text-white text-sm font-semibold">
            {video.channelInitial}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <h3 className="line-clamp-2 text-xs sm:text-sm font-semibold leading-snug text-foreground group-hover:text-accent transition-smooth">
            {video.title}
          </h3>
          <p className="mt-0.5 sm:mt-1 text-[11px] sm:text-xs text-muted-foreground flex items-center gap-1">
            <span className="truncate">{video.channel}</span>
            {video.isVerified && <VerifiedBadge />}
          </p>
          <p className="text-[11px] sm:text-xs text-muted-foreground">
            {video.views ?? 0} views • {video.time}
          </p>
        </div>
      </div>
    </Link>
  );
}

export function VideoCardSkeleton() {
  return (
    <div className="space-y-3">
      <div className="aspect-video rounded-2xl skeleton" />
      <div className="flex gap-3">
        <div className="h-9 w-9 rounded-full skeleton" />
        <div className="flex-1 space-y-2">
          <div className="h-3 rounded skeleton w-3/4" />
          <div className="h-3 rounded skeleton w-1/2" />
        </div>
      </div>
    </div>
  );
}
