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
                  <div className={`w-8 h-8 flex-shrink-0 relative ${chat.otherUserType === 'COMPANY' ? 'rounded-[8px]' : 'rounded-full'} overflow-hidden`}>
                    {!(chat.isBlockedByOther || chat.isDeactivated || chat.isDeleted) && chat.avatar ? (
                      <img
                        src={chat.avatar}
                        alt={chat.name}
                        className={`w-full h-full object-cover ${chat.otherUserType === 'COMPANY' ? 'rounded-[8px]' : 'rounded-full'}`}
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).style.display = 'none';
                          const sibling = (e.currentTarget as HTMLImageElement).nextElementSibling as HTMLElement | null;
                          if (sibling) sibling.style.display = 'block';
                        }}
                      />
                    ) : null}
                    {chat.otherUserType === 'COMPANY' ? (
                      <svg
                        width="32" height="32" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"
                        style={{ display: (!(chat.isBlockedByOther || chat.isDeactivated || chat.isDeleted) && chat.avatar) ? 'none' : 'block' }}
                      >
                        <rect width="40" height="40" rx="12" fill="#DADADA"/>
                        <path d="M18 20H22M18 16H22M22 29V26C22 25.4696 21.7893 24.9609 21.4142 24.5858C21.0391 24.2107 20.5304 24 20 24C19.4696 24 18.9609 24.2107 18.5858 24.5858C18.2107 24.9609 18 25.4696 18 26V29" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M14 18H12C11.4696 18 10.9609 18.2107 10.5858 18.5858C10.2107 18.9609 10 19.4696 10 20V27C10 27.5304 10.2107 28.0391 10.5858 28.4142C10.9609 28.7893 11.4696 29 12 29H28C28.5304 29 29.0391 28.7893 29.4142 28.4142C29.7893 28.0391 30 27.5304 30 27V17C30 16.4696 29.7893 15.9609 29.4142 15.5858C29.0391 15.2107 28.5304 15 28 15H26" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M14 29V13C14 12.4696 14.2107 11.9609 14.5858 11.5858C14.9609 11.2107 15.4696 11 16 11H24C24.5304 11 25.0391 11.2107 25.4142 11.5858C25.7893 11.9609 26 12.4696 26 13V29" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    ) : (
                      <svg
                        width="32" height="32" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"
                        style={{ display: (!(chat.isBlockedByOther || chat.isDeactivated || chat.isDeleted) && chat.avatar) ? 'none' : 'block' }}
                      >
                        <circle cx="20" cy="20" r="20" fill="#DADADA"/>
                        <path d="M20 10C14.477 10 10 14.477 10 20C10 25.523 14.477 30 20 30C25.523 30 30 25.523 30 20C30 14.477 25.523 10 20 10Z" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M12.2695 26.346C12.2695 26.346 14.4985 23.5 19.9985 23.5C25.4985 23.5 27.7285 26.346 27.7285 26.346M19.9985 20C20.7942 20 21.5572 19.6839 22.1199 19.1213C22.6825 18.5587 22.9985 17.7956 22.9985 17C22.9985 16.2044 22.6825 15.4413 22.1199 14.8787C21.5572 14.3161 20.7942 14 19.9985 14C19.2029 14 18.4398 14.3161 17.8772 14.8787C17.3146 15.4413 16.9985 16.2044 16.9985 17C16.9985 17.7956 17.3146 18.5587 17.8772 19.1213C18.4398 19.6839 19.2029 20 19.9985 20Z" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </div>
                  <div className={`flex-1 min-w-0 flex flex-col justify-center`}>
                    <h3 className={`${isQuickChat ? "font-['Poppins'] font-normal text-[14px] leading-[20px] text-black truncate" : "font-semibold text-sm text-foreground truncate leading-tight group-hover:text-primary transition-colors"}`}>
                      {chat.name}
                    </h3>
                    {chat.role ? (
                      <p className={`${isQuickChat ? "font-['Poppins'] font-normal text-[10px] leading-[15px] text-[#6B7280] truncate" : "text-xs text-muted-foreground truncate"}`}>{chat.role}</p>
                    ) : (
                      <p className={`${isQuickChat ? "font-['Poppins'] font-normal text-[10px] leading-[15px] text-[#6B7280] truncate" : "text-xs truncate"}`}>
                        {!chat.is_requesting && (
                          chat.online 
                            ? <span className={`${isQuickChat ? "text-[#6B7280]" : "text-emerald-500 font-medium"}`}>Active now</span>
                            : <span className={`${isQuickChat ? "text-[#6B7280]" : "text-muted-foreground"}`}>Offline</span>
                        )}
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
