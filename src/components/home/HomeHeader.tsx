'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Search, MessageCircle, Clock, Trash2, Bell } from 'lucide-react';
import Link from 'next/link';
import { NotificationPopover } from '@/components/notifications/NotificationPopover';
import { useDebounce } from '@/hooks/use-debounce';
import { searchUsers } from '@/services/api/user';
import { searchHashtags, HashtagSuggestion } from '@/services/api/hashtags';
import { SearchedUser } from '@/types/user';
import { ProfileSwitcher } from '@/components/layout/ProfileSwitcher';
import { useSearchHistory } from '@/hooks/useSearchHistory';
import { useRouter, usePathname } from 'next/navigation';
import { Hash, Plus } from 'lucide-react';
import { useUIStore } from '@/store/ui.store';

export const HomeHeader = () => {
    const router = useRouter();
    const pathname = usePathname();
    const isNotificationsActive = pathname === '/notifications';
    const [isPopoverOpen, setIsPopoverOpen] = useState(false);
    // Reset popover-open state when navigating away from /notifications
    // so the active pill style doesn't get stuck after "See all" navigation
    useEffect(() => {
        if (pathname !== '/notifications') {
            setIsPopoverOpen(false);
        }
    }, [pathname]);
    const { setActiveModal } = useUIStore();
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<SearchedUser[]>([]);
    const [hashtagResults, setHashtagResults] = useState<HashtagSuggestion[]>([]);
    const [searchLoading, setSearchLoading] = useState(false);
    const [isSearchFocused, setIsSearchFocused] = useState(false);
    const debouncedSearchQuery = useDebounce(searchQuery, 300);

    const [activeIndex, setActiveIndex] = useState(-1);
    const abortControllerRef = useRef<AbortController | null>(null);
    const { history, saveSearch, removeSearch, clearAll } = useSearchHistory();

    const [isHeaderVisible, setIsHeaderVisible] = useState(true);
    const lastScrollY = useRef(0);
    const isFeedPage = pathname === '/feed' || pathname === '/';

    useEffect(() => {
        if (!isFeedPage) {
            setIsHeaderVisible(true);
            return;
        }

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
    }, [isFeedPage]);

    // Helper for matching text highlighting
    const highlightMatch = (text: string, query: string) => {
        if (!query.trim()) return text;
        const cleanQuery = query.startsWith('#') ? query.slice(1) : query;
        if (!cleanQuery) return text;

        try {
            const parts = text.split(new RegExp(`(${cleanQuery})`, 'gi'));
            return (
                <span>
                    {parts.map((part, i) =>
                        part.toLowerCase() === cleanQuery.toLowerCase()
                            ? <b key={i} className="text-primary font-bold">{part}</b>
                            : part
                    )}
                </span>
            );
        } catch {
            return text;
        }
    };


    useEffect(() => {
        if (debouncedSearchQuery.trim() === '') {
            setSearchResults([]);
            setHashtagResults([]);
            setActiveIndex(-1);
            return;
        }

        const fetchResults = async () => {
            // Cancel previous request
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
            abortControllerRef.current = new AbortController();

            setSearchLoading(true);
            try {
                const query = debouncedSearchQuery.trim();

                if (query.startsWith('#')) {
                    const data = await searchHashtags(query, abortControllerRef.current.signal);
                    setHashtagResults(data.tags);
                    setSearchResults([]);
                } else {
                    const users = await searchUsers(query); // Note: searchUsers might need signal too if updated
                    setSearchResults(users);
                    setHashtagResults([]);
                }
                setActiveIndex(0);
            } catch (error: unknown) {
                if (!(error instanceof DOMException && error.name === 'AbortError')) {
                    console.error('Error fetching search results:', error);
                    setSearchResults([]);
                    setHashtagResults([]);
                }
            } finally {
                setSearchLoading(false);
            }
        };

        fetchResults();

        return () => {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        };
    }, [debouncedSearchQuery]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        const totalItems = hashtagResults.length + searchResults.length;
        if (totalItems === 0 && history.length === 0) return;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            const max = searchQuery ? totalItems : history.length;
            setActiveIndex(prev => (prev + 1) % max);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            const max = searchQuery ? totalItems : history.length;
            setActiveIndex(prev => (prev - 1 + max) % max);
        } else if (e.key === 'Enter' && activeIndex >= 0) {
            e.preventDefault();
            if (searchQuery) {
                const visibleHashtags = hashtagResults.slice(0, 5);
                const hasSeeMore = hashtagResults.length > 5;

                if (activeIndex < visibleHashtags.length) {
                    const h = visibleHashtags[activeIndex];
                    saveSearch(`#${h.tag}`);
                    setIsSearchFocused(false);
                    setSearchQuery("");
                    router.push(`/hashtag/${h.tag.toLowerCase()}`);
                } else if (hasSeeMore && activeIndex === visibleHashtags.length) {
                    setIsSearchFocused(false);
                    router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
                } else {
                    const peopleIdx = activeIndex - visibleHashtags.length - (hasSeeMore ? 1 : 0);
                    const user = searchResults[peopleIdx];
                    if (user) {
                        saveSearch(user);
                        setIsSearchFocused(false);
                        setSearchQuery("");
                        router.push(user.type === 'COMPANY' ? `/organization/${user.slug}` : `/profile/${user.account_name || user.id}`);
                    }
                }
            } else {
                const item = history[activeIndex];
                if (item.type === 'USER') {
                    saveSearch(item.value);
                    router.push(item.value.type === 'COMPANY' ? `/organization/${item.value.slug}` : `/profile/${item.value.account_name || item.value.id}`);
                } else {
                    setSearchQuery(item.value as string);
                }
                setIsSearchFocused(false);
            }
        } else if (e.key === 'Escape') {
            setIsSearchFocused(false);
            (e.target as HTMLInputElement).blur();
        }
    };

    return (
        <header
            className={`sticky top-0 z-50 border-b border-border bg-background/85 px-3 py-2 backdrop-blur-md transition-transform duration-300 ease-in-out supports-[backdrop-filter]:bg-background/70 md:px-4 md:py-0 ${!isHeaderVisible && !isSearchFocused ? '-translate-y-full' : 'translate-y-0'
                } md:translate-y-0`}
        >
            <div className="mx-auto flex min-h-12 w-full max-w-[1128px] items-center px-1 md:min-h-14 md:px-4 xl:px-0">
                {/* --- Desktop Header (Visible from md screens up) --- */}
                <div className="hidden w-full md:flex items-center justify-between mx-auto max-w-[998px] h-full">
                    {/* Header Left Section (Search Bar) */}
                    <div className="flex items-center">
                        <div className="relative flex items-center w-[422px] h-10 transition-all duration-300">
                            <input
                                type="text"
                                placeholder="Search"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onFocus={() => setIsSearchFocused(true)}
                                onBlur={() => {
                                    setTimeout(() => setIsSearchFocused(false), 200);
                                }}
                                onKeyDown={handleKeyDown}
                                className="w-full h-full px-4 rounded-[24px] border border-primary/50 focus:border-primary focus:outline-none bg-secondary text-foreground placeholder-muted-foreground transition-all"
                            />
                            <Search
                                className="w-5 h-5 text-primary absolute right-4 cursor-pointer hover:scale-110 transition-transform"
                                onClick={() => {
                                    if (searchQuery.trim()) {
                                        saveSearch(searchQuery);
                                        setIsSearchFocused(false);
                                    }
                                }}
                            />

                            {/* Search Dropdown */}
                            {isSearchFocused && searchQuery && (
                                <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-xl shadow-lg overflow-hidden z-50">
                                    {hashtagResults.length > 0 && (
                                        <>
                                            <div className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b border-border bg-muted/20">
                                                Hashtags
                                            </div>
                                            {hashtagResults.slice(0, 5).map((h, idx) => (
                                                <Link
                                                    key={h.tag}
                                                    href={`/hashtag/${h.tag.toLowerCase()}`}
                                                    className={`flex items-center gap-3 px-4 py-2.5 transition-colors ${activeIndex === idx ? 'bg-primary/10' : 'hover:bg-muted/50'}`}
                                                    onClick={() => {
                                                        saveSearch(`#${h.tag}`);
                                                        setIsSearchFocused(false);
                                                        setSearchQuery("");
                                                    }}
                                                >
                                                    <div className="w-10 h-10 rounded-full bg-muted/80 flex items-center justify-center flex-shrink-0">
                                                        <Hash className="w-5 h-5 text-primary" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-semibold text-foreground truncate">
                                                            #{highlightMatch(h.tag, searchQuery)}
                                                        </p>
                                                        <p className="text-[10px] text-muted-foreground truncate uppercase font-medium mt-0.5 tracking-tight">{h.usage_count} Posts</p>
                                                    </div>
                                                </Link>
                                            ))}
                                            {hashtagResults.length > 5 && (
                                                <button
                                                    onClick={() => {
                                                        setIsSearchFocused(false);
                                                        router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
                                                    }}
                                                    className={`w-full px-4 py-2 text-xs font-bold text-primary transition-colors text-left border-t border-border/50 bg-muted/5 ${activeIndex === 5 ? 'bg-primary/10' : 'hover:bg-primary/5'}`}
                                                >
                                                    See more results for &quot;{searchQuery}&quot;
                                                </button>
                                            )}
                                        </>
                                    )}

                                    {searchResults.length > 0 && (
                                        <>
                                            <div className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b border-border bg-muted/20">
                                                People & Organizations
                                            </div>
                                            {searchResults.map((user, idx) => {
                                                const visibleHashtagsCount = Math.min(hashtagResults.length, 5);
                                                const hasSeeMore = hashtagResults.length > 5;
                                                const adjustedIdx = idx + visibleHashtagsCount + (hasSeeMore ? 1 : 0);
                                                return (
                                                    <Link
                                                        key={user.type === 'COMPANY' ? user.slug : user.id}
                                                        href={user.type === 'COMPANY' ? `/organization/${user.slug}` : `/profile/${user.account_name || user.id}`}
                                                        className={`flex items-center gap-3 px-4 py-2.5 transition-colors ${activeIndex === adjustedIdx ? 'bg-primary/10' : 'hover:bg-muted/50'}`}
                                                        onClick={() => {
                                                            saveSearch(user);
                                                            setIsSearchFocused(false);
                                                            setSearchQuery("");
                                                        }}
                                                    >
                                                        <img src={user.avatar_url || (user.type === 'COMPANY' ? '/assets/company-placeholder.png' : '/assets/pngegg.png')} alt={user.full_name} className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2">
                                                                <p className="text-sm font-semibold text-foreground truncate">{highlightMatch(user.full_name, searchQuery)}</p>
                                                                {user.type === 'COMPANY' && (
                                                                    <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-primary/10 text-primary flex-shrink-0">Company</span>
                                                                )}
                                                            </div>
                                                            {(user.headline || (user.type === 'COMPANY' && user.industry)) && (
                                                                <div className="flex items-center gap-1 text-xs text-muted-foreground truncate font-normal mt-0.5">
                                                                    {user.headline && <span className="truncate">{user.headline}</span>}
                                                                    {user.headline && user.type === 'COMPANY' && user.industry && <span className="flex-shrink-0">·</span>}
                                                                    {user.type === 'COMPANY' && user.industry && <span className="truncate text-primary/70">{user.industry}</span>}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </Link>
                                                );
                                            })}
                                        </>
                                    )}

                                    {!searchLoading && searchResults.length === 0 && hashtagResults.length === 0 && (
                                        <div className="p-4 text-center text-muted-foreground">No matches found.</div>
                                    )}

                                    {searchLoading && (
                                        <div className="p-4 text-center text-muted-foreground">Loading matches...</div>
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
                                            history.map((item, idx) => (
                                                <div key={item.id} className={`relative group/history transition-colors ${activeIndex === idx ? 'bg-primary/5' : ''}`}>
                                                    {item.type === 'USER' ? (
                                                        <Link
                                                            href={item.value.type === 'COMPANY' ? `/organization/${item.value.slug}` : `/profile/${item.value.account_name || item.value.id}`}
                                                            className={`flex items-center gap-3 px-4 py-2.5 transition-colors ${activeIndex === idx ? '' : 'hover:bg-muted/50'}`}
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
                                                            className={`flex items-center gap-3 px-4 py-2.5 transition-colors cursor-pointer ${activeIndex === idx ? '' : 'hover:bg-muted/50'}`}
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
                    </div>

                    {/* Header Right Section (Action Buttons) */}
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setActiveModal('create-post')}
                            className="flex items-center justify-center gap-[10px] w-[122px] h-10 rounded-[24px] bg-[#6366F1] hover:bg-[#5558e3] text-white text-sm font-semibold transition-all shadow-sm"
                        >
                            <span>Create</span>
                            <div className="w-5 h-5 rounded-full border-2 border-white flex items-center justify-center flex-shrink-0">
                                <Plus size={12} strokeWidth={3} />
                            </div>
                        </button>

                        <div className="flex items-center gap-4 text-muted-foreground">
                            <NotificationPopover
                                className={`relative flex items-center justify-center transition-colors  ${isNotificationsActive || isPopoverOpen ? 'bg-primary/10 text-primary w-14 h-10 px-4 py-2 rounded-[24px]' : 'text-muted-foreground p-2 rounded-full'}`}
                                icon={<Bell width={20} height={20} strokeWidth={1.5} />}
                                onOpenChange={setIsPopoverOpen}
                            />
                            <Link
                                href="/messaging"
                                className="p-2 rounded-full transition-colors hover:bg-muted hover:text-foreground"
                            >
                                <MessageCircle width={20} height={20} strokeWidth={1.5} />
                            </Link>
                        </div>
                        <div className="ml-2">
                            <ProfileSwitcher showArrow={true} />
                        </div>
                    </div>
                </div>

                {/* --- Mobile Header (Hidden from md screens up) --- */}
                <div className="relative flex w-full items-center gap-2 md:hidden">
                    {/* Mobile Search Bar */}
                    <div className="flex-1 flex items-center gap-3 relative">
                        <input
                            type="text"
                            placeholder="Search"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onFocus={() => setIsSearchFocused(true)}
                            onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
                            onKeyDown={handleKeyDown}
                            className="w-full pl-4 pr-10 py-2.5 bg-secondary border border-border focus:border-primary rounded-full text-sm transition-all outline-none text-foreground"
                        />
                        <Search
                            className="w-4 h-4 text-primary absolute right-3 cursor-pointer"
                            onClick={() => {
                                if (searchQuery.trim()) {
                                    saveSearch(searchQuery);
                                    setIsSearchFocused(false);
                                }
                            }}
                        />
                        {/* Mobile Search Dropdown */}
                        {isSearchFocused && searchQuery && (
                            <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-xl shadow-lg overflow-hidden z-50">
                                {hashtagResults.length > 0 && (
                                    <>
                                        <div className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b border-border bg-muted/20">
                                            Hashtags
                                        </div>
                                        {hashtagResults.slice(0, 5).map((h, idx) => (
                                            <Link
                                                key={h.tag}
                                                href={`/hashtag/${h.tag.toLowerCase()}`}
                                                className={`flex items-center gap-3 px-4 py-2.5 transition-colors ${activeIndex === idx ? 'bg-primary/10' : 'hover:bg-muted/50'}`}
                                                onClick={() => {
                                                    saveSearch(`#${h.tag}`);
                                                    setIsSearchFocused(false);
                                                    setSearchQuery("");
                                                }}
                                            >
                                                <div className="w-8 h-8 rounded-full bg-muted/80 flex items-center justify-center flex-shrink-0">
                                                    <Hash className="w-4 h-4 text-primary" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-semibold text-foreground truncate">
                                                        #{highlightMatch(h.tag, searchQuery)}
                                                    </p>
                                                    <p className="text-[10px] text-muted-foreground truncate uppercase font-medium mt-0.5 tracking-tight">{h.usage_count} Posts</p>
                                                </div>
                                            </Link>
                                        ))}
                                        {hashtagResults.length > 5 && (
                                            <button
                                                onClick={() => {
                                                    setIsSearchFocused(false);
                                                    router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
                                                }}
                                                className={`w-full px-4 py-2 text-xs font-bold text-primary transition-colors text-left border-t border-border/50 bg-muted/5 ${activeIndex === 5 ? 'bg-primary/10' : 'hover:bg-primary/5'}`}
                                            >
                                                See more results for &quot;{searchQuery}&quot;
                                            </button>
                                        )}
                                    </>
                                )}

                                {searchResults.length > 0 && (
                                    <>
                                        <div className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b border-border bg-muted/20">
                                            People
                                        </div>
                                        {searchResults.map((user, idx) => {
                                            const visibleHashtagsCount = Math.min(hashtagResults.length, 5);
                                            const hasSeeMore = hashtagResults.length > 5;
                                            const adjustedIdx = idx + visibleHashtagsCount + (hasSeeMore ? 1 : 0);
                                            return (
                                                <Link
                                                    key={user.type === 'COMPANY' ? user.slug : user.id}
                                                    href={user.type === 'COMPANY' ? `/organization/${user.slug}` : `/profile/${user.account_name || user.id}`}
                                                    className={`flex items-center gap-3 px-4 py-2.5 transition-colors ${activeIndex === adjustedIdx ? 'bg-primary/10' : 'hover:bg-muted/50'}`}
                                                    onClick={() => {
                                                        saveSearch(user);
                                                        setIsSearchFocused(false);
                                                        setSearchQuery("");
                                                    }}
                                                >
                                                    <img src={user.avatar_url || (user.type === 'COMPANY' ? '/assets/company-placeholder.png' : '/assets/pngegg.png')} alt={user.full_name} className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2">
                                                            <p className="text-sm font-semibold text-foreground truncate">{highlightMatch(user.full_name, searchQuery)}</p>
                                                            {user.type === 'COMPANY' && (
                                                                <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-primary/10 text-primary flex-shrink-0">Co</span>
                                                            )}
                                                        </div>
                                                        {(user.headline || (user.type === 'COMPANY' && user.industry)) && (
                                                            <p className="text-xs text-muted-foreground truncate font-normal mt-0.5">
                                                                {user.headline || user.industry}
                                                            </p>
                                                        )}
                                                    </div>
                                                </Link>
                                            );
                                        })}
                                    </>
                                )}

                                {searchLoading && (
                                    <div className="p-4 text-center text-muted-foreground animate-pulse">Searching...</div>
                                )}

                                {!searchLoading && searchResults.length === 0 && hashtagResults.length === 0 && (
                                    <div className="p-4 text-center text-muted-foreground">No matches found.</div>
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
                                        history.map((item, idx) => (
                                            <div key={item.id} className={`relative group/history transition-colors ${activeIndex === idx ? 'bg-primary/5' : ''}`}>
                                                {item.type === 'USER' ? (
                                                    <Link
                                                        href={item.value.type === 'COMPANY' ? `/organization/${item.value.slug}` : `/profile/${item.value.account_name || item.value.id}`}
                                                        className={`flex items-center gap-3 px-4 py-2.5 transition-colors ${activeIndex === idx ? '' : 'hover:bg-muted/50'}`}
                                                        onClick={() => saveSearch(item.value)}
                                                    >
                                                        <img src={item.value.avatar_url || (item.value.type === 'COMPANY' ? '/assets/company-placeholder.png' : '/assets/pngegg.png')} alt={item.value.full_name} className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm font-semibold text-foreground truncate">{item.value.full_name}</p>
                                                            <p className="text-[10px] text-muted-foreground truncate uppercase font-medium">Recent Profile</p>
                                                        </div>
                                                    </Link>
                                                ) : (
                                                    <div
                                                        className={`flex items-center gap-3 px-4 py-2.5 transition-colors cursor-pointer ${activeIndex === idx ? '' : 'hover:bg-muted/50'}`}
                                                        onClick={() => {
                                                            const queryText = item.value as string;
                                                            setSearchQuery(queryText);
                                                            saveSearch(queryText);
                                                        }}
                                                    >
                                                        <div className="w-8 h-8 rounded-full bg-muted/80 flex items-center justify-center flex-shrink-0">
                                                            <Clock className="w-4 h-4 text-muted-foreground" />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm font-semibold text-foreground truncate">{item.value as string}</p>
                                                            <p className="text-[10px] text-muted-foreground truncate uppercase font-medium">Recent Search</p>
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
                            <NotificationPopover
                                className={`relative flex items-center justify-center transition-colors hover:bg-muted hover:text-foreground ${isNotificationsActive || isPopoverOpen ? 'bg-primary/10 text-primary w-14 h-10 px-4 py-2 rounded-[24px]' : 'text-muted-foreground p-2 rounded-full'}`}
                                icon={<Bell className="w-5 h-5" />}
                                onOpenChange={setIsPopoverOpen}
                            />
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
