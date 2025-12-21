import type { ChatThread, Message } from "@/types/messaging";

export const mockChats: ChatThread[] = [
  {
    id: 1,
    name: "Michael Chen",
    role: "Recruiter",
    lastMessage: "Thanks for connecting! Looking forward to chatting.",
    time: "2m ago",
    unread: 2,
    avatar: "gradient-1",
    online: true,
    pinnedContext: "Senior React Developer Role"
  },
  {
    id: 2,
    name: "Emily Rodriguez",
    role: "Hiring Manager",
    lastMessage: "That sounds great! When would be a good time?",
    time: "1h ago",
    unread: 0,
    avatar: "gradient-2",
    online: true
  },
  {
    id: 3,
    name: "David Park",
    role: "Connection",
    lastMessage: "I saw your recent post about AI trends...",
    time: "3h ago",
    unread: 1,
    avatar: "gradient-3",
    online: false
  },
  {
    id: 4,
    name: "Jessica Williams",
    role: "Talent Acquisition",
    lastMessage: "Happy to help with that project!",
    time: "1d ago",
    unread: 0,
    avatar: "gradient-4",
    online: false
  },
  {
    id: 5,
    name: "Alex Thompson",
    role: "Connection",
    lastMessage: "Let me know if you need anything else.",
    time: "2d ago",
    unread: 0,
    avatar: "gradient-5",
    online: false
  },
];

export const mockMessages: Record<number, Message[]> = {
  1: [
    { id: 1, sender: "other", text: "Hi! Thanks for accepting my connection request!", time: "10:30 AM" },
    { id: 2, sender: "other", text: "I'm reaching out regarding the Senior React role.", time: "10:30 AM" },
    { id: 3, sender: "me", text: "Hi Michael! Thanks for reaching out.", time: "10:32 AM" },
    { id: 4, sender: "me", text: "I'd love to hear more about the team.", time: "10:32 AM" },
    { id: 5, sender: "other", text: "Great! Do you have time for a quick call this week?", time: "10:33 AM" },
  ],
  2: [
    { id: 1, sender: "other", text: "Hi, are you available for an interview?", time: "09:00 AM" },
    { id: 2, sender: "me", text: "Yes, I am free tomorrow.", time: "09:05 AM" },
  ],
  // Fallback for others
};

export const avatarGradients: Record<string, string> = {
  "gradient-1": "from-blue-400 to-cyan-400",
  "gradient-2": "from-pink-400 to-rose-400",
  "gradient-3": "from-purple-400 to-indigo-400",
  "gradient-4": "from-green-400 to-emerald-400",
  "gradient-5": "from-orange-400 to-amber-400",
};
