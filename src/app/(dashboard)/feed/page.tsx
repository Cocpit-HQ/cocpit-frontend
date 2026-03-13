import { QueryClient, dehydrate, HydrationBoundary } from '@tanstack/react-query'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { getServerStories } from '@/lib/server-stories'
import { getServerFeed } from '@/lib/server-feed'
import { mapBackendPostToFrontend } from '@/lib/mappers/feed.mapper'
import HomePage from '@/components/home/HomePage'

export default async function FeedRoute() {
  const queryClient = new QueryClient()

  // Get the session to determine the correct query key
  const session = await getServerSession(authOptions)
  const userId = session?.user?.id || ''

  // Prefetch stories and feed
  const [feedData, storiesData] = await Promise.all([
    getServerFeed(),
    getServerStories()
  ]);

  if (feedData) {
    // Seed the infinite query cache with the first page
    // Query key matches FeedContext: ['feed', 'USER', userId]
    queryClient.setQueryData(['feed', 'USER', userId], {
      pages: [
        {
          ...feedData,
          posts: feedData.posts.map(mapBackendPostToFrontend),
        },
      ],
      pageParams: [null],
    })
  }

  if (storiesData) {
    // Query key matches StoriesContext: ['grouped-stories', userId]
    queryClient.setQueryData(['grouped-stories', userId], storiesData);
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <HomePage />
    </HydrationBoundary>
  )
}
