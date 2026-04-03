"use client";

import React, { useMemo, useState, useEffect } from 'react'
import Link from 'next/link'
import { Plus, Play, Check } from 'lucide-react'
import { StoryDetail, StoryGroup } from '@/types/showcase'
import { UserMention, getSuggestedUsers } from '@/services/api/users'
import { followUser } from '@/services/api/social'
import { toast } from 'sonner'
import { useStories } from '@/context/StoriesContext'
import { getStoryThumbnailUrl } from '@/lib/story-media'

type StoryRailProps = {
  groups: StoryGroup[]
  onCreateClick: () => void
  onStoryClick: (story: StoryDetail) => void
  isLoading?: boolean
  activeAccount?: { name: string; image?: string | null }
}

// Helper to determine image source
function getStoryImage(story: StoryDetail): string | null {
  const thumbnailUrl = getStoryThumbnailUrl(story);
  if (thumbnailUrl) return thumbnailUrl;

  if (story.media_type === 'video' || (story.image && (story.image.endsWith('.mp4') || story.image.endsWith('.mov')))) {
    if (story.image && story.image.includes('cloudinary')) {
      return story.image.replace(/\.[^/.]+$/, ".jpg");
    }
    return null;
  }
  return story.image || null;
}

export function StoryRail({ groups, onCreateClick, onStoryClick, isLoading, activeAccount }: StoryRailProps) {
  const [suggestedUsers, setSuggestedUsers] = useState<UserMention[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());
  const { isStoryViewerOpen, setIsStoryViewerOpen } = useStories();
  const [frozenGroups, setFrozenGroups] = useState<StoryGroup[] | null>(null);

  const myGroup = useMemo(() => groups.find(g => g.is_current_user), [groups]);
  
  const otherGroups = useMemo(() => {
    const filtered = groups.filter(g => !g.is_current_user);

    const performSort = (items: StoryGroup[]) => {
      return [...items].sort((a, b) => {
        const aHasUnseen = a.stories.some(s => !s.has_viewed && !s.isAuthor);
        const bHasUnseen = b.stories.some(s => !s.has_viewed && !s.isAuthor);

        if (aHasUnseen && !bHasUnseen) return -1;
        if (!aHasUnseen && bHasUnseen) return 1;

        const aTime = a.latest_story_at ? new Date(a.latest_story_at).getTime() : 0;
        const bTime = b.latest_story_at ? new Date(b.latest_story_at).getTime() : 0;
        return bTime - aTime;
      });
    };

    if (isStoryViewerOpen && frozenGroups) {
      const orderMap = new Map(frozenGroups.map((g, i) => [g.author.id, i]));
      return [...filtered].sort((a, b) => {
        const indexA = orderMap.has(a.author.id) ? orderMap.get(a.author.id)! : Infinity;
        const indexB = orderMap.has(b.author.id) ? orderMap.get(b.author.id)! : Infinity;
        return indexA - indexB;
      });
    }

    return performSort(filtered);
  }, [groups, isStoryViewerOpen, frozenGroups]);

  useEffect(() => {
    if (isStoryViewerOpen) {
      if (!frozenGroups) {
        setFrozenGroups(otherGroups);
      }
    } else {
      setFrozenGroups(null);
    }
  }, [isStoryViewerOpen, frozenGroups, otherGroups]);

  useEffect(() => {
    if (!isLoading && otherGroups.length === 0) {
      const fetchSuggestions = async () => {
        setIsLoadingSuggestions(true);
        try {
          const data = await getSuggestedUsers();
          setSuggestedUsers(data);
        } catch (error) {
          console.error("Failed to fetch suggestions", error);
        } finally {
          setIsLoadingSuggestions(false);
        }
      };
      fetchSuggestions();
    }
  }, [isLoading, otherGroups.length]);

  const handleFollow = async (e: React.MouseEvent, userId: string) => {
    e.stopPropagation();
    e.preventDefault();

    if (followingIds.has(userId)) return;

    setFollowingIds(prev => new Set(prev).add(userId));
    try {
      await followUser(userId);
      toast.success("Following user");
    } catch (error) {
      console.error("Follow failed", error);
      setFollowingIds(prev => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
      toast.error("Failed to follow user");
    }
  };

  return (
    <div className="mb-2 md:mb-4">
      <div className="flex items-center justify-between mb-1 md:mb-3 px-4 md:px-0">
        <h2 className="font-semibold text-lg text-foreground">Stories</h2>
        <Link href="/showcase" className="text-primary text-sm hover:underline hidden md:block">
          View All
        </Link>
      </div>

      <div className="stories-scroll-container">
        <div className="flex gap-3 overflow-x-auto pt-2 pb-2 scrollbar-hide px-4 md:px-0">
          {isLoading ? (
            // Skeleton Loader
            Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="flex-shrink-0 flex flex-col items-center gap-2"
              >
                <div className="w-14 h-14 md:w-28 md:h-40 rounded-full md:rounded-xl bg-muted animate-pulse border border-border overflow-hidden relative">
                  <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/20 to-transparent hidden md:block" />
                </div>
                <div className="w-12 h-2 md:absolute md:bottom-3 md:left-1/2 md:-translate-x-1/2 md:w-16 bg-muted-foreground/20 rounded-full" />
              </div>
            ))
          ) : (
            <>
              {/* 1. My Story (Index 0 - Always Visible) */}
              {(() => {
                // If myGroup exists and has stories, show the story circle
                if (myGroup && myGroup.stories.length > 0) {
                  const story = myGroup.stories[myGroup.stories.length - 1];
                  const displayImage = getStoryImage(story);

                  return (
                    <div key="my-story" className="flex-shrink-0 flex flex-col items-center gap-2 group relative">
                      <div className="relative">
                        <button
                          onClick={() => onStoryClick(story)}
                          className="w-14 h-14 md:w-28 md:h-40 rounded-full md:rounded-xl border-2 border-primary overflow-hidden bg-black relative p-0.5"
                        >
                          {displayImage ? (
                            <img
                              src={displayImage}
                              alt={story.title}
                              className="w-full h-full rounded-full md:rounded-lg object-cover transition-transform duration-300 group-hover:scale-110"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                          ) : (
                            <div className="w-full h-full rounded-full md:rounded-lg bg-gray-800" />
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent hidden md:block" />
                          <span className="absolute bottom-2 left-0 w-full text-white text-xs font-medium truncate text-center shadow-black drop-shadow-md hidden md:block">
                            Your Story
                          </span>
                        </button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onCreateClick();
                          }}
                          className="absolute bottom-0 right-0 translate-x-1 translate-y-1 md:translate-y-0 md:translate-x-[-50%] md:top-auto md:bottom-8 md:right-auto md:left-1/2 w-5 h-5 md:w-10 md:h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center border-2 md:border-4 border-background z-10 hover:bg-primary/90 transition-colors"
                          aria-label="Add new story"
                        >
                          <Plus className="w-3.5 h-3.5 md:w-6 md:h-6" />
                        </button>
                      </div>
                      <span className="text-foreground text-[10px] md:text-xs font-medium md:hidden">Your Story</span>
                    </div>
                  );
                }

                // Fallback: "Add Story" Button (My Story Empty)
                return (
                  <button
                    key="my-empty"
                    onClick={onCreateClick}
                    className="flex-shrink-0 flex flex-col items-center gap-2 group text-left relative"
                  >
                    <div className="relative">
                      <div className="w-14 h-14 md:w-28 md:h-40 rounded-full md:rounded-xl bg-muted hover:bg-muted/80 flex items-center justify-center border border-border transition-colors relative overflow-hidden">
                        {activeAccount?.image ? (
                          <>
                            <img
                              src={activeAccount.image}
                              alt={activeAccount.name}
                              className="w-full h-full object-cover opacity-60 group-hover:opacity-40 transition-opacity"
                            />
                            {/* Desktop Overlay */}
                            <div className="absolute inset-0 hidden md:flex items-center justify-center">
                              <div className="w-10 h-10 rounded-full bg-primary/80 backdrop-blur-sm flex items-center justify-center shadow-sm">
                                <Plus className="w-6 h-6 text-primary-foreground" />
                              </div>
                            </div>
                          </>
                        ) : (
                          /* Fallback Empty State / Desktop Default */
                          <div className="w-full h-full flex items-center justify-center">
                            <Plus className="hidden md:block w-6 h-6 text-primary" />
                            {/* Mobile fallback icon inside circle if no image */}
                            <Plus className="md:hidden w-6 h-6 text-muted-foreground/30" />
                          </div>
                        )}
                      </div>

                      {/* Mobile Badge - Positioned Absolute Outside Overflow Container */}
                      <div className="absolute bottom-0 right-0 translate-x-1 translate-y-1 md:hidden z-10">
                        <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center border-2 border-background shadow-sm">
                          <Plus className="w-3.5 h-3.5 text-primary-foreground" />
                        </div>
                      </div>
                    </div>
                    <span className="text-foreground text-[10px] md:text-xs font-medium md:absolute md:bottom-2 md:left-0 md:w-full md:text-center">Add Story</span>
                  </button>
                );
              })()}

              {/* 2. Other Users' Stories (Index 1+) */}
              {otherGroups.map((group) => {
                const story = group.stories[group.stories.length - 1];
                const hasUnviewed = group.stories.some(s => !s.has_viewed && !s.isAuthor);
                const displayImage = getStoryImage(story);

                if (group.stories.length === 0) return null;

                return (
                  <div key={group.author.id} className="flex-shrink-0 flex flex-col items-center gap-2 group relative">
                    <button
                      onClick={() => {
                        setIsStoryViewerOpen(true);
                        onStoryClick(story);
                      }}
                      className={`w-14 h-14 md:w-28 md:h-40 rounded-full md:rounded-xl relative overflow-hidden bg-black ${hasUnviewed ? 'ring-2 ring-primary ring-offset-2' : 'border border-border'
                        }`}
                    >
                      {displayImage ? (
                        <img
                          src={displayImage}
                          alt={story.title}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="absolute inset-0 bg-gray-800" />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent hidden md:block" />

                      {story.media_type === 'video' && (
                        <div className="absolute top-1 right-1 md:top-2 md:right-2">
                          <Play className="w-3 h-3 md:w-4 md:h-4 text-white fill-white" />
                        </div>
                      )}

                      <div className="absolute bottom-2 left-2 right-2 hidden md:flex flex-col items-center">
                        <div className={`w-8 h-8 rounded-full p-0.5 bg-gradient-to-br from-blue-400 to-purple-500 mb-1 ${hasUnviewed ? 'animate-pulse' : ''}`}>
                          {group.author.avatar ? (
                            <img
                              src={group.author.avatar}
                              alt={group.author.name}
                              className="w-full h-full rounded-full object-cover border-2 border-white"
                            />
                          ) : (
                            <div className="w-full h-full rounded-full bg-gray-500 border-2 border-white flex items-center justify-center text-[10px] font-bold text-white uppercase">
                              {group.author.name?.[0] || '?'}
                            </div>
                          )}
                        </div>
                        <span className="text-white text-xs font-medium truncate w-full text-center shadow-black drop-shadow-md">
                          {group.author.name}
                        </span>
                      </div>
                    </button>
                    <span className="text-foreground text-[10px] md:text-xs font-medium truncate w-16 text-center md:hidden">
                      {group.author.name}
                    </span>
                  </div>
                )
              })}

              {/* 3. Suggested People Fallback (Mobile Only) */}
              {otherGroups.length === 0 && suggestedUsers.length > 0 && (
                suggestedUsers.map((user) => (
                  <div key={user.id} className="flex-shrink-0 flex flex-col items-center gap-2 group relative md:hidden">
                    <div className="relative">
                      <div
                        className="w-14 h-14 rounded-full border border-border overflow-hidden bg-muted flex items-center justify-center cursor-pointer transition-transform active:scale-95"
                        onClick={() => window.location.href = `/profile/${user.account_name || user.id}`}
                      >
                        {user.avatar_url ? (
                          <img
                            src={user.avatar_url}
                            alt={user.full_name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary font-bold text-lg">
                            {user.full_name[0]}
                          </div>
                        )}
                      </div>

                      {/* Follow Button (+) */}
                      <button
                        onClick={(e) => handleFollow(e, user.id)}
                        disabled={followingIds.has(user.id)}
                        className={`absolute top-10 left-11 w-5 h-5 rounded-full flex items-center justify-center border-2 border-background z-10 transition-colors ${followingIds.has(user.id)
                          ? 'bg-green-500 text-white'
                          : 'bg-primary text-primary-foreground hover:bg-primary/90'
                          }`}
                      >
                        {followingIds.has(user.id) ? (
                          <Check className="w-3 h-3" />
                        ) : (
                          <Plus className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>

                    <span className="text-foreground text-[10px] font-medium truncate w-16 text-center">
                      {user.account_name || user.full_name.split(' ')[0]}
                    </span>
                  </div>
                ))
              )}
            </>
          )}
        </div>
      </div>
    </div >
  )
}
