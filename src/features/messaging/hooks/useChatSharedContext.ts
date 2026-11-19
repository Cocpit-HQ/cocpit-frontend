"use client";

import { useState, useEffect, useRef } from "react";
import { ReadonlyURLSearchParams } from "next/navigation";
import type { Post } from "@/types/entities";

interface UseChatSharedContextProps {
  chatId: string | number;
  initialEntityContext?: { type: "job" | "offer" | "event"; id: string };
  searchParams?: ReadonlyURLSearchParams | null;
}

export function useChatSharedContext({
  chatId,
  initialEntityContext,
  searchParams,
}: UseChatSharedContextProps) {
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

  // Check and sync entity context
  useEffect(() => {
    const contextKey = `${chatId}:${initialEntityContext?.id}`;
    if (
      !initialEntityContext ||
      processedEntityContextRef.current === contextKey
    ) {
      return;
    }

    processedEntityContextRef.current = contextKey;

    const checkContext = async () => {
      // Whenever an explicit initialEntityContext is provided (e.g. from Job Applicants or Offer Screen),
      // always activate the pending context so the user can send it with their message.
      setPendingEntityContext(initialEntityContext);

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

    checkContext();
  }, [initialEntityContext?.id, chatId, initialEntityContext]);

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
