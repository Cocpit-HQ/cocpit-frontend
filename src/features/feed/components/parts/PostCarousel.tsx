"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { WheelGesturesPlugin } from "embla-carousel-wheel-gestures";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { CarouselDots } from "./CarouselDots";
import { useIsMobile } from "@/hooks/use-mobile";

export interface PostCarouselProps {
  images: string[];
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

// ─── X-style dynamic sizing helpers ────────────────────────────────────────

const MIN_CONTAINER_H = 200;
// Derived from X's observed behavior:
//   landscape/square first-image → X caps at ~412px → we use 416
//   portrait first-image         → X caps at ~642px → we use 640
const MAX_CONTAINER_H_LANDSCAPE = 416;
const MAX_CONTAINER_H_PORTRAIT  = 640;
const MAX_CONTAINER_W = 416;
const MIN_SLIDE_W = 36;  // X allows ~42px; 36 is our safe minimum

/**
 * Compute the shared carousel container height.
 * - If ANY image in the set is landscape (AR ≥ 1) → use landscape cap (416px).
 *   This matches X: a carousel containing a landscape slide uses the shorter height.
 * - If ALL images are portrait → use portrait cap (640px).
 *   This matches X: a carousel of phone screenshots uses the taller height.
 * Height is further clamped to the natural height of the first image.
 */
function computeContainerHeight(
  dims: Array<{ width: number; height: number } | null> | undefined
): number {
  const validDims = (dims || []).filter(Boolean) as Array<{ width: number; height: number }>;
  const first = validDims[0];
  if (!first || !first.width || !first.height) return MAX_CONTAINER_H_LANDSCAPE;

  // Pick cap based on whether ANY image is landscape (AR > 1.05 to avoid square triggering landscape)
  const hasLandscape = validDims.some(d => d.width / d.height > 1.05);
  const maxH = hasLandscape ? MAX_CONTAINER_H_LANDSCAPE : MAX_CONTAINER_H_PORTRAIT;

  const firstAr = first.width / first.height;
  const targetH = Math.round(MAX_CONTAINER_W / firstAr);

  return Math.max(MIN_CONTAINER_H, Math.min(targetH, maxH));
}

/**
 * Compute the display width for one slide given its natural dimensions,
 * the shared container height, and the available container width.
 */
function computeSlideWidth(
  dims: { width: number; height: number } | null | undefined,
  containerH: number,
  maxW: number
): number {
  if (!dims) return Math.round(maxW * 0.8); // fallback: 80% peek
  const ar = dims.width / dims.height;
  const natural = Math.round(containerH * ar);
  return Math.max(MIN_SLIDE_W, Math.min(natural, maxW));
}

// ────────────────────────────────────────────────────────────────────────────

export function PostCarousel({
  images,
  imageDimensions,
  priority = false,
  onImageLoad,
  imageFit = 'cover',
  showDots = true,
  viewportHeight,     // legacy prop – ignored when imageDimensions is provided
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

  const [loadedDims, setLoadedDims] = useState<Array<{ width: number; height: number } | null>>(
    imageDimensions || Array(images.length).fill(null)
  );

  useEffect(() => {
    if (imageDimensions && imageDimensions.some(Boolean)) {
      setLoadedDims(imageDimensions);
    } else {
      setLoadedDims(Array(images.length).fill(null));
    }
  }, [imageDimensions, images.length]);

  // Synchronously measure cached images or probe images when imageDimensions is missing
  useEffect(() => {
    if (imageDimensions && imageDimensions.every(Boolean)) return;
    if (typeof window === "undefined") return;

    let isMounted = true;
    images.forEach((src, index) => {
      if (!src) return;
      const probe = new window.Image();
      probe.src = src;

      const applyDims = () => {
        if (!isMounted) return;
        if (probe.naturalWidth && probe.naturalHeight) {
          setLoadedDims((prev) => {
            const curr = prev[index];
            if (!curr || curr.width !== probe.naturalWidth || curr.height !== probe.naturalHeight) {
              const next = [...prev];
              next[index] = { width: probe.naturalWidth, height: probe.naturalHeight };
              return next;
            }
            return prev;
          });
        }
      };

      if (probe.complete) {
        applyDims();
      } else {
        probe.onload = applyDims;
      }
    });

    return () => {
      isMounted = false;
    };
  }, [images, imageDimensions]);

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

  // Re-initialize Embla when images change, dims load, or mobile changes
  useEffect(() => {
    if (!emblaApi) return;
    const timer = setTimeout(() => {
      emblaApi.reInit();
      updateActiveState();
    }, 50);
    return () => clearTimeout(timer);
  }, [emblaApi, images, isMobile, loadedDims, updateActiveState]);

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

  if (!images || images.length === 0) return null;

  // ── Dynamic sizing (X-style) vs legacy fixed height ──────────────────────
  const hasDimensions = loadedDims && loadedDims.some(Boolean);

  // Container height in px
  const containerH = hasDimensions
    ? computeContainerHeight(loadedDims)
    : null; // null → use legacy viewportHeight class

  // Per-slide widths in px (null → use CSS percentage fallback)
  const slideWidths: (number | null)[] = images.map((_, i) =>
    hasDimensions
      ? computeSlideWidth(loadedDims?.[i], containerH!, MAX_CONTAINER_W)
      : null
  );

  // Height class for legacy / full-screen mode
  const legacyHeightClass = viewportHeight ?? 'h-[430px]';
  const containerStyle: React.CSSProperties = containerH
    ? { height: `${containerH}px` }
    : {};

  // ────────────────────────────────────────────────────────────────────────

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
            {images.map((src, index) => {
              const sw = slideWidths[index];
              const slideStyle: React.CSSProperties = sw
                ? { width: `${sw}px`, maxWidth: '100%', flexShrink: 0, flexGrow: 0 }
                : {};
              const slideCls = sw
                ? "relative max-w-full h-full rounded-[8px] border border-[var(--ds-media-border)] overflow-hidden select-none bg-ds-surface-2"
                : slideWidth === 'full'
                  ? "relative flex-[0_0_100%] min-w-0 h-full rounded-[8px] border border-[var(--ds-media-border)] overflow-hidden select-none bg-ds-surface-2"
                  : "relative flex-[0_0_80%] min-w-0 h-full rounded-[8px] border border-[var(--ds-media-border)] overflow-hidden select-none bg-ds-surface-2";
              const dim = imageDimensions ? imageDimensions[index] : null;
              let dynamicSizes = "(max-width: 768px) 100vw, 1200px";
              if (dim && dim.height > 0) {
                const ar = dim.width / dim.height;
                // For a ~416px container, we need (416 * AR * 2) width to maintain crisp retina height
                const neededW = Math.min(3840, Math.ceil(416 * Math.max(1, ar) * 2));
                dynamicSizes = `${neededW}px`;
              }

              return (
                <div
                  key={index}
                  className={slideCls}
                  style={slideStyle}
                >
                  <Image
                    src={src}
                    alt={`Post image ${index + 1}`}
                    fill
                    className={
                      imageFit === 'contain'
                        ? "object-contain rounded-[8px] transition-transform duration-300 ease-out"
                        : "object-cover rounded-[8px] transition-transform duration-300 ease-out"
                    }
                    priority={priority && index === 0}
                    // unoptimized={true}
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
                </div>
              );
            })}
          </div>
        </div>

        {/* Navigation Arrows */}
        {images.length > 1 && (
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
                aria-label="Previous photo"
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
                aria-label="Next photo"
              >
                <ChevronRight className={`w-5 h-5 ${arrowPlacement === 'inside' ? 'text-white' : 'text-ds-text-primary'}`} />
              </button>
            )}
          </>
        )}

        {/* Overlay elements (e.g. Tagged people badge) */}
        {overlay}
      </div>

      {/* Carousel Indicator Dots */}
      {showDots && images.length > 1 && (
        <CarouselDots
          total={images.length}
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

