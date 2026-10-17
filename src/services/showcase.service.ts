
import api from "@/lib/axios";
import { mapStory } from "@/lib/story-mapper";
import { StoryDetail, StoryCard, StoryGroup } from "@/types/showcase";

export const showcaseService = {
    getStories: async (): Promise<StoryDetail[]> => {
        const { data } = await api.get("/stories");
        return data.map(mapStory);
    },

    createStory: async (storyData: { title: string; description: string; media_url: string; media_type?: string; public_id?: string; shared_post_id?: string; story_metadata?: any }, companyId?: string) => {
        const params = companyId ? `?companyId=${companyId}` : '';
        const { data } = await api.post(`/story${params}`, storyData);
        return data;
    },

    uploadMedia: async (file: File, companyId?: string) => {
        const formData = new FormData();
        formData.append("file", file);
        const config = {
            headers: {
                "Content-Type": "multipart/form-data",
            },
        };
        void companyId;
        const { data } = await api.post("/upload/story", formData, config);
        return data;
    },

    getGroupedStories: async (companyId?: string): Promise<StoryGroup[]> => {
        void companyId;
        const { data } = await api.get("/stories/grouped");
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

    deleteStory: async (id: number, companyId?: string) => {
        const params = companyId ? `?companyId=${companyId}` : '';
        const { data } = await api.delete(`/stories/${id}${params}`);
        return data;
    },

    viewStory: async (id: number, companyId?: string) => {
        const params = companyId ? `?companyId=${companyId}` : '';
        await api.post(`/stories/${id}/view${params}`);
    },

    markShowcaseSeen: async (id: number, companyId?: string) => {
        const params = companyId ? `?companyId=${companyId}` : '';
        await api.post(`/stories/${id}/view${params}`);
    },

    reactToStory: async (id: number, reaction: boolean, companyId?: string) => {
        const params = companyId ? `?companyId=${companyId}` : '';
        const { data } = await api.post(`/stories/${id}/react${params}`, { reaction });
        return data;
    },

    getStoryDetails: async (id: number, companyId?: string) => {
        const params = companyId ? `?companyId=${companyId}` : '';
        const { data } = await api.get(`/stories/${id}${params}`);
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

    addStoryComment: async (storyId: number, content: string, companyId?: string) => {
        const params = companyId ? `?companyId=${companyId}` : '';
        const { data } = await api.post(`/stories/${storyId}/comments${params}`, { content });
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
