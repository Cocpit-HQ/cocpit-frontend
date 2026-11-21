"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { MessageSquare, User, Loader2 } from "lucide-react";
import { searchUsers, getUserByUsername, UserMention } from "@/services/api/users";
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
  const [fetchAttempted, setFetchAttempted] = useState(false);

  const prefixMatch = (username || "").match(/^(user|org|company):(.+)$/i);
  const explicitType = prefixMatch ? prefixMatch[1].toLowerCase() : null;
  const cleanIdentifier = prefixMatch ? prefixMatch[2] : (username || "");

  const isCompany = explicitType === 'org' || explicitType === 'company' || Boolean(
    userData?.is_company ||
    userData?.type?.toUpperCase() === 'COMPANY' ||
    userData?.account_type?.toUpperCase() === 'COMPANY' ||
    Boolean(userData?.org_id)
  );

  const isEveryone = cleanIdentifier?.toLowerCase() === 'everyone' || cleanIdentifier?.toLowerCase() === 'all';

  if (isEveryone) {
    return <>{children}</>;
  }

  const handleOpenChange = async (open: boolean) => {
    if (open && !userData && !isLoading && !fetchAttempted) {
      setIsLoading(true);
      try {
        // 1. Try direct profile lookup (most reliable — backend resolves account_name or uuid)
        let match = await getUserByUsername(cleanIdentifier);

        // 2. Fallback to search if direct lookup fails (handles old full_name format mentions)
        if (!match) {
          const results = await searchUsers(cleanIdentifier);
          // Exact match by account_name or id
          match = results.find(u => u.account_name?.toLowerCase() === cleanIdentifier.toLowerCase() || u.id === cleanIdentifier) || null;
          // Fallback: startsWith (for partial captures from old @full_name mentions)
          if (!match) {
            match = results.find(u =>
              u.full_name?.toLowerCase().startsWith(cleanIdentifier.toLowerCase()) ||
              u.account_name?.toLowerCase().startsWith(cleanIdentifier.toLowerCase())
            ) || null;
          }
          // Single result = strong match
          if (!match && results.length === 1) {
            match = results[0];
          }
        }

        if (match) {
          setUserData(match);
        }
      } catch (err) {
        console.error("Failed to fetch user data for mention", err);
      } finally {
        setIsLoading(false);
        setFetchAttempted(true);
      }
    }
  };

  const handleNavigateToProfile = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    const identifier = userData?.slug || userData?.account_name || userData?.id || cleanIdentifier;
    if (isCompany) {
      router.push(`/organization/${identifier}`);
    } else {
      router.push(`/profile/${identifier}`);
    }
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
        align={isMe ? "end" : "start"} 
        sideOffset={6}
        collisionPadding={12}
        className="w-72 bg-[var(--ds-bg)] border border-[var(--ds-border)] shadow-xl rounded-2xl p-3 will-change-[opacity,transform] z-[100] text-[var(--ds-text-primary)] font-['DM_Sans'] outline-none"
        onClick={(e) => e.stopPropagation()}
      >
        {isLoading ? (
           <div className="flex flex-col items-center justify-center py-4 gap-2">
             <Loader2 className="w-5 h-5 animate-spin text-[var(--ds-accent)]" />
             <p className="text-xs font-medium text-[var(--ds-text-secondary)]">Loading profile...</p>
           </div>
        ) : userData ? (
          <div className="flex flex-col gap-2 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-start gap-2.5">
              <Avatar className="w-10 h-10 border border-[var(--ds-border)] bg-[var(--ds-surface-1)] shrink-0">
                <AvatarImage src={userData.avatar_url || ""} alt={userData.full_name} className="object-cover" />
                <AvatarFallback className="bg-[var(--ds-surface-1)] text-[var(--ds-text-primary)] font-medium text-sm">
                  {userData.full_name.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <h4 className="text-[14px] font-semibold text-[var(--ds-text-primary)] truncate leading-tight font-['DM_Sans']">
                  {userData.full_name}
                </h4>
                <p className="text-xs text-[var(--ds-text-secondary)] font-normal truncate mt-0.5 font-['DM_Sans']">
                  @{userData.account_name}
                </p>
                {userData.headline && (
                  <p className="text-xs text-[var(--ds-text-secondary)] mt-1 line-clamp-2 leading-snug font-['DM_Sans']">
                    {userData.headline}
                  </p>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="py-4 text-center animate-in fade-in">
             <div className="w-8 h-8 bg-[var(--ds-surface-1)] border border-[var(--ds-border)] rounded-full flex items-center justify-center mx-auto mb-2">
               <User className="w-4 h-4 text-[var(--ds-text-secondary)]" />
             </div>
             <p className="text-xs text-[var(--ds-text-primary)] font-medium font-['DM_Sans']">User not found</p>
             <p className="text-[11px] text-[var(--ds-text-secondary)] mt-0.5 font-['DM_Sans']">This account may have been removed.</p>
          </div>
        )}
      </HoverCardContent>
    </HoverCard>
  );
}
