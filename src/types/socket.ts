export interface UserStatusPayload {
  userId: string;
  status: 'online' | 'offline';
}

export interface NotificationPayload {
  type: 'message' | 'system' | 'company_job' | 'company_event' | 'company_post' | 'company_announcement' | 'post_tag';
  from?: string; // Sender User ID
  senderName?: string;
  senderAvatar?: string;
  conversationId?: string;
  isGroup?: boolean;
  // Company notification fields
  actor_name?: string;
  actor_avatar?: string;
  actor_slug?: string;
  text?: string;
  reference_id?: string;
  referenceId?: string;
  metadata?: {
    post_id?: string;
    [key: string]: unknown;
  };
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
  author_company_id?: string | null; // Added
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
  isGroup?: boolean;
  username?: string;
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
