export interface ToggleSaveResponse {
    success: boolean;
    saved: boolean;
    message: string;
}

export interface Post {
    post_id: string;
    content: string;
    image_url?: string;
    created_at: string;
    is_saved?: boolean; // useful for feed
}

export interface SavedPostsResponse {
    success: boolean;
    posts: Post[];
}
