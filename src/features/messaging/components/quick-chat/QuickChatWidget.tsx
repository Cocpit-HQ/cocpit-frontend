"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X, GripHorizontal, SquareArrowOutUpRight, Plus } from "lucide-react";
import { useActiveProfile } from "@/context/ActiveProfileContext";
import { ChatThread } from "@/types/messaging";
import { getConversations } from "@/services/api/messaging";
import { mapBackendChatToChatThread } from "@/lib/mappers/messaging.mapper";
import { ChatList } from "../ui/ChatList";
import ChatWindow from "../ui/ChatWindow";
import { Icon } from "@iconify/react";
import { useSocket } from "@/context/SocketContext";
import { QuickNewChat } from "./QuickNewChat";
import { ChatFilterDropdown, ChatFilterOption } from "../ui/ChatFilterDropdown";

export function QuickChatWidget() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const widgetRef = useRef<HTMLDivElement>(null);
  const constraintsRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [selectedChat, setSelectedChat] = useState<ChatThread | null>(null);
  const [isNewChatOpen, setIsNewChatOpen] = useState(false);
  const [chatFilter, setChatFilter] = useState<ChatFilterOption>('All');
  const [leftOffset, setLeftOffset] = useState<string | null>(null);
  const [panelAlign, setPanelAlign] = useState<'left' | 'right'>('left');
  const { activeProfile } = useActiveProfile();
  const router = useRouter();
  const { socket } = useSocket();
  const [stripNotification, setStripNotification] = useState({ show: false, text: '' });

  const isFeedPage = pathname === '/feed' || pathname === '/';
  const shouldHide = !isFeedPage;

  // Fetch chats logic duplicated from MessagingPage (will share cache with the same query key)
  const rawChatsQuery = useQuery({
    queryKey: [
      "conversations",
      activeProfile?.type ?? "USER",
      activeProfile?.id ?? "me",
      "all", // Default to 'all' or 'GENERAL' for quick chat
    ],
    queryFn: async () => {
      const params =
        activeProfile?.type === "COMPANY"
          ? {
              companyId: activeProfile.id,
              tab: "GENERAL" as "JOBS" | "GENERAL",
            }
          : {};
      const backendChats = await getConversations(params);
      return backendChats.map(mapBackendChatToChatThread);
    },
    staleTime: 0,
    refetchOnWindowFocus: false,
    enabled: isOpen && !shouldHide, // Only fetch when opened and not hidden to save bandwidth
  });

  const chats = useMemo(() => {
    const all = rawChatsQuery.data || [];
    const seen = new Map<string, (typeof all)[number]>();
    for (const c of all) {
      if (!c.isDeleted && !seen.has(c.id)) {
        seen.set(c.id, c);
      }
    }
    return Array.from(seen.values());
  }, [rawChatsQuery.data]);

  useEffect(() => {
    if (!isOpen) {
      setSelectedChat(null);
    }
  }, [isOpen]);

  useEffect(() => {
    if (shouldHide) return;
    let pollInterval: NodeJS.Timeout;

    const updatePosition = () => {
      if (window.innerWidth < 768) {
        setLeftOffset(null);
        setPanelAlign('right');
        return;
      }
      
      // Look for the layout containers directly to avoid waiting for posts
      const feedContainer = 
        document.querySelector('section.max-w-\\[560px\\]') || 
        document.querySelector('.feed-card-shell') ||
        document.querySelector('.max-w-\\[592px\\]') ||
        document.querySelector('.max-w-\\[700px\\]');

      if (feedContainer) {
        const rect = feedContainer.getBoundingClientRect();
        const viewportWidth = document.documentElement.clientWidth;
        
        // Target: Left edge of widget is rect.right + 20px
        const buttonLeft = rect.right + 20;
        
        // Check if full panel (340px) goes off screen
        if (buttonLeft + 340 > viewportWidth - 16) {
          setLeftOffset(null);
          setPanelAlign('right');
        } else {
          setLeftOffset(`${buttonLeft}px`);
          setPanelAlign('left');
        }
      } else {
        // Fallback for pages without a feed post
        setLeftOffset(null);
        setPanelAlign('right');
      }
    };

    updatePosition();
    
    // Poll for a few seconds to catch asynchronously loaded posts just in case
    let attempts = 0;
    pollInterval = setInterval(() => {
      attempts++;
      updatePosition();
      if (attempts > 10 || document.querySelector('.feed-card-shell')) {
        clearInterval(pollInterval);
      }
    }, 500);

    window.addEventListener('resize', updatePosition);
    return () => {
      clearInterval(pollInterval);
      window.removeEventListener('resize', updatePosition);
    };
  }, [pathname, shouldHide]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      // Do not close if clicking inside a Radix dropdown portal or the menu itself
      if (target.closest && (target.closest('[data-radix-portal]') || target.closest('#chat-filter-dropdown') || target.closest('[role="menu"]'))) {
        return;
      }
      if (widgetRef.current && !widgetRef.current.contains(target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!socket) return;
    const handleNotification = (payload: any) => {
      if (!isOpen && (payload.type === 'message' || payload.type === 'new_message')) {
        setStripNotification({ show: true, text: `${payload.senderName || 'Someone'} sent you a message` });
        
        // Auto-hide after 3 seconds
        setTimeout(() => {
          setStripNotification(prev => ({ ...prev, show: false }));
        }, 3000);
      }
    };
    socket.on('notification', handleNotification);
    return () => {
      socket.off('notification', handleNotification);
    };
  }, [socket, isOpen]);

  const handleSelectChat = (chat: ChatThread) => {
    setSelectedChat(chat);
  };

  const handleBackToList = () => {
    setSelectedChat(null);
  };

  if (shouldHide) {
    return null;
  }

  return (
    <>
      {/* Invisible container to restrict dragging within the viewport (leaving room for navbar and bottom edge) */}
      <div ref={constraintsRef} className="fixed top-20 bottom-4 left-4 right-4 pointer-events-none z-[49]" />
      <motion.div 
        ref={widgetRef}
        drag
        dragConstraints={constraintsRef}
        dragMomentum={false}
      onDragStart={() => setIsDragging(true)}
      onDragEnd={() => setTimeout(() => setIsDragging(false), 150)}
      className="fixed z-50 pointer-events-auto"
      style={{
        left: leftOffset || undefined,
        right: !leftOffset ? '16px' : undefined,
        bottom: '16px'
      }}
    >
        <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className={`absolute bottom-[68px] ${panelAlign === 'left' ? 'left-0' : 'right-0'} w-[calc(100vw-32px)] sm:w-[340px] ${selectedChat ? 'h-[65vh] max-h-[480px] sm:h-[480px]' : 'h-[335px]'} bg-white border border-[#EEF2FF] shadow-[0_4px_20px_rgba(0,0,0,0.05)] rounded-[12px] flex flex-col overflow-hidden transition-all duration-300`}
            style={{ transformOrigin: 'bottom' }}
          >
          {/* Main Content Area */}
          <div className="flex-1 overflow-hidden relative flex flex-col bg-background">
            {selectedChat ? (
              <div className="flex flex-col h-full">
                <div 
                  className="flex-1 overflow-hidden"
                  onPointerDown={(e) => e.stopPropagation()}
                >
                  <ChatWindow
                    chat={selectedChat}
                    isMobile={true}
                    onBack={handleBackToList}
                    isQuickChat={true}
                  />
                </div>
              </div>
            ) : isNewChatOpen ? (
              <div className="flex flex-col h-full">
                <div 
                  className="flex-1 overflow-hidden"
                  onPointerDown={(e) => e.stopPropagation()}
                >
                  <QuickNewChat 
                    onBack={() => setIsNewChatOpen(false)}
                    onClose={() => setIsOpen(false)}
                    onSelectUser={(user) => {
                      const targetUserId = user.user_id || user.id;
                      const existingChat = chats.find(c => c.otherUserId === targetUserId && !c.isGroup);

                      if (existingChat) {
                        setSelectedChat(existingChat);
                      } else {
                        const newChat: ChatThread = {
                          id: "new",
                          otherUserId: targetUserId,
                          name: user.full_name || user.account_name || "cocpit user",
                          role: user.headline || "",
                          avatar: user.avatar_url || "gradient-1",
                          lastMessage: "",
                          time: new Date().toISOString(),
                          lastMessageAt: new Date().toISOString(),
                          unread: 0,
                          online: false,
                          isJobChat: false,
                        };
                        setSelectedChat(newChat);
                      }
                      setIsNewChatOpen(false);
                    }}
                  />
                </div>
              </div>
            ) : (
              <div className="flex flex-col h-full">
                {/* Header for ChatList since ChatWindow brings its own header usually */}
                <div 
                  className="flex justify-between items-center px-4 py-4 bg-white rounded-t-[12px] cursor-grab active:cursor-grabbing shrink-0 h-[56px]"
                  style={{ touchAction: "none" }}
                >
                  <div className="flex justify-start">
                    <h3 className="font-medium text-[16px] text-[#0B1C30] select-none">Messaging</h3>
                  </div>
                  <div className="flex justify-end items-center gap-2" onPointerDown={(e) => e.stopPropagation()}>
                    <ChatFilterDropdown value={chatFilter} onChange={setChatFilter} />
                    <button onClick={() => { setIsOpen(false); router.push("/messaging"); }} className="text-[#000000] w-6 h-6 flex items-center justify-center" title="Expand to full view">
                      <SquareArrowOutUpRight className="w-5 h-5" strokeWidth={1.5} />
                    </button>
                    <button onClick={() => setIsNewChatOpen(true)} className="text-[#000000] w-6 h-6 flex items-center justify-center">
                      <Plus className="w-5 h-5" strokeWidth={1.5} />
                    </button>
                    <button onClick={() => setIsOpen(false)} className="text-[#000000] w-6 h-6 flex items-center justify-center">
                      <X className="w-5 h-5" strokeWidth={1.5} />
                    </button>
                  </div>
                </div>
                <div 
                  className="flex-1 overflow-y-auto"
                  onPointerDown={(e) => e.stopPropagation()}
                >
                  <ChatList
                    chats={chats}
                    isLoading={rawChatsQuery.isLoading}
                    error={rawChatsQuery.error as Error}
                    onSelectChat={handleSelectChat}
                    isMobile={true}
                    isQuickChat={true}
                    chatFilter={chatFilter}
                  />
                </div>
              </div>
            )}
          </div>
          </motion.div>
        )}
        </AnimatePresence>
      
      <motion.button
        onClick={() => {
          if (isOpen) {
            setIsOpen(false);
          } else if (!isDragging) {
            setIsOpen(true);
          }
          setStripNotification(prev => ({ ...prev, show: false })); // Hide on click
        }}
        initial={false}
        animate={{ 
          width: stripNotification.show ? 'auto' : 50,
        }}
        className="relative bg-white text-black border border-[#EEF2FF] rounded-[12px] shadow-[0_4px_20px_rgba(0,0,0,0.05)] flex items-center hover:bg-gray-50 transition-colors cursor-grab active:cursor-grabbing whitespace-nowrap overflow-hidden"
        style={{
          flexDirection: panelAlign === 'left' ? 'row' : 'row-reverse',
          height: '50px'
        }}
      >
        <div className="relative flex items-center justify-center w-[50px] h-[50px] shrink-0">
          <Icon icon="proicons:chat" className="w-[28px] h-[28px]" />
          {chats.some(c => c.unread > 0) && (
            <div className="absolute top-[8px] right-[8px] w-1.5 h-1.5 bg-[#6366F1] rounded-full"></div>
          )}
        </div>
        
        <AnimatePresence>
          {stripNotification.show && (
            <motion.span
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              className={`text-[13px] font-medium text-[#0B1C30] overflow-hidden ${panelAlign === 'left' ? 'pr-4 pl-0' : 'pl-4 pr-0'}`}
            >
              {stripNotification.text}
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>
    </motion.div>
    </>
  );
}
