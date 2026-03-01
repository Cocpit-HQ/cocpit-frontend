import { useState, useCallback } from 'react';
import { StoryDetail, StoryGroup } from '@/types/showcase';

export function useStoryGroups(initialGroups: StoryGroup[] = []) {
    const [groups, setGroups] = useState<StoryGroup[]>(initialGroups);
    const [selectedStory, setSelectedStory] = useState<StoryDetail | null>(null);

    const handleCreateStory = useCallback((newStory: StoryDetail) => {
        setGroups((prevGroups) => {
            const newGroups = [...prevGroups];
            const myGroupIndex = newGroups.findIndex(g => g.is_current_user);

            if (myGroupIndex !== -1) {
                const existingGroup = newGroups[myGroupIndex];
                const exists = existingGroup.stories.some(s => s.id === newStory.id);

                if (!exists) {
                    newGroups[myGroupIndex] = {
                        ...existingGroup,
                        stories: [...existingGroup.stories, newStory]
                    };
                }
                return newGroups;
            } else {
                const newGroup: StoryGroup = {
                    author: newStory.author,
                    is_current_user: true,
                    latest_story_at: newStory.created_at || new Date().toISOString(),
                    stories: [newStory]
                };
                return [newGroup, ...prevGroups];
            }
        });

        setSelectedStory(newStory);
    }, []);

    const handleStoryUpdate = useCallback((updatedStory: StoryDetail) => {
        setGroups((prevGroups) => prevGroups.map(group => {
            const storyIndex = group.stories.findIndex(s => s.id === updatedStory.id);
            if (storyIndex !== -1) {
                const newStories = [...group.stories];
                newStories[storyIndex] = updatedStory;
                return { ...group, stories: newStories };
            }
            return group;
        }));

        setSelectedStory((prev) => prev?.id === updatedStory.id ? updatedStory : prev);
    }, []);

    return {
        groups,
        setGroups,
        selectedStory,
        setSelectedStory,
        handleCreateStory,
        handleStoryUpdate
    };
}
