"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import useEmblaCarousel from "embla-carousel-react";
// @ts-ignore
import { WheelGesturesPlugin } from "embla-carousel-wheel-gestures";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { CarouselDots } from "./CarouselDots";

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
const MIN_SLIDE_W = 36;  // X allows ~42px; 36 is our safe minimum
const MAX_CONTAINER_W = 416;

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
  if (!first) return MAX_CONTAINER_H_LANDSCAPE;

  // Pick cap based on whether ANY image is landscape
  const hasLandscape = validDims.some(d => d.width / d.height >= 1);
  const maxH = hasLandscape ? MAX_CONTAINER_H_LANDSCAPE : MAX_CONTAINER_H_PORTRAIT;

  return Math.max(MIN_CONTAINER_H, Math.min(first.height, maxH));
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
  const plugins = typeof WheelGesturesPlugin === 'function' ? [WheelGesturesPlugin()] : [];
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: false,
    align: 'start',
    containScroll: 'keepSnaps',
    dragFree: true,
  }, plugins);

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);
  const rAFRef = useRef<number | null>(null);

  const getActiveIndex = useCallback(() => {
    if (!emblaApi) return 0;

    const slidesInView = emblaApi.slidesInView();
    if (slidesInView && slidesInView.length > 0) {
      if (slidesInView.length === 1) {
        return slidesInView[0];
      }

      const rootNode = emblaApi.rootNode();
      const slideNodes = emblaApi.slideNodes();

      if (rootNode && slideNodes && slideNodes.length > 0) {
        const rootRect = rootNode.getBoundingClientRect();
        const rootCenter = rootRect.left + rootRect.width / 2;

        let maxOverlap = -1;
        let minCenterDist = Infinity;
        let bestIndex = slidesInView[0];

        for (const idx of slidesInView) {
          const slideNode = slideNodes[idx];
          if (!slideNode) continue;

          const slideRect = slideNode.getBoundingClientRect();
          const overlap = Math.max(
            0,
            Math.min(slideRect.right, rootRect.right) - Math.max(slideRect.left, rootRect.left)
          );
          const slideCenter = slideRect.left + slideRect.width / 2;
          const dist = Math.abs(slideCenter - rootCenter);

          if (
            overlap > maxOverlap ||
            (Math.abs(overlap - maxOverlap) < 1 && dist < minCenterDist)
          ) {
            maxOverlap = overlap;
            minCenterDist = dist;
            bestIndex = idx;
          }
        }
        return bestIndex;
      }
      return slidesInView[0];
    }

    return Math.min(images.length - 1, Math.max(0, emblaApi.selectedScrollSnap()));
  }, [emblaApi, images.length]);

  const updateActiveState = useCallback(() => {
    if (!emblaApi) return;
    const activeIdx = getActiveIndex();
    setSelectedIndex(activeIdx);
    setCanScrollPrev(activeIdx > 0);
    setCanScrollNext(activeIdx < images.length - 1);
  }, [emblaApi, getActiveIndex, images.length]);

  const onScroll = useCallback(() => {
    if (rAFRef.current !== null) return;
    rAFRef.current = requestAnimationFrame(() => {
      rAFRef.current = null;
      updateActiveState();
    });
  }, [updateActiveState]);

  const onSettle = useCallback(() => {
    if (rAFRef.current !== null) {
      cancelAnimationFrame(rAFRef.current);
      rAFRef.current = null;
    }
    updateActiveState();
  }, [updateActiveState]);

  useEffect(() => {
    if (!emblaApi) return;

    updateActiveState();

    emblaApi.on("select", onSettle);
    emblaApi.on("scroll", onScroll);
    emblaApi.on("settle", onSettle);
    emblaApi.on("reInit", onSettle);
    emblaApi.on("slidesInView", onScroll);

    return () => {
      if (rAFRef.current !== null) {
        cancelAnimationFrame(rAFRef.current);
        rAFRef.current = null;
      }
      emblaApi.off("select", onSettle);
      emblaApi.off("scroll", onScroll);
      emblaApi.off("settle", onSettle);
      emblaApi.off("reInit", onSettle);
      emblaApi.off("slidesInView", onScroll);
    };
  }, [emblaApi, onScroll, onSettle, updateActiveState]);

  // Re-initialize Embla when images change or after mount/modal open layout shifts
  useEffect(() => {
    if (!emblaApi) return;
    const timer = setTimeout(() => {
      emblaApi.reInit();
      onSettle();
    }, 50);
    return () => clearTimeout(timer);
  }, [emblaApi, images, onSettle]);

  const scrollPrev = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (!emblaApi) return;
    const targetIdx = Math.max(0, selectedIndex - 1);
    emblaApi.scrollTo(targetIdx);
  }, [emblaApi, selectedIndex]);

  const scrollNext = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (!emblaApi) return;
    const targetIdx = Math.min(images.length - 1, selectedIndex + 1);
    emblaApi.scrollTo(targetIdx);
  }, [emblaApi, images.length, selectedIndex]);

  if (!images || images.length === 0) return null;

  // ── Dynamic sizing (X-style) vs legacy fixed height ──────────────────────
  const hasDimensions = imageDimensions && imageDimensions.some(Boolean);

  // Container height in px
  const containerH = hasDimensions
    ? computeContainerHeight(imageDimensions)
    : null; // null → use legacy viewportHeight class

  // Per-slide widths in px (null → use CSS percentage fallback)
  const slideWidths: (number | null)[] = images.map((_, i) =>
    hasDimensions
      ? computeSlideWidth(imageDimensions?.[i], containerH!, MAX_CONTAINER_W)
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
          <div className="flex h-full gap-2">
            {images.map((src, index) => {
              const sw = slideWidths[index];
              const slideStyle: React.CSSProperties = sw
                ? { width: `${sw}px`, flexShrink: 0, flexGrow: 0 }
                : {};
              const slideCls = sw
                ? "relative h-full rounded-[8px] border border-[var(--ds-media-border)] overflow-hidden select-none bg-ds-surface-2 transition-all duration-300 ease-in-out"
                : slideWidth === 'full'
                  ? "relative flex-[0_0_100%] min-w-0 h-full rounded-[8px] border border-[var(--ds-media-border)] overflow-hidden select-none bg-ds-surface-2 transition-all duration-300 ease-in-out"
                  : "relative flex-[0_0_80%] min-w-0 h-full rounded-[8px] border border-[var(--ds-media-border)] overflow-hidden select-none bg-ds-surface-2 transition-all duration-300 ease-in-out";
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
                    ? "absolute left-3 top-1/2 -translate-y-1/2 z-20 flex items-center justify-center w-8 h-8 rounded-full bg-black/60 hover:bg-black/80 text-white backdrop-blur-sm shadow-md transition-all duration-150 cursor-pointer outline-none active:scale-95"
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
                    ? "absolute right-3 top-1/2 -translate-y-1/2 z-20 flex items-center justify-center w-8 h-8 rounded-full bg-black/60 hover:bg-black/80 text-white backdrop-blur-sm shadow-md transition-all duration-150 cursor-pointer outline-none active:scale-95"
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
          imageDimensions={imageDimensions}
          onDotClick={(idx) => emblaApi?.scrollTo(idx)}
          className={dotsClassName || (arrowPlacement === 'inside' ? "py-3" : "mt-[12px]")}
        />
      )}
    </div>
  );
}

export default PostCarousel;

