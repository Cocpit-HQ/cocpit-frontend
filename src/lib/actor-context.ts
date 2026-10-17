import { env } from "@/config/env";
import api, { publicApi } from "@/lib/axios";

export type ActorAwareProfile =
  | { type: "USER"; id: string }
  | { type: "COMPANY"; id: string }
  | null;

export function actorScopeKey(
  profile: ActorAwareProfile | { type: string; id: string } | null,
  fallbackId = "me"
) {
  if (!profile) {
    return ["USER", fallbackId] as const;
  }

  const type = profile.type === "COMPANY" ? "COMPANY" : "USER";
  return [type, profile.id] as const;
}

export function getActorHeadersFromStorage() {
  if (typeof window === "undefined") {
    return null;
  }

  const storedProfile = sessionStorage.getItem("cocpit_active_profile");
  if (!storedProfile) {
    return null;
  }

  try {
    const profile = JSON.parse(storedProfile) as ActorAwareProfile;
    if (!profile) return null;
    
    const actorType = profile.type === "COMPANY" ? "ORGANIZATION" : "USER";
    return {
      type: actorType,
      id: profile.id
    };
  } catch (e) {
    return null;
  }
}

export function getPreservedUserActorFromStorage() {
  if (typeof window === "undefined") {
    return null;
  }

  const storedUser = sessionStorage.getItem("cocpit_user_actor");
  if (!storedUser) {
    return null;
  }

  try {
    const user = JSON.parse(storedUser);
    if (!user || !user.id) return null;
    return {
      type: "USER" as const,
      id: String(user.id),
    };
  } catch (e) {
    return null;
  }
}

export function setPreservedUserActorInStorage(userId: string) {
  if (typeof window === "undefined" || !userId) return;
  try {
    sessionStorage.setItem(
      "cocpit_user_actor",
      JSON.stringify({ type: "USER", id: userId })
    );
  } catch (e) {
    // Ignore storage quota or disabled storage errors
  }
}

export function trackActorMetric(name: string, detail?: Record<string, unknown>) {
  if (typeof window !== "undefined" && typeof window.performance?.mark === "function") {
    try {
      window.performance.mark(`actor:${name}`);
    } catch {
      // Ignore unsupported performance APIs.
    }
  }

  if (env.DEBUG) {
    console.debug(`[ActorContext] ${name}`, detail || {});
  }
}
