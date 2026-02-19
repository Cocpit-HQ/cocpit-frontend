
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
  is_blocked_by_me?: boolean;
  is_blocked_by_other?: boolean;
  last_message_at?: string; // Added
  is_deleted_user?: boolean; // Added for deleted user handling
}

export interface BackendMessage {
  message_id: string;
  conversation_id: string;
  sender_id: string;
  text_content: string;
  created_at: string;
  read_at: string | null;
  author_company_id?: string | null; // Added for company messaging
  sender_name?: string;
  sender_avatar?: string;
  message_type?: string;
  action_type?: string;
  target_id?: string;
  is_blocked?: boolean; // Blocked status from backend
  is_deleted_for_everyone?: boolean; // Deleted status from backend
  is_deleted_for_me?: boolean;
  shared_post?: {
    post_id: string;
    content: string;
    author: {
      full_name: string;
      avatar_url: string;
    };
    media: { url: string; media_type: string }[];
  } | null;
  media?: { url: string; media_type: string }[];
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
  isBlockedByMe?: boolean;
  isBlockedByOther?: boolean;
  lastMessageAt: string; // ISO string for sorting (was timestamp)
  isDeleted?: boolean; // Frontend flag to filter out
  // Session indicator fields (company mode)
  sessionStatus?: 'mine' | 'other' | 'unclaimed' | null
  sessionHandlerName?: string
}

export interface Message {
  id: string; // was number | string
  senderId?: string;
  sender: "me" | "other";
  senderName?: string;
  senderAvatar?: string;
  text: string;
  isBlocked?: boolean; // Admin/Block status
  read_at: string | null;
  // Compatibility fields for backend objects
  text_content?: string;
  created_at?: string;
  is_edited?: boolean;
  edited_at?: string;

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
  is_deleted?: boolean;
  is_deleted_for_everyone?: boolean;
  is_deleted_for_me?: boolean;
  status?: 'sending' | 'sent' | 'delivered' | 'read';
  media?: { url: string; type: 'image' | 'video' | 'document' }[];
}
