import React, { useRef, useState, useCallback, forwardRef } from 'react';
import { cn } from '@/lib/utils';

export interface DragScrollContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export const DragScrollContainer = forwardRef<HTMLDivElement, DragScrollContainerProps>(
  ({ children, className, style, ...props }, forwardedRef) => {
    const internalRef = useRef<HTMLDivElement | null>(null);
    const [isDragging, setIsDragging] = useState(false);

    const isDownRef = useRef(false);
    const startXRef = useRef(0);
    const scrollLeftRef = useRef(0);
    const hasMovedRef = useRef(false);

    const setRef = useCallback(
      (node: HTMLDivElement | null) => {
        internalRef.current = node;
        if (typeof forwardedRef === 'function') {
          forwardedRef(node);
        } else if (forwardedRef) {
          (forwardedRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
        }
      },
      [forwardedRef]
    );

    const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
      // Only handle primary button (left click) or touch
      if (e.button !== 0 || !internalRef.current) return;

      // Allow clicks on interactive buttons inside cards (like bookmark/save button)
      const target = e.target as HTMLElement | null;
      if (target?.closest('button') || target?.closest('a') || target?.closest('[role="button"]')) {
        return;
      }

      isDownRef.current = true;
      startXRef.current = e.clientX;
      scrollLeftRef.current = internalRef.current.scrollLeft;
      hasMovedRef.current = false;
      // Do NOT set pointer capture on pointerdown so normal clicks pass directly to child cards
    };

    const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
      if (!isDownRef.current || !internalRef.current) return;

      const deltaX = e.clientX - startXRef.current;

      // Only engage drag mode if moved more than 6px
      if (!hasMovedRef.current && Math.abs(deltaX) > 6) {
        hasMovedRef.current = true;
        setIsDragging(true);

        // Capture pointer only when actual dragging has started
        try {
          e.currentTarget.setPointerCapture(e.pointerId);
        } catch (_) {}
      }

      if (hasMovedRef.current) {
        // Direct scrollLeft assignment for immediate 60fps horizontal sliding
        internalRef.current.scrollLeft = scrollLeftRef.current - deltaX;
      }
    };

    const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
      if (!isDownRef.current) return;
      isDownRef.current = false;

      try {
        if (e.currentTarget.hasPointerCapture(e.pointerId)) {
          e.currentTarget.releasePointerCapture(e.pointerId);
        }
      } catch (_) {}

      if (hasMovedRef.current) {
        // Keep hasMovedRef true for a short tick so that onClickCapture blocks child card click navigation
        setTimeout(() => {
          hasMovedRef.current = false;
          setIsDragging(false);
        }, 50);
      } else {
        hasMovedRef.current = false;
        setIsDragging(false);
      }
    };

    const handlePointerCancel = (e: React.PointerEvent<HTMLDivElement>) => {
      isDownRef.current = false;
      hasMovedRef.current = false;
      setIsDragging(false);
      try {
        if (e.currentTarget.hasPointerCapture(e.pointerId)) {
          e.currentTarget.releasePointerCapture(e.pointerId);
        }
      } catch (_) {}
    };

    const handleClickCapture = (e: React.MouseEvent) => {
      // If the user dragged to scroll, suppress card click navigation
      if (hasMovedRef.current) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    return (
      <div
        ref={setRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        onClickCapture={handleClickCapture}
        onDragStart={(e) => e.preventDefault()}
        className={cn(
          'w-full flex items-center gap-5 overflow-x-auto no-scrollbar select-none cursor-grab active:cursor-grabbing [&_img]:pointer-events-none',
          isDragging && 'cursor-grabbing [&_*]:cursor-grabbing scroll-auto',
          className
        )}
        style={{
          WebkitOverflowScrolling: 'touch',
          scrollBehavior: isDragging ? 'auto' : undefined,
          touchAction: 'pan-y',
          ...style,
        }}
        {...props}
      >
        {children}
      </div>
    );
  }
);

DragScrollContainer.displayName = 'DragScrollContainer';

export default DragScrollContainer;
