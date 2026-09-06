'use client';

import React, { useState, useEffect, useCallback } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
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
  onReplaceImage?: (id: string, file: File) => void;
  avatarUrl?: string | null;
  initial?: string;
  isEditMode?: boolean;
}

export const MAX_COMPOSER_IMAGES = 12;

export const ComposerImagePreview = ({
  images,
  onRemoveImage,
  isEditMode,
}: ComposerImagePreviewProps) => {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: false,
    align: 'start',
    containScroll: 'trimSnaps',
    dragFree: false,
  });

  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setCanScrollPrev(emblaApi.canScrollPrev());
    setCanScrollNext(emblaApi.canScrollNext());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on('select', onSelect);
    emblaApi.on('reInit', onSelect);
  }, [emblaApi, onSelect, images.length]);

  const scrollPrev = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  if (!images || images.length === 0) return null;

  const isMaxReached = images.length >= MAX_COMPOSER_IMAGES;

  // ── Single Image View ─────────────────────────────────────────────────────
  if (images.length === 1) {
    const singleImage = images[0];
    return (
      <div className="w-full flex flex-col items-start gap-1 select-none">
        <div className="w-full flex justify-center items-center">
          <div
            className="relative group overflow-hidden rounded-2xl flex items-center justify-center"
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

            {/* Hover Action Overlay (Delete text only, zero blur, crisp image) */}
            {!isEditMode && (
              <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-200 ease-in-out flex items-center justify-center z-10 rounded-2xl">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveImage(singleImage.id);
                  }}
                  className="cursor-pointer outline-none transition-transform duration-200 ease-out hover:scale-110 active:scale-95 select-none py-1.5 px-3 rounded-full hover:bg-black/30"
                  title="Delete photo"
                >
                  <span className="text-[14px] font-semibold text-[#FF3B30] tracking-wide drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)] no-underline">
                    Delete
                  </span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── Multiple Images: Side-by-Side Cards (2 Full Cards + 3rd Peeking) ───────
  return (
    <div className="w-full flex flex-col items-start gap-1 select-none">
      <div className="relative w-full max-w-[442px] overflow-visible">
        {/* Embla Viewport for Side-by-Side Cards with Smooth Dragging/Physics */}
        <div className="w-full overflow-hidden" ref={emblaRef}>
          <div className="flex py-0.5">
            {images.map((img) => (
              <div
                key={img.id}
                className="relative group flex-[0_0_178px] min-w-0 h-[223px] rounded-[16px] overflow-hidden bg-zinc-900 select-none flex-shrink-0 mr-[10px]"
              >
                <img
                  src={img.previewUrl}
                  alt="Selected photo"
                  className="w-full h-full object-cover rounded-[16px] block"
                />

                {/* Hover Action Overlay (Crisp image, smooth fade delete text) */}
                {!isEditMode && (
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-200 ease-in-out flex items-center justify-center z-10 rounded-[16px]">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemoveImage(img.id);
                      }}
                      className="cursor-pointer outline-none transition-transform duration-200 ease-out hover:scale-110 active:scale-95 select-none py-1.5 px-3 rounded-full hover:bg-black/30"
                      title="Delete photo"
                    >
                      <span className="text-[14px] font-semibold text-[#FF3B30] tracking-wide drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)] no-underline">
                        Delete
                      </span>
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Scroll Left Chevron (Positioned outside on left in margin) */}
        {canScrollPrev && (
          <button
            type="button"
            onClick={scrollPrev}
            className="absolute -left-7 md:-left-8 top-1/2 -translate-y-1/2 z-20 flex items-center justify-center p-1 text-white/90 hover:text-white transition-all duration-150 hover:scale-110 active:scale-95 cursor-pointer outline-none"
            aria-label="Scroll left"
          >
            <ChevronLeft className="w-6 h-6 text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]" />
          </button>
        )}

        {/* Scroll Right Chevron (Positioned outside on right in margin) */}
        {canScrollNext && (
          <button
            type="button"
            onClick={scrollNext}
            className="absolute -right-7 md:-right-8 top-1/2 -translate-y-1/2 z-20 flex items-center justify-center p-1 text-white/90 hover:text-white transition-all duration-150 hover:scale-110 active:scale-95 cursor-pointer outline-none"
            aria-label="Scroll right"
          >
            <ChevronRight className="w-6 h-6 text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]" />
          </button>
        )}
      </div>

      {/* Limit Notice (Positioned directly below card 1) */}
      {isMaxReached && (
        <p className="w-full text-left text-[12px] text-[#EF4444] font-medium pl-0.5 pt-1">
          Attached media limit reached({MAX_COMPOSER_IMAGES}/{MAX_COMPOSER_IMAGES})
        </p>
      )}
    </div>
  );
};

export default ComposerImagePreview;
