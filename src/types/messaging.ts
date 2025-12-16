export interface ChatThread {
  id: number;
  name: string;
  lastMessage: string;
  time: string;
  unread: number;
  avatar: string;
  online: boolean;
}

export interface Message {
  id: number;
  sender: "me" | "other";
  text: string;
  time: string;
}

