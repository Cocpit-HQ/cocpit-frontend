"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import useEmblaCarousel from "embla-carousel-react";
// @ts-ignore
import { WheelGesturesPlugin } from "embla-carousel-wheel-gestures";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Play, Volume2, VolumeX } from "lucide-react";
import { CarouselDots } from "./CarouselDots";
import { useIsMobile } from "@/hooks/use-mobile";
import { useFeedUIStore } from "@/store/feed.store";
import { PostMediaItem } from "@/types/entities";

export interface PostCarouselProps {
  images?: string[];
  media?: PostMediaItem[];
  imageDimensions?: Array<{ width: number; height: number } | null>;
  priority?: boolean;
  aspectRatio?: string | number;
  onImageLoad?: (event: React.SyntheticEvent<HTMLImageElement>) => void;
  imageFit?: 'cover' | 'contain';
  showDots?: boolean;
  viewportHeight?: string;
  overlay?: React.ReactNode;
  className?: string;
  arrowPlacement?: 'outside' | 'inside';
  slideWidth?: 'full' | 'peek';
  dotsClassName?: string;
}

// ─── Cocpit-style dynamic sizing helpers (max 442px width × 589px height) ──

const MIN_CONTAINER_H = 200;
const MAX_CONTAINER_H_LANDSCAPE = 442;
const MAX_CONTAINER_H_PORTRAIT = 589;
const MAX_CONTAINER_W = 442;
const MIN_SLIDE_W = 36;

function computeContainerHeight(
  dims: Array<{ width: number; height: number } | null> | undefined
): number {
  if (!dims || dims.length === 0) return MAX_CONTAINER_H_LANDSCAPE;
  // Always prioritize slide 0 to anchor carousel height
  const first = dims[0] || (dims.filter(Boolean) as Array<{ width: number; height: number }>)[0];
  if (!first || !first.width || !first.height) return MAX_CONTAINER_H_LANDSCAPE;

  const validDims = dims.filter(Boolean) as Array<{ width: number; height: number }>;
  const hasLandscape = validDims.some(d => d.width / d.height > 1.05);
  const maxH = hasLandscape ? MAX_CONTAINER_H_LANDSCAPE : MAX_CONTAINER_H_PORTRAIT;

  const firstAr = first.width / first.height;
  const targetH = Math.round(MAX_CONTAINER_W / firstAr);

  return Math.max(MIN_CONTAINER_H, Math.min(targetH, maxH));
}

function computeSlideWidth(
  dims: { width: number; height: number } | null | undefined,
  containerH: number,
  maxW: number
): number {
  if (!dims || !dims.height) return Math.round(maxW * 0.8);
  const ar = dims.width / dims.height;
  const natural = Math.round(containerH * ar);
  return Math.max(MIN_SLIDE_W, Math.min(natural, maxW));
}

// ─── Single Video Slide Component ──────────────────────────────────────────

interface CarouselVideoSlideProps {
  item: PostMediaItem;
  isActive: boolean;
  imageFit?: 'cover' | 'contain';
}

function CarouselVideoSlide({
  item,
  isActive,
  imageFit = 'cover',
}: CarouselVideoSlideProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { isMuted, setIsMuted } = useFeedUIStore();
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Sync muted property directly on DOM element
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.defaultMuted = true;
      videoRef.current.muted = isMuted;
    }
  }, [isMuted]);

  // Handle play/pause when isActive changes
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.defaultMuted = true;
    video.muted = isMuted;

    if (isActive) {
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => setIsPlaying(true))
          .catch((err) => {
            console.warn('[CarouselVideoSlide] Autoplay prevented or interrupted:', err.name);
            setIsPlaying(false);
          });
      }
    } else {
      video.pause();
      setIsPlaying(false);
    }
  }, [isActive, isMuted, item.url]);

  const togglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.defaultMuted = true;
      video.muted = isMuted;
      video.play().then(() => setIsPlaying(true)).catch(() => {});
    } else {
      video.pause();
      setIsPlaying(false);
    }
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMuted(!isMuted);
  };

  const posterSource = item.thumbnail_url || `${item.url}#t=0.001`;

  return (
    <div className="relative w-full h-full bg-black flex items-center justify-center overflow-hidden">
      {/* Background static poster if available */}
      {item.thumbnail_url ? (
        <img
          src={item.thumbnail_url}
          alt="Video thumbnail"
          className={`absolute inset-0 w-full h-full ${imageFit === 'contain' ? 'object-contain' : 'object-cover'} pointer-events-none ${isLoaded && isPlaying ? 'opacity-0' : 'opacity-100'} transition-opacity duration-200 z-0`}
          onError={(e) => { e.currentTarget.style.display = 'none'; }}
        />
      ) : null}

      <video
        ref={videoRef}
        src={item.url}
        poster={posterSource}
        preload="auto"
        playsInline
        loop
        muted={isMuted}
        onLoadedData={() => setIsLoaded(true)}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        className={`w-full h-full ${imageFit === 'contain' ? 'object-contain' : 'object-cover'} relative z-10`}
        onClick={togglePlay}
      />

      {/* Play/Pause overlay */}
      {!isPlaying && (
        <button
          type="button"
          onClick={togglePlay}
          className="absolute inset-0 z-20 flex items-center justify-center bg-black/30 text-white cursor-pointer"
          aria-label="Play video"
        >
          <div className="w-12 h-12 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center text-white shadow-md">
            <Play className="w-6 h-6 fill-white ml-0.5" />
          </div>
        </button>
      )}

      {/* Duration badge when not playing */}
      {!isPlaying && item.duration_seconds ? (
        <div className="absolute bottom-3 right-12 z-20 bg-black/70 backdrop-blur-sm px-1.5 py-0.5 rounded text-[11px] font-medium text-white select-none pointer-events-none">
          {Math.floor(item.duration_seconds / 60)}:
          {String(Math.floor(item.duration_seconds % 60)).padStart(2, '0')}
        </div>
      ) : null}

      {/* Mute button */}
      <button
        type="button"
        onClick={toggleMute}
        className="absolute bottom-3 right-3 z-30 w-8 h-8 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-sm flex items-center justify-center text-white transition-transform active:scale-90 cursor-pointer"
        aria-label={isMuted ? "Unmute" : "Mute"}
      >
        {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
      </button>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────

export function PostCarousel({
  images = [],
  media,
  imageDimensions,
  priority = false,
  onImageLoad,
  imageFit = 'cover',
  showDots = true,
  viewportHeight,
  overlay,
  className = '',
  arrowPlacement = 'outside',
  slideWidth = 'peek',
  dotsClassName,
}: PostCarouselProps) {
  const isMobile = useIsMobile();
  const plugins = typeof WheelGesturesPlugin === 'function' && !isMobile ? [WheelGesturesPlugin()] : [];
  const containerRef = useRef<HTMLDivElement | null>(null);
  const rAFRef = useRef<number | null>(null);

  // Normalize into unified slides
  const slides: PostMediaItem[] = React.useMemo(() => {
    if (media && media.length > 0) return media;
    if (images && images.length > 0) {
      return images.map((url, idx) => ({
        url,
        media_type: (url.match(/\.(mp4|webm|mov)(\?|#|$)/i) ? 'video' : 'image') as 'image' | 'video',
        order_index: idx,
        width: imageDimensions?.[idx]?.width,
        height: imageDimensions?.[idx]?.height,
      }));
    }
    return [];
  }, [media, images, imageDimensions]);

  const slideUrls = React.useMemo(() => slides.map(s => s.thumbnail_url || s.url), [slides]);

  const align = useCallback((viewSize: number, snapSize: number, index: number) => {
    if (index === 0) return 0;
    const slide = containerRef.current?.children[index] as HTMLElement | undefined;
    if (slide) {
      return Math.min(slide.offsetLeft, viewSize - snapSize);
    }
    return viewSize - snapSize;
  }, []);

  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: false,
    align,
    containScroll: false,
    dragFree: true,
    duration: 25,
  }, plugins);

  const initialDims = React.useMemo(() => {
    return slides.map((s, idx) => {
      if (s.width && s.height && s.width > 0 && s.height > 0) {
        return { width: s.width, height: s.height };
      }
      if (imageDimensions && imageDimensions[idx] && imageDimensions[idx]!.width > 0) {
        return imageDimensions[idx];
      }
      return null;
    });
  }, [slides, imageDimensions]);

  const [loadedDims, setLoadedDims] = useState<Array<{ width: number; height: number } | null>>(initialDims);

  useEffect(() => {
    setLoadedDims(initialDims);
  }, [initialDims]);

  // Synchronously measure cached images or probe images/videos when dimensions are missing
  useEffect(() => {
    if (loadedDims.length > 0 && loadedDims.every(Boolean)) return;
    if (typeof window === "undefined") return;

    let isMounted = true;
    slides.forEach((item, index) => {
      if (loadedDims[index]) return;
      const isVideo = item.media_type === 'video' || item.url?.match(/\.(mp4|webm|mov)(\?|#|$)/i);

      if (isVideo) {
        if (item.thumbnail_url) {
          const probe = new window.Image();
          probe.src = item.thumbnail_url;
          probe.onload = () => {
            if (!isMounted || !probe.naturalWidth || !probe.naturalHeight) return;
            setLoadedDims(prev => {
              if (prev[index]) return prev;
              const next = [...prev];
              next[index] = { width: probe.naturalWidth, height: probe.naturalHeight };
              return next;
            });
          };
        } else {
          const v = document.createElement('video');
          v.preload = 'metadata';
          v.src = item.url;
          v.onloadedmetadata = () => {
            if (!isMounted || !v.videoWidth || !v.videoHeight) return;
            setLoadedDims(prev => {
              if (prev[index]) return prev;
              const next = [...prev];
              next[index] = { width: v.videoWidth, height: v.videoHeight };
              return next;
            });
          };
        }
      } else {
        const probe = new window.Image();
        probe.src = item.url;
        const applyDims = () => {
          if (!isMounted || !probe.naturalWidth || !probe.naturalHeight) return;
          setLoadedDims(prev => {
            if (prev[index]) return prev;
            const next = [...prev];
            next[index] = { width: probe.naturalWidth, height: probe.naturalHeight };
            return next;
          });
        };
        if (probe.complete) applyDims();
        else probe.onload = applyDims;
      }
    });

    return () => {
      isMounted = false;
    };
  }, [slides, loadedDims]);

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  const updateActiveState = useCallback(() => {
    if (!emblaApi) return;
    const engine = emblaApi.internalEngine();
    if (engine && engine.scrollSnaps && engine.scrollSnaps.length > 0) {
      const snaps = engine.scrollSnaps;
      const loc = engine.location.get();
      let closest = 0;
      let minD = Infinity;
      for (let i = 0; i < snaps.length; i++) {
        const d = Math.abs(snaps[i] - loc);
        if (d < minD) {
          minD = d;
          closest = i;
        }
      }
      setSelectedIndex(closest);

      const hasScroll = Math.abs(snaps[0] - snaps[snaps.length - 1]) > 1;
      setCanScrollPrev(hasScroll && closest > 0);
      setCanScrollNext(hasScroll && closest < snaps.length - 1);
    } else {
      const idx = emblaApi.selectedScrollSnap();
      setSelectedIndex(idx);
      setCanScrollPrev(emblaApi.canScrollPrev());
      setCanScrollNext(emblaApi.canScrollNext());
    }
  }, [emblaApi]);

  const onScroll = useCallback(() => {
    if (rAFRef.current !== null) return;
    rAFRef.current = requestAnimationFrame(() => {
      rAFRef.current = null;
      updateActiveState();
    });
  }, [updateActiveState]);

  useEffect(() => {
    if (!emblaApi) return;

    updateActiveState();

    emblaApi.on("select", updateActiveState);
    emblaApi.on("settle", updateActiveState);
    emblaApi.on("reInit", updateActiveState);
    emblaApi.on("scroll", onScroll);

    return () => {
      if (rAFRef.current !== null) {
        cancelAnimationFrame(rAFRef.current);
        rAFRef.current = null;
      }
      emblaApi.off("select", updateActiveState);
      emblaApi.off("settle", updateActiveState);
      emblaApi.off("reInit", updateActiveState);
      emblaApi.off("scroll", onScroll);
    };
  }, [emblaApi, onScroll, updateActiveState]);

  // Re-initialize Embla when slides change, dims load, or mobile changes
  useEffect(() => {
    if (!emblaApi) return;
    const timer = setTimeout(() => {
      emblaApi.reInit();
      updateActiveState();
    }, 50);
    return () => clearTimeout(timer);
  }, [emblaApi, slides.length, isMobile, loadedDims, updateActiveState]);

  const scrollToSlide = useCallback((targetIdx: number) => {
    if (!emblaApi) return;
    emblaApi.scrollTo(targetIdx);
  }, [emblaApi]);

  const scrollPrev = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (!emblaApi) return;
    emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (!emblaApi) return;
    emblaApi.scrollNext();
  }, [emblaApi]);

  if (!slides || slides.length === 0) return null;

  // ── Dynamic sizing (X-style) vs legacy fixed height ──────────────────────
  const hasDimensions = loadedDims && loadedDims.some(Boolean);

  // Container height in px
  const containerH = hasDimensions
    ? computeContainerHeight(loadedDims)
    : null;

  // Per-slide widths in px
  const slideWidths: (number | null)[] = slides.map((_, i) =>
    hasDimensions
      ? computeSlideWidth(loadedDims?.[i], containerH!, MAX_CONTAINER_W)
      : null
  );

  const legacyHeightClass = viewportHeight ?? 'h-[430px]';
  const containerStyle: React.CSSProperties = containerH
    ? { height: `${containerH}px` }
    : {};

  return (
    <div className={`relative w-full flex flex-col items-center select-none ${className}`}>
      {/* Media Slider Viewport */}
      <div
        className={`relative w-full group select-none ${!containerH ? legacyHeightClass : ''}`}
        style={containerStyle}
      >
        {/* Embla Viewport */}
        <div className="w-full h-full overflow-hidden" ref={emblaRef}>
          <div className="flex h-full gap-2 touch-pan-y" ref={containerRef}>
            {slides.map((item, index) => {
              const isVideo = item.media_type === 'video' || item.url.match(/\.(mp4|webm|mov)(\?|#|$)/i);
              const isActive = selectedIndex === index;
              const sw = slideWidths[index];
              const slideStyle: React.CSSProperties = sw
                ? { width: `${sw}px`, maxWidth: '100%', flexShrink: 0, flexGrow: 0 }
                : {};
              const slideCls = sw
                ? "relative max-w-full h-full rounded-[8px] border border-[var(--ds-media-border)] overflow-hidden select-none bg-ds-surface-2"
                : slideWidth === 'full'
                  ? "relative flex-[0_0_100%] min-w-0 h-full rounded-[8px] border border-[var(--ds-media-border)] overflow-hidden select-none bg-ds-surface-2"
                  : "relative flex-[0_0_80%] min-w-0 h-full rounded-[8px] border border-[var(--ds-media-border)] overflow-hidden select-none bg-ds-surface-2";
              const dim = loadedDims[index];
              let dynamicSizes = "(max-width: 768px) 100vw, 1200px";
              if (dim && dim.height > 0) {
                const ar = dim.width / dim.height;
                const neededW = Math.min(3840, Math.ceil(MAX_CONTAINER_W * Math.max(1, ar) * 2));
                dynamicSizes = `${neededW}px`;
              }

              return (
                <div
                  key={index}
                  className={slideCls}
                  style={slideStyle}
                >
                  {isVideo ? (
                    <CarouselVideoSlide item={item} isActive={isActive} imageFit={imageFit} />
                  ) : (
                    <Image
                      src={item.url}
                      alt={`Post image ${index + 1}`}
                      fill
                      className={
                        imageFit === 'contain'
                          ? "object-contain rounded-[8px] transition-transform duration-300 ease-out"
                          : "object-cover rounded-[8px] transition-transform duration-300 ease-out"
                      }
                      priority={priority && index === 0}
                      sizes={dynamicSizes}
                      quality={90}
                      onLoad={(e) => {
                        const img = e.currentTarget;
                        if (img.naturalWidth && img.naturalHeight) {
                          setLoadedDims(prev => {
                            const curr = prev[index];
                            if (!curr || curr.width !== img.naturalWidth || curr.height !== img.naturalHeight) {
                              const newDims = [...prev];
                              newDims[index] = { width: img.naturalWidth, height: img.naturalHeight };
                              return newDims;
                            }
                            return prev;
                          });
                        }
                        if (index === 0 && onImageLoad) onImageLoad(e);
                      }}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Navigation Arrows */}
        {slides.length > 1 && (
          <>
            {canScrollPrev && (
              <button
                type="button"
                onClick={scrollPrev}
                className={
                  arrowPlacement === 'inside'
                    ? "absolute left-3 top-1/2 -translate-y-1/2 z-20 flex items-center justify-center w-8 h-8 rounded-full bg-black/60 hover:bg-black/80 text-white backdrop-blur-sm shadow-md transition-all duration-200 cursor-pointer outline-none active:scale-95 opacity-0 group-hover:opacity-100"
                    : "absolute -left-[44px] top-1/2 -translate-y-1/2 z-20 flex items-center justify-center w-8 h-8 rounded-full text-ds-text-primary hover:bg-ds-surface-2 transition-all duration-150 cursor-pointer outline-none"
                }
                aria-label="Previous slide"
              >
                <ChevronLeft className={`w-5 h-5 ${arrowPlacement === 'inside' ? 'text-white' : 'text-ds-text-primary'}`} />
              </button>
            )}
            {canScrollNext && (
              <button
                type="button"
                onClick={scrollNext}
                className={
                  arrowPlacement === 'inside'
                    ? "absolute right-3 top-1/2 -translate-y-1/2 z-20 flex items-center justify-center w-8 h-8 rounded-full bg-black/60 hover:bg-black/80 text-white backdrop-blur-sm shadow-md transition-all duration-200 cursor-pointer outline-none active:scale-95 opacity-0 group-hover:opacity-100"
                    : "absolute -right-[44px] top-1/2 -translate-y-1/2 z-20 flex items-center justify-center w-8 h-8 rounded-full text-ds-text-primary hover:bg-ds-surface-2 transition-all duration-150 cursor-pointer outline-none"
                }
                aria-label="Next slide"
              >
                <ChevronRight className={`w-5 h-5 ${arrowPlacement === 'inside' ? 'text-white' : 'text-ds-text-primary'}`} />
              </button>
            )}
          </>
        )}

        {/* Overlay elements */}
        {overlay}
      </div>

      {/* Carousel Indicator Dots */}
      {showDots && slides.length > 1 && (
        <CarouselDots
          total={slides.length}
          activeIndex={selectedIndex}
          imageDimensions={loadedDims}
          onDotClick={(idx) => scrollToSlide(idx)}
          className={dotsClassName || (arrowPlacement === 'inside' ? "py-3" : "mt-[12px]")}
        />
      )}
    </div>
  );
}

export default PostCarousel;
