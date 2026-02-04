
// Helper types representing backend responses
export interface BackendChat {
  conversation_id: string;
  is_group: boolean;
  updated_at: string;
  other_user_name: string;
  other_user_avatar: string;
  other_user_id?: string; // Added optional other_user_id
  other_user_headline?: string;
  last_message_text: string;
  unread_count: number;
  timeAgo?: string;
}

export interface BackendMessage {
  message_id: string;
  conversation_id: string;
  sender_id: string;
  text_content: string;
  created_at: string;
  read_at: string | null;
  sender_name?: string;
  sender_avatar?: string;
  message_type?: string;
  action_type?: string;
  target_id?: string;
  shared_post?: {
    post_id: string;
    content: string;
    author: {
      full_name: string;
      avatar_url: string;
    };
    media: { url: string; media_type: string }[];
  } | null;
}

// Frontend entity types
export interface ChatThread {
  id: string; // was number
  name: string;
  role?: string;
  lastMessage: string;
  time: string;
  unread: number;
  avatar: string;
  online: boolean; // Note: Backend response doesn't seem to have online status, might need socket
  pinnedContext?: string;
  otherUserId?: string; // Added to support sending messages to user
  isGroup?: boolean; // Added for Group Chat
}

export interface Message {
  id: string; // was number | string
  senderId?: string;
  sender: "me" | "other";
  senderName?: string;
  senderAvatar?: string;
  text: string;
  // Compatibility fields for backend objects
  text_content?: string;
  created_at?: string;

  time: string;
  type?: 'text' | 'system';
  action_type?: string;
  target_id?: string;
  isFirstInGroup?: boolean;
  isLastInGroup?: boolean;
  sharedPost?: {
    id: string;
    content: string;
    author: string;
    authorAvatar: string;
    media?: { url: string; type: 'image' | 'video' }[];
  } | null;
}
