export interface UserStatusPayload {
  userId: string;
  status: 'online' | 'offline';
}

export interface NotificationPayload {
  type: 'message' | 'system';
  from?: string; // Sender User ID
  senderName?: string;
  senderAvatar?: string;
  conversationId?: string;
}

export interface ErrorPayload {
  message: string;
}

// --- Chat / Conversation Types ---

export interface SocketMessage {
  message_id: string;
  conversation_id: string;
  sender_id: string;
  text_content: string;
  created_at: string; // ISO Date string
  read_at: string | null;
  shared_post?: {
    post_id: string;
    content: string;
    created_at: string;
    author: {
      full_name: string;
      avatar_url: string;
    };
    media: { url: string; media_type: string }[];
  } | null;
}

export interface TypingPayload {
  conversationId: string;
  senderId?: string; // Present in server->client event
}

export interface MessageReadPayload {
  conversationId: string;
  readerId: string;
  messageIds: string[]; // List of message IDs marked as read
}

export interface MessageDeletedPayload {
  messageId: string;
  conversationId: string;
}

export interface NotificationReadPayload {
  notificationId: string;
}
