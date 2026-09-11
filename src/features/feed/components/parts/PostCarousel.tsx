"use client";

import React, { useState, useEffect, useCallback } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { WheelGesturesPlugin } from "embla-carousel-wheel-gestures";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { CarouselDots } from "./CarouselDots";

export interface PostCarouselProps {
  images: string[];
  priority?: boolean;
  aspectRatio?: string | number;
  onImageLoad?: (event: React.SyntheticEvent<HTMLImageElement>) => void;
  imageFit?: 'cover' | 'contain';
  showDots?: boolean;
  viewportHeight?: string;
  overlay?: React.ReactNode;
  className?: string;
}

export function PostCarousel({
  images,
  priority = false,
  onImageLoad,
  imageFit = 'cover',
  showDots = true,
  viewportHeight = 'h-full',
  overlay,
  className = '',
}: PostCarouselProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: false,
    align: 'start',
    containScroll: 'trimSnaps',
    dragFree: true,
  }, [WheelGesturesPlugin()]);

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
    setCanScrollPrev(emblaApi.canScrollPrev());
    setCanScrollNext(emblaApi.canScrollNext());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on("select", onSelect);
    emblaApi.on("scroll", onSelect);
    emblaApi.on("settle", onSelect);
    emblaApi.on("reInit", onSelect);
    return () => {
      emblaApi.off("select", onSelect);
      emblaApi.off("scroll", onSelect);
      emblaApi.off("settle", onSelect);
      emblaApi.off("reInit", onSelect);
    };
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

  const isFullHeight = viewportHeight === 'h-full';
  const sliderHeightClass = isFullHeight
    ? (showDots && images.length > 1 ? 'flex-1 min-h-0' : 'h-full')
    : viewportHeight;

  return (
    <div className={`relative w-full flex flex-col items-center select-none ${className}`}>
      {/* Media Slider Viewport */}
      <div className={`relative w-full ${sliderHeightClass} group select-none`}>
        {/* Embla Viewport */}
        <div className="w-full h-full overflow-hidden" ref={emblaRef}>
          <div className="flex h-full">
            {images.map((src, index) => (
              <div
                key={index}
                className="relative flex-[0_0_80%] min-w-0 h-full rounded-[16px] overflow-hidden mr-2.5 select-none bg-ds-surface-2 transition-all duration-300 ease-in-out"
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
                type="button"
                onClick={scrollPrev}
                className="absolute -left-[44px] top-1/2 -translate-y-1/2 z-20 flex items-center justify-center w-8 h-8 rounded-full text-ds-text-primary hover:bg-ds-surface-2 transition-all duration-150 cursor-pointer outline-none"
                aria-label="Previous photo"
              >
                <ChevronLeft className="w-5 h-5 text-ds-text-primary" />
              </button>
            )}
            {canScrollNext && (
              <button
                type="button"
                onClick={scrollNext}
                className="absolute -right-[44px] top-1/2 -translate-y-1/2 z-20 flex items-center justify-center w-8 h-8 rounded-full text-ds-text-primary hover:bg-ds-surface-2 transition-all duration-150 cursor-pointer outline-none"
                aria-label="Next photo"
              >
                <ChevronRight className="w-5 h-5 text-ds-text-primary" />
              </button>
            )}
          </>
        )}

        {/* Overlay elements (e.g. Tagged people badge) */}
        {overlay}
      </div>

      {/* Instagram-style Carousel Indicator Dots */}
      {showDots && images.length > 1 && (
        <CarouselDots
          total={images.length}
          activeIndex={selectedIndex}
          onDotClick={(idx) => emblaApi?.scrollTo(idx)}
          className="mt-[12px]"
        />
      )}
    </div>
  );
}

export default PostCarousel;

