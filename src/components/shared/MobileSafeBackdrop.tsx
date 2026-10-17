"use client";

import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';

interface MobileSafeBackdropProps {
    onClose: () => void;
    className?: string;
    isAnimated?: boolean;
    style?: React.CSSProperties;
}

/**
 * A reusable backdrop component that safely handles mobile touch events and ghost clicks.
 * Use this instead of `<div className="fixed inset-0" onClick={...}>` in custom portals.
 */
export function MobileSafeBackdrop({ 
    onClose, 
    className = "absolute inset-0 bg-black/60 backdrop-blur-sm z-[99]", 
    isAnimated = false,
    style
}: MobileSafeBackdropProps) {
    
    const handleInteract = (e: React.MouseEvent | React.TouchEvent) => {
        // Prevent the mobile browser from generating a synthetic 'click' event
        // after the touch ends. This prevents the click from "falling through" 
        // to underlying elements once this backdrop unmounts.
        if (e.cancelable) e.preventDefault();
        e.stopPropagation();
        onClose();
    };

    if (isAnimated) {
        return (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                onClick={handleInteract}
                onTouchEnd={handleInteract}
                className={className}
                style={style}
            />
        );
    }

    return (
        <div
            onClick={handleInteract}
            onTouchEnd={handleInteract}
            className={className}
            style={style}
        />
    );
}
