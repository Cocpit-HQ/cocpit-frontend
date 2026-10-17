'use client';

import React, { useId } from 'react';
import { motion } from 'framer-motion';

export interface CarouselDotsProps {
  total: number;
  activeIndex: number;
  onDotClick?: (index: number) => void;
  className?: string;
  imageDimensions?: Array<{ width: number; height: number } | null>;
}

const MAX_VISIBLE = 5;

export const CarouselDots: React.FC<CarouselDotsProps> = ({
  total,
  activeIndex,
  onDotClick,
  className = '',
  imageDimensions,
}) => {
  const instanceId = useId();

  if (total <= 1) return null;

  const clampedActive = Math.max(0, Math.min(activeIndex, total - 1));

  // Determine sliding window start offset
  let windowStart = 0;
  if (total > MAX_VISIBLE) {
    windowStart = Math.max(0, Math.min(clampedActive - 2, total - MAX_VISIBLE));
  }

  return (
    <div
      className={`w-full max-w-[442px] h-[6px] flex items-center justify-center select-none ${className}`}
      aria-label="Carousel pagination"
      role="tablist"
    >
      <div className="flex flex-row items-center justify-center h-[6px]">
        {Array.from({ length: total }, (_, i) => {
          const isActive = i === clampedActive;
          const isInsideWindow =
            total <= MAX_VISIBLE ||
            (i >= windowStart && i < windowStart + MAX_VISIBLE);

          const isLeftEdge =
            total > MAX_VISIBLE && i === windowStart && windowStart > 0;
          const isRightEdge =
            total > MAX_VISIBLE &&
            i === windowStart + MAX_VISIBLE - 1 &&
            windowStart + MAX_VISIBLE - 1 < total - 1;

          let width = 0;
          let height = 0;
          let opacity = 0;
          let bgColor = '#726B67';
          let marginLeft = 0;

          if (isInsideWindow) {
            opacity = 1;
            marginLeft = i === windowStart ? 0 : 2; // 2px gap

            // Calculate proportional width
            let naturalWidth = 8; // Default medium pill
            if (imageDimensions && imageDimensions[i]) {
              const dim = imageDimensions[i]!;
              if (dim.height > 0) {
                const ar = dim.width / dim.height;
                if (ar < 0.8) naturalWidth = 4;
                else if (ar > 1.2) naturalWidth = 16;
                else naturalWidth = 8;
              }
            }

            if (isActive) {
              width = naturalWidth;
              height = 6;
              bgColor = 'transparent'; // Let the motion.div handle the color
            } else if (isLeftEdge || isRightEdge) {
              width = 4; // Shrink edges
              height = 4;
            } else {
              width = naturalWidth;
              height = 4;
            }
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
              className="flex items-center justify-center border-none bg-transparent p-0 cursor-pointer outline-none focus-visible:opacity-80"
              style={{
                width: `${width}px`,
                height: `6px`, // Container is fixed height for alignment
                marginLeft: `${marginLeft}px`,
                transition: 'width 250ms ease, margin 250ms ease, opacity 250ms ease',
                opacity,
                pointerEvents: isInsideWindow ? 'auto' : 'none',
              }}
              tabIndex={isInsideWindow ? 0 : -1}
            >
              <span
                className="rounded-[2px] pointer-events-none block relative"
                style={{
                  width: '100%',
                  height: `${height}px`,
                  backgroundColor: isActive ? 'transparent' : bgColor,
                  transition: 'height 250ms ease, background-color 200ms ease',
                }}
              >
                {isActive && (
                  <motion.div
                    layoutId={`activeCarouselDot-${instanceId}`}
                    className="absolute inset-0 rounded-[2px]"
                    style={{ backgroundColor: '#EC6229' }}
                    transition={{ type: "spring", stiffness: 400, damping: 35 }}
                  />
                )}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default CarouselDots;
