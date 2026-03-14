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

export function setActorRequestHeaders(profile: ActorAwareProfile) {
  if (!profile) {
    delete api.defaults.headers.common["x-actor-type"];
    delete api.defaults.headers.common["x-actor-id"];
    delete publicApi.defaults.headers.common["x-actor-type"];
    delete publicApi.defaults.headers.common["x-actor-id"];
    return;
  }

  const actorType = profile.type === "COMPANY" ? "ORGANIZATION" : "USER";
  api.defaults.headers.common["x-actor-type"] = actorType;
  api.defaults.headers.common["x-actor-id"] = profile.id;
  publicApi.defaults.headers.common["x-actor-type"] = actorType;
  publicApi.defaults.headers.common["x-actor-id"] = profile.id;
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
