"use client"

import React, { useState } from "react"
import { avatarGradients } from "@/constants/messaging"

interface AvatarProps {
    url?: string
    fallbackGradient?: string
    name: string
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
    online?: boolean
    className?: string
}

export const getAvatarGradient = (avatar: string) => {
    return avatarGradients[avatar] || "from-gray-400 to-gray-500";
}

export default function Avatar({
    url,
    fallbackGradient = "gradient-1",
    name,
    size = 'md',
    online,
    className = ""
}: AvatarProps) {
    const [error, setError] = useState(false)

    const sizeClasses = {
        xs: "w-6 h-6",
        sm: "w-8 h-8",
        md: "w-10 h-10",
        lg: "w-12 h-12",
        xl: "w-16 h-16"
    }

    const indicatorSize = {
        xs: "w-1.5 h-1.5",
        sm: "w-2 h-2",
        md: "w-2.5 h-2.5",
        lg: "w-3 h-3",
        xl: "w-4 h-4"
    }

    // Check if avatar is a URL or a gradient key
    const isUrl = url && (url.startsWith('http') || url.startsWith('/')) && !error;
    const gradientClass = getAvatarGradient(isUrl ? "" : (url || fallbackGradient));

    return (
        <div className={`relative shrink-0 ${className}`}>
            <div className={`${sizeClasses[size]} rounded-full overflow-hidden flex-shrink-0 bg-muted`}>
                {isUrl ? (
                    <img
                        src={url}
                        alt={name}
                        className="w-full h-full object-cover"
                        onError={() => setError(true)}
                    />
                ) : (
                    <div className={`w-full h-full bg-gradient-to-br ${gradientClass}`} />
                )}
            </div>

            {online && (
                <div
                    className={`absolute bottom-0 right-0 ${indicatorSize[size]} bg-green-500 rounded-full border-2 border-background`}
                />
            )}
        </div>
    )
}
