"use client";

import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { StoryDetail, StoryGroup } from '@/types/showcase';
import { showcaseService } from '@/services/showcase.service';
import { useActiveProfile } from '@/context/ActiveProfileContext';

interface StoriesContextType {
    groups: StoryGroup[];
    isLoading: boolean;
    selectedStory: StoryDetail | null;
    setSelectedStory: (story: StoryDetail | null) => void;
    handleCreateStory: (newStory: StoryDetail) => void;
    handleStoryUpdate: (updatedStory: StoryDetail) => void;
    refreshStories: () => Promise<void>;
    isStoryViewerOpen: boolean;
    setIsStoryViewerOpen: (isOpen: boolean) => void;
}

const StoriesContext = createContext<StoriesContextType | undefined>(undefined);

export function StoriesProvider({ children }: { children: React.ReactNode }) {
    const { activeProfile } = useActiveProfile();
    const queryClient = useQueryClient();
    const [selectedStory, setSelectedStory] = useState<StoryDetail | null>(null);
    const [isStoryViewerOpen, setIsStoryViewerOpen] = useState(false);

    const companyId = activeProfile?.type === 'COMPANY' ? activeProfile.id : undefined;
    const queryKey = useMemo(() => ['grouped-stories', activeProfile?.id], [activeProfile?.id]);

    const { data: groups = [], isLoading, refetch } = useQuery({
        queryKey: queryKey,
        queryFn: () => showcaseService.getGroupedStories(companyId),
        staleTime: 1000 * 60 * 5, // 5 minutes
        refetchOnWindowFocus: false,
    });

    const handleCreateStory = useCallback((newStory: StoryDetail) => {
        queryClient.setQueryData(queryKey, (oldGroups: StoryGroup[] | undefined) => {
            const prevGroups = oldGroups || [];
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
    }, [queryClient, queryKey]);

    const handleStoryUpdate = useCallback((updatedStory: StoryDetail) => {
        queryClient.setQueryData(queryKey, (oldGroups: StoryGroup[] | undefined) => {
            const prevGroups = oldGroups || [];
            return prevGroups.map(group => {
                const storyIndex = group.stories.findIndex(s => s.id === updatedStory.id);
                if (storyIndex !== -1) {
                    const newStories = [...group.stories];
                    newStories[storyIndex] = updatedStory;
                    return { ...group, stories: newStories };
                }
                return group;
            });
        });

        setSelectedStory((prev) => prev?.id === updatedStory.id ? updatedStory : prev);
    }, [queryClient, queryKey]);

    const refreshStories = useCallback(async () => {
        await refetch();
    }, [refetch]);

    const value = {
        groups,
        isLoading,
        selectedStory,
        setSelectedStory,
        handleCreateStory,
        handleStoryUpdate,
        refreshStories,
        isStoryViewerOpen,
        setIsStoryViewerOpen
    };

    return (
        <StoriesContext.Provider value={value}>
            {children}
        </StoriesContext.Provider>
    );
}

export function useStories() {
    const context = useContext(StoriesContext);
    if (context === undefined) {
        throw new Error('useStories must be used within a StoriesProvider');
    }
    return context;
}
