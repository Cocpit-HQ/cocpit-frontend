import { useState, useEffect } from 'react';
import { useDebounce } from './use-debounce';
import { searchUsers, getSuggestedUsers, UserMention } from '@/services/api/users';
import { searchHashtags, getTrendingHashtags, HashtagSuggestion } from '@/services/api/hashtags';

export type MentionMode = 'mention' | 'hashtag' | null;

export type SearchUsersFnResult = 
    | UserMention[] 
    | { data?: UserMention[]; users?: UserMention[]; nextCursor?: string | null; hasMore?: boolean };

interface UseMentionsProps {
    searchUsersFn?: (query: string, forTagging?: boolean, cursor?: string) => Promise<SearchUsersFnResult>;
}

export const useMentions = ({ searchUsersFn }: UseMentionsProps = {}) => {
    const [query, setQuery] = useState('');
    const [mode, setMode] = useState<MentionMode>(null);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [suggestionPosition, setSuggestionPosition] = useState({ top: 0, left: 0 });
    const [users, setUsers] = useState<UserMention[]>([]);
    const [hashtags, setHashtags] = useState<HashtagSuggestion[]>([]);
    const [activeIndex, setActiveIndex] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [cursor, setCursor] = useState<string | null>(null);
    const [hasMore, setHasMore] = useState(false);

    const debouncedQuery = useDebounce(query, 300);

    useEffect(() => {
        let isMounted = true;
        const abortController = new AbortController();

        const fetchData = async () => {
            if (!mode) {
                setUsers([]);
                setHashtags([]);
                setCursor(null);
                setHasMore(false);
                return;
            }

            setIsLoading(true);
            try {
                if (mode === 'mention') {
                    if (debouncedQuery) {
                        if (searchUsersFn) {
                            const res: any = await searchUsersFn(debouncedQuery, true);
                            if (isMounted) {
                                if (Array.isArray(res)) {
                                    setUsers(res || []);
                                    setCursor(null);
                                    setHasMore(false);
                                } else {
                                    setUsers(res?.data || res?.users || []);
                                    setCursor(res?.nextCursor || null);
                                    setHasMore(Boolean(res?.hasMore));
                                }
                                setActiveIndex(0);
                            }
                        } else {
                            const results = await searchUsers(debouncedQuery, true);
                            if (isMounted) {
                                setUsers(results || []);
                                setCursor(null);
                                setHasMore(false);
                                setActiveIndex(0);
                            }
                        }
                    } else {
                        // Empty query: user just typed "@"
                        let results: any = [];
                        if (searchUsersFn) {
                            try {
                                results = await searchUsersFn('', true);
                            } catch (_) {
                                results = [];
                            }
                        }
                        // If searchUsersFn didn't provide empty-query results (e.g. searchUsers), fall back to feed suggested users & orgs
                        if (!results || (Array.isArray(results) && results.length === 0)) {
                            results = await getSuggestedUsers(true);
                        }
                        if (isMounted) {
                            if (Array.isArray(results)) {
                                setUsers(results || []);
                                setCursor(null);
                                setHasMore(false);
                            } else {
                                setUsers(results?.data || results?.users || []);
                                setCursor(results?.nextCursor || null);
                                setHasMore(Boolean(results?.hasMore));
                            }
                            setActiveIndex(0);
                        }
                    }
                } else if (mode === 'hashtag') {
                    if (debouncedQuery) {
                        const results = await searchHashtags(debouncedQuery, abortController.signal);
                        if (isMounted) {
                            setHashtags(results.tags || []);
                            setActiveIndex(0);
                        }
                    } else {
                        const trending = await getTrendingHashtags();
                        if (isMounted) {
                            setHashtags(trending || []);
                            setActiveIndex(0);
                        }
                    }
                }
            } catch (err: any) {
                if (err.name !== 'AbortError') console.error('Search failed', err);
            } finally {
                if (isMounted) setIsLoading(false);
            }
        };

        fetchData();

        return () => {
            isMounted = false;
            abortController.abort();
        };
    }, [debouncedQuery, mode, searchUsersFn]);

    const loadMoreUsers = async () => {
        if (!hasMore || isLoading || !cursor || mode !== 'mention' || !searchUsersFn) return;
        setIsLoading(true);
        try {
            const res: any = await searchUsersFn(debouncedQuery, true, cursor);
            const newItems: UserMention[] = Array.isArray(res) ? res : (res?.data || res?.users || []);
            const nextC = res?.nextCursor || null;
            const more = Boolean(res?.hasMore);

            setUsers(prev => {
                const existingIds = new Set(prev.map(u => u.id));
                const filteredNew = newItems.filter(u => !existingIds.has(u.id));
                return [...prev, ...filteredNew];
            });
            setCursor(nextC);
            setHasMore(more);
        } catch (err) {
            console.error("Failed to load more users for mentions", err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyDown = (
        e: React.KeyboardEvent | KeyboardEvent, 
        onSelect: (item: UserMention | HashtagSuggestion) => void
    ) => {
        const itemsCount = mode === 'mention' ? users.length : hashtags.length;
        
        if (showSuggestions && itemsCount > 0) {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setActiveIndex(prev => (prev + 1) % itemsCount);
                return true;
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setActiveIndex(prev => (prev - 1 + itemsCount) % itemsCount);
                return true;
            } else if (e.key === 'Enter' || e.key === 'Tab') {
                e.preventDefault();
                const item = mode === 'mention' ? users[activeIndex] : hashtags[activeIndex];
                onSelect(item);
                return true;
            } else if (e.key === 'Escape') {
                setShowSuggestions(false);
                return true;
            }
        }
        return false;
    };

    return {
        query, setQuery,
        mode, setMode,
        showSuggestions, setShowSuggestions,
        suggestionPosition, setSuggestionPosition,
        users, hashtags,
        activeIndex, setActiveIndex,
        isLoading,
        hasMore,
        loadMoreUsers,
        handleKeyDown
    };
};
