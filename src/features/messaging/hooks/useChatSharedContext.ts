"use client";

import { useState, useEffect, useRef } from "react";
import { ReadonlyURLSearchParams } from "next/navigation";
import type { Post } from "@/types/entities";
import { checkContextSent } from "@/services/api/messaging";
import { QueryClient } from "@tanstack/react-query";

interface UseChatSharedContextProps {
  chatId: string | number;
  initialEntityContext?: { type: "job" | "offer" | "event"; id: string };
  searchParams?: ReadonlyURLSearchParams | null;
  existingMessages?: any[];
  queryClient?: QueryClient;
  activeProfileId?: string;
  chatJobId?: string;
}

export const isMessageDeletedForEveryone = (m: any): boolean => {
  return Boolean(
    m?.is_deleted_for_everyone ||
    m?.text === "This message was deleted for everyone" ||
    m?.text_content === "This message was deleted for everyone"
  );
};

export const markJobContextSent = (chatId: string | number, entityId?: string) => {
  if (typeof window === "undefined" || !entityId) return;
  try {
    const key = `${chatId}:${entityId}`;
    const stored = sessionStorage.getItem("cocpit_sent_job_contexts");
    const parsed: string[] = stored ? JSON.parse(stored) : [];
    if (!parsed.includes(key)) {
      parsed.push(key);
      sessionStorage.setItem("cocpit_sent_job_contexts", JSON.stringify(parsed));
    }
  } catch (err) {
    console.error("Failed to mark job context sent:", err);
  }
};

export const unmarkJobContextSent = (chatId: string | number, entityId?: string) => {
  if (typeof window === "undefined") return;
  try {
    const key = `${chatId}:${entityId || ""}`;
    const stored = sessionStorage.getItem("cocpit_sent_job_contexts");
    if (!stored) return;
    const parsed: string[] = JSON.parse(stored);
    const filtered = parsed.filter(
      (item) => (entityId ? item !== key : !item.startsWith(`${chatId}:`))
    );
    sessionStorage.setItem("cocpit_sent_job_contexts", JSON.stringify(filtered));
  } catch (err) {
    console.error("Failed to unmark job context sent:", err);
  }
};

export const isJobContextAlreadySent = (chatId: string | number, entityId?: string): boolean => {
  if (typeof window === "undefined" || !entityId) return false;
  try {
    const key = `${chatId}:${entityId}`;
    const stored = sessionStorage.getItem("cocpit_sent_job_contexts");
    if (stored) {
      const parsed: string[] = JSON.parse(stored);
      return parsed.includes(key);
    }
  } catch {}
  return false;
};

export const checkHasJobCardInMessages = (
  msgs?: any[],
  targetEntityId?: string
): boolean => {
  if (!msgs || !Array.isArray(msgs) || msgs.length === 0) return false;
  return msgs.some((m: any) => {
    // Only disregard if deleted for EVERYONE.
    // If deleted only for me, the message is still active for the other participant.
    if (isMessageDeletedForEveryone(m)) return false;

    const mType = m?.entityType || m?.entity_type;
    const mId = m?.entityId || m?.entity_id;
    if (mType === "job" || mType === "offer") {
      if (!targetEntityId) return true;
      return String(mId) === String(targetEntityId);
    }
    return false;
  });
};

export function useChatSharedContext({
  chatId,
  initialEntityContext,
  searchParams,
  existingMessages,
  queryClient,
  activeProfileId,
  chatJobId,
}: UseChatSharedContextProps) {
  const effectiveEntityContext =
    initialEntityContext ||
    (chatJobId ? { type: "job" as const, id: chatJobId } : undefined);
  const sharedPostIdParam = searchParams?.get("sharedPostId");
  const sharedProfileIdParam = searchParams?.get("sharedProfileId");

  const [pendingSharedPostId, setPendingSharedPostId] = useState<string | null>(null);
  const [pendingSharedPost, setPendingSharedPost] = useState<Post | Record<string, unknown> | null>(null);

  const [pendingSharedProfileId, setPendingSharedProfileId] = useState<string | null>(null);
  const [pendingSharedProfile, setPendingSharedProfile] = useState<Record<string, unknown> | null>(null);

  const [pendingEntityContext, setPendingEntityContext] = useState<{
    type: "job" | "offer" | "event";
    id: string;
  } | null>(null);

  const processedEntityContextRef = useRef<string | null>(null);

  // Sync shared post from URL query param
  useEffect(() => {
    if (sharedPostIdParam) {
      setPendingSharedPostId(sharedPostIdParam);
      Promise.all([
        import("@/services/api/posts"),
        import("@/lib/mappers/feed.mapper"),
      ]).then(([{ getPostById }, { mapBackendPostToFrontend }]) => {
        getPostById(sharedPostIdParam)
          .then((backendPost) => {
            const mapped = mapBackendPostToFrontend(backendPost);
            setPendingSharedPost(mapped);
          })
          .catch((err) => {
            console.error("Failed to fetch shared post details:", err);
          });
      });

      // Clean up URL query parameter without full reload
      if (typeof window !== "undefined") {
        const newParams = new URLSearchParams(window.location.search);
        newParams.delete("sharedPostId");
        const newSearch = newParams.toString();
        const newPath =
          window.location.pathname + (newSearch ? `?${newSearch}` : "");
        window.history.replaceState(null, "", newPath);
      }
    }
  }, [sharedPostIdParam, chatId]);

  // Sync shared profile from URL query param
  useEffect(() => {
    if (sharedProfileIdParam) {
      setPendingSharedProfileId(sharedProfileIdParam);
      import("@/services/api/user").then(({ getUserById }) => {
        getUserById(sharedProfileIdParam)
          .then((response) => {
            setPendingSharedProfile(response.user);
          })
          .catch((err) => {
            console.error("Failed to fetch shared profile details:", err);
          });
      });

      // Clean up URL query parameter without full reload
      if (typeof window !== "undefined") {
        const newParams = new URLSearchParams(window.location.search);
        newParams.delete("sharedProfileId");
        const newSearch = newParams.toString();
        const newPath =
          window.location.pathname + (newSearch ? `?${newSearch}` : "");
        window.history.replaceState(null, "", newPath);
      }
    }
  }, [sharedProfileIdParam, chatId]);

  // Clean URL parameters helper
  const cleanUrlParams = () => {
    if (typeof window !== "undefined") {
      const newParams = new URLSearchParams(window.location.search);
      let changed = false;
      if (newParams.has("jobContext")) {
        newParams.delete("jobContext");
        changed = true;
      }
      if (newParams.has("offerContext")) {
        newParams.delete("offerContext");
        changed = true;
      }
      if (newParams.has("eventContext")) {
        newParams.delete("eventContext");
        changed = true;
      }
      if (changed) {
        const newSearch = newParams.toString();
        window.history.replaceState(
          null,
          "",
          window.location.pathname + (newSearch ? `?${newSearch}` : ""),
        );
      }
    }
  };

  // Check and sync entity context
  useEffect(() => {
    const contextKey = `${chatId}:${effectiveEntityContext?.id || ""}`;
    if (
      !effectiveEntityContext ||
      processedEntityContextRef.current === contextKey
    ) {
      return;
    }

    processedEntityContextRef.current = contextKey;

    const checkContext = async () => {
      const isJobOrOffer =
        effectiveEntityContext.type === "job" ||
        effectiveEntityContext.type === "offer";

      if (isJobOrOffer) {
        // Inspect loaded messages or cache: only an active message that is NOT deleted for everyone counts
        let activeCardFound = false;
        let messagesLoaded = false;

        if (existingMessages && Array.isArray(existingMessages) && existingMessages.length > 0) {
          messagesLoaded = true;
          activeCardFound = checkHasJobCardInMessages(existingMessages, effectiveEntityContext.id);
        } else if (queryClient) {
          const cached1 = queryClient.getQueryData<any>([
            "messages",
            chatId,
            activeProfileId || "USER",
          ]);
          const cached2 = queryClient.getQueryData<any>(["messages", chatId]);
          const cachedPages = cached1?.pages || cached2?.pages;
          if (cachedPages && Array.isArray(cachedPages) && cachedPages.length > 0) {
            messagesLoaded = true;
            const allCachedMsgs = cachedPages.flat();
            activeCardFound = checkHasJobCardInMessages(allCachedMsgs, effectiveEntityContext.id);
          }
        }

        if (messagesLoaded) {
          if (activeCardFound) {
            markJobContextSent(chatId, effectiveEntityContext.id);
            setPendingEntityContext(null);
            cleanUrlParams();
            return;
          } else {
            // Messages are loaded and NO active job card exists (e.g. previous was deleted for everyone).
            // Reconcile by unmarking sent status so the dashboard can re-attach the context.
            unmarkJobContextSent(chatId, effectiveEntityContext.id);
            setPendingEntityContext(effectiveEntityContext);
            cleanUrlParams();
            return;
          }
        }

        // If messages are not yet loaded, check local session cache as a preliminary guard
        if (isJobContextAlreadySent(chatId, effectiveEntityContext.id)) {
          setPendingEntityContext(null);
          cleanUrlParams();
          return;
        }

        // If conversation exists on backend, check with checkContextSent API
        if (chatId && chatId !== "new") {
          try {
            const res = await checkContextSent(
              String(chatId),
              effectiveEntityContext.id,
              effectiveEntityContext.type
            );
            if (res && res.sent) {
              markJobContextSent(chatId, effectiveEntityContext.id);
              setPendingEntityContext(null);
              cleanUrlParams();
              return;
            }
          } catch (err) {
            console.warn("Failed to check if job context was sent:", err);
          }
        }
      }

      // If context has not been sent yet or was deleted for everyone, attach it
      setPendingEntityContext(effectiveEntityContext);
      cleanUrlParams();
    };

    checkContext();
  }, [
    effectiveEntityContext?.id,
    chatId,
    effectiveEntityContext,
    existingMessages,
    queryClient,
    activeProfileId,
  ]);

  // Reactive listener on existingMessages: automatically clear pendingEntityContext
  // as soon as any active job/offer message is detected in the conversation
  useEffect(() => {
    if (!pendingEntityContext) return;
    if (
      pendingEntityContext.type === "job" ||
      pendingEntityContext.type === "offer"
    ) {
      if (checkHasJobCardInMessages(existingMessages, pendingEntityContext.id)) {
        markJobContextSent(chatId, pendingEntityContext.id);
        setPendingEntityContext(null);
      }
    }
  }, [existingMessages, pendingEntityContext, chatId]);

  return {
    pendingSharedPostId,
    setPendingSharedPostId,
    pendingSharedPost,
    setPendingSharedPost,
    pendingSharedProfileId,
    setPendingSharedProfileId,
    pendingSharedProfile,
    setPendingSharedProfile,
    pendingEntityContext,
    setPendingEntityContext,
  };
}
