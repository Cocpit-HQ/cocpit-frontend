import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { StoryGroup } from "@/types/showcase";
import { mapStory } from "@/lib/story-mapper";
import { cookies } from "next/headers";

/**
 * Server-side stories fetcher.
 * Uses getServerSession to get the access token and calls the backend directly.
 * This runs ONLY on the server (in Server Components or Route Handlers).
 */
export async function getServerStories(): Promise<StoryGroup[] | null> {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.accessToken) {
            return null;
        }

        const apiUrl = process.env.NEXT_PUBLIC_API_URL;
        if (!apiUrl) {
            console.error("[Server Stories] NEXT_PUBLIC_API_URL is not defined");
            return null;
        }

        const cookieStore = await cookies();
        const activeActorCookie = cookieStore.get("activeActor")?.value || "";
        const [actorType, actorId] = activeActorCookie.split(":");

        const headers: Record<string, string> = {
            Authorization: `Bearer ${session.user.accessToken}`,
            "Content-Type": "application/json",
        };

        if (actorType === "ORGANIZATION" && actorId) {
            headers["x-actor-type"] = "ORGANIZATION";
            headers["x-actor-id"] = actorId;
        }

        const url = new URL(`${apiUrl}/stories/grouped`);

        const response = await fetch(url.toString(), {
            headers,
            cache: "no-store",
        });

        if (!response.ok) {
            console.error(`[Server Stories] API responded with ${response.status}`);
            return null;
        }

        const data = await response.json();

        // Map backend response to match StoryGroup structure (mirrors showcaseService.ts)
        return data.map((group: any) => ({
            author: {
                id: group.author.id,
                name: group.author.name,
                avatar: group.author.avatar
            },
            is_current_user: group.is_current_user,
            latest_story_at: group.latest_story_at,
            stories: group.stories.map(mapStory)
        }));
    } catch (error) {
        console.error("[Server Stories] Failed to prefetch stories:", error);
        return null;
    }
}
