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
  if (!backendChat.other_user_id) {
    console.warn(`Conversation ${backendChat.conversation_id} is missing 'other_user_id'. This conversation might not support direct messaging.`);
  }
  return {
    id: backendChat.conversation_id,
    name: backendChat.other_user_name,
    role: "", // Not provided by backend yet
    lastMessage: backendChat.last_message_text,
    time: backendChat.timeAgo || formatTimeAgo(backendChat.updated_at),
    unread: backendChat.unread_count,
    avatar: backendChat.other_user_avatar || "default-avatar", // Handle missing avatar
    online: false, // Default to false, updated via socket
    pinnedContext: undefined,
    otherUserId: backendChat.other_user_id, // Map other_user_id
  };
};

export const mapBackendMessageToMessage = (backendMessage: BackendMessage, currentUserId?: string): Message => {
  return {
    id: backendMessage.message_id,
    sender: backendMessage.sender_id === currentUserId ? "me" : "other",
    text: backendMessage.text_content,
    time: formatTime(backendMessage.created_at),
  };
};
