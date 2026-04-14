import api from '@/lib/axios';

export interface UserMention {
    id: string;
    full_name: string;
    account_name: string;
    avatar_url: string;
    headline?: string;
    account_type?: string;
}

export const searchUsers = async (query: string): Promise<UserMention[]> => {
    if (!query) return [];
    const response = await api.get(`/users/search?q=${encodeURIComponent(query)}`);
    return response.data;
};

export const getSuggestedUsers = async (): Promise<UserMention[]> => {
    const response = await api.get('/users/suggested');
    return response.data;
};

/**
 * Fetch a user profile directly by account_name (or UUID).
 * Uses GET /users/:id which resolves account_name on the backend.
 * Returns UserMention format, or null if not found.
 */
export const getUserByUsername = async (username: string): Promise<UserMention | null> => {
    if (!username) return null;
    try {
        const response = await api.get(`/users/${encodeURIComponent(username)}`);
        const data = response.data;
        // The profile endpoint nests under .user
        const u = data.user || data;
        return {
            id: u.id || u.user_id || '',
            full_name: u.name || u.full_name || '',
            account_name: u.account_name || username,
            avatar_url: u.avatar || u.avatar_url || '',
            headline: u.headline || '',
            account_type: u.account_type || '',
        };
    } catch {
        return null;
    }
};
