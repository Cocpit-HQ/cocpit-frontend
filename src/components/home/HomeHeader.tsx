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
            className={`sticky top-0 z-50 bg-background/85 px-3 py-2 backdrop-blur-md transition-transform duration-300 ease-in-out supports-[backdrop-filter]:bg-background/70 md:px-0 md:py-0 ${!isHeaderVisible && !isSearchFocused ? '-translate-y-full' : 'translate-y-0'
                } md:translate-y-0`}
        >
            <div className="mx-auto flex min-h-12 min-w-0 max-w-[1128px] items-center px-0 md:min-h-[72px] md:px-4 xl:px-0">
                {/* --- Desktop Header (Visible from md screens up) --- */}
                <div className="hidden flex-1 min-w-0 md:flex items-center justify-between md:mx-auto max-w-[998px] h-full gap-4">
                    {/* Header Left Section (Search Bar) */}
                    <div className="relative flex flex-row justify-between items-center flex-1 min-w-0 max-w-[360px] h-10 px-4 py-2 gap-[10px] rounded-[24px] border border-[#6B7280] bg-transparent transition-all duration-300">
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
                            className="flex-grow min-w-0 bg-transparent text-[#6B7280] dark:text-white placeholder-[#6B7280] text-[16px] font-normal leading-[24px] font-poppins focus:outline-none outline-none"
                        />
                        <Search
                            className="w-6 h-6 text-[#6B7280] cursor-pointer hover:scale-110 transition-transform flex-shrink-0"
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
                                                className={`flex items-center gap-3 px-4 py-2.5 transition-colors ${activeIndex === idx ? 'bg-[#EEF2FF] dark:bg-[#1e1b4b]/50 text-[#6366F1] dark:text-[#818CF8]' : 'hover:bg-[#EEF2FF] dark:hover:bg-[#1e1b4b]/50 text-foreground'}`}
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
                                                className={`w-full px-4 py-2 text-xs font-bold text-primary transition-colors text-left border-t border-border/50 bg-muted/5 ${activeIndex === 5 ? 'bg-[#EEF2FF] dark:bg-[#1e1b4b]/50' : 'hover:bg-[#EEF2FF] dark:hover:bg-[#1e1b4b]/50'}`}
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
                                                    className={`flex items-center gap-3 px-4 py-2.5 transition-colors ${activeIndex === adjustedIdx ? 'bg-[#EEF2FF] dark:bg-[#1e1b4b]/50 text-foreground' : 'hover:bg-[#EEF2FF] dark:hover:bg-[#1e1b4b]/50 text-foreground'}`}
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
                            <div
                                className="absolute top-full left-0 mt-2 bg-white dark:bg-[#1a1a2e] border border-[#C7D2FE] rounded-[24px] shadow-lg overflow-hidden z-50 flex flex-col items-start py-4 px-0"
                                style={{
                                    boxSizing: 'border-box',
                                    width: '421px',
                                    height: '410px',
                                    gap: '16px',
                                }}
                            >
                                {/* Frame 2608712 */}
                                <div
                                    className="w-full flex flex-row items-center px-4"
                                    style={{
                                        height: '26px',
                                        gap: '10px',
                                        flex: 'none',
                                        order: 0,
                                        alignSelf: 'stretch',
                                        flexGrow: 0,
                                    }}
                                >
                                    <span
                                        className="font-poppins text-black dark:text-white"
                                        style={{
                                            width: '63px',
                                            height: '26px',
                                            fontStyle: 'normal',
                                            fontWeight: 500,
                                            fontSize: '18px',
                                            lineHeight: '26px',
                                            color: 'currentColor',
                                            flex: 'none',
                                            order: 0,
                                            flexGrow: 0,
                                        }}
                                    >
                                        Recent
                                    </span>
                                </div>

                                {/* Scrollable list */}
                                <div className="w-full flex-1 overflow-y-auto scrollbar-hide flex flex-col gap-2">
                                    {history.length > 0 ? (
                                        history.map((item, idx) => (
                                            <div
                                                key={item.id}
                                                className="relative group/history w-full"
                                            >
                                                {item.type === 'USER' ? (
                                                    /* Frame 2608727 */
                                                    <Link
                                                        href={item.value.type === 'COMPANY' ? `/organization/${item.value.slug}` : `/profile/${item.value.account_name || item.value.id}`}
                                                        className="w-full flex flex-row items-start px-4 py-2 transition-colors hover:bg-[#EEF2FF] dark:hover:bg-[#1e1b4b]/50"
                                                        style={{
                                                            height: '56px',
                                                            gap: '16px',
                                                            backgroundColor: activeIndex === idx ? '#EEF2FF' : 'transparent',
                                                            flex: 'none',
                                                            alignSelf: 'stretch',
                                                            flexGrow: 0,
                                                        }}
                                                        onClick={() => saveSearch(item.value)}
                                                    >
                                                        {/* Frame 2608720 */}
                                                        <div
                                                            style={{
                                                                display: 'flex',
                                                                flexDirection: 'row',
                                                                alignItems: 'center',
                                                                padding: '0px',
                                                                gap: '8px',
                                                                width: '389px',
                                                                height: '40px',
                                                                flex: 'none',
                                                                order: 0,
                                                                flexGrow: 1,
                                                            }}
                                                        >
                                                            {/* Ellipse 2 / Ellipse 24 */}
                                                            <img
                                                                src={item.value.avatar_url || (item.value.type === 'COMPANY' ? '/assets/company-placeholder.png' : '/assets/pngegg.png')}
                                                                alt={item.value.full_name}
                                                                className="rounded-full object-cover"
                                                                style={{
                                                                    width: '40px',
                                                                    height: '40px',
                                                                    flex: 'none',
                                                                    order: 0,
                                                                    flexGrow: 0,
                                                                }}
                                                            />

                                                            {/* Frame 2608728 */}
                                                            <div
                                                                style={{
                                                                    display: 'flex',
                                                                    flexDirection: 'column',
                                                                    justifyContent: 'center',
                                                                    alignItems: 'flex-start',
                                                                    padding: '0px',
                                                                    width: '144px',
                                                                    height: '40px',
                                                                    flex: 'none',
                                                                    order: 1,
                                                                    flexGrow: 0,
                                                                }}
                                                            >
                                                                {/* Amara okafor / Sara chen */}
                                                                <span
                                                                    className="font-poppins text-black dark:text-white truncate"
                                                                    style={{
                                                                        height: '24px',
                                                                        fontStyle: 'normal',
                                                                        fontWeight: 400,
                                                                        fontSize: '16px',
                                                                        lineHeight: '24px',
                                                                        color: 'currentColor',
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        flex: 'none',
                                                                        order: 0,
                                                                        flexGrow: 0,
                                                                    }}
                                                                >
                                                                    {item.value.full_name}
                                                                </span>

                                                                {/* Senior product designer */}
                                                                <span
                                                                    className="font-poppins text-muted-foreground truncate"
                                                                    style={{
                                                                        width: '144px',
                                                                        height: '16px',
                                                                        fontStyle: 'normal',
                                                                        fontWeight: 400,
                                                                        fontSize: '12px',
                                                                        lineHeight: '16px',
                                                                        color: '#6B7280',
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        flex: 'none',
                                                                        order: 1,
                                                                        flexGrow: 0,
                                                                    }}
                                                                >
                                                                    {item.value.headline || (item.value.type === 'COMPANY' ? item.value.industry : 'Product Designer')}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </Link>
                                                ) : (
                                                    /* Frame 2608724 */
                                                    <div
                                                        className="w-full flex flex-row items-center px-4 py-2 transition-colors cursor-pointer hover:bg-[#EEF2FF] dark:hover:bg-[#1e1b4b]/50"
                                                        style={{
                                                            height: '40px',
                                                            gap: '10px',
                                                            backgroundColor: activeIndex === idx ? '#EEF2FF' : 'transparent',
                                                            flex: 'none',
                                                            alignSelf: 'stretch',
                                                            flexGrow: 0,
                                                        }}
                                                        onClick={() => {
                                                            const queryText = item.value as string;
                                                            setSearchQuery(queryText);
                                                            saveSearch(queryText);
                                                        }}
                                                    >
                                                        {/* Recent Icon */}
                                                        <div
                                                            style={{
                                                                width: '24px',
                                                                height: '24px',
                                                                flex: 'none',
                                                                order: 0,
                                                                flexGrow: 0,
                                                            }}
                                                        >
                                                            <Clock className="w-6 h-6 text-black dark:text-white" />
                                                        </div>

                                                        {/* UI UX job */}
                                                        <span
                                                            className="font-poppins text-black dark:text-white truncate"
                                                            style={{
                                                                height: '24px',
                                                                fontStyle: 'normal',
                                                                fontWeight: 400,
                                                                fontSize: '16px',
                                                                lineHeight: '24px',
                                                                color: 'currentColor',
                                                                flex: 'none',
                                                                order: 1,
                                                                flexGrow: 0,
                                                            }}
                                                        >
                                                            {item.value as string}
                                                        </span>
                                                    </div>
                                                )}
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        e.preventDefault();
                                                        removeSearch(item.id);
                                                    }}
                                                    className="absolute right-4 top-1/2 -translate-y-1/2 p-1.5 rounded-lg opacity-0 group-hover/history:opacity-100 hover:bg-muted/10 transition-all text-xs"
                                                    title="Remove from history"
                                                >
                                                    ❌
                                                </button>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="py-8 text-center text-sm text-muted-foreground w-full">
                                            No recent searches yet.
                                        </div>
                                    )}
                                </div>

                                {/* Frame 2608719 */}
                                {history.length > 0 && (
                                    <div
                                        className="w-full flex flex-row justify-center items-center px-4"
                                        style={{
                                            height: '24px',
                                            gap: '10px',
                                            flex: 'none',
                                            order: 6,
                                            alignSelf: 'stretch',
                                            flexGrow: 0,
                                        }}
                                    >
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                clearAll();
                                            }}
                                            className="font-poppins text-[#6366F1] hover:text-[#6366F1]/80 transition-colors"
                                            style={{
                                                width: '67px',
                                                height: '24px',
                                                fontStyle: 'normal',
                                                fontWeight: 500,
                                                fontSize: '16px',
                                                lineHeight: '24px',
                                                color: '#6366F1',
                                                flex: 'none',
                                                order: 0,
                                                flexGrow: 0,
                                            }}
                                        >
                                            Clear all
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Header Right Section (Action Buttons) */}
                    <div className="flex items-center gap-4 shrink-0 xl:w-[406px] xl:justify-end">
                        <button
                            onClick={() => setActiveModal('create-post')}
                            className="flex items-center justify-center gap-[10px] w-[122px] h-10 rounded-[24px] bg-[#6366F1] hover:bg-[#5558e3] text-white font-[family-name:var(--font-poppins)] text-[16px] font-normal leading-[24px] text-center transition-all shadow-sm"
                        >
                            <span>Create</span>
                            <div className="w-5 h-5 rounded-full border-2 border-white flex items-center justify-center flex-shrink-0">
                                <Plus size={12} strokeWidth={3} />
                            </div>
                        </button>

                        {/* Icons group — gap-2 (8px) between each, each icon 56×40 */}
                        <div className="flex items-center gap-2">
                            <NotificationPopover
                                className={`relative flex items-center justify-center transition-colors w-14 h-10 rounded-[24px] ${isNotificationsActive || isPopoverOpen ? 'bg-[#EEF2FF] dark:bg-[#1e1b4b]/50 text-[#6366F1] dark:text-[#818CF8]' : 'text-[#000000] dark:text-white hover:bg-[#EEF2FF] dark:hover:bg-[#1e1b4b]/50'}`}
                                icon={<Bell width={24} height={24} strokeWidth={1.5} />}
                                onOpenChange={setIsPopoverOpen}
                            />
                            <Link
                                href="/messaging"
                                className={`flex items-center justify-center w-14 h-10 rounded-[24px] transition-colors ${pathname === '/messaging' || pathname.startsWith('/messaging') ? 'bg-[#EEF2FF] dark:bg-[#1e1b4b]/50 text-[#6366F1] dark:text-[#818CF8]' : 'text-[#000000] dark:text-white hover:bg-[#EEF2FF] dark:hover:bg-[#1e1b4b]/50'}`}
                            >
                                <MessageCircle width={24} height={24} strokeWidth={1.5} />
                            </Link>
                            <div className="flex items-center justify-center w-14 h-10 rounded-[24px]">
                                <ProfileSwitcher showArrow={false} />
                            </div>
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
                            className="w-full pl-4 pr-10 py-2.5 bg-transparent border border-border focus:border-primary rounded-full text-sm transition-all outline-none text-foreground"
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
                                className={`relative flex items-center justify-center transition-colors hover:text-foreground ${isNotificationsActive || isPopoverOpen ? 'bg-[#EEF2FF] dark:bg-[#1e1b4b]/50 text-primary dark:text-[#818CF8] w-14 h-10 px-4 py-2 rounded-[24px]' : 'text-muted-foreground hover:bg-[#EEF2FF] dark:hover:bg-[#1e1b4b]/50 p-2 rounded-full'}`}
                                icon={<Bell className="w-5 h-5" />}
                                onOpenChange={setIsPopoverOpen}
                            />
                            <Link
                                href="/messaging"
                                className={`p-2 rounded-full transition-colors ${pathname === '/messaging' || pathname.startsWith('/messaging') ? 'bg-[#EEF2FF] dark:bg-[#1e1b4b]/50 text-primary dark:text-[#818CF8]' : 'text-muted-foreground hover:bg-[#EEF2FF] dark:hover:bg-[#1e1b4b]/50'}`}
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
