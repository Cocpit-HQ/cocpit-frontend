// Raw API Response Types

export interface ApiPollOption {
    option_id: string;
    option_text: string;
    vote_count: number;
}

export interface ApiPoll {
    poll_id: string;
    total_votes: number;
    options: ApiPollOption[];
}

export interface ApiMedia {
    media_id: string;
    post_id: string;
    url: string;
    media_type: 'image' | 'video';
    aspect_ratio: string | null;
}

export interface ApiPost {
    post_id: string;
    author_id: string;
    category_id: string;
    content: string;
    visibility: 'public' | 'private'; // Or other visibility types
    created_at: string;
    updated_at: string;
    post_type: 'image' | 'video' | 'article' | 'poll'; // Add other types if needed
    title: string | null;
    author_name: string;
    author_avatar: string | null;
    category_name: string;
    media: ApiMedia[];
    poll: ApiPoll | null;
}

export interface FeedResponse {
    posts: ApiPost[];
    nextCursor: string | null;
}
