import type { AIMessage } from "../types/ai.types";

export interface ProjectChat {
  id: string;
  title: string;
  lastMessageTime: string;
  isPinned: boolean;
  projectId: string;
  messages: AIMessage[];
}

export interface ProjectMember {
  id: string;
  name: string;
  email: string;
  role: string;
  avatarUrl?: string;
}

export interface ProjectConversation {
  id: string;
  title: string;
  lastMessageAt: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  conversations?: ProjectConversation[];
  members?: ProjectMember[];
  conversationCount?: number;
  memberCount?: number;
  chats?: ProjectChat[];
  instructions?: string;
  pinned?: boolean;
  pinnedAt?: string;
  displayChatsCount?: number;
  displayUpdatedTime?: string;
}

export interface ProjectHeaderProps {
  onClose?: () => void;
  title?: string;
  icon?: string;
  variant?: "default" | "details";
}

export interface ProjectEmptyStateProps {
  onNewProjectClick?: () => void;
  title?: string;
  description?: string;
  icon?: string;
  buttonText?: string;
  buttonIcon?: string;
}

export interface ProjectScreenProps {
  onClose?: () => void;
  onNewProjectClick?: () => void;
  projects?: Project[];
  onUpdateProjects?: (projects: Project[]) => void;
}

export interface ProjectFile {
  id: string;
  name: string;
  type: "document" | "image";
  uploadedAt: Date;
  size?: number;
  url?: string;
}
