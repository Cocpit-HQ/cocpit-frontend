import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { FeedResponse } from "@/services/api/feed";

/**
 * Server-side feed fetcher.
 * Uses getServerSession to get the access token and calls the backend directly.
 * This runs ONLY on the server (in Server Components or Route Handlers).
 */
export async function getServerFeed(): Promise<FeedResponse | null> {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.accessToken) {
            return null;
        }

        const apiUrl = process.env.NEXT_PUBLIC_API_URL;
        if (!apiUrl) {
            console.error("[Server Feed] NEXT_PUBLIC_API_URL is not defined");
            return null;
        }

        const response = await fetch(`${apiUrl}/All/feeds`, {
            headers: {
                Authorization: `Bearer ${session.user.accessToken}`,
                "Content-Type": "application/json",
            },
            // Don't cache - feed is personalized per user
            cache: "no-store",
        });

        if (!response.ok) {
            console.error(`[Server Feed] API responded with ${response.status}`);
            return null;
        }

        return await response.json();
    } catch (error) {
        console.error("[Server Feed] Failed to prefetch feed:", error);
        return null;
    }
}
