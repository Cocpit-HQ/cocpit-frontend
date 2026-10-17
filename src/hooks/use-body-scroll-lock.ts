"use client";

import { useEffect, useRef } from "react";

/**
 * Global scroll-lock state supporting nested modals / sheets.
 * Reference counting ensures that when Modal A opens Modal B:
 * - The background page remains completely locked.
 * - When Modal B closes, the background remains locked.
 * - When the outermost Modal A closes, the background scroll position and styles are cleanly restored.
 */
interface SavedBodyState {
  scrollY: number;
  position: string;
  top: string;
  left: string;
  right: string;
  width: string;
  paddingRight: string;
  bodyOverflow: string;
  htmlOverflow: string;
  bodyOverscroll: string;
  htmlOverscroll: string;
}

let lockCount = 0;
let savedState: SavedBodyState | null = null;

export function lockBodyScroll() {
  if (typeof window === "undefined" || typeof document === "undefined") return;

  if (lockCount === 0) {
    const scrollY = window.scrollY;
    const scrollBarWidth = window.innerWidth - document.documentElement.clientWidth;

    savedState = {
      scrollY,
      position: document.body.style.position,
      top: document.body.style.top,
      left: document.body.style.left,
      right: document.body.style.right,
      width: document.body.style.width,
      paddingRight: document.body.style.paddingRight,
      bodyOverflow: document.body.style.overflow,
      htmlOverflow: document.documentElement.style.overflow,
      bodyOverscroll: document.body.style.overscrollBehavior,
      htmlOverscroll: document.documentElement.style.overscrollBehavior,
    };

    if (scrollBarWidth > 0) {
      document.body.style.paddingRight = `${scrollBarWidth}px`;
    }
    document.body.style.position = "fixed";
    document.body.style.top = `-${scrollY}px`;
    document.body.style.left = "0";
    document.body.style.right = "0";
    document.body.style.width = "100%";
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    document.body.style.overscrollBehavior = "none";
    document.documentElement.style.overscrollBehavior = "none";
  }

  lockCount++;
}

export function unlockBodyScroll() {
  if (typeof window === "undefined" || typeof document === "undefined") return;
  if (lockCount === 0) return;

  lockCount--;

  if (lockCount === 0 && savedState) {
    const {
      scrollY,
      position,
      top,
      left,
      right,
      width,
      paddingRight,
      bodyOverflow,
      htmlOverflow,
      bodyOverscroll,
      htmlOverscroll,
    } = savedState;

    document.body.style.position = position;
    document.body.style.top = top;
    document.body.style.left = left;
    document.body.style.right = right;
    document.body.style.width = width;
    document.body.style.paddingRight = paddingRight;
    document.body.style.overflow = bodyOverflow;
    document.documentElement.style.overflow = htmlOverflow;
    document.body.style.overscrollBehavior = bodyOverscroll;
    document.documentElement.style.overscrollBehavior = htmlOverscroll;

    savedState = null;
    window.scrollTo(0, scrollY);
  }
}

/**
 * React hook to lock background page scroll when `isLocked` is true.
 * Safely handles nested modals via reference counting, preserves exact scroll offset,
 * prevents desktop scrollbar width shifting, and isolates iOS Safari WebKit touch chaining.
 */
export function useBodyScrollLock(isLocked: boolean = true) {
  const isHeldRef = useRef(false);

  useEffect(() => {
    if (isLocked) {
      if (!isHeldRef.current) {
        lockBodyScroll();
        isHeldRef.current = true;
      }
    } else {
      if (isHeldRef.current) {
        unlockBodyScroll();
        isHeldRef.current = false;
      }
    }

    return () => {
      if (isHeldRef.current) {
        unlockBodyScroll();
        isHeldRef.current = false;
      }
    };
  }, [isLocked]);
}
