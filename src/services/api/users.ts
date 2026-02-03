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
