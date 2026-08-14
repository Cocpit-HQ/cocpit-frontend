import { useState, useEffect, useMemo } from "react";
import { useSession } from "next-auth/react";
import { SearchedUser } from "@/types/user";
import { useActiveProfile } from "@/context/ActiveProfileContext";

export type HistoryItem = 
    | { type: 'QUERY', value: string, id: string }
    | { type: 'USER', value: SearchedUser, id: string };

export const useSearchHistory = () => {
    const { data: session } = useSession();
    const { activeProfile } = useActiveProfile();
    const userId = session?.user?.id || session?.user?.email || 'guest';
    const contextId = activeProfile?.id || userId;
    const storageKey = useMemo(() => `search_history_v2_${userId}_${contextId}`, [userId, contextId]);
    
    const [history, setHistory] = useState<HistoryItem[]>([]);

    // Load from localStorage whenever storageKey changes (login/logout)
    useEffect(() => {
        // One-time migration: copy old search history to new scoped key
        // We do NOT remove oldKey so that if the user switches to a different context
        // for the first time, it can still inherit their original search history.
        const oldKey = `search_history_v2_${userId}`;
        if (storageKey !== oldKey) {
            const existingNew = localStorage.getItem(storageKey);
            const existingOld = localStorage.getItem(oldKey);
            if (!existingNew && existingOld) {
                localStorage.setItem(storageKey, existingOld);
            }
        }
        const stored = JSON.parse(localStorage.getItem(storageKey) || "[]");
        setHistory(stored);
    }, [storageKey, userId]);

    // Save search
    const saveSearch = (item: string | SearchedUser) => {
        if (!item) return;

        let newItem: HistoryItem;
        if (typeof item === 'string') {
            const trimmed = item.trim();
            if (!trimmed) return;
            newItem = { type: 'QUERY', value: trimmed, id: `query-${trimmed.toLowerCase()}` };
        } else {
            const userId = item.id || item.slug || Math.random().toString(36).substr(2, 9);
            newItem = { type: 'USER', value: item, id: `user-${userId}` };
        }

        // Sync update localStorage immediately to prevent loss on navigation
        const stored = JSON.parse(localStorage.getItem(storageKey) || "[]");
        const filtered = stored.filter((h: any) => h.id !== newItem.id);
        const updated = [newItem, ...filtered].slice(0, 5);
        localStorage.setItem(storageKey, JSON.stringify(updated));
        
        // Update state for UI
        setHistory(updated);
    };

    // Remove one
    const removeSearch = (id: string) => {
        const stored = JSON.parse(localStorage.getItem(storageKey) || "[]");
        const updated = stored.filter((item: any) => item.id !== id);
        localStorage.setItem(storageKey, JSON.stringify(updated));
        setHistory(updated);
    };

    // Clear all
    const clearAll = () => {
        setHistory([]);
        localStorage.removeItem(storageKey);
    };

    return { history, saveSearch, removeSearch, clearAll };
};
