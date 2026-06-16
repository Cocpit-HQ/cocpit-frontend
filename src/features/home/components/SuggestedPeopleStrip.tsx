"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Plus, Check, ChevronLeft, ChevronRight } from 'lucide-react';
import { followUser } from '@/services/api/social';
import { getConnectionSuggestions } from '@/services/api/connections';
import { SuggestedUser } from '@/features/connection/types';
import { toast } from 'sonner';

export function SuggestedPeopleStrip() {
    const [suggestions, setSuggestions] = useState<SuggestedUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());

    const scrollRef = useRef<HTMLDivElement>(null);
    const [showLeftScroll, setShowLeftScroll] = useState(false);
    const [showRightScroll, setShowRightScroll] = useState(false);

    const updateScrollButtons = useCallback(() => {
        const container = scrollRef.current;
        if (!container) return;

        const { scrollLeft, scrollWidth, clientWidth } = container;
        setShowLeftScroll(scrollLeft > 5);
        setShowRightScroll(scrollWidth - clientWidth - scrollLeft > 5);
    }, []);

    useEffect(() => {
        const frame = requestAnimationFrame(() => {
            updateScrollButtons();
        });
        window.addEventListener("resize", updateScrollButtons);
        return () => {
            cancelAnimationFrame(frame);
            window.removeEventListener("resize", updateScrollButtons);
        };
    }, [suggestions, updateScrollButtons]);

    const scrollLeft = () => {
        scrollRef.current?.scrollBy({ left: -300, behavior: "smooth" });
    };

    const scrollRight = () => {
        scrollRef.current?.scrollBy({ left: 300, behavior: "smooth" });
    };

    useEffect(() => {
        const fetchSuggestions = async () => {
            try {
                const response = await getConnectionSuggestions(20);
                setSuggestions(response.data);
            } catch (error) {
                console.error("Failed to fetch suggestions", error);
            } finally {
                setLoading(false);
            }
        };
        fetchSuggestions();
    }, []);

    const handleFollow = async (e: React.MouseEvent, userId: string) => {
        e.preventDefault();
        e.stopPropagation();

        if (followingIds.has(userId)) return;

        setFollowingIds(prev => new Set(prev).add(userId));
        try {
            await followUser(userId);
            toast.success("Following user");
            
            // Wait briefly before removing for UX (shows the 'Following' state briefly)
            setTimeout(() => {
                setSuggestions(prev => prev.filter(user => user.id !== userId));
            }, 800);
        } catch (error) {
            console.error("Follow failed", error);
            setFollowingIds(prev => {
                const next = new Set(prev);
                next.delete(userId);
                return next;
            });
            toast.error("Failed to follow user");
        }
    };

    if (loading) {
        return (
            <div className="mb-6 hidden md:block w-full">
                <div className="mb-4">
                    <h2 className="font-['Poppins'] text-[18px] font-medium leading-[26px] text-[#000000] dark:text-white">
                        Suggested for You
                    </h2>
                </div>
                <div className="flex-1 flex items-center gap-[16px] overflow-x-auto px-0 pb-1 pt-0 scrollbar-hide">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="flex-shrink-0 flex flex-col items-center">
                            <div className="relative h-[74px] w-[74px] overflow-hidden rounded-full border border-border bg-muted animate-pulse" />
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (suggestions.length === 0) return null;

    return (
        <div className="mb-6 hidden md:block w-full relative">
            <div className="mb-5 flex items-center justify-between px-0">
                <h2 className="font-['Poppins'] text-[18px] font-medium leading-[26px] text-[#000000]">
                    Suggested for You
                </h2>
            </div>

            <div className="stories-scroll-container relative w-full flex items-center">
                {showLeftScroll && (
                    <button
                        onClick={scrollLeft}
                        className="absolute -left-4 top-1/2 -translate-y-1/2 z-10 flex h-8 w-8 items-center justify-center rounded-full text-primary bg-background shadow-md border border-border/50 hover:bg-muted transition-colors"
                        aria-label="Scroll left"
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </button>
                )}

                <div 
                    ref={scrollRef}
                    onScroll={updateScrollButtons}
                    className="flex-1 flex items-center gap-[16px] overflow-x-auto px-0 pb-1 pt-0 scrollbar-hide"
                >
                    {suggestions.map((user) => (
                        <div 
                            key={user.id} 
                            className="flex-shrink-0 flex flex-col items-center group relative cursor-pointer"
                            onClick={() => window.location.href = `/profile/${user.id}`}
                        >
                            <div className="h-[74px] w-[74px] rounded-full border-2 border-[#DADADA] relative transition-transform active:scale-95">
                                {user.avatarUrl ? (
                                    <img
                                        src={user.avatarUrl}
                                        alt={user.name}
                                        className="h-full w-full rounded-full object-cover transition-transform duration-300"
                                        onError={(e) => {
                                            e.currentTarget.style.display = 'none';
                                        }}
                                    />
                                ) : (
                                    <div className="h-full w-full rounded-full bg-gray-800 flex items-center justify-center text-white text-xs font-bold font-['Poppins'] uppercase">
                                        {user.name?.[0] || '?'}
                                    </div>
                                )}
                                
                                <button
                                    onClick={(e) => handleFollow(e, user.id)}
                                    disabled={followingIds.has(user.id)}
                                    className={`absolute -top-1 -right-1 z-10 flex h-5 w-5 items-center justify-center rounded-full border-2 border-background bg-white shadow-sm transition-colors ${
                                        followingIds.has(user.id)
                                            ? 'text-green-500'
                                            : 'text-[#6366F1] hover:bg-gray-50'
                                    }`}
                                >
                                    {followingIds.has(user.id) ? (
                                        <Check className="h-3 w-3" />
                                    ) : (
                                        <Plus className="h-3.5 w-3.5" />
                                    )}
                                </button>
                            </div>

                            <span className="font-['Poppins'] text-[10px] font-normal leading-[15px] text-[#000000] text-center max-w-[74px] overflow-hidden text-ellipsis whitespace-nowrap mt-[8px]">
                                {user.name}
                            </span>
                        </div>
                    ))}
                </div>

                {showRightScroll && (
                    <button
                        onClick={scrollRight}
                        className="absolute -right-4 top-1/2 -translate-y-1/2 z-10 flex h-8 w-8 items-center justify-center rounded-full text-primary bg-background shadow-md border border-border/50 hover:bg-muted transition-colors"
                        aria-label="Scroll right"
                    >
                        <ChevronRight className="h-4 w-4" />
                    </button>
                )}
            </div>
        </div>
    );
}
