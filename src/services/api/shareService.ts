/**
 * Universal Share Service
 *
 * Central API service for the Universal Share Architecture.
 * Replaces entity-specific share calls with a single unified API.
 */

import api from "@/lib/axios";

// ─── Types ──────────────────────────────────────────────────

export type EntityType = "post" | "profile" | "company" | "job" | "event";
export type ShareMethod = "message" | "notification" | "copy_link";

export interface UniversalSharePayload {
    entityType: EntityType;
    entityId: string;
    shareMethod: ShareMethod;
    targetId?: string;
    targetType?: "user" | "company";
    message?: string;
    senderCompanyId?: string;
}

export interface ShareResult {
    success: boolean;
    message: string;
    conversationId?: string;
    url?: string;
    messageData?: Record<string, unknown>;
}

export interface EntityPreview {
    entityType: EntityType;
    entityId: string;
    title: string;
    subtitle: string;
    image: string | null;
    url: string;
}

export interface EntityPreviewRequest {
    type: EntityType;
    id: string;
}

// ─── API Functions ──────────────────────────────────────────

/**
 * Universal share — routes to message, notification, or copy_link
 */
export const universalShare = async (payload: UniversalSharePayload): Promise<ShareResult> => {
    const { senderCompanyId, ...rest } = payload;
    void senderCompanyId;
    const { data } = await api.post("/share", rest);
    return data;
};

/**
 * Fetch lightweight entity preview metadata.
 * Flow: API → Redis cache → DB
 */
export const fetchEntityPreview = async (
    entityType: EntityType,
    entityId: string
): Promise<EntityPreview> => {
    const { data } = await api.get(`/entity/preview/${entityType}/${entityId}`);
    return data;
};

/**
 * Fetch multiple entity previews in batch.
 */
export const fetchEntityPreviewsBatch = async (
    requests: EntityPreviewRequest[]
): Promise<EntityPreview[]> => {
    const { data } = await api.post("/entity/preview/batch", requests);
    return data;
};

/**
 * Generate entity URL on the client side (no API call needed).
 */
export const generateEntityUrl = (entityType: EntityType, entityId: string): string => {
    const patterns: Record<EntityType, string> = {
        post: `/post/${entityId}`,
        profile: `/profile/${entityId}`,
        company: `/company/${entityId}`,
        job: `/jobs/${entityId}`,
        event: `/events/${entityId}`,
    };
    return patterns[entityType] || `/${entityType}/${entityId}`;
};

// ─── Share to Feed (Repost) ─────────────────────────────────

export interface ShareToFeedPayload {
    postId: string;
    content?: string;
    category?: string;
    visibility?: string;
    companyId?: string;
}

/**
 * Share a post to feed (repost).
 * Delegates to createPost with shared_post_id.
 */
export const shareToFeed = async (payload: ShareToFeedPayload) => {
    const { companyId, ...rest } = payload;
    void companyId;
    const { data } = await api.post("/share/feed", rest);
    return data;
};

// ─── Share to Story ─────────────────────────────────────────

export interface ShareToStoryPayload {
    postId: string;
    title?: string;
    description?: string;
    media_url: string;
    media_type?: string;
    public_id?: string;
    story_metadata?: Record<string, unknown>;
}

/**
 * Share a post to story.
 * Delegates to createStory with shared_post_id.
 */
export const shareToStory = async (payload: ShareToStoryPayload) => {
    const { data } = await api.post("/share/story", payload);
    return data;
};

