import { useEffect, useRef, useState } from "react";
import Hls from "hls.js";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Settings,
  Maximize,
} from "lucide-react";

type Props = {
  src: string;
  poster?: string;
  type?: string;
  title?: string;
  onWatchProgress?: (watched: number, duration: number) => void;
};

export function VideoPlayer({ src, poster, title, onWatchProgress }: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const hlsRef = useRef<Hls | null>(null);
  const watchedRef = useRef(0);
  const lastTickRef = useRef<number | null>(null);
  const tapCountRef = useRef(0);
  const tapTimerRef = useRef<NodeJS.Timeout | null>(null);
  const singleTapTimerRef = useRef<NodeJS.Timeout | null>(null);
  const controlsTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [showControls, setShowControls] = useState(true);

  const [buffering, setBuffering] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState("0:00");
  const [duration, setDuration] = useState("0:00");

  const [tapHint, setTapHint] = useState<{
    side: "left" | "right";
    seconds: number;
  } | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src) return;

    hlsRef.current?.destroy();
    hlsRef.current = null;

    if (src.endsWith(".m3u8") && Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: false,
        capLevelToPlayerSize: true,
        startLevel: -1,
        maxBufferLength: 15,
        maxMaxBufferLength: 30,
      });

      hls.loadSource(src);
      hls.attachMedia(video);
      hlsRef.current = hls;
    } else {
      video.src = src;
    }

    return () => {
      hlsRef.current?.destroy();
      hlsRef.current = null;
    };
  }, [src]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onPlay = () => {
      setPlaying(true);
      lastTickRef.current = Date.now();
      showPlayerControls();
    };

    const onPause = () => {
      setPlaying(false);
      setShowControls(true);

      if (controlsTimerRef.current) {
        clearTimeout(controlsTimerRef.current);
      }

      controlsTimerRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);

      lastTickRef.current = null;
      onWatchProgress?.(watchedRef.current, video.duration || 0);
    };

    const onTimeUpdate = () => {
      if (!video.duration) return;

      setProgress((video.currentTime / video.duration) * 100);
      setCurrentTime(formatTime(video.currentTime));
      setDuration(formatTime(video.duration));

      if (lastTickRef.current !== null && !video.paused) {
        const now = Date.now();
        const delta = (now - lastTickRef.current) / 1000;
        lastTickRef.current = now;

        if (delta > 0 && delta < 2) {
          watchedRef.current += delta;
        }

        onWatchProgress?.(watchedRef.current, video.duration || 0);
      }
    };
    const onWaiting = () => {
      setBuffering(true);
    };

    const onPlaying = () => {
      setBuffering(false);
    };

    video.addEventListener("play", onPlay);
    video.addEventListener("pause", onPause);
    video.addEventListener("ended", onPause);
    video.addEventListener("timeupdate", onTimeUpdate);
    video.addEventListener("waiting", onWaiting);
    video.addEventListener("playing", onPlaying);

    return () => {
      video.removeEventListener("play", onPlay);
      video.removeEventListener("pause", onPause);
      video.removeEventListener("ended", onPause);
      video.removeEventListener("timeupdate", onTimeUpdate);
      video.removeEventListener("waiting", onWaiting);
      video.removeEventListener("playing", onPlaying);
    };
  }, [onWatchProgress]);

  const formatTime = (time: number) => {
    if (!time || isNaN(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    video.paused ? video.play() : video.pause();
  };

  const handleVideoTap = (side: "left" | "right") => {
    if (singleTapTimerRef.current) {
      clearTimeout(singleTapTimerRef.current);
      singleTapTimerRef.current = null;
      handleDoubleTapSkip(side);
      return;
    }

    singleTapTimerRef.current = setTimeout(() => {
      togglePlay();
      singleTapTimerRef.current = null;
    }, 220);
  };

  const handleDoubleTapSkip = (side: "left" | "right") => {
    const video = videoRef.current;
    if (!video) return;

    tapCountRef.current += 1;

    const seconds = tapCountRef.current * 10;
    const direction = side === "right" ? 1 : -1;

    video.currentTime = Math.max(
      0,
      Math.min(video.duration || 0, video.currentTime + direction * 10)
    );

    setTapHint({ side, seconds });

    if (tapTimerRef.current) clearTimeout(tapTimerRef.current);

    tapTimerRef.current = setTimeout(() => {
      tapCountRef.current = 0;
      setTapHint(null);
    }, 700);
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = !video.muted;
    setMuted(video.muted);
  };

  const seekVideo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video || !video.duration) return;

    const value = Number(e.target.value);
    video.currentTime = (value / 100) * video.duration;
    setProgress(value);
  };

  const fullscreen = () => {
    videoRef.current?.requestFullscreen();
  };

  const showPlayerControls = () => {
    setShowControls(true);

    if (controlsTimerRef.current) {
      clearTimeout(controlsTimerRef.current);
    }

    controlsTimerRef.current = setTimeout(() => {
      setShowControls(false);
    }, 3000);
  };

  return (
    <div
      className="group relative w-full overflow-hidden bg-black"
      onMouseMove={showPlayerControls}
      onClick={showPlayerControls}
      onTouchStart={showPlayerControls}
    >
      <video
        ref={videoRef}
        poster={poster}
        preload="metadata"
        playsInline
        disablePictureInPicture
        controls={false}
        controlsList="nodownload noplaybackrate noremoteplayback"
        className="w-full aspect-video bg-black object-contain"
      />

      {showControls && title && (
        <div className="absolute left-12 top-4 z-20 max-w-[58%]">
          <h2 className="line-clamp-2 text-sm font-medium text-white md:text-base">
            {title}
          </h2>
        </div>
      )}
      {buffering && (
        <div className="pointer-events-none absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/20 text-white">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-white/30 border-t-white" />

        </div>
      )}

      <div
        onClick={() => handleVideoTap("left")}
        className="absolute left-0 top-0 h-full w-1/2"
      />

      <div
        onClick={() => handleVideoTap("right")}
        className="absolute right-0 top-0 h-full w-1/2"
      />

      {tapHint && (
        <div
          className={`pointer-events-none absolute top-1/2 -translate-y-1/2 rounded-full bg-black/60 px-5 py-3 text-sm font-semibold text-white backdrop-blur-md ${tapHint.side === "left" ? "left-10" : "right-10"
            }`}
        >
          {tapHint.side === "left" ? "⏪" : "⏩"} {tapHint.seconds}s
        </div>
      )}

      {!playing && showControls && (
        <button
          onClick={togglePlay}
          className="absolute inset-0 m-auto flex h-16 w-16 items-center justify-center rounded-full bg-black/60 text-4xl text-white"
        >
          <Play size={36} fill="white" />
        </button>
      )}

      <div
        className={`absolute bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-black/90 via-black/50 to-transparent px-3 pb-2 pt-12 transition-opacity duration-300 ${showControls ? "opacity-100" : "pointer-events-none opacity-0"
          }`}
      >
        <input
          type="range"
          min="0"
          max="100"
          value={progress}
          onChange={seekVideo}
          style={{ "--progress": `${progress}%` } as React.CSSProperties}
          className="vidind-progress w-full"
        />

        <div className="mt-2 flex items-center justify-between text-white">
          <div className="flex items-center gap-3">
            <button onClick={togglePlay} className="text-xl">
              {playing ? <Pause size={22} /> : <Play size={22} />}
            </button>

            <button onClick={toggleMute} className="text-xl">
              {muted ? <VolumeX size={22} /> : <Volume2 size={22} />}
            </button>

            <span className="text-xs">
              {currentTime} / {duration}
            </span>
          </div>

          <div className="flex items-center gap-4">
            <button className="text-lg"><Settings size={22} /></button>

            <button onClick={fullscreen} className="text-xl">
              <Maximize size={22} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}