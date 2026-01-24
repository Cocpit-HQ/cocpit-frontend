
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
}

export interface Message {
  id: string; // was number | string
  sender: "me" | "other";
  text: string;
  time: string;
  isFirstInGroup?: boolean;
  isLastInGroup?: boolean;
}
