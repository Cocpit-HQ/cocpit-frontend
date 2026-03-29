import { StoryDetail } from "@/types/showcase";
import { getStoryImageUrl, getStoryThumbnailUrl, parseStoryMetadata } from "@/lib/story-media";

type RawStory = {
    story_id: number;
    title?: string;
    media_type?: "image" | "video";
    media_url?: string | null;
    created_at: string;
    view_count?: number;
    like_count?: number;
    description?: string;
    author_title?: string;
    author_name: string;
    author_avatar: string | null;
    author_id?: string | number;
    is_company?: boolean;
    is_author?: boolean;
    has_liked?: boolean;
    has_viewed?: boolean;
    thumbnail_url?: string | null;
    story_metadata?: unknown;
    sharedPost?: StoryDetail["shared_post"];
    shared_post?: StoryDetail["shared_post"];
};

// Mapper to convert backend snake_case to frontend camelCase
export const mapStory = (story: RawStory): StoryDetail => {
    const story_metadata = parseStoryMetadata(story.story_metadata);
    const media_url = getStoryImageUrl({
        media_url: story.media_url,
        story_metadata
    });
    const thumbnail_url = getStoryThumbnailUrl({
        thumbnail_url: story.thumbnail_url,
        image: media_url,
        story_metadata
    });

    return {
        id: story.story_id,
        title: story.title || "",
        image: media_url || thumbnail_url || "",
        isVideo: story.media_type === "video",
        timeAgo: new Date(story.created_at).toLocaleDateString(), // You might want a better timeAgo helper
        views: story.view_count || 0,
        likes: story.like_count || 0,
        description: story.description,
        authorTitle: story.author_title || "", // Check backend response
        author: {
            name: story.author_name,
            avatar: story.author_avatar,
            id: story.author_id,
            is_company: story.is_company
        },
        isAuthor: story.is_author,
        isLiked: story.has_liked,
        has_viewed: story.has_viewed,
        media_type: story.media_type,
        media_url,
        thumbnail_url,
        shared_post: story.sharedPost || story.shared_post,
        story_metadata,
        created_at: story.created_at
    };
};
