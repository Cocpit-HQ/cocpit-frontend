export type Notification = {
  id: number
  text: string
  time: string
  read: boolean
  avatarColor: string
}

export const mockNotifications: Notification[] = [
  {
    id: 1,
    text: "Sarah Chen liked your story",
    time: "2m ago",
    read: false,
    avatarColor: "bg-blue-400",
  },
  {
    id: 2,
    text: "Michael Torres commented on your post",
    time: "1 hour ago",
    read: false,
    avatarColor: "bg-purple-400",
  },
  {
    id: 3,
    text: "New job alert: Product Designer",
    time: "3 hours ago",
    read: true,
    avatarColor: "bg-green-400",
  },
  {
    id: 4,
    text: "Jessica Williams viewed your profile",
    time: "5 hours ago",
    read: true,
    avatarColor: "bg-yellow-400",
  },
]
