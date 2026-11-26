'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
} from 'lucide-react';

interface ShowcaseVideoPlayerProps {
  src: string;
  autoPlayOnView?: boolean;
}

function formatSec(sec: number): string {
  if (!Number.isFinite(sec) || sec < 0) return '0:00';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

const SPEEDS = [1, 1.25, 1.5] as const;

export function ShowcaseVideoPlayer({
  src,
  autoPlayOnView = false,
}: ShowcaseVideoPlayerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const userPausedRef = useRef(false);

  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [autoplayMutedFallback, setAutoplayMutedFallback] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [speedIdx, setSpeedIdx] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const onFsChange = () => {
      const doc = document as Document & { webkitFullscreenElement?: Element | null };
      setIsFullscreen(Boolean(document.fullscreenElement || doc.webkitFullscreenElement));
    };
    document.addEventListener('fullscreenchange', onFsChange);
    document.addEventListener('webkitfullscreenchange', onFsChange);
    return () => {
      document.removeEventListener('fullscreenchange', onFsChange);
      document.removeEventListener('webkitfullscreenchange', onFsChange);
    };
  }, []);

  useEffect(() => {
    if (!autoPlayOnView) return;
    const target = containerRef.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        const v = videoRef.current;
        if (!v || !entry) return;
        // Never pause/toggle while browser is entering or exiting fullscreen
        if (document.fullscreenElement) return;

        if (entry.isIntersecting && !userPausedRef.current) {
          v.muted = false;
          setMuted(false);
          setAutoplayMutedFallback(false);
          v.play().catch(() => {
            v.muted = true;
            setMuted(true);
            setAutoplayMutedFallback(true);
            void v.play().catch(() => {});
          });
        } else if (!entry.isIntersecting && !v.paused) {
          v.pause();
        }
      },
      { threshold: 0.45 }
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [autoPlayOnView]);

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      userPausedRef.current = false;
      void v.play();
    } else {
      userPausedRef.current = true;
      v.pause();
    }
  };

  const unmuteNow = () => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = false;
    setMuted(false);
    setAutoplayMutedFallback(false);
  };

  const toggleMute = () => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setMuted(v.muted);
    if (!v.muted) setAutoplayMutedFallback(false);
  };

  const cycleSpeed = () => {
    const nextIdx = (speedIdx + 1) % SPEEDS.length;
    setSpeedIdx(nextIdx);
    if (videoRef.current) {
      videoRef.current.playbackRate = SPEEDS[nextIdx];
    }
  };

  const toggleFullscreen = async () => {
    const el = containerRef.current as
      | (HTMLDivElement & { webkitRequestFullscreen?: () => Promise<void> })
      | null;
    const v = videoRef.current as
      | (HTMLVideoElement & { webkitEnterFullscreen?: () => void })
      | null;
    const doc = document as Document & {
      webkitFullscreenElement?: Element | null;
      webkitExitFullscreen?: () => Promise<void>;
    };

    try {
      if (document.fullscreenElement || doc.webkitFullscreenElement) {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if (doc.webkitExitFullscreen) {
          await doc.webkitExitFullscreen();
        }
      } else if (el?.requestFullscreen) {
        await el.requestFullscreen();
      } else if (el?.webkitRequestFullscreen) {
        await el.webkitRequestFullscreen();
      } else if (v?.webkitEnterFullscreen) {
        v.webkitEnterFullscreen();
      }
    } catch {
      // Ignore if fullscreen blocked
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    setCurrentTime(val);
    if (videoRef.current) {
      videoRef.current.currentTime = val;
    }
  };

  const progressPct = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;

  return (
    <div
      ref={containerRef}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-white/[0.12] bg-black shadow-[0_28px_90px_rgba(0,0,0,0.75)] [&:fullscreen]:h-full [&:fullscreen]:w-full [&:fullscreen]:rounded-none [&:fullscreen]:border-0 [&:fullscreen]:shadow-none"
    >
      {/* Video Surface (No Header) */}
      <div
        className={`relative w-full bg-black ${
          isFullscreen ? 'min-h-0 flex-1' : 'aspect-video'
        }`}
      >
        <video
          ref={videoRef}
          src={src}
          muted={muted}
          playsInline
          preload="metadata"
          onClick={togglePlay}
          onDoubleClick={toggleFullscreen}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onEnded={() => setPlaying(false)}
          onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
          onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
          className="h-full w-full cursor-pointer object-contain"
        />

        {/* Subtle Unmute Pill when browser required muted autoplay */}
        {playing && muted && autoplayMutedFallback && (
          <button
            type="button"
            onClick={unmuteNow}
            className="absolute right-3.5 top-3.5 inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-black/70 px-3 py-1.5 text-[11px] font-medium text-white backdrop-blur-md transition hover:bg-blue-600/80"
          >
            <VolumeX className="h-3.5 w-3.5 text-blue-400" />
            Tap to Unmute
          </button>
        )}

        {/* Center Play Overlay when paused */}
        {!playing && (
          <button
            type="button"
            onClick={togglePlay}
            aria-label="Play showcase video"
            className="absolute inset-0 flex items-center justify-center bg-black/25 backdrop-blur-[1px] transition hover:bg-black/15"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-full border border-white/25 bg-[#0B1224]/85 text-white shadow-[0_0_32px_rgba(37,99,235,0.55)] backdrop-blur-md transition duration-200 hover:scale-105 hover:bg-blue-600">
              <Play className="ml-0.5 h-5 w-5 fill-white" />
            </span>
          </button>
        )}
      </div>

      {/* Custom Control Bar — floats cleanly at bottom in Fullscreen */}
      <div
        className={
          isFullscreen
            ? 'absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-black/95 via-black/75 to-transparent px-6 pb-5 pt-8 opacity-0 transition-opacity duration-200 group-hover:opacity-100'
            : 'border-t border-white/[0.08] bg-[#080B14]/95 px-3.5 py-2.5 backdrop-blur-md'
        }
      >
        {/* Progress Scrubber */}
        <div className="relative mb-2.5 flex items-center">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/15">
            <div
              className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-400 transition-[width] duration-75"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <input
            type="range"
            min={0}
            max={duration || 100}
            step={0.1}
            value={currentTime}
            onChange={handleSeek}
            aria-label="Seek video"
            className="absolute inset-0 h-4 w-full cursor-pointer opacity-0"
          />
        </div>

        {/* Controls Row */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={togglePlay}
              aria-label={playing ? 'Pause' : 'Play'}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/[0.08] text-white transition hover:bg-white/[0.16]"
            >
              {playing ? <Pause className="h-4 w-4" /> : <Play className="ml-0.5 h-4 w-4" />}
            </button>

            <button
              type="button"
              onClick={toggleMute}
              aria-label={muted ? 'Unmute' : 'Mute'}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/[0.05] text-zinc-300 transition hover:bg-white/[0.12] hover:text-white"
            >
              {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </button>

            <span className="font-mono text-[11px] text-zinc-300">
              {formatSec(currentTime)} <span className="text-zinc-500">/</span> {formatSec(duration)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={cycleSpeed}
              className="rounded-lg border border-white/10 bg-white/[0.05] px-2.5 py-1 font-mono text-[11px] font-medium text-zinc-200 transition hover:bg-white/[0.12] hover:text-white"
              title="Playback speed"
            >
              {SPEEDS[speedIdx]}×
            </button>
            <button
              type="button"
              onClick={toggleFullscreen}
              aria-label="Toggle fullscreen"
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/[0.05] text-zinc-200 transition hover:bg-white/[0.12] hover:text-white"
            >
              {isFullscreen ? (
                <Minimize2 className="h-4 w-4" />
              ) : (
                <Maximize2 className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
