'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, MessageCircle, Clock, Trash2, Bell, MessageSquareText } from 'lucide-react';
import { Icon } from '@iconify/react';
import Link from 'next/link';
import { useDebounce } from '@/hooks/use-debounce';
import { searchUsers } from '@/services/api/user';
import { searchHashtags, HashtagSuggestion } from '@/services/api/hashtags';
import { SearchedUser } from '@/types/user';
import { ProfileDropdown } from '@/components/layout/ProfileDropdown';
import { useSearchHistory } from '@/hooks/useSearchHistory';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { ChannelSearchBar } from '../../features/channel/public/components/ChannelSearchBar';
import { Hash, Plus } from 'lucide-react';
import { useUIStore } from '@/store/ui.store';
import { useActiveProfile } from '@/context/ActiveProfileContext';
import { getNotifications } from '@/features/notification/api';
import { useSocket } from '@/context/SocketContext';
import { useCompanyPermissions } from '@/components/organizations/hooks/use-company';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { FeatureDisabledTooltip } from '@/components/feature-flags';
import * as channelService from '@/features/channel/services/channel.service';
import { useQuery } from '@tanstack/react-query';
import { getConversations } from '@/services/api/messaging';
import { mapBackendChatToChatThread } from '@/lib/mappers/messaging.mapper';

export const HomeHeader = () => {
    const { activeProfile, isCompany } = useActiveProfile();
    const { checkPermission } = useCompanyPermissions(activeProfile);
    const { socket } = useSocket();
    const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);
    const router = useRouter();
    const pathname = usePathname();
    const isNotificationsActive = pathname === '/notifications';
    const [isPopoverOpen, setIsPopoverOpen] = useState(false);

    const rawChatsQuery = useQuery({
        queryKey: [
            "conversations",
            activeProfile?.type ?? "USER",
            activeProfile?.id ?? "me",
            "all",
        ],
        queryFn: async () => {
            const params = activeProfile?.type === "COMPANY" ? { companyId: activeProfile.id } : {};
            const backendChats = await getConversations(params);
            return backendChats.map(mapBackendChatToChatThread);
        },
        staleTime: 0,
        refetchOnWindowFocus: false,
    });

    const hasUnreadMessages = rawChatsQuery.data?.some((c: any) => c.unread > 0 || c.is_read === false) || false;
    // Reset popover-open state when navigating away from /notifications
    // so the active pill style doesn't get stuck after "See all" navigation
    useEffect(() => {
        if (pathname !== '/notifications') {
            setIsPopoverOpen(false);
        }
    }, [pathname]);

    const fetchUnreadCount = async () => {
        try {
            const companyId = (isCompany && activeProfile) ? activeProfile.id : undefined;
            const notifs = await getNotifications(companyId);
            const count = notifs.filter((n: any) => !n.is_read).length;
            setUnreadNotificationsCount(count);
        } catch (error) {
            console.error("Failed to fetch unread notifications count:", error);
        }
    };

    useEffect(() => {
        fetchUnreadCount();
    }, [activeProfile, isCompany]);

    useEffect(() => {
        const handleUpdate = () => {
            fetchUnreadCount();
        };
        window.addEventListener('notifications-updated', handleUpdate);
        return () => {
            window.removeEventListener('notifications-updated', handleUpdate);
        };
    }, [activeProfile, isCompany]);

    useEffect(() => {
        if (!socket) return;

        const handleNewNotification = () => {
            fetchUnreadCount();
        };

        socket.on('notification', handleNewNotification);

        return () => {
            socket.off('notification', handleNewNotification);
        };
    }, [socket, activeProfile, isCompany]);
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
    const isJobsPage = pathname === '/jobs' || pathname.startsWith('/jobs');
    const isChannelPage = pathname === '/channels' || pathname.startsWith('/channels/');
    const isChannelSearchPage = pathname === '/channels/search';
    const isChannelDetailPage = isChannelPage && !isChannelSearchPage && pathname !== '/channels';

    // Track whether the create-job wizard is active (set via body data-attribute by JobsPage)
    const [isCreateJobActive, setIsCreateJobActive] = useState(false);
    useEffect(() => {
        const checkAttr = () => setIsCreateJobActive(!!document.body.dataset.hideSearch);
        checkAttr();
        const observer = new MutationObserver(checkAttr);
        observer.observe(document.body, { attributes: true, attributeFilter: ['data-hide-search'] });
        return () => observer.disconnect();
    }, []);

    // Job search state
    const [jobTitleQuery, setJobTitleQuery] = useState('');
    const [jobLocationQuery, setJobLocationQuery] = useState('');

    // Channel search state
    const [channelFilter, setChannelFilter] = useState<'All' | 'Channels' | 'Articles'>('All');
    const [filterDropdownOpen, setFilterDropdownOpen] = useState(false);
    const filterRef = useRef<HTMLDivElement>(null);

    // Read URL params on the jobs page or channel search page to pre-fill the inputs
    const urlSearchParams = useSearchParams();
    useEffect(() => {
        if (isJobsPage) {
            const urlSearch = urlSearchParams?.get('search') || '';
            const urlLocation = urlSearchParams?.get('location') || '';
            setJobTitleQuery(urlSearch);
            setJobLocationQuery(urlLocation);
        }
        if (isChannelSearchPage && urlSearchParams) {
            const urlFilter = urlSearchParams.get('filter') as 'All' | 'Channels' | 'Articles' | null;
            if (urlFilter && ['All', 'Channels', 'Articles'].includes(urlFilter)) {
                setChannelFilter(urlFilter);
            }
        }
    }, [isJobsPage, isChannelSearchPage, urlSearchParams]);

    const navigateChannelSearch = (q: string, filter: string) => {
        const params = new URLSearchParams();
        if (q.trim()) params.set('q', q.trim());
        if (filter && filter !== 'All') params.set('filter', filter);
        router.push(`/channels/search?${params.toString()}`);
    };

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


    // Removed useEffect that forced isSearchFocused to false, as it broke typing suggestions

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
                setActiveIndex(-1);
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

    if (pathname.includes('/article/') || pathname.includes('/settings')) {
        return null;
    }

    return (
        <header
            className={`sticky top-0 z-50 bg-background/85 px-3 py-2 backdrop-blur-md transition-transform duration-300 ease-in-out supports-[backdrop-filter]:bg-background/70 md:px-0 md:py-0 ${!isHeaderVisible && !isSearchFocused ? '-translate-y-full' : 'translate-y-0'
                } md:translate-y-0 ${pathname?.startsWith('/channels/') ? 'hidden md:block' : ''}`}
        >
            <div className="mx-auto flex min-h-12 min-w-0 max-w-[1128px] items-center px-0 md:min-h-[72px] md:px-4 xl:px-0">
                {isChannelPage && (
                    <div className="hidden md:flex w-full max-w-[960px] mx-auto items-center justify-between h-full px-4 xl:px-0">
                        <div className="flex items-center gap-[16px]">
                            <button
                                onClick={() => router.back()}
                                className="w-[48px] h-[48px] rounded-[100px] border border-[#DADADA] dark:border-[#2E3445] backdrop-blur-[12px] flex items-center justify-center hover:bg-gray-50 dark:hover:bg-[#1C2340] transition-colors shrink-0"
                            >
                                <Icon icon="lucide:chevron-left" className="w-[24px] h-[24px] text-[#6B7280] dark:text-[#9CA3AF]" />
                            </button>
                            <div className="flex flex-col justify-center">
                                <h1 className="text-black dark:text-white text-[18px] font-medium font-['Poppins'] leading-[26px]">
                                    {isChannelSearchPage ? 'Search channel' : 'Channel'}
                                </h1>
                                <p className="text-[#6B7280] dark:text-[#A1A8B3] text-[12px] font-normal font-['Poppins'] leading-[16px] hidden sm:block">
                                    {isChannelSearchPage ? 'Find the channel you want' :
                                        isChannelDetailPage ? 'Explore articles, insights, and updates shared by the channel' :
                                            'Explore channels that match your interests'}
                                </p>
                            </div>
                        </div>

                        {!isChannelDetailPage && (
                            <div className="flex items-center gap-[16px]">
                                {/* Search pill with autocomplete */}
                                <div className="relative w-[240px] sm:w-[320px] md:w-[380px]">
                                    <ChannelSearchBar
                                        filterParam={channelFilter}
                                        placeholder="Search"
                                        containerClassName="relative flex flex-row items-center w-full"
                                        inputClassName="w-full h-[40px] pl-[16px] pr-[44px] py-[8px] rounded-[24px] border border-[#6B7280] dark:border-[#A1A8B3] bg-transparent text-[16px] font-normal leading-[24px] text-black dark:text-white placeholder:text-[#6B7280] dark:placeholder:text-[#A1A8B3] focus:outline-none focus:border-[#6366F1] dark:focus:border-[#818CF8] font-['Poppins'] transition-colors"
                                        iconClassName="absolute right-[16px] top-1/2 -translate-y-1/2 w-[20px] h-[20px] text-[#6B7280] dark:text-[#A1A8B3] hover:opacity-80 transition-opacity"
                                        initialQuery={urlSearchParams?.get('q') || ''}
                                    />
                                </div>

                                {/* Filter icon + dropdown — only on search page */}
                                {isChannelSearchPage && (
                                    <div className="relative shrink-0" ref={filterRef}>
                                        <button
                                            onClick={() => setFilterDropdownOpen((o) => !o)}
                                            className="w-[24px] h-[24px] flex items-center justify-center hover:opacity-70 transition-opacity"
                                            aria-label="Filter results"
                                        >
                                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#000000" className="dark:stroke-white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                                <line x1="3" y1="6" x2="21" y2="6" />
                                                <line x1="6" y1="12" x2="18" y2="12" />
                                                <line x1="9" y1="18" x2="15" y2="18" />
                                            </svg>
                                        </button>

                                        {filterDropdownOpen && (
                                            <div className="absolute right-0 top-[calc(100%+8px)] z-50 w-[180px] bg-white dark:bg-[#1C2333] border border-[#EEF2FF] dark:border-[#2A2D35] rounded-[12px] shadow-lg overflow-hidden">
                                                {(['All', 'Channels', 'Articles'] as const).map((f) => (
                                                    <button
                                                        key={f}
                                                        onClick={() => {
                                                            setChannelFilter(f);
                                                            setFilterDropdownOpen(false);
                                                            navigateChannelSearch(urlSearchParams?.get('q') || '', f);
                                                        }}
                                                        className={`w-full text-left px-[20px] py-[12px] font-['Poppins'] text-[15px] leading-[22px] transition-colors ${channelFilter === f
                                                                ? 'text-[#6366F1] dark:text-[#818CF8] font-medium bg-[#EEF2FF] dark:bg-[#1e1b4b]'
                                                                : 'text-black dark:text-white hover:bg-gray-50 dark:hover:bg-[#232D3F]'
                                                            }`}
                                                    >
                                                        {f}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {!isChannelPage && (
                    <>
                        {/* --- Desktop Header (Visible from md screens up) --- */}
                        <div className="hidden flex-1 min-w-0 md:flex items-center justify-between md:mx-auto max-w-[998px] h-full gap-4">
                            {/* Header Left Section — route-aware search */}
                            {isJobsPage ? (
                                /* === JOB SEARCH UI === */
                                <div className="flex items-center gap-2 flex-shrink-0">
                                    {/* Job title / keywords pill */}
                                    <div className="w-36 md:w-40 lg:w-44 px-4 py-2 rounded-[24px] border border-[#6B7280] flex items-center gap-2 h-10 bg-transparent">
                                        <Search className="w-[18px] h-[18px] text-[#6B7280] flex-shrink-0" />
                                        <input
                                            type="text"
                                            placeholder="Job title, keywords"
                                            value={jobTitleQuery}
                                            onChange={(e) => setJobTitleQuery(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    router.push(`/jobs/search?search=${encodeURIComponent(jobTitleQuery)}${jobLocationQuery ? `&location=${encodeURIComponent(jobLocationQuery)}` : ''}`);
                                                }
                                            }}
                                            className="flex-1 min-w-0 bg-transparent text-foreground placeholder-[#6B7280] text-[16px] font-normal leading-[24px] font-poppins focus:outline-none outline-none truncate"
                                        />
                                    </div>

                                    {/* City / remote pill */}
                                    <div className="w-36 md:w-40 lg:w-44 px-4 py-2 rounded-[24px] border border-[#6B7280] flex items-center gap-2 h-10 bg-transparent">
                                        {/* Location pin icon — SVG matching Figma design */}
                                        <svg className="w-[18px] h-[18px] flex-shrink-0 text-[#6B7280]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
                                            <circle cx="12" cy="9" r="2.5" />
                                        </svg>
                                        <input
                                            type="text"
                                            placeholder="City or remote"
                                            value={jobLocationQuery}
                                            onChange={(e) => setJobLocationQuery(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    router.push(`/jobs/search?search=${encodeURIComponent(jobTitleQuery)}${jobLocationQuery ? `&location=${encodeURIComponent(jobLocationQuery)}` : ''}`);
                                                }
                                            }}
                                            className="flex-1 min-w-0 bg-transparent text-foreground placeholder-[#6B7280] text-[16px] font-normal leading-[24px] font-poppins focus:outline-none outline-none truncate"
                                        />
                                    </div>

                                    {/* Find jobs button */}
                                    <button
                                        onClick={() => {
                                            router.push(`/jobs/search?search=${encodeURIComponent(jobTitleQuery)}${jobLocationQuery ? `&location=${encodeURIComponent(jobLocationQuery)}` : ''}`);
                                        }}
                                        className="px-4 py-2 h-10 rounded-[24px] border border-[#6366F1] text-[#6366F1] bg-transparent hover:bg-[#6366F1] hover:text-white text-[16px] font-medium leading-[24px] font-poppins transition-all duration-200 flex-shrink-0"
                                    >
                                        Find jobs
                                    </button>
                                </div>
                            ) : (
                                /* === DEFAULT FEED / OTHER SEARCH === */
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
                                        className="flex-grow min-w-0 bg-transparent text-foreground placeholder-[#6B7280] text-[16px] font-normal leading-[24px] font-poppins focus:outline-none outline-none"
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
                                        <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-xl shadow-lg overflow-y-auto max-h-[320px] z-50 scrollbar-hide">
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
                                                                {user.avatar || user.avatar_url ? (
                                                                    <img src={(user.avatar || user.avatar_url)!} alt={user.full_name} className={`w-10 h-10 object-cover flex-shrink-0 ${user.type === 'COMPANY' ? 'rounded-md' : 'rounded-full'}`} />
                                                                ) : user.type === 'COMPANY' ? (
                                                                    <img src="/assets/company-placeholder.png" alt={user.full_name} className="w-10 h-10 rounded-md object-cover flex-shrink-0" />
                                                                ) : (
                                                                    <div className="w-10 h-10 rounded-full bg-[#EEF2FF] text-[#6366F1] font-light text-xl flex items-center justify-center font-[family-name:var(--font-poppins)] flex-shrink-0 select-none">
                                                                        {(user.full_name || user.name || "C").charAt(0).toUpperCase()}
                                                                    </div>
                                                                )}
                                                                <div className="flex-1 min-w-0">
                                                                    <div className="flex items-center gap-2">
                                                                        <p className="text-sm font-semibold text-foreground truncate">{highlightMatch(user.full_name, searchQuery)}</p>
                                                                        {user.type === 'COMPANY' && (
                                                                            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-primary/10 text-primary flex-shrink-0">{user.account_type ? user.account_type.charAt(0).toUpperCase() + user.account_type.slice(1).toLowerCase() : 'Company'}</span>
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
                                            className="absolute top-full left-0 mt-2 notification-popover-custom border rounded-[24px] shadow-lg overflow-hidden z-50 flex flex-col items-start py-4 px-0"
                                            style={{
                                                boxSizing: 'border-box',
                                                width: '100%',
                                                maxHeight: '410px',
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
                                                                            width: '100%',
                                                                            height: '40px',
                                                                            flex: 'none',
                                                                            order: 0,
                                                                            flexGrow: 1,
                                                                        }}
                                                                    >
                                                                        <div
                                                                            className={`relative bg-[#EEF2FF] text-[#6366F1] font-semibold text-sm flex items-center justify-center font-['Poppins'] select-none shrink-0 overflow-hidden ${item.value.type === 'COMPANY' ? 'rounded-md' : 'rounded-full'}`}
                                                                            style={{
                                                                                width: '40px',
                                                                                height: '40px',
                                                                                flex: 'none',
                                                                                order: 0,
                                                                                flexGrow: 0,
                                                                            }}
                                                                        >
                                                                            <span>{(item.value.full_name || item.value.name || "U").charAt(0).toUpperCase()}</span>
                                                                            {(item.value.avatar || item.value.avatar_url) && (item.value.avatar || item.value.avatar_url) !== '/assets/pngegg.png' ? (
                                                                                <img
                                                                                    src={(item.value.avatar || item.value.avatar_url)!}
                                                                                    alt={item.value.full_name}
                                                                                    className="absolute inset-0 w-full h-full object-cover"
                                                                                    onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                                                                                />
                                                                            ) : null}
                                                                        </div>

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
                                                                onMouseDown={(e) => e.preventDefault()}
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
                                                        onMouseDown={(e) => e.preventDefault()}
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
                            )}

                            {/* Header Right Section (Action Buttons) */}
                            <div className="flex items-center gap-4 shrink-0 min-w-0 xl:w-[406px] xl:justify-end">
                                {!pathname.startsWith('/channel') && !pathname.startsWith('/team') && (
                                    <FeatureDisabledTooltip featureKey="enablePostCreation" disabledMessage="Content posting is temporarily paused by admin.">
                                        <TooltipProvider delayDuration={0}>
                                            <Tooltip enableTouch={isCompany && !checkPermission('create_post') && !checkPermission('CREATE_POST')}>
                                                <TooltipTrigger asChild>
                                                    <button
                                                        onClick={(e) => {
                                                            if (isCompany && !checkPermission('create_post') && !checkPermission('CREATE_POST')) {
                                                                e.preventDefault();
                                                                e.stopPropagation();
                                                                return;
                                                            }
                                                            setActiveModal('create-post');
                                                        }}
                                                        className={`flex items-center justify-center gap-[10px] h-10 px-4 rounded-[24px] ${isCompany ? 'bg-[#1A73E8]' : 'bg-[#6366F1]'} text-white font-[family-name:var(--font-poppins)] text-[16px] font-normal leading-[24px] text-center transition-all shadow-sm whitespace-nowrap ${(isCompany && !checkPermission('create_post') && !checkPermission('CREATE_POST')) ? '!cursor-default' : ''}`}
                                                    >
                                                        <span>Create post</span>
                                                        <div className="w-5 h-5 rounded-full border-2 border-white flex items-center justify-center flex-shrink-0">
                                                            <Plus size={12} strokeWidth={3} />
                                                        </div>
                                                    </button>
                                                </TooltipTrigger>
                                                {(isCompany && !checkPermission('create_post') && !checkPermission('CREATE_POST')) && (
                                                    <TooltipContent side="bottom" className="bg-gray-800 text-white border-gray-700">
                                                        <p>You don't have permission to access this</p>
                                                    </TooltipContent>
                                                )}
                                            </Tooltip>
                                        </TooltipProvider>
                                    </FeatureDisabledTooltip>
                                )}

                                {/* Icons group — gap-2 (8px) between each, each icon 56×40 */}
                                <div className="flex items-center gap-2">
                                    <Link
                                        href="/notifications"
                                        className={`flex items-center justify-center w-14 h-10 rounded-[24px] transition-colors ${isNotificationsActive ? 'bg-primary-tint text-primary-tint-foreground' : 'text-foreground hover:bg-profile-hover'}`}
                                    >
                                        <div className="relative">
                                            <Bell width={24} height={24} strokeWidth={1.5} />
                                            {unreadNotificationsCount > 0 && (
                                                /* Bug fix: Notification indicator color updated to #EC6229 (var(--ds-accent)) */
                                                <span
                                                    style={{
                                                        position: 'absolute',
                                                        width: '6px',
                                                        height: '6px',
                                                        left: '19px',
                                                        top: '-3px',
                                                        backgroundColor: isCompany ? '#1A73E8' : '#EC6229',
                                                        borderRadius: '50%'
                                                    }}
                                                />
                                            )}
                                        </div>
                                    </Link>
                                    <TooltipProvider delayDuration={0}>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Link
                                                    href="/messaging"
                                                    onClick={(e) => {
                                                        if (isCompany && !checkPermission('chat') && !checkPermission('MESSAGES') && !checkPermission('jobs_chat') && !checkPermission('JOBS_CHAT')) {
                                                            e.preventDefault();
                                                            e.stopPropagation();
                                                        }
                                                    }}
                                                    className={`flex items-center justify-center w-14 h-10 rounded-[24px] transition-colors ${pathname === '/messaging' || pathname.startsWith('/messaging') ? 'bg-primary-tint text-primary-tint-foreground' : 'text-foreground hover:bg-profile-hover'} ${(isCompany && !checkPermission('chat') && !checkPermission('MESSAGES') && !checkPermission('jobs_chat') && !checkPermission('JOBS_CHAT')) ? '!cursor-default' : ''}`}
                                                >
                                                    <div className="relative">
                                                        <Icon icon="proicons:chat" style={{ width: '24px', height: '24px' }} />
                                                        {hasUnreadMessages && (
                                                            <span
                                                                style={{
                                                                    position: 'absolute',
                                                                    width: '6px',
                                                                    height: '6px',
                                                                    left: '19px',
                                                                    top: '-3px',
                                                                    backgroundColor: isCompany ? '#1A73E8' : '#6366F1',
                                                                    borderRadius: '50%'
                                                                }}
                                                            />
                                                        )}
                                                    </div>
                                                </Link>
                                            </TooltipTrigger>
                                            {(isCompany && !checkPermission('chat') && !checkPermission('MESSAGES') && !checkPermission('jobs_chat') && !checkPermission('JOBS_CHAT')) && (
                                                <TooltipContent side="bottom" className="bg-gray-800 text-white border-gray-700">
                                                    <p>You don't have permission to access this</p>
                                                </TooltipContent>
                                            )}
                                        </Tooltip>
                                    </TooltipProvider>
                                    <div className="flex items-center justify-center w-14 h-10 rounded-[24px]">
                                        <ProfileDropdown />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </>
                )}

                {/* --- Mobile Header (Hidden from md screens up) --- */}
                <div className={`relative w-full items-center gap-2 md:hidden ${isCreateJobActive || isChannelSearchPage ? 'hidden' : 'flex'}`}>
                    {/* Mobile Search Bar */}
                    {isChannelPage ? (
                        <div className="flex-1 flex items-center gap-3 relative">
                            <ChannelSearchBar
                                filterParam={channelFilter}
                                placeholder="Search"
                                containerClassName="w-full relative flex flex-row items-center"
                                inputClassName="w-full pl-4 pr-10 py-2.5 bg-transparent border border-border focus:border-primary rounded-full text-sm transition-all outline-none text-foreground"
                                iconClassName="w-4 h-4 text-primary absolute right-3 cursor-pointer"
                                initialQuery={urlSearchParams?.get('q') || ''}
                            />
                        </div>
                    ) : (
                        <div className="flex-1 flex items-center gap-3 relative">
                            <input
                                type="text"
                                placeholder={pathname === '/jobs' || pathname.startsWith('/jobs/') ? "Search jobs" : "Search"}
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
                                                        <div className="relative w-10 h-10 rounded-full bg-[#EEF2FF] text-[#6366F1] flex items-center justify-center font-semibold text-sm flex-shrink-0 overflow-hidden font-['Poppins'] select-none">
                                                            <span>{(user.full_name || 'U').charAt(0).toUpperCase()}</span>
                                                            {user.avatar_url && user.avatar_url !== '/assets/pngegg.png' ? (
                                                                <img
                                                                    src={user.avatar_url}
                                                                    alt={user.full_name}
                                                                    className="absolute inset-0 w-full h-full object-cover"
                                                                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                                                />
                                                            ) : null}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2">
                                                                <p className="text-sm font-semibold text-foreground truncate">{highlightMatch(user.full_name, searchQuery)}</p>
                                                                {user.type === 'COMPANY' && (
                                                                    <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-primary/10 text-primary flex-shrink-0">{user.account_type ? user.account_type.charAt(0).toUpperCase() + user.account_type.slice(1).toLowerCase() : 'Company'}</span>
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
                                                onMouseDown={(e) => e.preventDefault()}
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
                                                            <div className="relative w-10 h-10 rounded-full bg-[#EEF2FF] text-[#6366F1] flex items-center justify-center font-semibold text-sm flex-shrink-0 overflow-hidden font-['Poppins'] select-none">
                                                                <span>{(item.value.full_name || 'U').charAt(0).toUpperCase()}</span>
                                                                {(item.value.avatar || item.value.avatar_url) && (item.value.avatar || item.value.avatar_url) !== '/assets/pngegg.png' ? (
                                                                    <img
                                                                        src={(item.value.avatar || item.value.avatar_url)!}
                                                                        alt={item.value.full_name}
                                                                        className="absolute inset-0 w-full h-full object-cover"
                                                                        onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                                                                    />
                                                                ) : null}
                                                            </div>
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
                                                        onMouseDown={(e) => e.preventDefault()}
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
                    )}

                    {/* Mobile Icons */}
                    {!isSearchFocused && (
                        <div className="flex items-center gap-1">
                            <Link
                                href="/notifications"
                                className={`flex items-center justify-center transition-colors hover:text-foreground ${isNotificationsActive ? 'bg-[#EEF2FF] dark:bg-[#1e1b4b]/50 text-primary dark:text-[#818CF8] w-14 h-10 px-4 py-2 rounded-[24px]' : 'text-muted-foreground hover:bg-[#EEF2FF] dark:bg-[#1e1b4b]/50 p-2 rounded-full'}`}
                            >
                                <div className="relative">
                                    <Bell className="w-5 h-5" />
                                    {unreadNotificationsCount > 0 && (
                                        /* Bug fix: Notification indicator color updated to #EC6229 (var(--ds-accent)) */
                                        <span
                                            style={{
                                                position: 'absolute',
                                                width: '6px',
                                                height: '6px',
                                                left: '16px',
                                                top: '-3px',
                                                backgroundColor: isCompany ? '#1A73E8' : '#EC6229',
                                                borderRadius: '50%'
                                            }}
                                        />
                                    )}
                                </div>
                            </Link>
                            <Link
                                href="/messaging"
                                className={`p-2 rounded-full transition-colors ${pathname === '/messaging' || pathname.startsWith('/messaging') ? 'bg-[#EEF2FF] dark:bg-[#1e1b4b]/50 text-primary dark:text-[#818CF8]' : 'text-muted-foreground hover:bg-[#EEF2FF] dark:hover:bg-[#1e1b4b]/50'}`}
                            >
                                <div className="relative">
                                    <Icon icon="proicons:chat" className="w-6 h-6 text-black dark:text-white" />
                                    {hasUnreadMessages && (
                                        <span
                                            style={{
                                                position: 'absolute',
                                                width: '6px',
                                                height: '6px',
                                                right: '0px',
                                                top: '-2px',
                                                backgroundColor: isCompany ? '#1A73E8' : '#6366F1',
                                                borderRadius: '50%'
                                            }}
                                        />
                                    )}
                                </div>
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};
