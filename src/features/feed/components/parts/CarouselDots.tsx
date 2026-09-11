'use client';

import React from 'react';

export interface CarouselDotsProps {
  total: number;
  activeIndex: number;
  onDotClick?: (index: number) => void;
  className?: string;
}

const MAX_VISIBLE = 5;
const STEP_PX = 10; // Center-to-center step per dot slot in px

export const CarouselDots: React.FC<CarouselDotsProps> = ({
  total,
  activeIndex,
  onDotClick,
  className = '',
}) => {
  if (total <= 1) return null;

  const clampedActive = Math.max(0, Math.min(activeIndex, total - 1));

  // Determine sliding window start offset
  let windowStart = 0;
  if (total > MAX_VISIBLE) {
    windowStart = Math.max(0, Math.min(clampedActive - 2, total - MAX_VISIBLE));
  }

  const viewportWidth = total <= MAX_VISIBLE ? total * STEP_PX : MAX_VISIBLE * STEP_PX;
  const translateX = total <= MAX_VISIBLE ? 0 : -(windowStart * STEP_PX);

  return (
    <div
      className={`w-full max-w-[442px] h-[6px] flex items-center justify-center select-none ${className}`}
      aria-label="Carousel pagination"
      role="tablist"
    >
      {/* Fixed-width clipping viewport */}
      <div
        className="relative overflow-hidden flex items-center justify-start h-[6px]"
        style={{ width: `${viewportWidth}px` }}
      >
        {/* Animated sliding track */}
        <div
          className="flex flex-row items-center h-[6px] will-change-transform"
          style={{
            transform: `translateX(${translateX}px)`,
            transition: 'transform 250ms cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        >
          {Array.from({ length: total }, (_, i) => {
            const isActive = i === clampedActive;
            const isInsideWindow =
              total <= MAX_VISIBLE ||
              (i >= windowStart && i <= windowStart + MAX_VISIBLE - 1);

            const isLeftEdge =
              total > MAX_VISIBLE && i === windowStart && windowStart > 0;
            const isRightEdge =
              total > MAX_VISIBLE &&
              i === windowStart + MAX_VISIBLE - 1 &&
              windowStart + MAX_VISIBLE - 1 < total - 1;

            let scale = 0;
            let opacity = 0;
            let bgColor = '#71717A';

            if (isActive) {
              scale = 1.5; // 4px * 1.5 = 6px
              opacity = 1;
              bgColor = 'var(--ds-accent, #EC6229)';
            } else if (isLeftEdge || isRightEdge) {
              scale = 0.625; // 4px * 0.625 = 2.5px
              opacity = 0.75;
              bgColor = '#71717A';
            } else if (isInsideWindow) {
              scale = 1; // 4px * 1 = 4px
              opacity = 1;
              bgColor = '#71717A';
            } else {
              scale = 0;
              opacity = 0;
              bgColor = '#71717A';
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
                className="w-[10px] h-[12px] flex items-center justify-center shrink-0 border-none bg-transparent p-0 cursor-pointer outline-none focus-visible:opacity-80"
                tabIndex={isInsideWindow ? 0 : -1}
              >
                <span
                  className="w-[4px] h-[4px] rounded-full block pointer-events-none will-change-transform"
                  style={{
                    transform: `scale(${scale})`,
                    backgroundColor: bgColor,
                    opacity,
                    transition:
                      'transform 250ms cubic-bezier(0.4, 0, 0.2, 1), background-color 200ms ease, opacity 200ms ease',
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
