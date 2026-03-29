'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Search, MessageCircle, X, Clock, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { NotificationPopover } from '@/components/notifications/NotificationPopover';
import { useDebounce } from '@/hooks/use-debounce';
import { searchUsers } from '@/services/api/user';
import { SearchedUser } from '@/types/user';
import { ProfileSwitcher } from '@/components/layout/ProfileSwitcher';
import { useSearchHistory } from '@/hooks/useSearchHistory';

export const HomeHeader = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<SearchedUser[]>([]);
    const [searchLoading, setSearchLoading] = useState(false);
    const [isSearchFocused, setIsSearchFocused] = useState(false);
    const debouncedSearchQuery = useDebounce(searchQuery, 300);
    const { history, saveSearch, removeSearch, clearAll } = useSearchHistory();

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
            className={`sticky top-0 z-20 border-b p-3 md:py-2 bg-background border-border transition-transform duration-300 ease-in-out ${!isHeaderVisible && !isSearchFocused ? '-translate-y-full' : 'translate-y-0'
                } md:translate-y-0`}
        >
            <div className="max-w-5xl mx-auto px-1 md:px-0">
                {/* --- Desktop Header (Visible from md screens up) --- */}
                <div className="hidden md:flex items-center gap-4">
                    {/* Desktop Search Bar */}
                    <div
                        className={`relative flex-1 flex items-center gap-3 max-w-2xl transition-all duration-300 ${isSearchFocused ? 'md:max-w-2xl' : ''
                            }`}
                    >
                        <Search 
                            className="w-5 h-5 text-muted-foreground absolute left-3 cursor-pointer hover:text-primary transition-colors" 
                            onClick={() => {
                                if (searchQuery.trim()) {
                                    saveSearch(searchQuery);
                                    setIsSearchFocused(false);
                                }
                            }}
                        />
                        <input
                            type="text"
                            placeholder="Search posts, professionals..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onFocus={() => setIsSearchFocused(true)}
                            onBlur={() => {
                                setTimeout(() => setIsSearchFocused(false), 200);
                            }}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    if (searchQuery.trim()) {
                                        saveSearch(searchQuery);
                                        setIsSearchFocused(false);
                                    }
                                }
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
                                            key={user.type === 'COMPANY' ? user.slug : user.id}
                                            href={user.type === 'COMPANY' ? `/organization/${user.slug}` : `/profile/${user.account_name || user.id}`}
                                            className="flex items-center gap-3 px-4 py-2.5 hover:bg-muted/50 transition-colors"
                                            onClick={() => {
                                                saveSearch(user);
                                                setIsSearchFocused(false);
                                                setSearchQuery("");
                                            }}
                                        >
                                            <img src={user.avatar_url || (user.type === 'COMPANY' ? '/assets/company-placeholder.png' : '/assets/pngegg.png')} alt={user.full_name} className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <p className="text-sm font-semibold text-foreground truncate">{user.full_name}</p>
                                                    {user.type === 'COMPANY' && (
                                                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-primary/10 text-primary flex-shrink-0">Company</span>
                                                    )}
                                                </div>
                                                {(user.headline || (user.type === 'COMPANY' && user.industry)) && (
                                                    <div className="flex items-center gap-1 text-xs text-muted-foreground truncate font-normal mt-0.5">
                                                        {user.headline && <span className="truncate">{user.headline}</span>}
                                                        {user.headline && user.type === 'COMPANY' && user.industry && <span className="flex-shrink-0">·</span>}
                                                        {user.type === 'COMPANY' && user.industry && <span className="truncate">{user.industry}</span>}
                                                    </div>
                                                )}
                                            </div>
                                        </Link>
                                    ))
                                ) : (
                                    <div className="p-4 text-center text-muted-foreground">No users found.</div>
                                )}
                            </div>
                        )}

                        {isSearchFocused && !searchQuery && (
                            <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-xl shadow-lg overflow-hidden z-50">
                                <div className="px-4 py-2 border-b border-border flex justify-between items-center bg-muted/30">
                                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Recent Searches</span>
                                    {history.length > 0 && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                clearAll();
                                            }}
                                            className="text-[10px] font-bold text-primary hover:underline flex items-center gap-1"
                                        >
                                            <Trash2 className="w-3 h-3" />
                                            Clear All
                                        </button>
                                    )}
                                </div>
                                <div className="max-h-[300px] overflow-y-auto">
                                    {history.length > 0 ? (
                                        history.map((item) => (
                                            <div key={item.id} className="relative group/history">
                                                {item.type === 'USER' ? (
                                                    <Link
                                                        href={item.value.type === 'COMPANY' ? `/organization/${item.value.slug}` : `/profile/${item.value.account_name || item.value.id}`}
                                                        className="flex items-center gap-3 px-4 py-2.5 hover:bg-muted/50 transition-colors"
                                                        onClick={() => saveSearch(item.value)}
                                                    >
                                                        <img src={item.value.avatar_url || (item.value.type === 'COMPANY' ? '/assets/company-placeholder.png' : '/assets/pngegg.png')} alt={item.value.full_name} className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2">
                                                                <p className="text-sm font-semibold text-foreground truncate">{item.value.full_name}</p>
                                                                {item.value.type === 'COMPANY' && (
                                                                    <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-primary/10 text-primary flex-shrink-0">Company</span>
                                                                )}
                                                            </div>
                                                            {(item.value.headline || (item.value.type === 'COMPANY' && item.value.industry)) && (
                                                                <div className="flex items-center gap-1 text-xs text-muted-foreground truncate font-normal mt-0.5">
                                                                    {item.value.headline && <span className="truncate">{item.value.headline}</span>}
                                                                    {item.value.headline && item.value.type === 'COMPANY' && item.value.industry && <span className="flex-shrink-0">·</span>}
                                                                    {item.value.type === 'COMPANY' && item.value.industry && <span className="truncate">{item.value.industry}</span>}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </Link>
                                                ) : (
                                                    <div
                                                        className="flex items-center gap-3 px-4 py-2.5 hover:bg-muted/50 transition-colors cursor-pointer"
                                                        onClick={() => {
                                                            const queryText = item.value as string;
                                                            setSearchQuery(queryText);
                                                            saveSearch(queryText);
                                                        }}
                                                    >
                                                        <div className="w-10 h-10 rounded-full bg-muted/80 flex items-center justify-center flex-shrink-0">
                                                            <Clock className="w-5 h-5 text-muted-foreground" />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2">
                                                                <p className="text-sm font-semibold text-foreground truncate">{item.value as string}</p>
                                                            </div>
                                                            <p className="text-[10px] text-muted-foreground truncate uppercase font-medium mt-0.5 tracking-tight">Recent Search</p>
                                                        </div>
                                                    </div>
                                                )}
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        e.preventDefault();
                                                        removeSearch(item.id);
                                                    }}
                                                    className="absolute right-4 top-1/2 -translate-y-1/2 p-1.5 rounded-lg opacity-0 group-hover/history:opacity-100 hover:bg-muted transition-all text-xs"
                                                    title="Remove from history"
                                                >
                                                    ❌
                                                </button>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="p-8 text-center">
                                            <Clock className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                                            <p className="text-sm text-muted-foreground">No recent searches yet.</p>
                                        </div>
                                    )}
                                </div>
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
                        <div className="ml-1">
                            <ProfileSwitcher showArrow={true} />
                        </div>
                    </div>
                </div>

                {/* --- Mobile Header (Hidden from md screens up) --- */}
                <div className="md:hidden flex items-center gap-2 relative">
                    {/* Mobile Search Bar */}
                    <div className="flex-1 flex items-center gap-3 relative">
                        <Search 
                            className="w-4 h-4 text-muted-foreground absolute left-3 cursor-pointer" 
                            onClick={() => {
                                if (searchQuery.trim()) {
                                    saveSearch(searchQuery);
                                    setIsSearchFocused(false);
                                }
                            }}
                        />
                        <input
                            type="text"
                            placeholder="Search users..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onFocus={() => setIsSearchFocused(true)}
                            onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    if (searchQuery.trim()) {
                                        saveSearch(searchQuery);
                                        setIsSearchFocused(false);
                                    }
                                }
                            }}
                            className="w-full pl-10 pr-4 py-2.5 bg-muted/50 border border-transparent focus:border-primary/30 focus:bg-background rounded-xl text-sm transition-all outline-none"
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
                                            key={user.type === 'COMPANY' ? user.slug : user.id}
                                            href={user.type === 'COMPANY' ? `/organization/${user.slug}` : `/profile/${user.account_name || user.id}`}
                                            className="flex items-center gap-3 px-4 py-2.5 hover:bg-muted/50 transition-colors"
                                            onClick={() => {
                                                saveSearch(user);
                                                setIsSearchFocused(false);
                                                setSearchQuery("");
                                            }}
                                        >
                                            <img src={user.avatar_url || (user.type === 'COMPANY' ? '/assets/company-placeholder.png' : '/assets/pngegg.png')} alt={user.full_name} className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <p className="text-sm font-semibold text-foreground truncate">{user.full_name}</p>
                                                    {user.type === 'COMPANY' && (
                                                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-primary/10 text-primary flex-shrink-0">Company</span>
                                                    )}
                                                </div>
                                                {(user.headline || (user.type === 'COMPANY' && user.industry)) && (
                                                    <div className="flex items-center gap-1 text-xs text-muted-foreground truncate font-normal mt-0.5">
                                                        {user.headline && <span className="truncate">{user.headline}</span>}
                                                        {user.headline && user.type === 'COMPANY' && user.industry && <span className="flex-shrink-0">·</span>}
                                                        {user.type === 'COMPANY' && user.industry && <span className="truncate">{user.industry}</span>}
                                                    </div>
                                                )}
                                            </div>
                                        </Link>
                                    ))
                                ) : (
                                    <div className="p-4 text-center text-muted-foreground">No users found.</div>
                                )}
                            </div>
                        )}

                        {/* Mobile Search History Dropdown */}
                        {isSearchFocused && !searchQuery && (
                            <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-xl shadow-lg overflow-hidden z-50">
                                <div className="px-4 py-2 border-b border-border flex justify-between items-center bg-muted/30">
                                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Recent</span>
                                    {history.length > 0 && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                clearAll();
                                            }}
                                            className="text-[10px] font-bold text-primary hover:underline"
                                        >
                                            Clear
                                        </button>
                                    )}
                                </div>
                                <div className="max-h-[250px] overflow-y-auto">
                                    {history.length > 0 ? (
                                        history.map((item) => (
                                            <div key={item.id} className="relative group/history">
                                                {item.type === 'USER' ? (
                                                    <Link
                                                        href={item.value.type === 'COMPANY' ? `/organization/${item.value.slug}` : `/profile/${item.value.account_name || item.value.id}`}
                                                        className="flex items-center gap-3 px-4 py-2.5 hover:bg-muted/50 transition-colors"
                                                        onClick={() => saveSearch(item.value)}
                                                    >
                                                        <img src={item.value.avatar_url || (item.value.type === 'COMPANY' ? '/assets/company-placeholder.png' : '/assets/pngegg.png')} alt={item.value.full_name} className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2">
                                                                <p className="text-sm font-semibold text-foreground truncate">{item.value.full_name}</p>
                                                                {item.value.type === 'COMPANY' && (
                                                                    <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-primary/10 text-primary flex-shrink-0">Company</span>
                                                                )}
                                                            </div>
                                                            {(item.value.headline || (item.value.type === 'COMPANY' && item.value.industry)) && (
                                                                <div className="flex items-center gap-1 text-xs text-muted-foreground truncate font-normal mt-0.5">
                                                                    {item.value.headline && <span className="truncate">{item.value.headline}</span>}
                                                                    {item.value.headline && item.value.type === 'COMPANY' && item.value.industry && <span className="flex-shrink-0">·</span>}
                                                                    {item.value.type === 'COMPANY' && item.value.industry && <span className="truncate">{item.value.industry}</span>}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </Link>
                                                ) : (
                                                    <div
                                                        className="flex items-center gap-3 px-4 py-2.5 hover:bg-muted/50 transition-colors cursor-pointer"
                                                        onClick={() => {
                                                            const queryText = item.value as string;
                                                            setSearchQuery(queryText);
                                                            saveSearch(queryText);
                                                        }}
                                                    >
                                                        <div className="w-10 h-10 rounded-full bg-muted/80 flex items-center justify-center flex-shrink-0">
                                                            <Clock className="w-5 h-5 text-muted-foreground" />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2">
                                                                <p className="text-sm font-semibold text-foreground truncate">{item.value as string}</p>
                                                            </div>
                                                            <p className="text-[10px] text-muted-foreground truncate uppercase font-medium mt-0.5 tracking-tight">Recent Search</p>
                                                        </div>
                                                    </div>
                                                )}
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        e.preventDefault();
                                                        removeSearch(item.id);
                                                    }}
                                                    className="absolute right-4 top-1/2 -translate-y-1/2 p-1.5 rounded-lg opacity-100 bg-muted/50 text-xs"
                                                    title="Remove from history"
                                                >
                                                    ❌
                                                </button>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="p-8 text-center">
                                            <Clock className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                                            <p className="text-sm text-muted-foreground">No recent searches yet.</p>
                                        </div>
                                    )}
                                </div>
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
