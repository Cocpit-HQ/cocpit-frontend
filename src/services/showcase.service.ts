
import api from "@/lib/axios";
import { mapStory } from "@/lib/story-mapper";
import { StoryDetail, StoryCard, StoryGroup } from "@/types/showcase";

export const showcaseService = {
    getStories: async (): Promise<StoryDetail[]> => {
        const { data } = await api.get("/stories");
        return data.map(mapStory);
    },

    createStory: async (storyData: { title: string; description: string; media_url: string }) => {
        const { data } = await api.post("/story", storyData);
        return data;
    },

    getGroupedStories: async (): Promise<StoryGroup[]> => {
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

    deleteStory: async (id: number) => {
        const { data } = await api.delete(`/stories/${id}`);
        return data;
    },

    viewStory: async (id: number) => {
        await api.post(`/stories/${id}/view`);
    },

    reactToStory: async (id: number, reaction: boolean) => {
        const { data } = await api.post(`/stories/${id}/react`, { reaction });
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
    }
};
