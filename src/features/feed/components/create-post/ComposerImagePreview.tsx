'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Reorder } from 'framer-motion';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { Icon } from '@/components/icons';
import { MAX_MEDIA_WIDTH, MAX_MEDIA_HEIGHT } from '@/features/feed/utils/imageBounds';
import { CarouselDots } from '@/features/feed/components/parts/CarouselDots';

export interface ComposerImage {
  id: string;
  file: File;
  previewUrl: string;
  naturalWidth: number;
  naturalHeight: number;
  aspectRatio: number;
}

interface ComposerImagePreviewProps {
  images: ComposerImage[];
  activeIdx?: number;
  onSelectIdx?: (idx: number) => void;
  onRemoveImage: (id: string) => void;
  onReorderImages?: (newImages: ComposerImage[]) => void;
  onReplaceImage?: (id: string, file: File) => void;
  avatarUrl?: string | null;
  initial?: string;
  isEditMode?: boolean;
  showLimitNotice?: boolean;
}

export const MAX_COMPOSER_IMAGES = 12;

// Carousel item width: dynamic, clamped between 178px and 334px based on image count
// With 1 image (single-image branch handles this), but for multi:
// - 1 image shown wide → 334px
// - Many images → minimum 178px
// Formula: unconstrained width = availableWidth / Math.min(count, 2.4), clamped [178, 334]
const CAROUSEL_ITEM_HEIGHT = 223; // px — fixed per spec
const CAROUSEL_GAP = 8;           // px — between items
const CAROUSEL_MIN_WIDTH = 178;   // px
const CAROUSEL_MAX_WIDTH = 334;   // px

function getItemWidth(count: number, containerWidth: number): number {
  if (count <= 1) return Math.min(containerWidth, CAROUSEL_MAX_WIDTH);
  // Show ~1.8 items at a time so user sees there's more
  const rawWidth = (containerWidth - CAROUSEL_GAP * (Math.min(count, 2) - 1)) / Math.min(count, 1.8);
  return Math.max(CAROUSEL_MIN_WIDTH, Math.min(CAROUSEL_MAX_WIDTH, Math.round(rawWidth)));
}

export const ComposerImagePreview = ({
  images,
  onRemoveImage,
  onReorderImages,
  isEditMode,
  showLimitNotice = false,
}: ComposerImagePreviewProps) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const outerWrapperRef = useRef<HTMLDivElement>(null);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);
  const [activeScrollIdx, setActiveScrollIdx] = useState(0);
  const [containerWidth, setContainerWidth] = useState(334);
  // Fixed-position coordinates for the right chevron (escapes overflow-y:auto clip)
  const [rightChevronPos, setRightChevronPos] = useState<{ top: number; left: number } | null>(null);

  const itemWidth = getItemWidth(images.length, containerWidth);

  // Update the fixed-position right-chevron coordinates from the carousel's bounding rect.
  // position:fixed escapes overflow-y:auto clipping on ancestor containers.
  const updateRightChevronPos = useCallback(() => {
    const scrollEl = scrollContainerRef.current;
    const wrapperEl = outerWrapperRef.current;
    if (!scrollEl || !wrapperEl) { setRightChevronPos(null); return; }
    const scrollRect = scrollEl.getBoundingClientRect();
    const wrapperRect = wrapperEl.getBoundingClientRect();
    setRightChevronPos({
      top: scrollRect.top + scrollRect.height / 2,
      left: wrapperRect.right + 6,
    });
  }, []);

  const checkScrollability = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    const atStart = scrollLeft <= 4;
    const atEnd = scrollLeft >= scrollWidth - clientWidth - 4;
    setCanScrollPrev(!atStart);
    setCanScrollNext(!atEnd);
    // Clamp to first/last index at scroll boundaries so the dot always reaches
    // the end even when the physical max scrollLeft < (n-1) × stepWidth.
    if (atEnd) {
      setActiveScrollIdx(images.length - 1);
    } else if (atStart) {
      setActiveScrollIdx(0);
    } else {
      const stepWidth = itemWidth + CAROUSEL_GAP;
      const idx = Math.round(scrollLeft / stepWidth);
      setActiveScrollIdx(Math.max(0, Math.min(idx, images.length - 1)));
    }
    // Keep fixed chevron in sync with carousel position
    updateRightChevronPos();
  }, [itemWidth, images.length, updateRightChevronPos]);

  useEffect(() => {
    checkScrollability();
    const el = scrollContainerRef.current;
    if (!el) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerWidth(entry.contentRect.width);
      }
      checkScrollability();
    });
    resizeObserver.observe(el);

    // Keep right-chevron in sync on window resize or any ancestor scroll
    const handleWindowChange = () => updateRightChevronPos();
    window.addEventListener('resize', handleWindowChange, { passive: true });
    window.addEventListener('scroll', handleWindowChange, { passive: true, capture: true });

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', handleWindowChange);
      window.removeEventListener('scroll', handleWindowChange, { capture: true });
    };
  }, [checkScrollability, updateRightChevronPos, images.length]);

  const scrollPrev = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    const el = scrollContainerRef.current;
    if (el) {
      el.scrollBy({ left: -188, behavior: 'smooth' });
    }
  }, []);

  const scrollNext = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    const el = scrollContainerRef.current;
    if (el) {
      el.scrollBy({ left: 188, behavior: 'smooth' });
    }
  }, []);

  // Handle trackpad/mouse wheel vertical scroll as horizontal scroll
  const handleWheel = useCallback((e: React.WheelEvent<HTMLDivElement>) => {
    if (Math.abs(e.deltaY) > Math.abs(e.deltaX) && e.deltaY !== 0) {
      const el = scrollContainerRef.current;
      if (el) {
        el.scrollLeft += e.deltaY;
        checkScrollability();
      }
    }
  }, [checkScrollability]);

  if (!images || images.length === 0) return null;

  const isMaxReached = images.length >= MAX_COMPOSER_IMAGES;

  // ── Single Image View ─────────────────────────────────────────────────────
  if (images.length === 1) {
    const singleImage = images[0];
    return (
      <div className="w-full flex flex-col items-start gap-1 select-none">
        <div className="w-full flex justify-start items-center">
          <div
            className="relative group overflow-hidden rounded-2xl flex items-center justify-start"
            style={{
              maxWidth: `${MAX_MEDIA_WIDTH}px`,
              maxHeight: `${MAX_MEDIA_HEIGHT}px`,
            }}
          >
            <img
              src={singleImage.previewUrl}
              alt="Selected photo"
              className="w-full h-auto object-contain rounded-2xl block"
              style={{
                maxWidth: `${MAX_MEDIA_WIDTH}px`,
                maxHeight: `${MAX_MEDIA_HEIGHT}px`,
              }}
            />

            {!isEditMode && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemoveImage(singleImage.id);
                }}
                className="absolute top-[8px] right-[8px] w-[32px] h-[32px] flex items-center justify-center bg-[var(--ds-surface-1)] hover:brightness-110 rounded-full transition-colors z-30 shadow-md cursor-pointer outline-none"
                aria-label="Remove photo"
                title="Remove photo"
              >
                <X className="w-[20px] h-[20px] text-[var(--ds-text-primary)]" />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── Multiple Images: Reorderable Side-by-Side Cards (Drag & Reorder with Slidethrough) ───────
  return (
    <div className="w-full flex flex-col items-start gap-1 select-none">
      <div ref={outerWrapperRef} className="relative w-full max-w-[442px] overflow-visible">
        {/* Scrollable Viewport with Reorder.Group */}
        <div
          ref={scrollContainerRef}
          onScroll={checkScrollability}
          onWheel={handleWheel}
          className="w-full overflow-x-auto scrollbar-hide py-1"
          style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
          }}
        >
          <Reorder.Group
            axis="x"
            values={images}
            onReorder={(newOrder) => onReorderImages?.(newOrder)}
            className="flex flex-row"
            style={{ display: 'flex', flexDirection: 'row' }}
          >
            {images.map((img) => (
              <Reorder.Item
                key={img.id}
                value={img}
                onContextMenu={(e) => e.preventDefault()}
                className="relative group min-w-0 rounded-[16px] overflow-hidden bg-ds-surface-2 select-none [-webkit-touch-callout:none] flex-shrink-0 cursor-grab active:cursor-grabbing will-change-transform"
                style={{
                  width: `${itemWidth}px`,
                  height: `${CAROUSEL_ITEM_HEIGHT}px`,
                  marginRight: `${CAROUSEL_GAP}px`,
                  WebkitTouchCallout: 'none',
                }}
                whileDrag={{
                  scale: 1.05,
                  zIndex: 50,
                  boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.4), 0 8px 10px -6px rgba(0, 0, 0, 0.3)',
                }}
                transition={{ type: 'spring', stiffness: 450, damping: 35 }}
              >
                {/* object-fit: cover — images may be cropped/upscaled but never distorted */}
                <img
                  src={img.previewUrl}
                  alt="Selected photo"
                  className="w-full h-full object-cover rounded-[16px] block pointer-events-none select-none"
                  draggable={false}
                />

                {/* Remove photo button (Top-right circular cross) */}
                {!isEditMode && (
                  <button
                    type="button"
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveImage(img.id);
                    }}
                    className="absolute top-[8px] right-[8px] w-[32px] h-[32px] flex items-center justify-center bg-[var(--ds-surface-1)] hover:brightness-110 rounded-full transition-colors z-30 shadow-md cursor-pointer outline-none"
                    aria-label="Remove photo"
                    title="Remove photo"
                  >
                    <X className="w-[20px] h-[20px] text-[var(--ds-text-primary)]" />
                  </button>
                )}
              </Reorder.Item>
            ))}
          </Reorder.Group>
        </div>

        {/* Scroll Left Chevron — sits in the pl-[44px] margin space, plain icon per design */}
        {canScrollPrev && (
          <button
            type="button"
            onClick={scrollPrev}
            className="absolute -left-7 md:-left-8 top-1/2 -translate-y-1/2 z-20 flex items-center justify-center cursor-pointer outline-none text-ds-text-primary hover:opacity-80 transition-opacity"
            aria-label="Scroll left"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        )}

        {/* Right Chevron: rendered via position:fixed so it escapes overflow-y:auto ancestors.
            This matches the Figma design where the arrow floats outside the card boundary. */}
        {canScrollNext && rightChevronPos && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); scrollNext(e as any); }}
            className="flex items-center justify-center cursor-pointer outline-none text-ds-text-primary hover:opacity-80 transition-opacity"
            style={{
              position: 'fixed',
              top: rightChevronPos.top,
              left: rightChevronPos.left,
              transform: 'translateY(-50%)',
              zIndex: 200,
              pointerEvents: 'auto',
            }}
            aria-label="Scroll right"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Carousel Dot Indicators — shown below carousel when multiple images are attached */}
      <CarouselDots
        total={images.length}
        activeIndex={activeScrollIdx}
        className="mt-[6px]"
      />

      {/* Limit Notice (Only shown if showLimitNotice is explicitly true) */}
      {showLimitNotice && isMaxReached && (
        <p className="w-full text-left text-[12px] text-[var(--ds-error)] font-medium pl-0.5 pt-1">
          Attached media limit reached({MAX_COMPOSER_IMAGES}/{MAX_COMPOSER_IMAGES})
        </p>
      )}
    </div>
  );
};

export default ComposerImagePreview;
