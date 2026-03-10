import { QueryClient, dehydrate, HydrationBoundary } from '@tanstack/react-query'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { getServerFeed } from '@/lib/server-feed'
import { mapBackendPostToFrontend } from '@/lib/mappers/feed.mapper'
import HomePage from '@/components/home/HomePage'

export default async function FeedRoute() {
  const queryClient = new QueryClient()

  // Get the session to determine the correct query key
  const session = await getServerSession(authOptions)
  const userId = session?.user?.id || ''

  // Prefetch the first page of the feed on the server
  const feedData = await getServerFeed()

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

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <HomePage />
    </HydrationBoundary>
  )
}
