"use client";

import React, { useState, useEffect, useCallback } from "react";
import useEmblaCarousel from "embla-carousel-react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface PostCarouselProps {
  images: string[];
  priority?: boolean;
  aspectRatio?: string | number;
  onImageLoad?: (event: React.SyntheticEvent<HTMLImageElement>) => void;
  imageFit?: 'cover' | 'contain';
}

export function PostCarousel({
  images,
  priority = false,
  aspectRatio,
  onImageLoad,
  imageFit,
}: PostCarouselProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: false });
  const [currentIndex, setCurrentIndex] = useState(0);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setCurrentIndex(emblaApi.selectedScrollSnap());
    setCanScrollPrev(emblaApi.canScrollPrev());
    setCanScrollNext(emblaApi.canScrollNext());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);
  }, [emblaApi, onSelect]);

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  const scrollTo = useCallback(
    (index: number) => {
      if (emblaApi) emblaApi.scrollTo(index);
    },
    [emblaApi]
  );

  if (!images || images.length === 0) return null;

  return (
    <div className="relative w-full h-full group overflow-hidden bg-zinc-900 flex items-center justify-center">
      {/* 1 / N Indicator */}
      {images.length > 1 && (
        <div className="absolute top-3 right-3 z-20 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-white text-[11px] font-semibold tracking-wider transition-opacity duration-300 group-hover:opacity-100 opacity-0 md:opacity-0">
          {currentIndex + 1} / {images.length}
        </div>
      )}

      {/* Main Carousel Viewport */}
      <div className="w-full h-full overflow-hidden" ref={emblaRef}>
        <div className="flex h-full">
          {images.map((src, index) => (
            <div
              key={index}
              className="relative flex-[0_0_100%] min-w-0 h-full flex items-center justify-center"
            >
              <Image
                src={src}
                alt={`Post image ${index + 1}`}
                fill
                className={imageFit === 'contain' ? "object-contain bg-black/5 dark:bg-white/5" : "object-cover"}
                priority={priority && index === 0}
                sizes="(max-width: 768px) 100vw, 600px"
                onLoad={(e) => {
                  if (index === 0 && onImageLoad) onImageLoad(e);
                }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Navigation Arrows */}
      {images.length > 1 && (
        <>
          {canScrollPrev && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                scrollPrev();
              }}
              className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-8 h-8 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/40 backdrop-blur-md border border-white/20 text-white transition-all duration-200 hover:scale-110 opacity-0 group-hover:opacity-100 hidden md:flex"
            >
              <ChevronLeft className="w-5 h-5 shadow-sm" />
            </button>
          )}
          {canScrollNext && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                scrollNext();
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-8 h-8 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/40 backdrop-blur-md border border-white/20 text-white transition-all duration-200 hover:scale-110 opacity-0 group-hover:opacity-100 hidden md:flex"
            >
              <ChevronRight className="w-5 h-5 shadow-sm" />
            </button>
          )}
        </>
      )}

      {/* Pagination Dots */}
      {images.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-1.5 transition-opacity duration-300">
          {images.map((_, index) => (
            <button
              key={index}
              onClick={(e) => {
                e.stopPropagation();
                scrollTo(index);
              }}
              className={cn(
                "w-1.5 h-1.5 rounded-full transition-all duration-300",
                currentIndex === index
                  ? "bg-white scale-125 shadow-[0_0_8px_rgba(255,255,255,0.5)]"
                  : "bg-white/40 hover:bg-white/60"
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
}
