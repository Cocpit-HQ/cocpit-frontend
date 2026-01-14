export interface ChatThread {
  id: number;
  name: string;
  role?: string; // e.g., "Recruiter", "Hiring Manager", "Connection"
  lastMessage: string;
  time: string;
  unread: number;
  avatar: string;
  online: boolean;
  pinnedContext?: string; // e.g., "Software Engineer Role Application"
}

export interface Message {
  id: number | string;
  sender: "me" | "other";
  text: string;
  time: string;
  isFirstInGroup?: boolean; // For visual grouping
  isLastInGroup?: boolean;  // For visual grouping
}
