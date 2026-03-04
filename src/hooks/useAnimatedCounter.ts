'use client'

import { useEffect, useRef, useState } from 'react'

/**
 * Animates a number from 0 to `end` over `duration` ms using easeOutExpo.
 * Returns the current animated value.
 */
export function useAnimatedCounter(end: number, duration = 1200): number {
    const [value, setValue] = useState(0)
    const raf = useRef<number | null>(null)
    const startTime = useRef<number | null>(null)

    useEffect(() => {
        startTime.current = null

        const animate = (timestamp: number) => {
            if (!startTime.current) startTime.current = timestamp
            const elapsed = timestamp - startTime.current
            const progress = Math.min(elapsed / duration, 1)

            // easeOutExpo
            const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress)

            setValue(eased * end)

            if (progress < 1) {
                raf.current = requestAnimationFrame(animate)
            }
        }

        raf.current = requestAnimationFrame(animate)

        return () => {
            if (raf.current) cancelAnimationFrame(raf.current)
        }
    }, [end, duration])

    return value
}
