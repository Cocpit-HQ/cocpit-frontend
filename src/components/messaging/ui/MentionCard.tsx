"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { MessageSquare, User, Loader2 } from "lucide-react";
import { searchUsers, UserMention } from "@/services/api/users";
import { useSocial } from "@/context/SocialContext";

export interface MentionProps {
  username: string;
  isMe?: boolean;
  children: React.ReactNode;
}

export function Mention({ username, isMe, children }: MentionProps) {
  const router = useRouter();
  const { startChat } = useSocial();
  
  const [userData, setUserData] = useState<UserMention | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleOpenChange = async (open: boolean) => {
    if (open && !userData && !isLoading) {
      setIsLoading(true);
      try {
        const results = await searchUsers(username);
        // Find exact match by account_name (case-insensitive)
        const match = results.find(u => u.account_name.toLowerCase() === username.toLowerCase());
        if (match) {
          setUserData(match);
        }
      } catch (err) {
        console.error("Failed to fetch user data for mention", err);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleNavigateToProfile = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    router.push(`/profile/${username}`);
  };

  const handleMessage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (userData) {
      // Use the SocialContext to start a chat and route properly
      startChat(userData.id);
    }
  };

  return (
    <HoverCard onOpenChange={handleOpenChange} openDelay={250} closeDelay={200}>
      <HoverCardTrigger asChild>
        {/* We use an inline-flex or inline-block so it fits the text tightly */}
        <span onClick={handleNavigateToProfile} className="relative z-10 inline-block align-bottom shadow-none">
            {children}
        </span>
      </HoverCardTrigger>
      {/* Portaled by default in Radix, prevents overflow issues */}
      <HoverCardContent 
        side="top" 
        align="start" 
        sideOffset={6}
        className="w-72 p-4 bg-popover/95 backdrop-blur-xl border-white/10 shadow-2xl rounded-2xl will-change-[opacity,transform] z-[100]"
        onClick={(e) => e.stopPropagation()}
      >
        {isLoading ? (
           <div className="flex flex-col items-center justify-center py-6 gap-3">
             <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
             <p className="text-xs font-medium text-muted-foreground">Loading profile...</p>
           </div>
        ) : userData ? (
          <div className="flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-start gap-4">
              <Avatar className="w-14 h-14 border border-white/10 shadow-sm ring-2 ring-background">
                <AvatarImage src={userData.avatar_url || ""} alt={userData.full_name} className="object-cover" />
                <AvatarFallback className="bg-primary/10 text-primary font-medium text-lg">
                  {userData.full_name.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0 pt-0.5">
                <h4 className="text-[15px] font-semibold text-foreground truncate leading-tight">
                  {userData.full_name}
                </h4>
                <p className="text-xs text-[#818cf8] font-medium truncate mt-0.5">
                  @{userData.account_name}
                </p>
                {userData.headline && (
                  <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2 leading-snug">
                    {userData.headline}
                  </p>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-2 mt-1">
              <Button 
                variant="default" 
                size="sm" 
                className="flex-1 h-8 rounded-full text-xs font-medium hover:scale-[1.02] active:scale-[0.98] transition-transform"
                onClick={handleMessage}
              >
                <MessageSquare className="w-3.5 h-3.5 mr-1.5" />
                Message
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="flex-1 h-8 rounded-full text-xs font-medium border-white/10 hover:bg-white/5 hover:scale-[1.02] active:scale-[0.98] transition-transform"
                onClick={handleNavigateToProfile}
              >
                <User className="w-3.5 h-3.5 mr-1.5" />
                Profile
              </Button>
            </div>
          </div>
        ) : (
          <div className="py-6 text-center animate-in fade-in">
             <div className="w-10 h-10 bg-muted/50 rounded-full flex items-center justify-center mx-auto mb-3">
               <User className="w-5 h-5 text-muted-foreground/50" />
             </div>
             <p className="text-sm text-foreground font-medium">User not found</p>
             <p className="text-xs text-muted-foreground mt-1">This account may have been removed.</p>
          </div>
        )}
      </HoverCardContent>
    </HoverCard>
  );
}
