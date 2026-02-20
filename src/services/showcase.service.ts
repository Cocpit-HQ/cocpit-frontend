
import api from "@/lib/axios";
import { mapStory } from "@/lib/story-mapper";
import { StoryDetail, StoryCard, StoryGroup } from "@/types/showcase";

export const showcaseService = {
    getStories: async (): Promise<StoryDetail[]> => {
        const { data } = await api.get("/stories");
        return data.map(mapStory);
    },

    createStory: async (storyData: { title: string; description: string; media_url: string; media_type?: string; public_id?: string; media_status?: string; shared_post_id?: string; story_metadata?: any; original_url?: string; final_url?: string }, companyId?: string) => {
        const config = companyId ? { headers: { 'x-company-id': companyId } } : {};
        const { data } = await api.post("/story", storyData, config);
        return data;
    },

    uploadMedia: async (file: File, companyId?: string) => {
        const formData = new FormData();
        formData.append("file", file);
        const config = {
            headers: {
                "Content-Type": "multipart/form-data",
                ...(companyId ? { 'x-company-id': companyId } : {})
            },
        };
        const { data } = await api.post("/upload/story", formData, config);
        return data;
    },

    getGroupedStories: async (companyId?: string): Promise<StoryGroup[]> => {
        const config = companyId ? { headers: { 'x-company-id': companyId } } : {};
        const { data } = await api.get("/stories/grouped", config);
        // Map backend response to match StoryGroup structure
        return data.map((group: any) => ({
            author: {
                id: group.author.id,
                name: group.author.name,
                avatar: group.author.avatar
            },
            is_current_user: group.is_current_user,
            latest_story_at: group.latest_story_at,
            stories: group.stories.map(mapStory)
        }));
    },

    deleteStory: async (id: number) => {
        const { data } = await api.delete(`/stories/${id}`);
        return data;
    },

    viewStory: async (id: number, companyId?: string) => {
        const config = companyId ? { headers: { 'x-company-id': companyId } } : {};
        await api.post(`/stories/${id}/view`, {}, config);
    },

    reactToStory: async (id: number, reaction: boolean, companyId?: string) => {
        const config = companyId ? { headers: { 'x-company-id': companyId } } : {};
        const { data } = await api.post(`/stories/${id}/react`, { reaction }, config);
        return data;
    },

    getStoryDetails: async (id: number) => {
        const { data } = await api.get(`/stories/${id}`);
        // Transform backend response to match StoryDetail structure for viewers/likers
        const viewers = data.viewers.map((v: any) => ({
            id: v.user_id,
            name: v.full_name,
            avatar: v.avatar_url
        }));

        const likers = data.viewers.filter((v: any) => v.reaction_type).map((v: any) => ({
            id: v.user_id,
            name: v.full_name,
            avatar: v.avatar_url
        }));

        return {
            viewerCount: data.viewerCount,
            viewers,
            likers
        };
    },

    addStoryComment: async (storyId: number, content: string) => {
        const { data } = await api.post(`/stories/${storyId}/comments`, { content });
        return data;
    },

    getStoryComments: async (storyId: number) => {
        const { data } = await api.get(`/stories/${storyId}/comments`);
        return data;
    },

    deleteStoryComment: async (commentId: string) => {
        const { data } = await api.delete(`/stories/comments/${commentId}`);
        return data;
    }
};
