import React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, MoreVertical, Phone, Video, X, Copy, Pencil, Info as InfoIcon, Trash2 } from "lucide-react"
import { ChatThread, Message } from "@/types/messaging"
import Avatar from "@/components/shared/Avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface MobileChatHeaderProps {
  chat: ChatThread;
  onBack: () => void;
  selectedMessage?: Message | null;
  onMessageAction?: (action: string) => void;
  currentUserId?: string;
}

export default function MobileChatHeader({ chat, onBack, selectedMessage, onMessageAction, currentUserId }: MobileChatHeaderProps) {
  const router = useRouter()
  const isMyMessage = selectedMessage && (selectedMessage.sender === 'me' || selectedMessage.senderId === currentUserId || selectedMessage.senderId === 'me');

  return (
    <div
      className="w-full p-3 border-b flex items-center justify-between bg-background border-border overflow-hidden shrink-0"
    >
      <div className="flex items-center gap-3 overflow-hidden flex-1">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onBack();
          }}
          className="p-2 rounded-full transition-colors hover:bg-muted text-muted-foreground hover:text-foreground shrink-0"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>

        {!selectedMessage ? (
          <div className="flex items-center gap-2 overflow-hidden flex-1">
            {chat.isGroup ? (
              <div className="flex items-center gap-2 overflow-hidden flex-1">
                <Avatar
                  url={chat.avatar}
                  name={chat.name}
                  size="sm"
                  online={chat.online}
                />
                <div className="flex-1 min-w-0 flex flex-col justify-center">
                  <h3 className="font-semibold text-sm text-foreground truncate w-full">
                    {chat.name}
                  </h3>
                  <p className="text-xs text-muted-foreground truncate w-full">
                    {chat.role ? chat.role : "Group Chat"}
                  </p>
                </div>
              </div>
            ) : (
              <Link 
                href={chat.otherUserType === 'COMPANY' ? `/organization/${chat.otherUserSlug || chat.otherUserId}` : `/profile/${chat.otherUserSlug || chat.otherUserId}`}
                className="flex items-center gap-2 overflow-hidden flex-1 group"
              >
                <Avatar
                  url={chat.avatar}
                  name={chat.name}
                  size="sm"
                  online={chat.online}
                />
                <div className="flex-1 min-w-0 flex flex-col justify-center">
                  <h3 className="font-semibold text-sm text-foreground truncate w-full group-hover:underline group-hover:text-primary transition-colors">
                    {chat.name}
                  </h3>
                  {chat.role && (
                    <p className="text-xs text-primary truncate w-full">{chat.role}</p>
                  )}
                  {!chat.role && (
                    <p className="text-xs text-muted-foreground truncate w-full">
                      {chat.online ? "Active now" : "Offline"}
                    </p>
                  )}
                </div>
              </Link>
            )}
          </div>
        ) : (
          <div className="font-medium text-foreground">1 Selected</div>
        )}
      </div>

      <div className="flex items-center gap-1 shrink-0">
        {selectedMessage ? (
          <>
            <Button variant="ghost" size="icon" onClick={() => onMessageAction?.('close')} title="Close Selection">
              <X className="h-5 w-5" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onMessageAction?.('copy')}>
                  <Copy className="w-4 h-4 mr-2" /> Copy
                </DropdownMenuItem>
                {isMyMessage && (
                  <>
                    <DropdownMenuItem onClick={() => onMessageAction?.('info')}>
                      <InfoIcon className="w-4 h-4 mr-2" /> Info
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onMessageAction?.('edit')}>
                      <Pencil className="w-4 h-4 mr-2" /> Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onMessageAction?.('delete')} className="text-destructive focus:text-destructive">
                      <Trash2 className="w-4 h-4 mr-2" /> Delete
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        ) : (
          <>
            <button className="p-2 rounded-full text-muted-foreground hover:bg-muted hover:text-foreground">
              <Phone className="w-5 h-5" />
            </button>
            <button className="p-2 rounded-full text-muted-foreground hover:bg-muted hover:text-foreground">
              <MoreVertical className="w-5 h-5" />
            </button>
          </>
        )}
      </div>
    </div>
  )
}
