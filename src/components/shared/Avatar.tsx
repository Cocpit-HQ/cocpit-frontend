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
    showOnlineStatus?: boolean
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
    showOnlineStatus = false,
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
    const backgroundClass = isUnknown
        ? "bg-transparent"
        : `bg-gradient-to-br ${getAvatarGradient(gradientKey)} text-white`;

    const roundedClass = isCompany ? companyRoundedClasses[size] : "rounded-full";

    return (
        <div className={`relative shrink-0 ${className}`}>
            <div className={`relative ${sizeClasses[size]} ${roundedClass} overflow-hidden flex-shrink-0 ${backgroundClass} font-semibold flex items-center justify-center font-['Poppins'] select-none`}>
                {!isUrl && (
                    isUnknown ? (
                        isCompany ? (
                            <svg width="100%" height="100%" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="absolute inset-0 w-full h-full">
                                <rect width="40" height="40" rx="12" fill="#DADADA"/>
                                <path d="M18 20H22M18 16H22M22 29V26C22 25.4696 21.7893 24.9609 21.4142 24.5858C21.0391 24.2107 20.5304 24 20 24C19.4696 24 18.9609 24.2107 18.5858 24.5858C18.2107 24.9609 18 25.4696 18 26V29" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                <path d="M14 18H12C11.4696 18 10.9609 18.2107 10.5858 18.5858C10.2107 18.9609 10 19.4696 10 20V27C10 27.5304 10.2107 28.0391 10.5858 28.4142C10.9609 28.7893 11.4696 29 12 29H28C28.5304 29 29.0391 28.7893 29.4142 28.4142C29.7893 28.0391 30 27.5304 30 27V17C30 16.4696 29.7893 15.9609 29.4142 15.5858C29.0391 15.2107 28.5304 15 28 15H26" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                <path d="M14 29V13C14 12.4696 14.2107 11.9609 14.5858 11.5858C14.9609 11.2107 15.4696 11 16 11H24C24.5304 11 25.0391 11.2107 25.4142 11.5858C25.7893 11.9609 26 12.4696 26 13V29" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                        ) : (
                            <svg width="100%" height="100%" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="absolute inset-0 w-full h-full">
                                <circle cx="20" cy="20" r="20" fill="#DADADA"/>
                                <path d="M20 10C14.477 10 10 14.477 10 20C10 25.523 14.477 30 20 30C25.523 30 30 25.523 30 20C30 14.477 25.523 10 20 10Z" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                <path d="M12.2695 26.346C12.2695 26.346 14.4985 23.5 19.9985 23.5C25.4985 23.5 27.7285 26.346 27.7285 26.346M19.9985 20C20.7942 20 21.5572 19.6839 22.1199 19.1213C22.6825 18.5587 22.9985 17.7956 22.9985 17C22.9985 16.2044 22.6825 15.4413 22.1199 14.8787C21.5572 14.3161 20.7942 14 19.9985 14C19.2029 14 18.4398 14.3161 17.8772 14.8787C17.3146 15.4413 16.9985 16.2044 16.9985 17C16.9985 17.7956 17.3146 18.5587 17.8772 19.1213C18.4398 19.6839 19.2029 20 19.9985 20Z" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                        )
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

            {online && showOnlineStatus && (
                <div
                    className={`absolute bottom-0 right-0 ${indicatorSize[size]} bg-green-500 rounded-full border-2 border-background z-10`}
                />
            )}
        </div>
    )
}
