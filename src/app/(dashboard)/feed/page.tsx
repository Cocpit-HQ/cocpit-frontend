import { QueryClient, dehydrate, HydrationBoundary } from '@tanstack/react-query'
import { cookies } from 'next/headers'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { getServerStories } from '@/lib/server-stories'
import { getServerFeed } from '@/lib/server-feed'
import { mapBackendPostToFrontend } from '@/lib/mappers/feed.mapper'
import HomePage from '@/components/home/HomePage'

type ActorType = 'USER' | 'COMPANY'

function normalizeActorType(rawType?: string | null): ActorType {
  if (!rawType) return 'USER'
  const normalized = rawType.trim().toUpperCase()
  if (normalized === 'ORGANIZATION' || normalized === 'COMPANY' || normalized === 'ORG') {
    return 'COMPANY'
  }
  return 'USER'
}

export default async function FeedRoute() {
  const queryClient = new QueryClient()

  // Get the session to determine the correct query key
  const session = await getServerSession(authOptions)
  const userId = session?.user?.id

  const cookieStore = await cookies()
  const activeActorCookie = cookieStore.get('activeActor')?.value || ''
  const [actorType, actorId] = activeActorCookie.split(':')

  // Resolve active scope for query keys
  const activeType = normalizeActorType(actorType)
  const activeId = actorId || userId || 'me'

  // Prefetch stories and feed
  const [feedData, storiesData] = await Promise.all([
    getServerFeed(),
    getServerStories()
  ]);

  if (feedData) {
    // Seed the infinite query cache with the first page
    // Query key matches FeedContext: ['feed', activeType, activeId]
    queryClient.setQueryData(['feed', activeType, activeId], {
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
    // Query key matches StoriesContext: ['grouped-stories', <type>, <id>]
    queryClient.setQueryData(['grouped-stories', activeType, activeId], storiesData);
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <HomePage />
    </HydrationBoundary>
  )
}
