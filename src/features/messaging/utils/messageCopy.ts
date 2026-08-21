import { Message } from "@/types/messaging";

/**
 * Resolves the appropriate text/URL to copy to clipboard for a message.
 * - Shared Posts / Articles -> ${origin}/post/${postId}
 * - Shared Profiles / Organizations -> ${origin}/profile/${profileId} or /organization/${slug}
 * - Shared Jobs -> ${origin}/jobs/${jobId}
 * - Text Messages -> message.text || message.text_content
 */
export function getMessageCopyText(targetMsg?: Message | null): string {
  if (!targetMsg) return "";

  const origin = typeof window !== "undefined" ? window.location.origin : "";

  // 1. Shared Post or Article
  if (
    targetMsg.sharedPost?.id ||
    targetMsg.sharedPostId ||
    (targetMsg as any)?.shared_post_id ||
    ((targetMsg.entityType === "post" || targetMsg.entityType === "article") && targetMsg.entityId)
  ) {
    const postId =
      targetMsg.sharedPost?.id ||
      targetMsg.sharedPostId ||
      (targetMsg as any)?.shared_post_id ||
      targetMsg.entityId;
    return `${origin}/post/${postId}`;
  }

  // 2. Shared Profile or Company / Organization
  if (
    targetMsg.sharedProfileId ||
    targetMsg.sharedProfile?.username ||
    targetMsg.sharedProfile?.slug ||
    (targetMsg.sharedProfile as any)?.id ||
    (targetMsg.sharedProfile as any)?.user_id ||
    ((targetMsg.entityType === "profile" || targetMsg.entityType === "company") && targetMsg.entityId)
  ) {
    const profileId =
      targetMsg.sharedProfileId ||
      targetMsg.sharedProfile?.username ||
      targetMsg.sharedProfile?.slug ||
      (targetMsg.sharedProfile as any)?.id ||
      (targetMsg.sharedProfile as any)?.user_id ||
      targetMsg.entityId;

    const isCompany =
      targetMsg.sharedProfileType === "company" ||
      targetMsg.entityType === "company" ||
      (targetMsg.sharedProfile as any)?.type === "COMPANY" ||
      Boolean(targetMsg.sharedProfile?.slug);

    return `${origin}/${isCompany ? "organization" : "profile"}/${profileId}`;
  }

  // 3. Shared Job
  if (
    (targetMsg.entityType === "job" || targetMsg.entityType === "offer") &&
    targetMsg.entityId
  ) {
    return `${origin}/jobs/${targetMsg.entityId}`;
  }

  // 4. Default plain text
  return targetMsg.text || targetMsg.text_content || "";
}
