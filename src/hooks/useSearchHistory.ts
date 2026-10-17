import { useState, useEffect, useMemo, useRef } from "react";
import { useSession } from "next-auth/react";
import api from "@/lib/axios";
import { SearchedUser } from "@/types/user";
import { useActiveProfile } from "@/context/ActiveProfileContext";

export type HistoryItem = 
    | { type: 'QUERY', value: string, id: string }
    | { type: 'USER', value: SearchedUser, id: string };

export const useSearchHistory = () => {
    const { data: session } = useSession();
    const { activeProfile, isCompany } = useActiveProfile();
    const userId = session?.user?.id || session?.user?.email || 'guest';

    // Scope search history by active profile context (personal vs organization)
    const orgId = isCompany && activeProfile?.id ? activeProfile.id : null;
    const contextKey = orgId ? `org_${orgId}` : 'personal';
    const storageKey = useMemo(() => `cocpit_search_history_${userId}_${contextKey}`, [userId, contextKey]);
    
    const [history, setHistory] = useState<HistoryItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const hasFetchedRef = useRef(false);

    // 1. Load from localStorage immediately, then fetch from API
    useEffect(() => {
        if (!userId) return;
        
        // Step 1: Read localStorage for instant UI (with fallback to legacy key for personal mode)
        const storedJson = localStorage.getItem(storageKey) 
            || (contextKey === 'personal' ? localStorage.getItem(`cocpit_search_history_${userId}`) : null);
        const stored = JSON.parse(storedJson || "[]");
        setHistory(stored);
        
        // Step 2: Fetch from database if authenticated
        const fetchHistory = async () => {
            if (userId === 'guest') {
                setIsLoading(false);
                return;
            }
            try {
                const response = await api.get('/users/search-history');
                if (response.data.success) {
                    const dbHistory = response.data.data.map((item: any) => {
                        if (item.profileSnapshot) {
                            return {
                                type: 'USER',
                                id: item.id,
                                value: typeof item.profileSnapshot === 'string' ? JSON.parse(item.profileSnapshot) : item.profileSnapshot
                            };
                        } else {
                            return {
                                type: 'QUERY',
                                id: item.id,
                                value: item.query
                            };
                        }
                    });
                    
                    // Step 3: Synchronize - Database is the source of truth
                    setHistory(dbHistory);
                    localStorage.setItem(storageKey, JSON.stringify(dbHistory));
                }
            } catch (error: any) {
                if (error?.response?.status !== 404) {
                    console.error("Failed to fetch search history from DB:", error);
                }
            } finally {
                setIsLoading(false);
                hasFetchedRef.current = true;
            }
        };

        fetchHistory();
    }, [storageKey, userId, contextKey]);

    // Save search
    const saveSearch = (item: any) => {
        if (!item) return;
        
        let queryToSave = '';
        let profileSnapshot = null;
        let newItem: HistoryItem;
        const tempId = `temp-${Date.now()}`;

        if (typeof item === 'string') {
            queryToSave = item.trim();
            if (!queryToSave) return;
            newItem = { type: 'QUERY', value: queryToSave, id: tempId };
        } else {
            queryToSave = (item.full_name || item.name || '').trim();
            if (!queryToSave) return;
            profileSnapshot = item;
            newItem = { type: 'USER', value: item, id: tempId };
        }
        
        // Optimistic UI update
        setHistory(prev => {
            // Remove duplicates by ID for users, or by text for queries
            const filtered = prev.filter(h => {
                if (newItem.type === 'USER' && h.type === 'USER') {
                    return h.value.id !== (newItem.value as SearchedUser).id;
                }
                if (newItem.type === 'QUERY' && h.type === 'QUERY') {
                    return h.value.toLowerCase() !== (newItem.value as string).toLowerCase();
                }
                return true; // Query and User searches don't overwrite each other
            });
            const updated = [newItem, ...filtered];
            localStorage.setItem(storageKey, JSON.stringify(updated));
            return updated;
        });

        // Background API Sync
        if (userId !== 'guest') {
            api.post('/users/search-history', { query: queryToSave, profileSnapshot })
                .then(response => {
                    if (response.data.success) {
                        // Replace temp ID with real DB ID silently
                        const realId = response.data.data.id;
                        setHistory(current => {
                            const updated = current.map(h => h.id === tempId ? { ...h, id: realId } : h);
                            localStorage.setItem(storageKey, JSON.stringify(updated));
                            return updated;
                        });
                    }
                })
                .catch(err => {
                    if (err?.response?.status !== 404) {
                        console.error("Failed to save search to DB:", err);
                    }
                });
        }
    };

    // Remove one
    const removeSearch = (id: string) => {
        // Optimistic UI update
        setHistory(prev => {
            const updated = prev.filter(item => item.id !== id);
            localStorage.setItem(storageKey, JSON.stringify(updated));
            return updated;
        });

        // Background API Sync
        if (userId !== 'guest' && !id.startsWith('temp-')) {
            api.delete(`/users/search-history/${id}`)
                .catch(err => {
                    if (err?.response?.status !== 404) {
                        console.error("Failed to remove search from DB:", err);
                    }
                });
        }
    };

    // Clear all
    const clearAll = () => {
        // Optimistic UI update
        setHistory([]);
        localStorage.setItem(storageKey, JSON.stringify([]));

        // Background API Sync
        if (userId !== 'guest') {
            api.delete('/users/search-history')
                .catch(err => {
                    if (err?.response?.status !== 404) {
                        console.error("Failed to clear search history in DB:", err);
                    }
                });
        }
    };

    return { history, saveSearch, removeSearch, clearAll, isLoading };
};
