"use client";

import React, { useCallback, useEffect, useState, forwardRef } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
// @ts-ignore
import { WheelGesturesPlugin } from 'embla-carousel-wheel-gestures';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

export interface DragScrollContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  containerClassName?: string;
  dragFree?: boolean;
}

export const DragScrollContainer = forwardRef<HTMLDivElement, DragScrollContainerProps>(
  (
    {
      children,
      className,
      containerClassName,
      style,
      dragFree = true,
      ...props
    },
    forwardedRef
  ) => {
    const isMobile = useIsMobile();
    const [isDragging, setIsDragging] = useState(false);

    const plugins = React.useMemo(() => {
      if (typeof window === 'undefined') return [];
      if (typeof WheelGesturesPlugin !== 'function') return [];
      if (isMobile) return [];
      return [WheelGesturesPlugin()];
    }, [isMobile]);

    const [emblaRef, emblaApi] = useEmblaCarousel(
      {
        loop: false,
        align: 'start',
        containScroll: 'trimSnaps',
        dragFree,
        duration: 25,
        skipSnaps: false,
      },
      plugins
    );

    // Synchronize forwarded ref with the Embla viewport
    const setViewportRef = useCallback(
      (node: HTMLDivElement | null) => {
        emblaRef(node);
        if (typeof forwardedRef === 'function') {
          forwardedRef(node);
        } else if (forwardedRef) {
          (forwardedRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
        }
      },
      [emblaRef, forwardedRef]
    );

    // Track dragging state for dynamic cursor feedback
    useEffect(() => {
      if (!emblaApi) return;
      const onPointerDown = () => setIsDragging(true);
      const onPointerUp = () => setIsDragging(false);

      emblaApi.on('pointerDown', onPointerDown);
      emblaApi.on('pointerUp', onPointerUp);

      return () => {
        emblaApi.off('pointerDown', onPointerDown);
        emblaApi.off('pointerUp', onPointerUp);
      };
    }, [emblaApi]);

    // Re-initialize Embla whenever children update (e.g. skeleton -> loaded cards)
    useEffect(() => {
      if (emblaApi) {
        emblaApi.reInit();
      }
    }, [emblaApi, children]);

    return (
      <div
        ref={setViewportRef}
        className={cn(
          'w-full overflow-hidden select-none cursor-grab active:cursor-grabbing [&_img]:pointer-events-none',
          isDragging && 'cursor-grabbing [&_*]:cursor-grabbing',
          className
        )}
        style={{
          touchAction: 'pan-y',
          ...style,
        }}
        {...props}
      >
        <div
          className={cn(
            'flex items-center gap-5 py-1 touch-pan-y',
            containerClassName
          )}
        >
          {children}
        </div>
      </div>
    );
  }
);

DragScrollContainer.displayName = 'DragScrollContainer';

export default DragScrollContainer;
