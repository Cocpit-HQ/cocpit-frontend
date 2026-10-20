import api from '@/lib/axios';

export interface UserMention {
    id: string;
    full_name: string;
    account_name: string;
    avatar_url: string;
    headline?: string;
    account_type?: string;
    type?: string;
    slug?: string;
    org_id?: string;
    is_company?: boolean;
}

export const searchUsers = async (query: string, forTagging?: boolean): Promise<UserMention[]> => {
    if (!query) return [];
    let url = `/users/search?q=${encodeURIComponent(query)}`;
    if (forTagging) url += '&forTagging=true';
    const response = await api.get(url);
    return response.data;
};

export const getSuggestedUsers = async (forTagging?: boolean): Promise<UserMention[]> => {
    let url = '/users/suggested';
    if (forTagging) url += '?forTagging=true';
    const response = await api.get(url);
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
            type: u.type || '',
            slug: u.slug || '',
        };
    } catch {
        return null;
    }
};
