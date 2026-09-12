'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Reorder } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Icon } from '@/components/icons';
import { MAX_MEDIA_WIDTH, MAX_MEDIA_HEIGHT } from '@/features/feed/utils/imageBounds';

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
}

export const MAX_COMPOSER_IMAGES = 12;

export const ComposerImagePreview = ({
  images,
  onRemoveImage,
  onReorderImages,
  isEditMode,
}: ComposerImagePreviewProps) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  const checkScrollability = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanScrollPrev(scrollLeft > 4);
    setCanScrollNext(scrollLeft < scrollWidth - clientWidth - 4);
  }, []);

  useEffect(() => {
    checkScrollability();
    const el = scrollContainerRef.current;
    if (!el) return;

    const resizeObserver = new ResizeObserver(checkScrollability);
    resizeObserver.observe(el);

    return () => {
      resizeObserver.disconnect();
    };
  }, [checkScrollability, images.length]);

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
                className="absolute top-3 right-3 w-8 h-8 rounded-full bg-ds-surface-2/90 hover:bg-ds-surface-2 border border-ds-border/40 text-[var(--ds-error)] flex items-center justify-center z-10 transition-all duration-150 hover:scale-105 active:scale-95 shadow-md cursor-pointer outline-none ring-0 focus-visible:ring-2 focus-visible:ring-[var(--ds-accent)]"
                aria-label="Remove photo"
                title="Remove photo"
              >
                <Icon name="cancel" className="w-4 h-4 text-[var(--ds-error)]" />
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
      <div className="relative w-full max-w-[442px] overflow-visible">
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
                className="relative group flex-[0_0_178px] min-w-0 h-[223px] rounded-[16px] overflow-hidden bg-ds-surface-2 select-none flex-shrink-0 mr-[10px] cursor-grab active:cursor-grabbing will-change-transform"
                whileDrag={{
                  scale: 1.05,
                  zIndex: 50,
                  boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.4), 0 8px 10px -6px rgba(0, 0, 0, 0.3)',
                }}
                transition={{ type: 'spring', stiffness: 450, damping: 35 }}
              >
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
                    className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full bg-ds-surface-2/90 hover:bg-ds-surface-2 border border-ds-border/40 text-[var(--ds-error)] flex items-center justify-center z-10 transition-all duration-150 hover:scale-105 active:scale-95 shadow-md cursor-pointer outline-none ring-0 focus-visible:ring-2 focus-visible:ring-[var(--ds-accent)]"
                    aria-label="Remove photo"
                    title="Remove photo"
                  >
                    <Icon name="cancel" className="w-3.5 h-3.5 text-[var(--ds-error)]" />
                  </button>
                )}
              </Reorder.Item>
            ))}
          </Reorder.Group>
        </div>

        {/* Scroll Left Chevron (Positioned outside on left in margin) */}
        {canScrollPrev && (
          <button
            type="button"
            onClick={scrollPrev}
            className="absolute -left-7 md:-left-8 top-1/2 -translate-y-1/2 z-20 flex items-center justify-center p-1 text-ds-text-primary hover:opacity-80 transition-all duration-150 hover:scale-110 active:scale-95 cursor-pointer outline-none"
            aria-label="Scroll left"
          >
            <ChevronLeft className="w-6 h-6 text-ds-text-primary" />
          </button>
        )}

        {/* Scroll Right Chevron (Positioned outside on right in margin) */}
        {canScrollNext && (
          <button
            type="button"
            onClick={scrollNext}
            className="absolute -right-7 md:-right-8 top-1/2 -translate-y-1/2 z-20 flex items-center justify-center p-1 text-ds-text-primary hover:opacity-80 transition-all duration-150 hover:scale-110 active:scale-95 cursor-pointer outline-none"
            aria-label="Scroll right"
          >
            <ChevronRight className="w-6 h-6 text-ds-text-primary" />
          </button>
        )}
      </div>

      {/* Limit Notice (Positioned directly below card 1) */}
      {isMaxReached && (
        <p className="w-full text-left text-[12px] text-[var(--ds-error)] font-medium pl-0.5 pt-1">
          Attached media limit reached({MAX_COMPOSER_IMAGES}/{MAX_COMPOSER_IMAGES})
        </p>
      )}
    </div>
  );
};

export default ComposerImagePreview;
