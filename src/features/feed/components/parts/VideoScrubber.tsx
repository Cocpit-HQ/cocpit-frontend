import React, { useRef, useState, useEffect } from 'react';

interface VideoScrubberProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  progress?: number;
  setProgress?: React.Dispatch<React.SetStateAction<number>>;
  isDraggingRef?: React.MutableRefObject<boolean>;
  className?: string;
}

export const VideoScrubber: React.FC<VideoScrubberProps> = ({
  videoRef,
  progress = 0,
  setProgress,
  isDraggingRef: externalDraggingRef,
  className = '',
}) => {
  const trackRef = useRef<HTMLDivElement>(null);
  const progressFillRef = useRef<HTMLDivElement>(null);
  const localDraggingRef = useRef(false);
  const activeDraggingRef = externalDraggingRef || localDraggingRef;
  const [isDraggingState, setIsDraggingState] = useState(false);
  const wasPlayingRef = useRef(false);
  const animFrameRef = useRef<number | null>(null);

  // Sync initial / prop progress to DOM fill width (only when paused to prevent fighting 60fps rAF loop)
  useEffect(() => {
    if (!activeDraggingRef.current && progressFillRef.current) {
      const video = videoRef.current;
      if (!video || video.paused) {
        progressFillRef.current.style.width = `${Math.max(0, Math.min(100, progress))}%`;
      }
    }
  }, [progress]);

  // Smooth 60fps rAF loop + direct DOM style update while playing (zero React re-render lag)
  useEffect(() => {
    let cleanup: (() => void) | null = null;

    const setup = () => {
      const video = videoRef.current;
      if (!video) return false;

      const updateProgress = () => {
        if (!activeDraggingRef.current && video.duration && !video.paused) {
          const pct = Math.max(0, Math.min(100, (video.currentTime / video.duration) * 100));
          if (progressFillRef.current) {
            progressFillRef.current.style.width = `${pct}%`;
          }
          animFrameRef.current = requestAnimationFrame(updateProgress);
        }
      };

      const handlePlay = () => {
        if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = requestAnimationFrame(updateProgress);
      };

      const handlePause = () => {
        if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      };

      const handleTimeUpdate = () => {
        if (!activeDraggingRef.current && video.duration) {
          const pct = Math.max(0, Math.min(100, (video.currentTime / video.duration) * 100));
          if (progressFillRef.current) {
            progressFillRef.current.style.width = `${pct}%`;
          }
        }
      };

      video.addEventListener('play', handlePlay);
      video.addEventListener('playing', handlePlay);
      video.addEventListener('pause', handlePause);
      video.addEventListener('timeupdate', handleTimeUpdate);
      video.addEventListener('seeking', handleTimeUpdate);
      video.addEventListener('seeked', handleTimeUpdate);

      if (!video.paused) {
        handlePlay();
      } else {
        handleTimeUpdate();
      }

      cleanup = () => {
        if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
        video.removeEventListener('play', handlePlay);
        video.removeEventListener('playing', handlePlay);
        video.removeEventListener('pause', handlePause);
        video.removeEventListener('timeupdate', handleTimeUpdate);
        video.removeEventListener('seeking', handleTimeUpdate);
        video.removeEventListener('seeked', handleTimeUpdate);
      };

      return true;
    };

    if (!setup()) {
      const interval = setInterval(() => {
        if (setup()) {
          clearInterval(interval);
        }
      }, 100);
      return () => {
        clearInterval(interval);
        if (cleanup) cleanup();
      };
    }

    return () => {
      if (cleanup) cleanup();
    };
  }, [videoRef]);

  const calculateRatio = (clientX: number): number => {
    if (!trackRef.current) return 0;
    const rect = trackRef.current.getBoundingClientRect();
    if (rect.width <= 0) return 0;
    return Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
  };

  const updateSeek = (ratio: number) => {
    const nextPct = ratio * 100;
    if (progressFillRef.current) {
      progressFillRef.current.style.width = `${nextPct}%`;
    }
    if (setProgress) {
      setProgress(nextPct);
    }
    const video = videoRef.current;
    if (video && video.duration) {
      video.currentTime = ratio * video.duration;
    }
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.stopPropagation();
    const target = e.currentTarget;
    try {
      target.setPointerCapture(e.pointerId);
    } catch {}

    const video = videoRef.current;
    wasPlayingRef.current = video ? !video.paused : false;

    activeDraggingRef.current = true;
    setIsDraggingState(true);

    const ratio = calculateRatio(e.clientX);
    updateSeek(ratio);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!activeDraggingRef.current && !isDraggingState) return;
    e.stopPropagation();
    const ratio = calculateRatio(e.clientX);
    updateSeek(ratio);
  };

  const handlePointerEnd = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!activeDraggingRef.current && !isDraggingState) return;
    e.stopPropagation();
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {}

    const ratio = calculateRatio(e.clientX);
    updateSeek(ratio);

    activeDraggingRef.current = false;
    setIsDraggingState(false);

    const video = videoRef.current;
    if (video && wasPlayingRef.current) {
      video.play().catch(() => {});
    }
  };

  return (
    <div
      ref={trackRef}
      role="slider"
      tabIndex={0}
      aria-label="Video progress scrubber"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(progress)}
      className={`w-full cursor-pointer select-none py-2 min-h-[40px] flex items-center touch-none relative outline-none focus:outline-none ${className}`}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerEnd}
      onPointerCancel={handlePointerEnd}
      onKeyDown={(e) => {
        const video = videoRef.current;
        if (!video || !video.duration) return;
        if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
          e.preventDefault();
          const nextTime = Math.min(video.duration, video.currentTime + 5);
          video.currentTime = nextTime;
          updateSeek(nextTime / video.duration);
        } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
          e.preventDefault();
          const nextTime = Math.max(0, video.currentTime - 5);
          video.currentTime = nextTime;
          updateSeek(nextTime / video.duration);
        }
      }}
    >
      {/* Outer Groove Track */}
      <div className="w-full h-[6px] bg-black/40 rounded-full overflow-hidden relative">
        {/* Progress Fill */}
        <div
          ref={progressFillRef}
          className="h-full bg-[#F4D9D2] rounded-full transition-none"
          style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
        />
      </div>
    </div>
  );
};
