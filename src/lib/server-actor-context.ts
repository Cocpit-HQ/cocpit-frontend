import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { env } from "@/config/env";

export interface ResolvedServerActor {
    type: "USER" | "COMPANY";
    id: string;
}

/**
 * Server-side actor resolution.
 *
 * Mirrors what ActiveProfileContext resolves client-side via getActorContext(),
 * but runs during SSR instead of waiting for the client to bootstrap. This is
 * the source of truth for query keys seeded during SSR — the `activeActor`
 * cookie cannot be trusted on a user's first-ever page load after login,
 * because it is only ever set as a side-effect of the client calling this
 * same backend endpoint, which happens *after* SSR has already responded.
 *
 * Returns null on any failure (unauthenticated, network error, etc.) so
 * callers can fall back to cookie/session-derived defaults.
 */
export async function getServerActorContext(): Promise<ResolvedServerActor | null> {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.accessToken) {
            return null;
        }

        const apiUrl = env.API_URL;

        const response = await fetch(`${apiUrl}/auth/actor-context`, {
            headers: {
                Authorization: `Bearer ${session.user.accessToken}`,
                "Content-Type": "application/json",
            },
            cache: "no-store",
        });

        if (!response.ok) {
            console.error(`[Server Actor Context] API responded with ${response.status}`);
            return null;
        }

        const data = await response.json();
        const actor = data?.actor;

        if (!actor?.id) {
            return null;
        }

        if (actor.type === "ORGANIZATION") {
            return { type: "COMPANY", id: actor.id };
        }

        return { type: "USER", id: actor.id };
    } catch (error) {
        console.error("[Server Actor Context] Failed to resolve actor:", error);
        return null;
    }
}
