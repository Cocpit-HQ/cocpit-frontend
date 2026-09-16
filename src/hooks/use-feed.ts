import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import { useActiveProfile } from '@/context/ActiveProfileContext';
import { getFeed, resetFeedSession } from '@/services/api/feed';
import { deletePost as apiDeletePost } from '@/services/api/posts';
import { mapBackendPostToFrontend } from '@/lib/mappers/feed.mapper';
import { Post } from '@/types/entities';
import React, { useCallback, useMemo } from 'react';
import { toast } from 'sonner';

export const useFeed = (enableInitialFetch = true) => {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const { activeProfile } = useActiveProfile();
  const pathname = usePathname();
  const isFeedRoute = pathname === '/feed' || pathname?.startsWith('/feed');

  const currentUser = useMemo(() => ({
    id: session?.user?.id || '',
    name: session?.user?.name || '',
    image: session?.user?.image,
  }), [session]);

  const feedQueryKey = useMemo(
    () => ['feed', activeProfile?.type ?? 'USER', activeProfile?.id ?? currentUser.id] as const,
    [activeProfile?.id, activeProfile?.type, currentUser.id]
  );

  const [sessionId, setSessionId] = React.useState<string | null>(null);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError
  } = useInfiniteQuery({
    queryKey: feedQueryKey,
    queryFn: async ({ pageParam }) => {
      const companyId = activeProfile?.type !== 'USER' ? activeProfile?.id : undefined;
      const response = await getFeed(pageParam || undefined, companyId);
      if (response.session_id) {
        setSessionId(response.session_id);
      }
      return {
        ...response,
        posts: response.posts.map(mapBackendPostToFrontend)
      };
    },
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor || undefined,
    refetchOnWindowFocus: false,
    enabled: !!session && enableInitialFetch && isFeedRoute,
  });

  const posts = useMemo(() => {
    if (!data?.pages) return [];
    const allPosts = data.pages.flatMap(page => page.posts);
    const seen = new Set();
    return allPosts.filter(post => {
      if (seen.has(post.id)) return false;
      seen.add(post.id);
      return true;
    });
  }, [data]);

  const loadMorePosts = useCallback(async () => {
    if (hasNextPage && !isFetchingNextPage) {
      await fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const deletePost = useCallback(async (id: string, companyId?: string) => {
    queryClient.setQueryData<any>(feedQueryKey, (oldData: any) => {
      if (!oldData) return oldData;
      return {
        ...oldData,
        pages: oldData.pages.map((page: any) => ({
          ...page,
          posts: page.posts.filter((p: Post) => p.id !== id)
        }))
      };
    });
    try {
      await apiDeletePost(id, companyId);
      toast.success("Post deleted successfully");
    } catch (error) {
      console.error("Failed to delete post:", error);
      toast.error("Failed to delete post");
      // Optionally: refetch the feed to restore the post if deletion failed
      queryClient.invalidateQueries({ queryKey: feedQueryKey });
    }
  }, [feedQueryKey, queryClient]);

  const togglePostVisibility = useCallback((id: string) => {
    queryClient.setQueryData<any>(feedQueryKey, (oldData: any) => {
      if (!oldData) return oldData;
      return {
        ...oldData,
        pages: oldData.pages.map((page: any) => ({
          ...page,
          posts: page.posts.map((post: Post) =>
            post.id === id
              ? { ...post, visibility: post.visibility === 'private' ? 'public' : 'private' }
              : post
          )
        }))
      };
    });
  }, [feedQueryKey, queryClient]);

  const addPost = useCallback((post: Post) => {
    queryClient.setQueryData<any>(feedQueryKey, (oldData: any) => {
      if (!oldData) return oldData;
      // Prevent duplicates
      const exists = oldData.pages.some((page: any) =>
        page.posts.some((p: Post) => p.id === post.id)
      );
      if (exists) return oldData;

      const newPages = [...oldData.pages];
      if (newPages.length > 0) {
        newPages[0] = {
          ...newPages[0],
          posts: [post, ...newPages[0].posts]
        };
      }
      return { ...oldData, pages: newPages };
    });
  }, [feedQueryKey, queryClient]);

  const updatePostInFeed = useCallback((id: string, updates: Partial<Post>) => {
    queryClient.setQueryData<any>(feedQueryKey, (oldData: any) => {
      if (!oldData) return oldData;
      return {
        ...oldData,
        pages: oldData.pages.map((page: any) => ({
          ...page,
          posts: page.posts.map((post: Post) =>
            post.id === id ? { ...post, ...updates } : post
          )
        }))
      };
    });
  }, [feedQueryKey, queryClient]);

  const removePostFromFeed = useCallback((id: string) => {
    queryClient.setQueryData<any>(feedQueryKey, (oldData: any) => {
      if (!oldData) return oldData;
      return {
        ...oldData,
        pages: oldData.pages.map((page: any) => ({
          ...page,
          posts: page.posts.filter((post: Post) => post.id !== id)
        }))
      };
    });
  }, [feedQueryKey, queryClient]);

  const resetSession = useCallback(async () => {
    try {
      await resetFeedSession();
      setSessionId(null);
      queryClient.invalidateQueries({ queryKey: feedQueryKey });
    } catch (err) {
      console.error("Failed to reset feed session", err);
    }
  }, [feedQueryKey, queryClient]);

  React.useEffect(() => {
    if (!enableInitialFetch) return;

    const handlePostCreated = (e: Event) => {
      const customEvent = e as CustomEvent;
      const newPost = customEvent.detail;
      if (newPost) {
        addPost(newPost);
      }
    };

    const handleRepostDeleted = (e: Event) => {
      const customEvent = e as CustomEvent;
      const { repostId, originalPostId } = customEvent.detail;
      
      queryClient.setQueryData<any>(feedQueryKey, (oldData: any) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          pages: oldData.pages.map((page: any) => ({
            ...page,
            posts: page.posts.filter((p: Post) => {
               if (repostId && p.id.toString() === repostId.toString()) return false;
               if (p.shared_post?.id?.toString() === originalPostId?.toString() && p.authorId === activeProfile?.id) return false;
               return true;
            }).map((p: Post) => {
               if (p.id.toString() === originalPostId?.toString()) {
                  return { ...p, isReposted: false, repostId: null, shares: Math.max(0, (Number(p.shares) || 1) - 1).toString() };
               }
               return p;
            })
          }))
        };
      });
    };

    window.addEventListener('postCreated', handlePostCreated);
    window.addEventListener('repostDeleted', handleRepostDeleted);
    return () => {
      window.removeEventListener('postCreated', handlePostCreated);
      window.removeEventListener('repostDeleted', handleRepostDeleted);
    };
  }, [addPost, enableInitialFetch, queryClient, feedQueryKey, activeProfile?.id]);

  return {
    posts,
    sessionId,
    currentUser,
    loadMorePosts,
    addPost,
    deletePost,
    togglePostVisibility,
    updatePostInFeed,
    removePostFromFeed,
    resetSession,
    hasMore: !!hasNextPage,
    loading: isLoading || isFetchingNextPage,
    isError,
  };
};
