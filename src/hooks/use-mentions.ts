import { useState, useEffect } from 'react';
import { useDebounce } from './use-debounce';
import { searchUsers, getSuggestedUsers, UserMention } from '@/services/api/users';
import { searchHashtags, getTrendingHashtags, HashtagSuggestion } from '@/services/api/hashtags';

export type MentionMode = 'mention' | 'hashtag' | null;

interface UseMentionsProps {
    searchUsersFn?: (query: string) => Promise<UserMention[]>;
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

    const debouncedQuery = useDebounce(query, 300);

    useEffect(() => {
        let isMounted = true;
        const abortController = new AbortController();

        const fetchData = async () => {
            if (!mode) {
                setUsers([]);
                setHashtags([]);
                return;
            }

            setIsLoading(true);
            try {
                if (mode === 'mention') {
                    if (debouncedQuery) {
                        if (searchUsersFn) {
                            const results = await searchUsersFn(debouncedQuery);
                            if (isMounted) {
                                setUsers(results || []);
                                setActiveIndex(0);
                            }
                        } else {
                            const results = await searchUsers(debouncedQuery);
                            if (isMounted) {
                                setUsers(results || []);
                                setActiveIndex(0);
                            }
                        }
                    } else {
                        const suggested = await getSuggestedUsers();
                        if (isMounted) {
                            setUsers(suggested || []);
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
        handleKeyDown
    };
};
