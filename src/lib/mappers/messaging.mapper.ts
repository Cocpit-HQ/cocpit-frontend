import { BackendChat, BackendMessage, ChatThread, Message } from "@/types/messaging";
import { UserStatusPayload } from "@/types/socket"; // We might need this later if we map status

// Helper to format time (simplified)
export const formatTime = (isoString: string): string => {
  const date = new Date(isoString);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

export const formatTimeAgo = (isoString: string): string => {
  if (!isoString) return '';
  const date = new Date(isoString);
  const now = new Date();

  // Check if it's today
  const isToday = date.getDate() === now.getDate() &&
                  date.getMonth() === now.getMonth() &&
                  date.getFullYear() === now.getFullYear();

  if (isToday) {
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  }

  // Check if it's yesterday
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday = date.getDate() === yesterday.getDate() &&
                      date.getMonth() === yesterday.getMonth() &&
                      date.getFullYear() === yesterday.getFullYear();

  if (isYesterday) {
    return 'Yesterday';
  }

  // Calculate difference in days (ignoring time of day)
  const dateAtMidnight = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const nowAtMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diffDays = Math.floor((nowAtMidnight.getTime() - dateAtMidnight.getTime()) / (1000 * 60 * 60 * 24));

  // Within the last 6 days (meaning it falls on a distinct day of the week)
  if (diffDays > 1 && diffDays < 7) {
    return date.toLocaleDateString('en-US', { weekday: 'long' }); // 'Monday', 'Tuesday', etc.
  }

  // Older than a week, format as dd/mm/yyyy (en-GB uses this format natively)
  return date.toLocaleDateString('en-GB');
};

export const isPostUrl = (text?: string): boolean => {
  if (!text) return false;
  const postUrlRegex = /(?:https?:\/\/[^\/\s]+)?\/post\/([a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12})/i;
  return postUrlRegex.test(text.trim());
};

export const mapBackendChatToChatThread = (backendChat: BackendChat): ChatThread => {
  if (!backendChat.other_user_id && !backendChat.is_group) {
    console.warn(`Conversation ${backendChat.conversation_id} is missing 'other_user_id'. This conversation might not support direct messaging.`);
  }
  return {
    id: backendChat.conversation_id,
    name: backendChat.other_user_name || "Deleted User",
    role: backendChat.other_user_headline || "",
    lastMessage: isPostUrl(backendChat.last_message_text) ? "Shared a post" : backendChat.last_message_text,
    time: (backendChat.last_message_at || backendChat.updated_at) 
      ? formatTimeAgo(backendChat.last_message_at || backendChat.updated_at) 
      : (backendChat.timeAgo || ""),
    unread: backendChat.unread_count,
    avatar: backendChat.other_user_avatar || "gradient-1", // Use the URL if present, or fallback to a gradient default
    online: false, // Default to false, updated via socket
    pinnedContext: undefined,
    otherUserId: backendChat.other_user_id, // Map other_user_id
    otherUserType: backendChat.other_user_type, // Map other_user_type
    otherUserSlug: backendChat.other_user_slug, // Map other_user_slug
    isGroup: backendChat.is_group,
    isBlockedByMe: backendChat.is_blocked_by_me || false,
    isBlockedByOther: backendChat.is_blocked_by_other || false,
    lastMessageAt: backendChat.last_message_at || backendChat.updated_at || new Date().toISOString(),
    isDeleted: backendChat.is_deleted_user || false,
    is_requesting: backendChat.is_requesting || false,
    invitation_id: backendChat.invitation_id,
    request_source: backendChat.request_source,
    is_read: backendChat.is_read || false,
    is_muted: backendChat.is_muted || false,
    muted_until: backendChat.muted_until || null,
  };
};

export const mapBackendMessageToMessage = (backendMessage: BackendMessage, currentUserId?: string, currentCompanyId?: string): Message => {
  const isMe = (currentUserId && String(backendMessage.sender_id) === String(currentUserId)) ||
    (currentCompanyId && backendMessage.author_company_id === currentCompanyId);
  const isDeletedUser = backendMessage.sender_id === null;

  return {
    id: backendMessage.message_id,
    senderId: backendMessage.sender_id,
    sender: isMe ? "me" : "other",
    senderName: isDeletedUser ? "Deleted User" : (backendMessage.sender_name || "Unknown"),
    senderAvatar: backendMessage.sender_avatar,
    text: backendMessage.text_content,
    time: formatTime(backendMessage.created_at),
    type: (backendMessage.message_type === 'system' || (backendMessage as any).type === 'system' || (backendMessage as any).is_system || backendMessage.action_type) ? 'system' : 'text',
    sharedPost: backendMessage.shared_post ? {
      id: backendMessage.shared_post.post_id,
      content: backendMessage.shared_post.content,
      author: backendMessage.shared_post.author.full_name,
      authorAvatar: backendMessage.shared_post.author.avatar_url,
      media: backendMessage.shared_post.media?.map(m => ({ url: m.url, type: m.media_type as 'image' | 'video' }))
    } : null,
    action_type: backendMessage.action_type,
    target_id: backendMessage.target_id,
    isBlocked: backendMessage.is_blocked || false,
    read_at: backendMessage.read_at,
    is_deleted_for_everyone: backendMessage.is_deleted_for_everyone || false,
    is_deleted_for_me: backendMessage.is_deleted_for_me || false,
    status: backendMessage.read_at ? 'read' : 'sent',
    media: backendMessage.media?.map(m => ({ url: m.url, type: m.media_type as 'image' | 'video' | 'document' })),
    sharedProfile: backendMessage.shared_profile || null,
    sharedProfileId: backendMessage.shared_profile_id || undefined,
    sharedProfileType: backendMessage.shared_profile_type || undefined,
    entityType: backendMessage.entity_type || undefined,
    entityId: backendMessage.entity_id || undefined,
    replied_msg_id: backendMessage.reply_message?.message_id || backendMessage.replied_msg_id || backendMessage.replyMessageId || null,
    repliedMessage: (backendMessage.reply_message || backendMessage.replied_msg_id || backendMessage.replyMessageId) ? {
      messageId: backendMessage.reply_message?.message_id || backendMessage.replied_msg_id || backendMessage.replyMessageId!,
      senderName: backendMessage.reply_message?.sender_name || backendMessage.replied_sender_name || "",
      content: backendMessage.reply_message?.text_content || backendMessage.replyMessageContent || backendMessage.replied_content || "",
      isDeleted: backendMessage.replied_is_deleted || false
    } : null,
    created_at: backendMessage.created_at,
    reactions: backendMessage.reactions || [],
    active_member_count: backendMessage.active_member_count,
    delivered_count: backendMessage.delivered_count,
    seen_count: backendMessage.seen_count,
  };
};
