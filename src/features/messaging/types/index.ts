export * from "@/types/messaging";

export interface MessageBubbleProps {
  message: import("@/types/messaging").Message;
  onAction?: (action: string, message: import("@/types/messaging").Message) => void;
  isEditing?: boolean;
  onSaveEdit?: (text: string) => void;
  onCancelEdit?: () => void;
  isSelected?: boolean;
  hasSelection?: boolean;
  onMessageClick?: (message: import("@/types/messaging").Message) => void;
  showSenderName?: boolean;
  isGroup?: boolean;
  showAvatar?: boolean;
  showTime?: boolean;
  isOpponentOnline?: boolean;
  onMediaClick?: (
    url: string,
    type: "image" | "video" | "document",
    name?: string,
  ) => void;
  onMediaLoad?: () => void;
  onReply?: (message: import("@/types/messaging").Message) => void;
  onReplyClick?: (messageId: string) => void;
  isHighlighted?: boolean;
  onReaction?: (message: import("@/types/messaging").Message, emoji: string) => void;
  currentUserId?: string;
  conversationId?: string;
  otherUserType?: "COMPANY" | "USER";
  otherUserSlug?: string;
  chatAvatar?: string;
  statusLabel?: 'Seen' | 'Delivered' | null;
  isRequesting?: boolean;
  isPinned?: boolean;
  groupMembers?: any[];
}

