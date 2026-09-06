"use client";

import React, { useState, useEffect, useCallback } from "react";
import useEmblaCarousel from "embla-carousel-react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";

export interface PostCarouselProps {
  images: string[];
  priority?: boolean;
  aspectRatio?: string | number;
  onImageLoad?: (event: React.SyntheticEvent<HTMLImageElement>) => void;
  imageFit?: 'cover' | 'contain';
}

export function PostCarousel({
  images,
  priority = false,
  onImageLoad,
  imageFit = 'cover',
}: PostCarouselProps) {
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
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);
  }, [emblaApi, onSelect]);

  const scrollPrev = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  if (!images || images.length === 0) return null;

  return (
    <div className="relative w-full h-full group select-none">
      {/* Embla Viewport */}
      <div className="w-full h-full overflow-hidden" ref={emblaRef}>
        <div className="flex h-full">
          {images.map((src, index) => (
            <div
              key={index}
              className="relative flex-[0_0_80%] min-w-0 h-full rounded-[16px] overflow-hidden mr-2.5 select-none bg-zinc-900 transition-all duration-300 ease-in-out"
            >
              <Image
                src={src}
                alt={`Post image ${index + 1}`}
                fill
                className={imageFit === 'contain' ? "object-contain rounded-[16px] transition-transform duration-300 ease-out" : "object-cover rounded-[16px] transition-transform duration-300 ease-out"}
                priority={priority && index === 0}
                sizes="(max-width: 768px) 80vw, 400px"
                onLoad={(e) => {
                  if (index === 0 && onImageLoad) onImageLoad(e);
                }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Navigation Arrows — Sleek borderless chevrons positioned outside the images */}
      {images.length > 1 && (
        <>
          {canScrollPrev && (
            <button
              onClick={scrollPrev}
              className="absolute -left-7 md:-left-8 top-1/2 -translate-y-1/2 z-20 flex items-center justify-center p-1 text-white/90 hover:text-white transition-all duration-150 hover:scale-110 cursor-pointer outline-none"
              aria-label="Previous photo"
            >
              <ChevronLeft className="w-6 h-6 text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]" />
            </button>
          )}
          {canScrollNext && (
            <button
              onClick={scrollNext}
              className="absolute -right-7 md:-right-8 top-1/2 -translate-y-1/2 z-20 flex items-center justify-center p-1 text-white/90 hover:text-white transition-all duration-150 hover:scale-110 cursor-pointer outline-none"
              aria-label="Next photo"
            >
              <ChevronRight className="w-6 h-6 text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]" />
            </button>
          )}
        </>
      )}
    </div>
  );
}

export default PostCarousel;
