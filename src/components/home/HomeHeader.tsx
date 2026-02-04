'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Search, MessageCircle } from 'lucide-react';
import Link from 'next/link';
import { NotificationPopover } from '@/components/notifications/NotificationPopover';
import { useDebounce } from '@/hooks/use-debounce';
import { searchUsers } from '@/services/api/user';
import { SearchedUser } from '@/types/user';

export const HomeHeader = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<SearchedUser[]>([]);
    const [searchLoading, setSearchLoading] = useState(false);
    const [isSearchFocused, setIsSearchFocused] = useState(false);
    const debouncedSearchQuery = useDebounce(searchQuery, 300);

    // Scroll behavior for mobile header
    const [isHeaderVisible, setIsHeaderVisible] = useState(true);
    const lastScrollY = useRef(0);

    useEffect(() => {
        const handleScroll = (e: Event) => {
            const target = e.target as HTMLElement | Document;
            let currentScrollY = window.scrollY;

            if (target instanceof HTMLElement) {
                if (target.scrollHeight < window.innerHeight) return;
                currentScrollY = target.scrollTop;
            }

            if (currentScrollY <= 60) {
                setIsHeaderVisible(true);
                lastScrollY.current = currentScrollY;
                return;
            }

            if (Math.abs(lastScrollY.current - currentScrollY) <= 5) return;

            if (currentScrollY > lastScrollY.current) {
                setIsHeaderVisible(false);
            } else {
                setIsHeaderVisible(true);
            }

            lastScrollY.current = currentScrollY;
        };

        window.addEventListener('scroll', handleScroll, { passive: true, capture: true });
        return () => window.removeEventListener('scroll', handleScroll, { capture: true });
    }, []);

    useEffect(() => {
        if (debouncedSearchQuery.trim() === '') {
            setSearchResults([]);
            return;
        }

        const fetchUsers = async () => {
            setSearchLoading(true);
            try {
                const users = await searchUsers(debouncedSearchQuery);
                setSearchResults(users);
            } catch (error) {
                console.error('Error fetching users:', error);
                setSearchResults([]);
            } finally {
                setSearchLoading(false);
            }
        };

        fetchUsers();
    }, [debouncedSearchQuery]);

    return (
        <header
            className={`sticky top-0 z-20 border-b px-4 py-3 md:py-4 bg-background border-border transition-transform duration-300 ease-in-out ${!isHeaderVisible && !isSearchFocused ? '-translate-y-full' : 'translate-y-0'
                } md:translate-y-0`}
        >
            <div className="max-w-5xl mx-auto">
                {/* --- Desktop Header (Visible from md screens up) --- */}
                <div className="hidden md:flex items-center gap-4">
                    {/* Desktop Search Bar */}
                    <div
                        className={`relative flex-1 flex items-center gap-3 max-w-2xl transition-all duration-300 ${isSearchFocused ? 'md:max-w-2xl' : ''
                            }`}
                    >
                        <Search className="w-5 h-5 text-muted-foreground absolute left-3" />
                        <input
                            type="text"
                            placeholder="Search posts, professionals..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onFocus={() => setIsSearchFocused(true)}
                            onBlur={() => {
                                setTimeout(() => setIsSearchFocused(false), 200);
                            }}
                            className="w-full pl-10 pr-4 py-2.5 rounded-full border focus:outline-none focus:border-primary bg-card text-foreground placeholder-muted-foreground border-border"
                        />

                        {/* Search Dropdown */}
                        {isSearchFocused && searchQuery && (
                            <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-xl shadow-lg overflow-hidden z-50">
                                <div className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                    People
                                </div>
                                {searchLoading ? (
                                    <div className="p-4 text-center text-muted-foreground">Loading...</div>
                                ) : searchResults.length > 0 ? (
                                    searchResults.map(user => (
                                        <Link
                                            key={user.id}
                                            href={`/profile/${user.id}`}
                                            className="flex items-center gap-3 px-4 py-2 hover:bg-muted/50 transition-colors"
                                        >
                                            <img src={user.avatar_url || '/assets/pngegg.png'} alt={user.full_name} className="w-8 h-8 rounded-full object-cover" />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-foreground truncate">{user.full_name}</p>
                                                <p className="text-xs text-muted-foreground truncate">{user.headline || ''}</p>
                                            </div>
                                        </Link>
                                    ))
                                ) : (
                                    <div className="p-4 text-center text-muted-foreground">No users found.</div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Desktop Icons */}
                    <div className="flex items-center gap-1 sm:gap-2">
                        <NotificationPopover />
                        <Link
                            href="/messaging"
                            className="p-2 rounded-full transition-colors hover:bg-muted text-muted-foreground"
                        >
                            <MessageCircle className="w-6 h-6" />
                        </Link>
                    </div>
                </div>

                {/* --- Mobile Header (Hidden from md screens up) --- */}
                <div className="md:hidden flex items-center gap-2 relative">
                    {/* Mobile Search Bar */}
                    <div className="flex-1 flex items-center gap-3 relative">
                        <Search className="w-4 h-4 text-muted-foreground absolute left-3" />
                        <input
                            type="text"
                            placeholder="Search..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onFocus={() => setIsSearchFocused(true)}
                            onBlur={() => {
                                setTimeout(() => setIsSearchFocused(false), 200);
                            }}
                            className="w-full pl-9 pr-4 py-1.5 text-sm rounded-full border focus:outline-none focus:border-primary bg-card text-foreground placeholder-muted-foreground border-border"
                        />

                        {/* Mobile Search Dropdown */}
                        {isSearchFocused && searchQuery && (
                            <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-xl shadow-lg overflow-hidden z-50">
                                <div className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                    People
                                </div>
                                {searchLoading ? (
                                    <div className="p-4 text-center text-muted-foreground">Loading...</div>
                                ) : searchResults.length > 0 ? (
                                    searchResults.map(user => (
                                        <Link
                                            key={user.id}
                                            href={`/profile/${user.id}`}
                                            className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors"
                                        >
                                            <img src={user.avatar_url || '/assets/pngegg.png'} alt={user.full_name} className="w-8 h-8 rounded-full object-cover" />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-foreground truncate">{user.full_name}</p>
                                                <p className="text-xs text-muted-foreground truncate">{user.headline || ''}</p>
                                            </div>
                                        </Link>
                                    ))
                                ) : (
                                    <div className="p-4 text-center text-muted-foreground">No users found.</div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Mobile Icons */}
                    {!isSearchFocused && (
                        <div className="flex items-center gap-1">
                            <NotificationPopover />
                            <Link
                                href="/messaging"
                                className="p-2 rounded-full transition-colors text-muted-foreground"
                            >
                                <MessageCircle className="w-5 h-5" />
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};
