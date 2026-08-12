"use client"

import React, { useState } from "react"
import { avatarGradients } from "@/constants/messaging"
import { Icon } from "@iconify/react"

interface AvatarProps {
    url?: string
    fallbackGradient?: string
    name: string
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
    online?: boolean
    className?: string
    isCompany?: boolean
    isUnknown?: boolean
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
    className = "",
    isCompany = false,
    isUnknown = false
}: AvatarProps) {
    const [error, setError] = useState(false)

    const sizeClasses = {
        xs: "w-6 h-6 text-[10px]",
        sm: "w-8 h-8 text-xs",
        md: "w-10 h-10 text-[20px]",
        lg: "w-12 h-12 text-lg",
        xl: "w-16 h-16 text-2xl"
    }

    const companyRoundedClasses = {
        xs: "rounded-[6px]",
        sm: "rounded-[8px]",
        md: "rounded-[10px]",
        lg: "rounded-[12px]",
        xl: "rounded-[16px]"
    }

    const indicatorSize = {
        xs: "w-1.5 h-1.5",
        sm: "w-2 h-2",
        md: "w-2.5 h-2.5",
        lg: "w-3 h-3",
        xl: "w-4 h-4"
    }

    const isUrl = Boolean(url && url !== '/assets/pngegg.png' && !url.startsWith('gradient-') && !error);
    const initial = (name || 'U').charAt(0).toUpperCase();

    const gradientKey = (url && url.startsWith('gradient-')) ? url : fallbackGradient;
    const backgroundClass = (isUnknown || (isCompany && !isUrl))
        ? "bg-[#F3F4F6] text-[#6B7280]"
        : (url && url.startsWith('gradient-')) 
            ? `bg-gradient-to-br ${getAvatarGradient(gradientKey)} text-white` 
            : "bg-[#F3F4F6] text-[#6B7280]";

    const roundedClass = isCompany ? companyRoundedClasses[size] : "rounded-full";

    return (
        <div className={`relative shrink-0 ${className}`}>
            <div className={`relative ${sizeClasses[size]} ${roundedClass} overflow-hidden flex-shrink-0 ${backgroundClass} font-semibold flex items-center justify-center font-['Poppins'] select-none`}>
                {!isUrl && (
                    isCompany ? (
                        <Icon icon="lucide:building-2" className="w-1/2 h-1/2 text-[#6B7280]" style={{ strokeWidth: '1.5px' }} />
                    ) : isUnknown ? (
                        <Icon icon="iconamoon:profile-circle-light" className="w-1/2 h-1/2 text-[#6B7280]" />
                    ) : (
                        <span>{initial}</span>
                    )
                )}
                {isUrl ? (
                    <img
                        src={url}
                        alt={name}
                        className="absolute inset-0 w-full h-full object-cover"
                        onError={() => setError(true)}
                    />
                ) : null}
            </div>

            {online && (
                <div
                    className={`absolute bottom-0 right-0 ${indicatorSize[size]} bg-green-500 rounded-full border-2 border-background z-10`}
                />
            )}
        </div>
    )
}
