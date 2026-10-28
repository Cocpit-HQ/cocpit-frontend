import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import type { InfiniteData } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import { useActiveProfile } from '@/context/ActiveProfileContext';
import { getFeed, resetFeedSession } from '@/services/api/feed';
import type { FeedResponse } from '@/services/api/feed';
import { deletePost as apiDeletePost } from '@/services/api/posts';
import { mapBackendPostToFrontend } from '@/lib/mappers/feed.mapper';
import { Post } from '@/types/entities';
import React, { useCallback, useMemo } from 'react';
import { toast } from 'sonner';

type FeedPage = Omit<FeedResponse, 'posts'> & { posts: Post[] };
type FeedData = InfiniteData<FeedPage>;
type PostWithSharedId = Post & { shared_post_id?: string };
const excludesPost = (post: Post, id: string) =>
  post.id !== id && post.shared_post?.id !== id && (post as PostWithSharedId).shared_post_id !== id;

// A ranked or cached slice may include a new post on one request and omit it
// on the next. Keep its local identity and preview until the creator lane has
// settled; a server copy of the same ID must not clear that identity.
function reconcileCreatedPost(serverPost: Post, localPost?: Post): Post {
  if (!localPost?._feedCreatedOptimistically) return serverPost;
  const imageLocalPreviews = serverPost.imageLocalPreviews?.length
    ? serverPost.imageLocalPreviews
    : localPost.imageLocalPreviews;
  const videoLocalPreview = serverPost.videoLocalPreview || localPost.videoLocalPreview;
  const images = serverPost.images?.map((src, index) =>
    serverPost.imageProcessingStatuses?.[index] === 'processing' && imageLocalPreviews?.[index]
      ? imageLocalPreviews[index]!
      : src
  );
  return {
    ...serverPost,
    _feedCreatedOptimistically: true,
    imageLocalPreviews,
    videoLocalPreview,
    images,
    imageSrc: images?.[0] || serverPost.imageSrc,
    videoSrc: serverPost.videoProcessingStatus === 'processing' && videoLocalPreview
      ? videoLocalPreview : serverPost.videoSrc,
  };
}

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
      const serverPosts = response.posts.map(mapBackendPostToFrontend);
      // Keep locally-created posts visible if a cached/ranked feed refresh does
      // not contain them yet. Once the backend returns the post, its canonical
      // version replaces the optimistic copy naturally.
      if (!pageParam) {
        const cachedData = queryClient.getQueryData<InfiniteData<FeedPage>>(feedQueryKey);
        const cachedPosts = (cachedData?.pages || []).flatMap((page) => page.posts);
        const localById = new Map(cachedPosts.map((post) => [post.id, post]));
        const reconciledPosts = serverPosts.map((post) => reconcileCreatedPost(post, localById.get(post.id)));
        const serverIds = new Set(reconciledPosts.map((post) => post.id));
        const retainedPosts = cachedPosts
          .filter((post) => post._feedCreatedOptimistically && !serverIds.has(post.id));
        return {
          ...response,
          posts: [...retainedPosts, ...reconciledPosts],
        };
      }
      return {
        ...response,
        posts: serverPosts
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
    queryClient.setQueryData<FeedData>(feedQueryKey, (oldData) => {
      if (!oldData) return oldData;
      return {
        ...oldData,
        pages: oldData.pages.map((page) => ({
          ...page,
          posts: page.posts.filter((post) => excludesPost(post, id))
        }))
      };
    });
    try {
      await apiDeletePost(id, companyId);
      toast.success("Post deleted successfully");

      // Dispatch global event so other lists (like profile) can update instantly
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent("postDeleted", { detail: { id: id.toString() } }));
      }
    } catch (error) {
      console.error("Failed to delete post:", error);
      toast.error("Failed to delete post");
      // Optionally: refetch the feed to restore the post if deletion failed
      queryClient.invalidateQueries({ queryKey: feedQueryKey });
    }
  }, [feedQueryKey, queryClient]);

  const togglePostVisibility = useCallback((id: string) => {
    queryClient.setQueryData<FeedData>(feedQueryKey, (oldData) => {
      if (!oldData) return oldData;
      return {
        ...oldData,
        pages: oldData.pages.map((page) => ({
          ...page,
          posts: page.posts.map((post) =>
            post.id === id
              ? { ...post, visibility: post.visibility === 'private' ? 'public' : 'private' }
              : post
          )
        }))
      };
    });
  }, [feedQueryKey, queryClient]);

  const addPost = useCallback((post: Post) => {
    const optimisticPost = { ...post, _feedCreatedOptimistically: true };
    queryClient.setQueryData<FeedData>(feedQueryKey, (oldData) => {
      if (!oldData) return { pages: [{ posts: [optimisticPost], nextCursor: null }], pageParams: [null] };
      // Prevent duplicates
      const exists = oldData.pages.some((page) =>
        page.posts.some((existing) => existing.id === post.id)
      );
      if (exists) return oldData;

      const newPages = [...oldData.pages];
      if (newPages.length > 0) {
        newPages[0] = {
          ...newPages[0],
          posts: [optimisticPost, ...newPages[0].posts]
        };
      }
      return { ...oldData, pages: newPages };
    });
  }, [feedQueryKey, queryClient]);

  const updatePostInFeed = useCallback((id: string, updates: Partial<Post>) => {
    queryClient.setQueryData<FeedData>(feedQueryKey, (oldData) => {
      if (!oldData) return oldData;
      return {
        ...oldData,
        pages: oldData.pages.map((page) => ({
          ...page,
          posts: page.posts.map((post) =>
            post.id === id ? { ...post, ...updates } : post
          )
        }))
      };
    });
  }, [feedQueryKey, queryClient]);

  const removePostFromFeed = useCallback((id: string) => {
    // 1. Remove from feed queries (infinite query format)
    queryClient.setQueryData<FeedData>(feedQueryKey, (oldData) => {
      if (!oldData) return oldData;
      return {
        ...oldData,
        pages: oldData.pages.map((page) => ({
          ...page,
          posts: page.posts.filter((post) => excludesPost(post, id))
        }))
      };
    });

    // 2. Remove from profile-posts query (standard array format)
    queryClient.setQueriesData<Post[]>({ queryKey: ["profile-posts"] }, (oldData) => {
      if (!oldData || !Array.isArray(oldData)) return oldData;
      return oldData.filter((post) => excludesPost(post, id));
    });

    // 3. Remove from profile-posts-preview query (standard array format)
    queryClient.setQueriesData<Post[]>({ queryKey: ["profile-posts-preview"] }, (oldData) => {
      if (!oldData || !Array.isArray(oldData)) return oldData;
      return oldData.filter((post) => excludesPost(post, id));
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
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('scroll-/feed', '0');
          sessionStorage.removeItem('cocpit_last_interacted_post_id');
          sessionStorage.removeItem('cocpit_last_interacted_post_viewport_top');
          if (window.location.pathname === '/feed' || window.location.pathname === '/') {
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }
        }
      }
    };

    const handleRepostDeleted = (e: Event) => {
      const customEvent = e as CustomEvent;
      const { repostId, originalPostId } = customEvent.detail;

      queryClient.setQueryData<FeedData>(feedQueryKey, (oldData) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          pages: oldData.pages.map((page) => ({
            ...page,
            posts: page.posts.filter((p) => {
              if (repostId && p.id.toString() === repostId.toString()) return false;
              if (p.shared_post?.id?.toString() === originalPostId?.toString() && p.authorId === activeProfile?.id) return false;
              return true;
            }).map((p) => {
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
