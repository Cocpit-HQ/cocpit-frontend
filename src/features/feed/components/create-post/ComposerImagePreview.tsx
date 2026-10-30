'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Reorder } from 'framer-motion';
import { ChevronLeft, ChevronRight, X, Play } from 'lucide-react';
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
  type?: 'image' | 'video';
  duration?: number;
  thumbnailUrl?: string;
  thumbnailBlob?: Blob;
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

// Carousel item width: dynamic, clamped between 178px and 334px based on media count
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

const formatDuration = (seconds?: number): string => {
  if (!seconds || isNaN(seconds) || seconds <= 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

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
    if (atEnd) {
      setActiveScrollIdx(images.length - 1);
    } else if (atStart) {
      setActiveScrollIdx(0);
    } else {
      const stepWidth = itemWidth + CAROUSEL_GAP;
      const idx = Math.round(scrollLeft / stepWidth);
      setActiveScrollIdx(Math.max(0, Math.min(idx, images.length - 1)));
    }
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

  // ── Single Item View ──────────────────────────────────────────────────────
  if (images.length === 1) {
    const singleItem = images[0];
    const isVideo = singleItem.type === 'video' || singleItem.file?.type?.startsWith('video/');
    return (
      <div className="w-full flex flex-col items-start gap-1 select-none">
        <div className="w-full flex justify-start items-center">
          <div
            className="relative group overflow-hidden rounded-2xl flex items-center justify-start bg-black/5"
            style={{
              maxWidth: `${MAX_MEDIA_WIDTH}px`,
              maxHeight: `${MAX_MEDIA_HEIGHT}px`,
            }}
          >
            {isVideo ? (
              <div className="relative w-full h-full flex items-center justify-center">
                <video
                  src={singleItem.previewUrl.startsWith('blob:') ? singleItem.previewUrl : `${singleItem.previewUrl}#t=0.001`}
                  preload="metadata"
                  muted
                  playsInline
                  className="w-full h-auto object-contain rounded-2xl block pointer-events-none select-none"
                  style={{
                    maxWidth: `${MAX_MEDIA_WIDTH}px`,
                    maxHeight: `${MAX_MEDIA_HEIGHT}px`,
                  }}
                />
                {singleItem.thumbnailUrl && (
                  <img
                    src={singleItem.thumbnailUrl}
                    alt="Selected video"
                    className="absolute inset-0 w-full h-auto object-contain rounded-2xl block pointer-events-none select-none"
                    style={{
                      maxWidth: `${MAX_MEDIA_WIDTH}px`,
                      maxHeight: `${MAX_MEDIA_HEIGHT}px`,
                    }}
                    onError={(e) => {
                      (e.currentTarget as HTMLElement).style.display = 'none';
                    }}
                  />
                )}
              </div>
            ) : (
              <img
                src={singleItem.previewUrl}
                alt="Selected photo"
                className="w-full h-auto object-contain rounded-2xl block"
                style={{
                  maxWidth: `${MAX_MEDIA_WIDTH}px`,
                  maxHeight: `${MAX_MEDIA_HEIGHT}px`,
                }}
              />
            )}

            {/* Video Play Badge & Duration Overlay */}
            {isVideo && (
              <>
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-12 h-12 rounded-full bg-black/60 flex items-center justify-center text-white backdrop-blur-sm shadow-md">
                    <Play className="w-6 h-6 fill-white text-white ml-0.5" />
                  </div>
                </div>
                {singleItem.duration ? (
                  <div className="absolute bottom-3 right-3 bg-black/75 backdrop-blur-sm text-white text-[12px] font-medium px-2 py-0.5 rounded-md pointer-events-none select-none">
                    {formatDuration(singleItem.duration)}
                  </div>
                ) : null}
              </>
            )}

            {!isEditMode && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemoveImage(singleItem.id);
                }}
                className="absolute top-[8px] right-[8px] w-[32px] h-[32px] flex items-center justify-center bg-[var(--ds-surface-1)] hover:brightness-110 rounded-full transition-colors z-30 shadow-md cursor-pointer outline-none"
                aria-label={isVideo ? "Remove video" : "Remove photo"}
                title={isVideo ? "Remove video" : "Remove photo"}
              >
                <X className="w-[20px] h-[20px] text-[var(--ds-text-primary)]" />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── Multiple Items: Reorderable Side-by-Side Cards (Drag & Reorder with Slidethrough) ───────
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
            {images.map((img) => {
              const isVideo = img.type === 'video' || img.file?.type?.startsWith('video/');
              return (
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
                  {/* object-fit: cover */}
                  {isVideo ? (
                    <div className="w-full h-full relative">
                      <video
                        src={img.previewUrl.startsWith('blob:') ? img.previewUrl : `${img.previewUrl}#t=0.001`}
                        preload="metadata"
                        muted
                        playsInline
                        className="w-full h-full object-cover rounded-[16px] block pointer-events-none select-none"
                      />
                      {img.thumbnailUrl && (
                        <img
                          src={img.thumbnailUrl}
                          alt="Selected video"
                          className="absolute inset-0 w-full h-full object-cover rounded-[16px] block pointer-events-none select-none"
                          draggable={false}
                          onError={(e) => {
                            (e.currentTarget as HTMLElement).style.display = 'none';
                          }}
                        />
                      )}
                    </div>
                  ) : (
                    <img
                      src={img.previewUrl}
                      alt="Selected photo"
                      className="w-full h-full object-cover rounded-[16px] block pointer-events-none select-none"
                      draggable={false}
                    />
                  )}

                  {/* Video Play Badge & Duration */}
                  {isVideo && (
                    <>
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="w-10 h-10 rounded-full bg-black/60 flex items-center justify-center text-white backdrop-blur-sm shadow-md">
                          <Play className="w-5 h-5 fill-white text-white ml-0.5" />
                        </div>
                      </div>
                      {img.duration ? (
                        <div className="absolute bottom-2 right-2 bg-black/75 backdrop-blur-sm text-white text-[11px] font-medium px-1.5 py-0.5 rounded pointer-events-none select-none">
                          {formatDuration(img.duration)}
                        </div>
                      ) : null}
                    </>
                  )}

                  {/* Remove photo/video button */}
                  {!isEditMode && (
                    <button
                      type="button"
                      onPointerDown={(e) => e.stopPropagation()}
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemoveImage(img.id);
                      }}
                      className="absolute top-[8px] right-[8px] w-[32px] h-[32px] flex items-center justify-center bg-[var(--ds-surface-1)] hover:brightness-110 rounded-full transition-colors z-30 shadow-md cursor-pointer outline-none"
                      aria-label={isVideo ? "Remove video" : "Remove photo"}
                      title={isVideo ? "Remove video" : "Remove photo"}
                    >
                      <X className="w-[20px] h-[20px] text-[var(--ds-text-primary)]" />
                    </button>
                  )}
                </Reorder.Item>
              );
            })}
          </Reorder.Group>
        </div>

        {/* Scroll Left Chevron */}
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

        {/* Right Chevron */}
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

      {/* Carousel Dot Indicators */}
      <CarouselDots
        total={images.length}
        activeIndex={activeScrollIdx}
        className="mt-[6px]"
      />

      {/* Limit Notice */}
      {showLimitNotice && isMaxReached && (
        <p className="w-full text-left text-[12px] text-[var(--ds-error)] font-medium pl-0.5 pt-1">
          Attached media limit reached({MAX_COMPOSER_IMAGES}/{MAX_COMPOSER_IMAGES})
        </p>
      )}
    </div>
  );
};

export default ComposerImagePreview;
