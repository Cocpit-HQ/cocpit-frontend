import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { EngineFeedResponse, FeedResponse, mapEngineResponseToFeedResponse } from "@/services/api/feed";
import { env } from "@/config/env";
import { ResolvedServerActor } from "@/lib/server-actor-context";

/**
 * Server-side feed fetcher.
 * Uses getServerSession to get the access token and calls the backend directly.
 * This runs ONLY on the server (in Server Components or Route Handlers).
 *
 * Calls the same /feed engine endpoint the client uses (not the legacy
 * /All/feeds public feed), and applies the exact same response mapping
 * (mapEngineResponseToFeedResponse) so SSR-seeded pages and client-side
 * pagination always agree on post shape and cursor format.
 *
 * `actor`, when provided, should come from getServerActorContext() — the
 * authoritative server-resolved actor — rather than the `activeActor`
 * cookie, which cannot exist yet on a user's first page load after login.
 */
export async function getServerFeed(actor?: ResolvedServerActor | null): Promise<FeedResponse | null> {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.accessToken) {
            return null;
        }

        const apiUrl = env.API_URL;

        const headers: Record<string, string> = {
            Authorization: `Bearer ${session.user.accessToken}`,
            "Content-Type": "application/json",
        };

        if (actor?.type === "COMPANY" && actor.id) {
            headers["x-actor-type"] = "ORGANIZATION";
            headers["x-actor-id"] = actor.id;
        }

        const response = await fetch(`${apiUrl}/feed`, {
            headers,
            // Don't cache - feed is personalized per user
            cache: "no-store",
        });

        if (!response.ok) {
            console.error(`[Server Feed] API responded with ${response.status}`);
            return null;
        }

        const data: EngineFeedResponse = await response.json();
        return mapEngineResponseToFeedResponse(data);
    } catch (error) {
        console.error("[Server Feed] Failed to prefetch feed:", error);
        return null;
    }
}
