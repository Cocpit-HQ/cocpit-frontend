import { QueryClient, dehydrate, HydrationBoundary } from '@tanstack/react-query'
import { cookies } from 'next/headers'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { getServerStories } from '@/lib/server-stories'
import { getServerFeed } from '@/lib/server-feed'
import { getServerActorContext } from '@/lib/server-actor-context'
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

  // Resolve the authoritative active actor server-side — mirrors what
  // ActiveProfileContext resolves client-side. The `activeActor` cookie is
  // only used as a fallback: it cannot exist yet on a user's first page
  // load after login (it's set as a side-effect of the *client* calling
  // this same backend endpoint, which happens after SSR has responded).
  const resolvedActor = await getServerActorContext()

  let activeType: ActorType
  let activeId: string

  if (resolvedActor) {
    activeType = resolvedActor.type
    activeId = resolvedActor.id
  } else {
    const cookieStore = await cookies()
    const activeActorCookie = cookieStore.get('activeActor')?.value || ''
    const [actorType, actorId] = activeActorCookie.split(':')
    activeType = normalizeActorType(actorType)
    activeId = actorId || userId || 'me'
  }

  // Prefetch stories and feed
  const [feedData, storiesData] = await Promise.all([
    getServerFeed(resolvedActor),
    getServerStories()
  ]);

  if (feedData) {
    // Seed the infinite query cache with the first page
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
