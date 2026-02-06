import { BackendChat, BackendMessage, ChatThread, Message } from "@/types/messaging";
import { UserStatusPayload } from "@/types/socket"; // We might need this later if we map status

// Helper to format time (simplified)
const formatTime = (isoString: string): string => {
  const date = new Date(isoString);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

// Helper to calculate relative time (simplified)
const formatTimeAgo = (isoString: string): string => {
  const date = new Date(isoString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  return `${Math.floor(diffInSeconds / 86400)}d ago`;
};

export const mapBackendChatToChatThread = (backendChat: BackendChat): ChatThread => {
  if (!backendChat.other_user_id && !backendChat.is_group) {
    console.warn(`Conversation ${backendChat.conversation_id} is missing 'other_user_id'. This conversation might not support direct messaging.`);
  }
  return {
    id: backendChat.conversation_id,
    name: backendChat.other_user_name || "Deleted User",
    role: backendChat.other_user_headline || "",
    lastMessage: backendChat.last_message_text,
    time: backendChat.timeAgo || formatTimeAgo(backendChat.last_message_at || backendChat.updated_at),
    unread: backendChat.unread_count,
    avatar: backendChat.other_user_avatar || "gradient-1", // Use the URL if present, or fallback to a gradient default
    online: false, // Default to false, updated via socket
    pinnedContext: undefined,
    otherUserId: backendChat.other_user_id, // Map other_user_id
    isGroup: backendChat.is_group,
    isBlockedByMe: backendChat.is_blocked_by_me || false,
    isBlockedByOther: backendChat.is_blocked_by_other || false,
    lastMessageAt: backendChat.last_message_at || backendChat.updated_at || new Date().toISOString(),
  };
};

export const mapBackendMessageToMessage = (backendMessage: BackendMessage, currentUserId?: string): Message => {
  const isMe = currentUserId && String(backendMessage.sender_id) === String(currentUserId);
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
  };
};
