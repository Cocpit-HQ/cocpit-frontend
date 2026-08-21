import { BackendChat, BackendMessage, ChatThread, Message } from "@/types/messaging";
import { UserStatusPayload } from "@/types/socket"; // We might need this later if we map status

// Helper to format time (simplified)
export const formatTime = (isoString?: string): string => {
  if (!isoString) return '';
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return isoString;
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

export const formatTimeAgo = (isoString: string): string => {
  if (!isoString) return '';
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return isoString;

  const now = new Date();
  const diffMs = Math.max(0, now.getTime() - date.getTime());
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

  if (diffMinutes < 60) {
    return "Just now";
  }

  if (diffHours < 24) {
    return `${diffHours} hour${diffHours > 1 ? 's' : ''}`;
  }

  const dateAtMidnight = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const nowAtMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diffDays = Math.floor((nowAtMidnight.getTime() - dateAtMidnight.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays <= 7) {
    return `${Math.max(1, diffDays)} day${diffDays > 1 ? 's' : ''}`;
  }

  const diffWeeks = Math.floor(diffDays / 7);
  return `${Math.max(1, diffWeeks)} week${diffWeeks > 1 ? 's' : ''}`;
};

export const isPostUrl = (text?: string): boolean => {
  if (!text) return false;
  const postUrlRegex = /(?:https?:\/\/[^\/\s]+)?\/post\/([a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12})/i;
  return postUrlRegex.test(text.trim());
};

export const isJobUrl = (text?: string): boolean => {
  if (!text) return false;
  const jobUrlRegex = /^(?:https?:\/\/[^\s]+)?\/jobs\/[a-zA-Z0-9-]+(?:\?[^\s]*)?$/i;
  return jobUrlRegex.test(text.trim());
};

export const isProfileUrl = (text?: string): boolean => {
  if (!text) return false;
  const profileUrlRegex = /(?:https?:\/\/[^\s]+)?\/(?:profile|organization|messaging)\b/i;
  return profileUrlRegex.test(text.trim());
};

export const mapBackendChatToChatThread = (backendChat: BackendChat): ChatThread => {
  if (!backendChat.other_user_id && !backendChat.is_group) {
    console.warn(`Conversation ${backendChat.conversation_id} is missing 'other_user_id'. This conversation might not support direct messaging.`);
  }
  const unreadRaw = typeof backendChat.unread_count === 'number'
    ? backendChat.unread_count
    : (typeof (backendChat as any).unread === 'number' ? (backendChat as any).unread : undefined);

  const isUnreadFlag = backendChat.is_read === false || (backendChat as any).isRead === false;

  const calculatedUnread = unreadRaw !== undefined 
    ? unreadRaw 
    : (isUnreadFlag ? 1 : 0);

  const finalUnread = isUnreadFlag ? Math.max(1, calculatedUnread) : calculatedUnread;

  const isCompany = backendChat.other_user_type === 'COMPANY';
  const fallbackName = isCompany ? "Unknown Page" : "Unknown User";

  const isBlocked = Boolean(backendChat.is_blocked_by_other);
  const isDeleted = Boolean(
    backendChat.is_deleted_user ||
    backendChat.other_user_name === "Deleted User" ||
    backendChat.other_user_name === "Deleted Page" ||
    backendChat.other_user_name === "Deactivated User" ||
    backendChat.other_user_headline === "This account has been deactivated"
  );
  const isDeactivated = !isDeleted && Boolean(
    backendChat.is_deactivated ||
    backendChat.other_user_headline === "This user has gone offline - for a while." ||
    backendChat.other_user_headline === "This page has gone offline - for a while." ||
    backendChat.org_headline === "This page has been deactivated" ||
    backendChat.org_headline === "This page has gone offline - for a while."
  );

  const isUnknown = isBlocked || isDeactivated || isDeleted ||
    backendChat.other_user_name === "Unknown User" ||
    backendChat.other_user_name === "Unknown user" ||
    backendChat.other_user_name === "Unknown Page" ||
    backendChat.other_user_headline === "User unavailable" ||
    backendChat.other_user_headline === "Page unavailable";

  const finalName = backendChat.is_group 
    ? (backendChat.other_user_name || "Group")
    : (isUnknown ? fallbackName : (backendChat.other_user_name || fallbackName));

  return {
    id: backendChat.conversation_id,
    name: finalName,
    role: !backendChat.is_group && isUnknown 
      ? (isCompany ? "Page unavailable" : "User unavailable") 
      : (backendChat.other_user_headline || (backendChat as any).group_headline || (backendChat as any).left_group_headline || ""),
    orgHeadline: !backendChat.is_group && isUnknown 
      ? "Page unavailable" 
      : (backendChat.org_headline || ""),
    lastMessage: (backendChat.last_message_text === 'Message unavailable' || (backendChat as any).is_unavailable)
      ? 'Message unavailable'
      : isPostUrl(backendChat.last_message_text)
      ? "Shared a post"
      : isJobUrl(backendChat.last_message_text)
      ? "Shared a job"
      : isProfileUrl(backendChat.last_message_text)
      ? "Shared a profile"
      : backendChat.last_message_text,
    time: (backendChat.last_message_at || backendChat.updated_at) 
      ? formatTimeAgo(backendChat.last_message_at || backendChat.updated_at) 
      : (backendChat.timeAgo || ""),
    unread: finalUnread,
    avatar: (isUnknown || !backendChat.other_user_avatar) ? undefined : backendChat.other_user_avatar,
    online: false, // Default to false, updated via socket
    pinnedContext: undefined,
    otherUserId: backendChat.other_user_id, // Map other_user_id
    otherUserType: backendChat.other_user_type, // Map other_user_type
    otherUserSlug: backendChat.other_user_slug, // Map other_user_slug
    isGroup: backendChat.is_group,
    isBlockedByMe: backendChat.is_blocked_by_me || false,
    isBlockedByOther: backendChat.is_blocked_by_other || false,
    lastMessageAt: backendChat.last_message_at || backendChat.updated_at || new Date().toISOString(),
    isDeleted: isDeleted,
    isDeactivated: isDeactivated,
    is_requesting: backendChat.is_requesting || false,
    invitation_id: backendChat.invitation_id,
    request_source: backendChat.request_source,
    is_read: backendChat.is_read ?? true,
    is_muted: backendChat.is_muted || false,
    muted_until: backendChat.muted_until || null,
    isJobChat: backendChat.is_job_chat || false,
  };
};

export const getNormalizedMediaType = (
  mediaType?: string,
  filename?: string | null,
  url?: string
): 'image' | 'video' | 'document' => {
  const mt = (mediaType || '').toLowerCase();
  const nameOrUrl = (filename || url || '').toLowerCase();

  if (
    mt === 'document' ||
    mt === 'file' ||
    mt.startsWith('application/') ||
    /\.(doc|docx|pdf|xls|xlsx|ppt|pptx|txt|csv|zip|rar)$/i.test(nameOrUrl)
  ) {
    return 'document';
  }
  if (
    mt === 'video' ||
    mt.startsWith('video/') ||
    /\.(mp4|webm|ogg|mov|avi|mkv)$/i.test(nameOrUrl)
  ) {
    return 'video';
  }
  return 'image';
};

export const mapBackendMessageToMessage = (
  backendMessage: BackendMessage,
  currentUserId?: string,
  companyId?: string
): Message => {
  const authorOrgId = backendMessage.author_org_id || backendMessage.author_company_id;
  const isOrgMessage = Boolean(authorOrgId);
  const messageSenderId = isOrgMessage
    ? authorOrgId
    : (backendMessage.sender_id || (backendMessage as any).senderId);

  let isMe = false;
  if (companyId) {
    // Current active profile is COMPANY context (activeProfile.type === "COMPANY")
    isMe = isOrgMessage && Boolean(messageSenderId && String(messageSenderId) === String(companyId));
  } else if (currentUserId) {
    // Current active profile is USER context (activeProfile.type !== "COMPANY")
    isMe = !isOrgMessage && Boolean(messageSenderId && String(messageSenderId) === String(currentUserId));
  }

  return {
    id: backendMessage.message_id,
    senderId: backendMessage.sender_id,
    sender: isMe ? "me" : "other",
    senderName: backendMessage.sender_name || "Unknown",
    senderMemberName: backendMessage.sender_member_name || undefined,
    orgHeadline: backendMessage.org_headline || "",
    senderAvatar: backendMessage.sender_avatar,
    text: backendMessage.text_content || "",
    time: formatTime(backendMessage.created_at),
    messageType: backendMessage.message_type,
    type: (backendMessage.message_type === 'system' || (backendMessage as any).type === 'system' || (backendMessage as any).is_system || backendMessage.action_type) ? 'system' : 'text',
    sharedPost: backendMessage.shared_post ? {
      id: backendMessage.shared_post.post_id,
      content: backendMessage.shared_post.content,
      author: typeof backendMessage.shared_post.author === 'object' && backendMessage.shared_post.author
        ? backendMessage.shared_post.author.full_name
        : (backendMessage.shared_post.author || backendMessage.shared_post.author_name || "Unknown"),
      authorAvatar: typeof backendMessage.shared_post.author === 'object' && backendMessage.shared_post.author
        ? backendMessage.shared_post.author.avatar_url
        : (backendMessage.shared_post.author_avatar || backendMessage.shared_post.authorAvatar || null),
      authorHeadline: typeof backendMessage.shared_post.author === 'object' && backendMessage.shared_post.author
        ? (backendMessage.shared_post.author.headline || backendMessage.shared_post.author.display_headline || null)
        : (backendMessage.shared_post.author_headline || backendMessage.shared_post.authorHeadline || null),
      isOrganizationPost: backendMessage.shared_post.is_organization_post || backendMessage.shared_post.isOrganizationPost || false,
      media: backendMessage.shared_post.media?.map(m => ({ url: m.url, type: m.media_type as 'image' | 'video' })),
      post_type: backendMessage.shared_post.post_type,
      title: backendMessage.shared_post.title,
      poll: backendMessage.shared_post.poll
    } : null,
    action_type: backendMessage.action_type,
    target_id: backendMessage.target_id,
    isBlocked: backendMessage.is_blocked || false,
    read_at: backendMessage.read_at,
    is_deleted_for_everyone: backendMessage.is_deleted_for_everyone || false,
    is_deleted_for_me: backendMessage.is_deleted_for_me || false,
    status: backendMessage.read_at ? 'read' : 'sent',
    media: backendMessage.is_deleted_for_everyone ? [] : backendMessage.media?.map(m => ({
      url: m.url,
      type: getNormalizedMediaType(m.media_type, m.filename, m.url),
      name: m.filename
    })),
    sharedProfile: backendMessage.is_deleted_for_everyone ? null : (backendMessage.shared_profile || null),
    sharedProfileId: backendMessage.is_deleted_for_everyone ? undefined : (backendMessage.shared_profile_id || undefined),
    sharedProfileType: backendMessage.is_deleted_for_everyone ? undefined : (backendMessage.shared_profile_type || undefined),
    sharedPostId: backendMessage.is_deleted_for_everyone ? undefined : (backendMessage.shared_post_id || undefined),
    shared_post_id: backendMessage.is_deleted_for_everyone ? undefined : (backendMessage.shared_post_id || undefined),
    entityType: backendMessage.is_deleted_for_everyone ? undefined : (backendMessage.entity_type || undefined),
    entityId: backendMessage.is_deleted_for_everyone ? undefined : (backendMessage.entity_id || undefined),
    replied_msg_id: backendMessage.reply_message?.message_id || backendMessage.replied_msg_id || backendMessage.replyMessageId || null,
    repliedMessage: (backendMessage.reply_message || backendMessage.replied_msg_id || backendMessage.replyMessageId) ? {
      messageId: backendMessage.reply_message?.message_id || backendMessage.replied_msg_id || backendMessage.replyMessageId!,
      senderName: backendMessage.reply_message?.sender_name || backendMessage.replied_sender_name || "",
      content: backendMessage.reply_message?.text_content || backendMessage.replyMessageContent || backendMessage.replied_content || "",
      isDeleted: backendMessage.replied_is_deleted || false,
      mediaType: (backendMessage.reply_message as any)?.media?.[0]?.media_type || (backendMessage.reply_message as any)?.media_type || (backendMessage.reply_message as any)?.message_type || (backendMessage.reply_message as any)?.type || null,
      mediaName: (backendMessage.reply_message as any)?.media?.[0]?.filename || (backendMessage.reply_message as any)?.filename || (backendMessage.reply_message as any)?.media_name || null,
      mediaUrl: (backendMessage.reply_message as any)?.media?.[0]?.url || (backendMessage.reply_message as any)?.media_url || null,
    } : null,
    created_at: backendMessage.created_at,
    reactions: backendMessage.reactions || [],
    active_member_count: backendMessage.active_member_count,
    delivered_count: backendMessage.delivered_count,
    seen_count: backendMessage.seen_count,
    is_unavailable: (backendMessage as any).is_unavailable === true,
    is_edited: backendMessage.is_edited === true || (backendMessage as any).isEdited === true,
  };
};
