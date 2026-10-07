                                                                'use client';

import React, { useState, useRef, useEffect, ReactNode, useCallback } from 'react';
import { motion, useAnimation } from 'framer-motion';
import { Loader2 } from 'lucide-react';

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: ReactNode;
}

export function PullToRefresh({ onRefresh, children }: PullToRefreshProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const controls = useAnimation();
  const spinnerControls = useAnimation();
  
  const pullDistance = useRef(0);
  const startY = useRef(0);
  const isAtTop = useRef(true);
  const refreshThreshold = 80;                                                                                   
  
  useEffect(() => {
    const handleScroll = () => {
      isAtTop.current = window.scrollY <= 0;
    };
    
    window.addEventListener('scroll', handleScroll);
    handleScroll(); // init
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (!isAtTop.current || isRefreshing) return;
    startY.current = e.touches[0].clientY;
  }, [isRefreshing]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isAtTop.current || isRefreshing || startY.current === 0) return;
    
    const y = e.touches[0].clientY;
    const diff = y - startY.current;
    
    if (diff > 0) {
      if (e.cancelable) e.preventDefault();
      
      const resistanceY = diff > refreshThreshold 
         ? refreshThreshold + (diff - refreshThreshold) * 0.3 
         : diff;
         
      pullDistance.current = resistanceY;
      controls.set({ y: resistanceY });
      
      // Update spinner scale/opacity based on pull distance
      const progress = Math.min(resistanceY / refreshThreshold, 1);
      spinnerControls.set({ scale: progress, opacity: progress });
    }
  }, [controls, spinnerControls, isRefreshing, refreshThreshold]);

  const handleTouchEnd = useCallback(async () => {
    if (startY.current === 0) return;
    
    if (pullDistance.current >= refreshThreshold) {
      setIsRefreshing(true);
      controls.start({ y: 50, transition: { type: 'spring', stiffness: 300, damping: 20 } });
      spinnerControls.start({ scale: 1, opacity: 1 });
      
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
        controls.start({ y: 0, transition: { type: 'spring', stiffness: 300, damping: 20 } });
        spinnerControls.start({ scale: 0, opacity: 0 });
      }
    } else {
      controls.start({ y: 0, transition: { type: 'spring', stiffness: 300, damping: 20 } });
      spinnerControls.start({ scale: 0, opacity: 0 });
    }
    
    startY.current = 0;
    pullDistance.current = 0;
  }, [controls, spinnerControls, onRefresh, refreshThreshold]);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;
    
    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchmove', handleTouchMove, { passive: false });
    element.addEventListener('touchend', handleTouchEnd, { passive: true });
    
    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="absolute top-2 left-0 right-0 flex items-center justify-center z-10 pointer-events-none">
        <motion.div
           animate={spinnerControls}
           initial={{ scale: 0, opacity: 0 }}
           className="bg-background rounded-full p-2 shadow-md border"
        >
            <motion.div
               animate={{ rotate: isRefreshing ? 360 : 0 }}
               transition={{ rotate: { repeat: isRefreshing ? Infinity : 0, duration: 1, ease: "linear" } }}
            >
              <Loader2 className="w-5 h-5 text-primary" />
            </motion.div>
        </motion.div>
      </div>
      
      <motion.div 
        animate={controls}
        className="w-full h-full relative"
      >
        {children}
      </motion.div>
    </div>
  );
}
