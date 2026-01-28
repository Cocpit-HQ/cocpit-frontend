import { StoryDetail } from "@/types/showcase";

// Mapper to convert backend snake_case to frontend camelCase
export const mapStory = (story: any): StoryDetail => ({
    id: story.story_id,
    title: story.title || "",
    image: story.media_url,
    isVideo: story.media_type === "video",
    timeAgo: new Date(story.created_at).toLocaleDateString(), // You might want a better timeAgo helper
    views: story.view_count || 0,
    likes: story.like_count || 0,
    description: story.description,
    authorTitle: story.author_title || "", // Check backend response
    author: {
        name: story.author_name,
        avatar: story.author_avatar,
        id: story.author_id
    },
    isAuthor: story.is_author,
    isLiked: story.has_liked,
    has_viewed: story.has_viewed,
    media_status: story.media_status,
    media_type: story.media_type,
    media_url: story.media_url,
    thumbnail_url: story.thumbnail_url || story.image,
    shared_post: story.shared_post,
    story_metadata: story.story_metadata // Pass through metadata
});
