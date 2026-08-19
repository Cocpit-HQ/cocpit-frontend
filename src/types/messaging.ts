
// Helper types representing backend responses
export interface BackendChat {
  conversation_id: string;
  is_group: boolean;
  updated_at: string;
  other_user_name: string;
  other_user_avatar?: string;
  other_user_id?: string; // Added optional other_user_id
  other_user_type?: "COMPANY" | "USER";
  other_user_headline?: string;
  org_headline?: string;
  other_user_slug?: string;
  last_message_text: string;
  unread_count: number;
  timeAgo?: string;
  is_blocked_by_me?: boolean;
  is_blocked_by_other?: boolean;
  last_message_at?: string; // Added
  is_deleted_user?: boolean; // Added for deleted user handling
  is_deactivated?: boolean;
  is_requesting?: boolean;
  invitation_id?: string;
  request_source?: string;
  is_read?: boolean;
  is_muted?: boolean;
  muted_until?: string | null;
  is_job_chat?: boolean;
}

export interface BackendMessage {
  message_id: string;
  conversation_id: string;
  sender_id: string;
  text_content: string;
  created_at: string;
  read_at: string | null;
  author_company_id?: string | null; // Added for company messaging
  author_org_id?: string | null;
  sender_name?: string;
  sender_member_name?: string;
  org_headline?: string;
  sender_avatar?: string;
  message_type?: string;
  action_type?: string;
  target_id?: string;
  is_blocked?: boolean; // Blocked status from backend
  is_deleted_for_everyone?: boolean; // Deleted status from backend
  is_deleted_for_me?: boolean;
  replied_is_deleted?: boolean;
  replied_msg_id?: string | null;
  replied_sender_name?: string | null;
  replied_content?: string | null;
  replyMessageId?: string | null;
  replyMessageContent?: string | null;
  reply_message?: {
    message_id: string;
    text_content: string;
    sender_name: string;
    message_type: string;
  } | null;
  shared_post?: {
    post_id: string;
    content: string;
    author?: string | {
      full_name: string;
      avatar_url: string;
      headline?: string;
      display_headline?: string;
    } | null;
    author_name?: string;
    author_avatar?: string;
    authorAvatar?: string;
    author_headline?: string;
    authorHeadline?: string;
    is_organization_post?: boolean;
    isOrganizationPost?: boolean;
    media?: { url: string; media_type: string }[] | null;
    post_type?: string;
    title?: string | null;
    poll?: MessagePoll | null;
  } | null;
  shared_profile?: {
    name: string;
    avatar: string | null;
    headline?: string;
    location?: string;
    industry?: string;
    username?: string;
    slug?: string;
  } | null;
  shared_profile_id?: string;
  shared_profile_type?: "user" | "company";
  shared_post_id?: string;
  entity_type?: "post" | "profile" | "company" | "job" | "event" | "offer" | "channel" | "community" | "article";
  entity_id?: string;
  media?: { url: string; media_type: string; filename?: string | null }[];
  reactions?: {
    user_id: string;
    emoji: string;
    full_name: string;
    avatar: string | null;
    updated_at: string;
  }[];
  active_member_count?: number;
  delivered_count?: number;
  seen_count?: number;
  is_edited?: boolean;
  isEdited?: boolean;
}

// Frontend entity types
export interface ChatThread {
  id: string; // was number
  name: string;
  role?: string;
  orgHeadline?: string;
  lastMessage: string;
  time: string;
  unread: number;
  avatar?: string;
  online: boolean; // Note: Backend response doesn't seem to have online status, might need socket
  pinnedContext?: string;
  otherUserId?: string; // Added to support sending messages to user
  otherUserType?: "COMPANY" | "USER";
  otherUserSlug?: string;
  isGroup?: boolean; // Added for Group Chat
  isBlockedByMe?: boolean;
  isBlockedByOther?: boolean;
  lastMessageAt: string; // ISO string for sorting (was timestamp)
  isDeleted?: boolean; // Frontend flag to filter out
  isDeactivated?: boolean;
  is_requesting?: boolean;
  invitation_id?: string;
  request_source?: string;
  is_read?: boolean;
  is_muted?: boolean;
  muted_until?: string | null;
  jobIds?: string[];
  isJobChat?: boolean;
  isMock?: boolean;
}

export interface Message {
  id: string; // was number | string
  senderId?: string;
  sender: "me" | "other";
  senderName?: string;
  senderMemberName?: string;
  orgHeadline?: string;
  senderAvatar?: string;
  text: string;
  isBlocked?: boolean; // Admin/Block status
  isBlockedByOther?: boolean; // The other user has blocked current user
  read_at: string | null;
  // Compatibility fields for backend objects
  text_content?: string;
  created_at?: string;
  is_edited?: boolean;
  edited_at?: string;

  time: string;
  type?: 'text' | 'system';
  messageType?: string;
  action_type?: string;
  target_id?: string;
  isFirstInGroup?: boolean;
  isLastInGroup?: boolean;
  sharedPost?: {
    id: string;
    content: string;
    author: string;
    authorAvatar?: string | null;
    authorHeadline?: string | null;
    isOrganizationPost?: boolean;
    media?: { url: string; type: 'image' | 'video' }[];
    post_type?: string;
    title?: string | null;
    poll?: MessagePoll | null;
  } | null;
  sharedProfile?: {
    name: string;
    avatar: string | null;
    headline?: string;
    location?: string;
    industry?: string;
    username?: string;
    slug?: string;
  } | null;
  sharedProfileId?: string;
  sharedProfileType?: "user" | "company";
  sharedPostId?: string;
  shared_post_id?: string;
  entityType?: "post" | "profile" | "company" | "job" | "event" | "offer" | "channel" | "community" | "article";
  entityId?: string;
  is_deleted?: boolean;
  is_deleted_for_everyone?: boolean;
  is_deleted_for_me?: boolean;
  replied_msg_id?: string | null;
  repliedMessage?: {
    messageId: string;
    senderName: string;
    content: string;
    isDeleted: boolean;
    mediaType?: 'image' | 'video' | 'document' | string | null;
    mediaName?: string | null;
    mediaUrl?: string | null;
  } | null;
  status?: 'sending' | 'sent' | 'delivered' | 'read';
  media?: { url: string; type: 'image' | 'video' | 'document'; name?: string | null }[];
  reactions?: {
    user_id: string;
    emoji: string;
    full_name: string;
    avatar: string | null;
    updated_at: string;
  }[];
  active_member_count?: number;
  delivered_count?: number;
  seen_count?: number;
  is_unavailable?: boolean;
}

export interface MessagePollOption {
  option_id: string;
  option_text: string;
  vote_count: number;
}

export interface MessagePoll {
  poll_id: string;
  options: MessagePollOption[];
  total_votes: number;
  duration: string;
  user_vote?: string | null;
  is_active?: boolean;
}
