"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { MessageCircle, X, GripHorizontal, ArrowUpLeft, Plus } from "lucide-react";
import { useActiveProfile } from "@/context/ActiveProfileContext";
import { ChatThread } from "@/types/messaging";
import { getConversations } from "@/services/api/messaging";
import { mapBackendChatToChatThread } from "@/lib/mappers/messaging.mapper";
import { ChatList } from "../ui/ChatList";
import ChatWindow from "../ui/ChatWindow";
import { Icon } from "@iconify/react";

export function QuickChatWidget() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const widgetRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedChat, setSelectedChat] = useState<ChatThread | null>(null);
  const [leftOffset, setLeftOffset] = useState<string | null>(null);
  const [panelAlign, setPanelAlign] = useState<'left' | 'right'>('left');
  const { activeProfile } = useActiveProfile();
  const router = useRouter();

  const shouldHide = Boolean(
    pathname?.startsWith("/messaging") || pathname === "/login" || pathname === "/signup"
  );

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
        
        // Check if button goes off screen (button is now 48px wide)
        if (buttonLeft + 48 > viewportWidth - 16) {
          setLeftOffset(null);
          setPanelAlign('right');
        } else {
          setLeftOffset(`${buttonLeft}px`);
          // Check if panel (320px) goes off screen if aligned left
          if (buttonLeft + 320 > viewportWidth - 16) {
            setPanelAlign('right');
          } else {
            setPanelAlign('left');
          }
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
      if (widgetRef.current && !widgetRef.current.contains(event.target as Node)) {
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
    <motion.div 
      ref={widgetRef}
      drag
      dragMomentum={false}
      onDragStart={() => setIsDragging(true)}
      onDragEnd={() => setTimeout(() => setIsDragging(false), 150)}
      className="fixed z-50 pointer-events-auto"
      style={{
        left: leftOffset || undefined,
        right: !leftOffset ? '16px' : undefined,
        bottom: '10px'
      }}
    >
      <div className="relative flex items-end justify-center w-[50px] h-[50px]">
        {isOpen && (
          <div className={`absolute bottom-[68px] ${panelAlign === 'left' ? 'left-0' : 'right-0'} w-[320px] h-[335px] bg-white border border-[#EEF2FF] shadow-[0_12px_24px_rgba(0,0,0,0.1)] rounded-[12px] flex flex-col overflow-hidden`}>
          {/* Main Content Area */}
          <div className="flex-1 overflow-hidden relative flex flex-col bg-background">
            {selectedChat ? (
              <div className="flex flex-col h-full">
                {/* Drag Handle for ChatWindow mode */}
                <div 
                  className="w-full h-6 bg-muted/50 flex items-center justify-center cursor-grab active:cursor-grabbing border-b border-border shrink-0"
                  style={{ touchAction: "none" }}
                >
                  <GripHorizontal className="w-4 h-4 text-muted-foreground" />
                </div>
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
            ) : (
              <div className="flex flex-col h-full">
                {/* Header for ChatList since ChatWindow brings its own header usually */}
                <div 
                  className="flex justify-between items-center px-4 py-4 bg-white rounded-t-[12px] cursor-grab active:cursor-grabbing shrink-0 h-[56px]"
                  style={{ touchAction: "none" }}
                >
                  <h3 className="font-medium text-[16px] text-[#0B1C30] select-none">Messaging</h3>
                  <div className="flex items-center gap-2" onPointerDown={(e) => e.stopPropagation()}>
                    <button onClick={() => { setIsOpen(false); router.push("/messaging"); }} className="text-[#6B7280] hover:text-black transition-colors w-6 h-6 flex items-center justify-center" title="Expand to full view">
                      <ArrowUpLeft className="w-5 h-5" strokeWidth={1.5} />
                    </button>
                    <button className="text-[#6B7280] hover:text-black transition-colors w-6 h-6 flex items-center justify-center">
                      <Plus className="w-5 h-5" strokeWidth={1.5} />
                    </button>
                    <button onClick={() => setIsOpen(false)} className="text-[#6B7280] hover:text-black transition-colors w-6 h-6 flex items-center justify-center">
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
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      
      <button
        onClick={() => {
          if (isOpen) setIsOpen(false);
          else if (!isDragging) setIsOpen(true);
        }}
        className="relative w-[50px] h-[50px] bg-white text-black border border-[#EEF2FF] rounded-[12px] shadow-[0_4px_20px_rgba(0,0,0,0.05)] flex items-center justify-center hover:bg-gray-50 transition-colors cursor-grab active:cursor-grabbing shrink-0"
      >
        <Icon icon="proicons:chat" className="w-[28px] h-[28px]" />
        <div className="absolute top-[8px] right-[8px] w-1.5 h-1.5 bg-[#6366F1] rounded-full"></div>
      </button>
      </div>
    </motion.div>
  );
}
