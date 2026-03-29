import { useState, useEffect, useMemo } from "react";
import { useSession } from "next-auth/react";
import { SearchedUser } from "@/types/user";

export type HistoryItem = 
    | { type: 'QUERY', value: string, id: string }
    | { type: 'USER', value: SearchedUser, id: string };

export const useSearchHistory = () => {
    const { data: session } = useSession();
    const userId = session?.user?.id || session?.user?.email || 'guest';
    const storageKey = useMemo(() => `search_history_v2_${userId}`, [userId]);
    
    const [history, setHistory] = useState<HistoryItem[]>([]);

    // Load from localStorage whenever storageKey changes (login/logout)
    useEffect(() => {
        const stored = JSON.parse(localStorage.getItem(storageKey) || "[]");
        setHistory(stored);
    }, [storageKey]);

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
