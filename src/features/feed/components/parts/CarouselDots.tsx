'use client';

import React, { useMemo } from 'react';

export interface CarouselDotsProps {
  total: number;
  activeIndex: number;
  onDotClick?: (index: number) => void;
  className?: string;
  imageDimensions?: Array<{ width: number; height: number } | null>;
}

const MAX_VISIBLE = 5;
const GAP_PX = 2; // 2px gap between dot slots

export const CarouselDots: React.FC<CarouselDotsProps> = ({
  total,
  activeIndex,
  onDotClick,
  className = '',
  imageDimensions,
}) => {
  if (total <= 1) return null;

  const clampedActive = Math.max(0, Math.min(activeIndex, total - 1));

  // Determine sliding window start offset
  let windowStart = 0;
  if (total > MAX_VISIBLE) {
    windowStart = Math.max(0, Math.min(clampedActive - 2, total - MAX_VISIBLE));
  }
  const windowEnd = Math.min(total - 1, windowStart + MAX_VISIBLE - 1);

  // Compute proportional natural widths per image based on aspect ratio
  const naturalWidths = useMemo(() => {
    return Array.from({ length: total }, (_, i) => {
      let nw = 8; // Default medium pill
      if (imageDimensions && imageDimensions[i]) {
        const dim = imageDimensions[i];
        if (dim && dim.height > 0) {
          const ar = dim.width / dim.height;
          if (ar < 0.8) nw = 4;        // Portrait: compact 4px pill
          else if (ar > 1.2) nw = 16;  // Landscape: wide 16px pill
          else nw = 8;                 // Square / standard: 8px pill
        }
      }
      return nw;
    });
  }, [total, imageDimensions]);

  // Compute fixed positions for each dot slot along the track
  const positions = useMemo(() => {
    const pos: number[] = [];
    let current = 0;
    for (let i = 0; i < naturalWidths.length; i++) {
      pos.push(current);
      current += naturalWidths[i] + GAP_PX;
    }
    return pos;
  }, [naturalWidths]);

  // Viewport width encompasses the visible window of dots
  const viewportWidth =
    positions[windowEnd] + naturalWidths[windowEnd] - positions[windowStart];
  const translateX = -positions[windowStart];

  return (
    <div
      className={`w-full max-w-[442px] h-[6px] flex items-center justify-center select-none ${className}`}
      aria-label="Carousel pagination"
      role="tablist"
    >
      {/* Fixed-width clipping viewport */}
      <div
        className="relative overflow-hidden flex items-center justify-start h-[6px]"
        style={{
          width: `${viewportWidth}px`,
          transition: 'width 200ms cubic-bezier(0.2, 0, 0, 1)',
        }}
      >
        {/* Animated sliding track */}
        <div
          className="flex flex-row items-center h-[6px] will-change-transform"
          style={{
            transform: `translateX(${translateX}px)`,
            transition: 'transform 250ms cubic-bezier(0.2, 0, 0, 1)',
          }}
        >
          {Array.from({ length: total }, (_, i) => {
            const isActive = i === clampedActive;
            const isInsideWindow =
              total <= MAX_VISIBLE ||
              (i >= windowStart && i <= windowEnd);

            const isLeftEdge =
              total > MAX_VISIBLE && i === windowStart && windowStart > 0;
            const isRightEdge =
              total > MAX_VISIBLE &&
              i === windowEnd &&
              windowEnd < total - 1;

            const naturalWidth = naturalWidths[i];
            let dotWidth = naturalWidth;
            let dotHeight = 4;
            let opacity = 0;
            let bgColor = '#726B67';

            if (isActive) {
              dotWidth = naturalWidth;
              dotHeight = 6;
              opacity = 1;
              bgColor = '#EC6229'; // Active primary brand accent
            } else if (isLeftEdge || isRightEdge) {
              dotWidth = 4; // Shrink edge indicators
              dotHeight = 4;
              opacity = 0.75;
              bgColor = '#726B67';
            } else if (isInsideWindow) {
              dotWidth = naturalWidth;
              dotHeight = 4;
              opacity = 1;
              bgColor = '#726B67';
            } else {
              dotWidth = naturalWidth;
              dotHeight = 4;
              opacity = 0;
              bgColor = '#726B67';
            }

            return (
              <button
                key={i}
                type="button"
                role="tab"
                aria-selected={isActive}
                aria-label={`Go to slide ${i + 1}`}
                onClick={(e) => {
                  e.stopPropagation();
                  onDotClick?.(i);
                }}
                className="flex items-center justify-center shrink-0 border-none bg-transparent p-0 cursor-pointer outline-none focus-visible:opacity-80"
                style={{
                  width: `${naturalWidth}px`,
                  height: '6px',
                  marginRight: i === total - 1 ? 0 : `${GAP_PX}px`,
                  pointerEvents: isInsideWindow ? 'auto' : 'none',
                }}
                tabIndex={isInsideWindow ? 0 : -1}
              >
                <span
                  className="rounded-[2px] block pointer-events-none will-change-transform"
                  style={{
                    width: `${dotWidth}px`,
                    height: `${dotHeight}px`,
                    backgroundColor: bgColor,
                    opacity,
                    transition:
                      'width 200ms ease, height 200ms ease, background-color 200ms ease, opacity 200ms ease',
                  }}
                />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default CarouselDots;
