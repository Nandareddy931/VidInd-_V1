import { useEffect, useRef } from "react";
import videojs from "video.js";
import type Player from "video.js/dist/types/player";
import "video.js/dist/video-js.css";

type Props = {
  src: string;
  poster?: string;
  type?: string;
  onReady?: (player: Player) => void;
  /** Called periodically with (watchedSeconds, durationSeconds). */
  onWatchProgress?: (watched: number, duration: number) => void;
};

/**
 * Reusable video.js player. Renders a 16:9 video element with custom neon
 * styling applied via the `vjs-vidind` skin in styles.css.
 */
export function VideoPlayer({ src, poster, type, onReady, onWatchProgress }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const playerRef = useRef<Player | null>(null);
  const watchedRef = useRef(0);
  const lastTickRef = useRef<number | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Build the <video> element each mount — video.js mutates/destroys it.
    const videoEl = document.createElement("video-js");
    videoEl.classList.add(
      "vjs-vidind",
      "vjs-big-play-centered",
      "vjs-fluid",
    );
    containerRef.current.appendChild(videoEl);

    const player = videojs(
      videoEl,
      {
        controls: true,
        responsive: true,
        fluid: true,
        playsinline: true,
        preload: "metadata",
        poster,
        sources: src ? [{ src, type: type ?? guessType(src) }] : [],
      },
      () => onReady?.(player),
    );
    playerRef.current = player;

    // Accurate watch-time tracking: accumulate elapsed wall-clock between
    // timeupdates while playing. Resilient to seeking.
    const onPlay = () => {
      lastTickRef.current = Date.now();
    };
    const onPauseOrEnd = () => {
      lastTickRef.current = null;
      onWatchProgress?.(watchedRef.current, player.duration() || 0);
    };
    const onTimeUpdate = () => {
      if (lastTickRef.current == null || player.paused()) return;
      const now = Date.now();
      const delta = (now - lastTickRef.current) / 1000;
      lastTickRef.current = now;
      // Cap delta to avoid huge jumps on tab refocus
      if (delta > 0 && delta < 2) watchedRef.current += delta;
      onWatchProgress?.(watchedRef.current, player.duration() || 0);
    };
    player.on("play", onPlay);
    player.on("pause", onPauseOrEnd);
    player.on("ended", onPauseOrEnd);
    player.on("timeupdate", onTimeUpdate);

    return () => {
      if (playerRef.current && !playerRef.current.isDisposed()) {
        playerRef.current.dispose();
      }
      playerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src, poster, type]);

  return (
    <div
      data-vjs-player
      ref={containerRef}
      className="relative w-full overflow-hidden rounded-2xl bg-black shadow-elevated"
    />
  );
}

function guessType(url: string): string {
  if (url.endsWith(".m3u8")) return "application/x-mpegURL";
  if (url.endsWith(".webm")) return "video/webm";
  return "video/mp4";
}
