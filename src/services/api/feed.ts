import axios from '@/lib/axios';
import { FeedResponse } from '@/types/api/feed';

export const getPublicFeed = async (cursor?: string): Promise<FeedResponse> => {
    const params = cursor ? { cursor } : {};
    const response = await axios.get<FeedResponse>('/api/All/feeds', { params });
    return response.data;
};
