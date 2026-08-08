import React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, MoreVertical, Phone, Video, X, Copy, Pencil, Info as InfoIcon, Trash2 } from "lucide-react"
import { ChatThread, Message } from "@/types/messaging"
import Avatar from "@/components/shared/Avatar"
import { Button } from "@/components/ui/button"
import { Icon } from "@iconify/react"
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
  onMuteClick?: () => void;
  onUnmuteClick?: () => void;
  onDeleteClick?: () => void;
  onLeaveClick?: () => void;
  isQuickChat?: boolean;
}

export default function MobileChatHeader({
  chat,
  onBack,
  selectedMessage,
  onMessageAction,
  currentUserId,
  onMuteClick,
  onUnmuteClick,
  onDeleteClick,
  onLeaveClick,
  isQuickChat
}: MobileChatHeaderProps) {
  const router = useRouter()
  const isMyMessage = selectedMessage && (selectedMessage.sender === 'me' || selectedMessage.senderId === currentUserId || selectedMessage.senderId === 'me');

  return (
    <div
      className={isQuickChat 
        ? "w-full px-[16px] py-[12px] bg-white flex items-center justify-between shrink-0 h-[59px]" 
        : "w-full px-3 py-2.5 border-b flex items-center justify-between bg-background border-border overflow-hidden shrink-0"}
    >
      <div className={`flex items-center gap-2 overflow-hidden flex-1`}>
        <div className={`flex items-center gap-2.5 overflow-hidden flex-1`}>
          {isQuickChat && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onBack();
              }}
              className="w-6 h-6 flex items-center justify-center transition-colors text-black hover:opacity-70 shrink-0"
            >
              <ArrowLeft className="w-6 h-6" strokeWidth={1.5} />
            </button>
          )}
          {!isQuickChat && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onBack();
              }}
              className="w-9 h-9 flex items-center justify-center rounded-full transition-colors hover:bg-muted text-muted-foreground hover:text-foreground shrink-0"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}

          {!selectedMessage ? (
            <div className={`flex items-center gap-2.5 overflow-hidden flex-1`}>
              {chat.isGroup ? (
                <div className={`flex items-center gap-2.5 overflow-hidden flex-1`}>
                  <Avatar
                    url={chat.avatar}
                    name={chat.name}
                    size="sm"
                  />
                  <div className={`flex-1 min-w-0 flex flex-col justify-center`}>
                    <h3 className={`${isQuickChat ? "font-['Poppins'] font-normal text-[14px] leading-[20px] text-black" : "font-semibold text-sm text-foreground truncate leading-tight"}`}>
                      {chat.name}
                    </h3>
                    <p className={`${isQuickChat ? "font-['Poppins'] font-normal text-[10px] leading-[15px] text-[#6B7280]" : "text-xs text-muted-foreground truncate"}`}>
                      {chat.role ? chat.role : "Group Chat"}
                    </p>
                  </div>
                </div>
              ) : (
                <Link 
                  href={chat.otherUserType === 'COMPANY' ? `/organization/${chat.otherUserSlug || chat.otherUserId}` : `/profile/${chat.otherUserSlug || chat.otherUserId}`}
                  className={`flex items-center gap-2.5 overflow-hidden flex-1 group`}
                >
                  <Avatar
                    url={chat.avatar}
                    name={chat.name}
                    size="sm"
                  />
                  <div className={`flex-1 min-w-0 flex flex-col justify-center`}>
                    <h3 className={`${isQuickChat ? "font-['Poppins'] font-normal text-[14px] leading-[20px] text-black truncate" : "font-semibold text-sm text-foreground truncate leading-tight group-hover:text-primary transition-colors"}`}>
                      {chat.name}
                    </h3>
                    {chat.role ? (
                      <p className={`${isQuickChat ? "font-['Poppins'] font-normal text-[10px] leading-[15px] text-[#6B7280] truncate" : "text-xs text-muted-foreground truncate"}`}>{chat.role}</p>
                    ) : (
                      <p className={`${isQuickChat ? "font-['Poppins'] font-normal text-[10px] leading-[15px] text-[#6B7280] truncate" : "text-xs truncate"}`}>
                        {chat.online 
                          ? <span className={`${isQuickChat ? "text-[#6B7280]" : "text-emerald-500 font-medium"}`}>Active now</span>
                          : <span className={`${isQuickChat ? "text-[#6B7280]" : "text-muted-foreground"}`}>Offline</span>}
                      </p>
                    )}
                  </div>
                </Link>
              )}
            </div>
          ) : (
            <div className={`flex items-center gap-2 overflow-hidden flex-1 ${isQuickChat ? "pl-8" : ""}`}>
              <span className="font-medium text-sm text-foreground truncate">1 Selected</span>
            </div>
          )}
        </div>
        
        <div className={`flex items-center gap-1 shrink-0 ml-2`}>
          {isQuickChat ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (onMessageAction && selectedMessage) {
                  onMessageAction('close');
                } else if (onBack) {
                  onBack();
                }
              }}
              className="w-6 h-6 flex items-center justify-center transition-colors text-black hover:opacity-70"
            >
              <X className="w-6 h-6" strokeWidth={1.5} />
            </button>
          ) : selectedMessage ? (
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
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="p-2 rounded-full text-muted-foreground hover:bg-muted hover:text-foreground outline-none transition-colors">
                  <MoreVertical className="w-5 h-5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-[204px] p-[8px] mr-4 bg-[var(--popover)] border border-[var(--border)]"
                style={{ borderRadius: '24px 0px 24px 24px' }}
              >
                {chat.isGroup ? (
                  <>
                    {chat.is_muted ? (
                      <DropdownMenuItem
                        onClick={onUnmuteClick}
                        className="flex items-center justify-between px-[16px] py-[10px] cursor-pointer hover:bg-[var(--primary-tint)] rounded-md transition-colors border-none outline-none"
                      >
                        <span className="font-['Poppins'] font-normal text-[14px] leading-[20px] text-[var(--foreground)]">Unmute group</span>
                        <Icon icon="fluent:speaker-2-16-regular" width={24} height={24} color="var(--foreground)" />
                      </DropdownMenuItem>
                    ) : (
                      <DropdownMenuItem
                        onClick={onMuteClick}
                        className="flex items-center justify-between px-[16px] py-[10px] cursor-pointer hover:bg-[var(--primary-tint)] rounded-md transition-colors border-none outline-none"
                      >
                        <span className="font-['Poppins'] font-normal text-[14px] leading-[20px] text-[var(--foreground)]">Mute group</span>
                        <Icon icon="fluent:speaker-mute-16-regular" width={24} height={24} color="var(--foreground)" />
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem
                      onClick={onLeaveClick}
                      className="flex items-center justify-between px-[16px] py-[10px] cursor-pointer hover:bg-[var(--destructive)]/10 rounded-md transition-colors border-none outline-none"
                    >
                      <span className="font-['Poppins'] font-normal text-[14px] leading-[20px] text-[var(--destructive)]">Leave group</span>
                      <Icon icon="fluent:door-arrow-left-16-regular" width={24} height={24} color="var(--destructive)" />
                    </DropdownMenuItem>
                  </>
                ) : (
                  <>
                    <DropdownMenuItem
                      onClick={onDeleteClick}
                      className="flex items-center justify-between px-[16px] py-[10px] cursor-pointer hover:bg-[var(--destructive)]/10 rounded-md transition-colors border-none outline-none"
                    >
                      <span className="font-['Poppins'] font-normal text-[14px] leading-[20px] text-[var(--destructive)]">Delete chat</span>
                      <Icon icon="fluent:delete-16-regular" width={24} height={24} color="var(--destructive)" />
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        )}
      </div>
    </div>
    </div>
  )
}
