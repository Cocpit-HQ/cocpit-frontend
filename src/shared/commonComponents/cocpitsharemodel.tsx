
"use client";

import React, { useMemo, useState, useEffect, useRef, useCallback } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X, Mail, Facebook, Search, User, Briefcase, Link } from "lucide-react";
import { Icon } from "@iconify/react";
import { BusinessBuildingIcon } from "@/components/icons";
import { useSocial } from "@/context/SocialContext";
import { useActiveProfile } from "@/context/ActiveProfileContext";
import { useAuth } from "@/hooks/use-auth";
import { useBodyScrollLock } from "@/hooks";
import { useQueryClient } from "@tanstack/react-query";
import { showToast as toast } from "@/shared/commonComponents/GlobalToast";
import { getShareUsers, sendMessage } from "@/services/api/messaging";
import { universalShare } from "@/services/api/shareService";
import { sendMessage as sendGroupMessage } from "@/services/api/group-chat";
import { MobileSafeBackdrop } from "@/components/shared/MobileSafeBackdrop";

export interface ShareUser {
  id: string;
  name: string;
  avatar?: string;
  slug?: string;
  headline?: string;
  type?: string;
  conversation_id?: string;
}

export interface CocpitShareModelProps {
  isOpen: boolean;
  onClose: () => void;
  users?: ShareUser[];
  onShare?: (selectedIds: string[]) => void;
  postId?: string;
  profileId?: string;
  jobId?: string;
  entityType?: "post" | "profile" | "company" | "job" | "event" | "offer" | "channel" | "community" | "article";
  entityId?: string;
  customUrl?: string;
}

export default function CocpitShareModel({
  isOpen,
  onClose,
  users: propUsers,
  onShare,
  postId,
  profileId,
  jobId,
  entityType,
  entityId,
  customUrl,
}: CocpitShareModelProps) {
  useBodyScrollLock(isOpen);

  const { startChat } = useSocial();
  const { activeProfile } = useActiveProfile();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [selectedUserMap, setSelectedUserMap] = useState<Map<string, ShareUser>>(new Map());
  const [isSending, setIsSending] = useState(false);
  const shareUrl = useMemo(() => {
    if (typeof window === "undefined") return "";
    const origin = window.location.origin;
    if (customUrl) {
      return customUrl.startsWith("http")
        ? customUrl
        : `${origin}${customUrl.startsWith("/") ? "" : "/"}${customUrl}`;
    }
    if (postId) return `${origin}/post/${postId}`;
    if (profileId) return `${origin}/profile/${profileId}`;
    if (jobId) return `${origin}/jobs/${jobId}`;
    if (entityType && entityId) {
      if (entityType === "job" || entityType === "offer") return `${origin}/jobs/${entityId}`;
      if (entityType === "post" || entityType === "article") return `${origin}/post/${entityId}`;
      if (entityType === "profile") return `${origin}/profile/${entityId}`;
      if (entityType === "company") return `${origin}/organization/${entityId}`;
      if (entityType === "channel" || entityType === "community") return `${origin}/channels/${entityId}`;
      if (entityType === "event") return `${origin}/events/${entityId}`;
      return `${origin}/${entityType}/${entityId}`;
    }
    return window.location.href;
  }, [customUrl, postId, profileId, jobId, entityType, entityId]);

  // Pagination states
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearchingApi, setIsSearchingApi] = useState(false);
  const [searchCursor, setSearchCursor] = useState<string | null>(null);
  const [hasMoreUsers, setHasMoreUsers] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const runSearch = useCallback(
    async (query: string, cursor?: string, append = false) => {
      setIsSearchingApi(true);
      setSearchError(null);
      try {
        const result = await getShareUsers(
          query || undefined,
          cursor,
          20
        );
        setSearchResults((prev) => {
          const combined = append ? [...prev, ...result.data] : result.data;
          const unique = Array.from(
            new Map(combined.map((u) => [u.user_id || u.id, u])).values()
          );
          return unique;
        });
        setSearchCursor(result.nextCursor);
        setHasMoreUsers(result.hasMore);
      } catch (err: any) {
        const msg =
          err?.response?.data?.message ||
          err?.message ||
          "Failed to load users";
        setSearchError(msg);
        toast.error(msg);
      } finally {
        setIsSearchingApi(false);
        setHasSearched(true);
      }
    },
    [toast]
  );

  useEffect(() => {
    if (propUsers) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!isOpen) {
      setHasSearched(false);
      return;
    }
    setIsSearchingApi(true);
    debounceRef.current = setTimeout(() => {
      setSearchResults([]);
      setSearchCursor(null);
      setHasMoreUsers(false);
      runSearch(searchTerm);
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchTerm, isOpen, propUsers, runSearch]);

  const handleLoadMore = useCallback(() => {
    if (!hasMoreUsers || isSearchingApi) return;
    runSearch(searchTerm, searchCursor ?? undefined, true);
  }, [hasMoreUsers, isSearchingApi, searchTerm, searchCursor, runSearch]);

  const handleScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      const el = e.currentTarget;
      const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 60;
      if (nearBottom) handleLoadMore();
    },
    [handleLoadMore]
  );

  const users: ShareUser[] = useMemo(() => {
    if (propUsers) return propUsers;
    return searchResults.map((f: any) => ({
      id: f.user_id || f.id,
      name: f.full_name || f.name,
      avatar: f.avatar_url || f.logo_url || undefined,
      headline: f.headline || f.account_name || undefined,
      type: f.type || (f.org_id ? 'COMPANY' : 'USER'),
      conversation_id: f.conversation_id,
    }));
  }, [propUsers, searchResults]);

  const isSearching = searchTerm.length > 0;

  const filteredUsers = useMemo(() => {
    if (!isSearching) return users;
    const term = searchTerm.toLowerCase();
    return users.filter((u: ShareUser) =>
      (u.name || '').toLowerCase().includes(term)
    );
  }, [users, isSearching, searchTerm]);

  // Display users with selected users sorted to the top
  const displayUsers = useMemo(() => {
    const baseList = isSearching ? filteredUsers : users;

    const selectedList = selectedUsers
      .map((id) => {
        return baseList.find((u) => u.id === id) || users.find((u) => u.id === id) || selectedUserMap.get(id);
      })
      .filter((u): u is ShareUser => Boolean(u));

    const selectedIdsSet = new Set(selectedUsers);

    const unselectedList = baseList.filter((u) => !selectedIdsSet.has(u.id));

    return [...selectedList, ...unselectedList];
  }, [isSearching, filteredUsers, users, selectedUsers, selectedUserMap]);

  const handleClose = () => {
    setSearchTerm("");
    setSelectedUsers([]);
    setSelectedUserMap(new Map());
    onClose();
  };

  const toggleSelected = (userToToggle: ShareUser) => {
    const id = userToToggle.id;
    setSelectedUsers((prev) => {
      if (prev.includes(id)) {
        return prev.filter((uId) => uId !== id);
      } else {
        return [...prev, id];
      }
    });
    setSelectedUserMap((prev) => {
      const next = new Map(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.set(id, userToToggle);
      }
      return next;
    });
  };

  const effectiveJobId = jobId || (entityType === "job" ? entityId : undefined);
  const effectiveEntityType = entityType || (effectiveJobId ? "job" : undefined);
  const effectiveEntityId = entityId || effectiveJobId;

  // If text is empty and no specific entity (post/profile/entity), fall back to shareUrl so text is never empty
  const isEntityPresent = Boolean(postId || profileId || effectiveEntityId);
  const messageText = isEntityPresent ? "" : shareUrl;

  const handleSendClick = async () => {
    if (selectedUsers.length === 0 || isSending) return;
    setIsSending(true);
    try {
      const isCompany = activeProfile?.type === "COMPANY";
      const effectiveCompanyId = isCompany ? activeProfile?.id : undefined;

      const responses = await Promise.all(
        selectedUsers.map((targetUserId) => {
          const target = displayUsers.find((u) => u.id === targetUserId) || users.find((u) => u.id === targetUserId);
          if (target && target.type === "GROUP") {
            return sendGroupMessage(
              targetUserId,
              messageText,
              "text",
              undefined,
              undefined,
              postId || undefined,
              profileId || undefined,
              undefined,
              effectiveEntityType,
              effectiveEntityId
            );
          } else {
            return sendMessage(
              targetUserId,
              messageText,
              postId || undefined,
              undefined,
              effectiveCompanyId,
              undefined,
              profileId || undefined,
              effectiveEntityType,
              effectiveEntityId
            );
          }
        })
      );

      let successMessage = selectedUsers.length > 1 ? "Messages sent" : "Message sent";
      if (profileId || entityType === "profile") {
        successMessage = "Profile shared successfully";
      } else if (postId || entityType === "post" || entityType === "article") {
        successMessage = "Post shared successfully";
      }
      toast.success(successMessage);

      // Only invalidate conversations (sidebar) — the socket event updates the message list in real time
      queryClient.invalidateQueries({ queryKey: ["conversations"] });

      // Calculate how many shares were actually tracked as new
      const newlyTrackedCount = responses.filter((r: any) => r && (r.shareTracked || r.data?.shareTracked || r.message?.shareTracked)).length;

      onShare?.(newlyTrackedCount > 0 ? Array(newlyTrackedCount).fill("") : []);
      handleClose();
    } catch (err: any) {
      console.error(err);
      toast.error(err?.response?.data?.message || "Failed to send message");
    } finally {
      setIsSending(false);
    }
  };

  const copyLabel = useMemo(() => {
    if (profileId || entityType === "profile") return "Copy profile link";
    if (postId || entityType === "post") return "Copy post link";
    if (effectiveJobId || entityType === "job") return "Copy job link";
    if (entityType === "event") return "Copy event link";
    if (entityType === "company") return "Copy organization link";
    return "Copy link";
  }, [profileId, postId, effectiveJobId, entityType]);

  const shareOptions = useMemo(() => {
    const trackShare = () => {
      if (profileId || entityType === "profile") {
        universalShare({ entityType: "profile", entityId: (profileId || effectiveEntityId) as string, shareMethod: "copy_link" })
          .then(() => onShare?.(["share"]))
          .catch(() => { });
      } else if (postId) {
        universalShare({ entityType: "post", entityId: postId, shareMethod: "copy_link" })
          .then(() => onShare?.(["share"]))
          .catch(() => { });
      } else if (effectiveJobId) {
        universalShare({ entityType: "job", entityId: effectiveJobId, shareMethod: "copy_link" })
          .then(() => onShare?.(["share"]))
          .catch(() => { });
      } else if (effectiveEntityType && effectiveEntityId) {
        universalShare({ entityType: effectiveEntityType as any, entityId: effectiveEntityId, shareMethod: "copy_link" })
          .then(() => onShare?.(["share"]))
          .catch(() => { });
      }
    };

    return [
      {
        icon: <Briefcase className="w-5 h-5 text-[var(--muted-foreground)]" />,
        label: "Work in progress",
        onClick: () => {
          toast.info("This feature is coming soon!");
        },
      },
      {
        icon: <Mail className="w-5 h-5 text-[var(--muted-foreground)]" />,
        label: "Send via Email",
        onClick: () => {
          window.open(
            `mailto:?subject=Check this out&body=${encodeURIComponent(shareUrl)}`,
            "_blank"
          );
          trackShare();
        },
      },
      {
        icon: <Icon icon="hugeicons:whatsapp" className="w-5 h-5 text-[var(--muted-foreground)]" />,
        label: "Share on WhatsApp",
        onClick: () => {
          window.open(
            `https://wa.me/?text=${encodeURIComponent(shareUrl)}`,
            "_blank"
          );
          trackShare();
        },
      },
      {
        icon: <Facebook className="w-5 h-5 text-[var(--muted-foreground)]" />,
        label: "Share on Facebook",
        onClick: () => {
          window.open(
            `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
            "_blank"
          );
          trackShare();
        },
      },
    ];
  }, [shareUrl, toast, postId, profileId, effectiveJobId, effectiveEntityType, effectiveEntityId, onShare]);

  return (
    <>
      <DialogPrimitive.Root
        open={isOpen}
        onOpenChange={(open) => {
          if (!open) handleClose();
        }}
      >
        <DialogPrimitive.Portal>
          <MobileSafeBackdrop 
            onClose={handleClose}
            className="fixed inset-0 z-[9998] bg-black/40 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" 
          />
          <DialogPrimitive.Content
            onOpenAutoFocus={(e) => {
              e.preventDefault();
            }}
            onPointerDownOutside={(e) => {
              if (isSending) {
                e.preventDefault();
              }
            }}
            onInteractOutside={(e) => {
              if (isSending) {
                e.preventDefault();
              }
            }}
            className="fixed left-1/2 top-1/2 z-[9999] w-[calc(100vw-32px)] max-w-[400px] sm:w-[400px] h-[468px] -translate-x-1/2 -translate-y-1/2 rounded-[16px] bg-ds-bg border border-ds-border p-[12px] shadow-2xl outline-none flex flex-col gap-[12px] box-border data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
          >
            {/* Header Area */}
            <div className="flex flex-col items-center w-full gap-[12px]">
              <div className="flex justify-end items-center w-full h-[20px]">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={isSending}
                  className="h-[20px] w-[20px] flex items-center justify-center text-ds-text-primary hover:opacity-80 transition-opacity"
                  aria-label="Close"
                >
                  <X className="h-[14px] w-[14px]" strokeWidth={2} />
                </button>
              </div>
              <DialogPrimitive.Title className="text-ds-text-primary ds-text-body-1 flex items-center justify-center h-[24px]">
                Share
              </DialogPrimitive.Title>
              <DialogPrimitive.Description className="sr-only">
                Share this with others
              </DialogPrimitive.Description>
            </div>

            <div className="flex-1 flex flex-col overflow-hidden w-full gap-[8px]">
              {/* Search */}
              <div className="relative flex items-center justify-between w-full h-9 border-b border-ds-text-primary py-[8px]">
                <input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search"
                  className="bg-transparent w-full outline-none text-ds-text-primary placeholder:text-ds-text-muted ds-text-secondary"
                />
                <Search className="w-4 h-4 text-ds-text-primary" strokeWidth={2} />
              </div>

              {/* List */}
              <div onScroll={handleScroll} className="flex-1 overflow-y-auto overflow-x-hidden w-full flex flex-col gap-[8px] mt-2 pb-2 scrollbar-hide">
                {(!propUsers && !hasSearched) || (isSearchingApi && displayUsers.length === 0) ? (
                  <div className="flex flex-col w-full gap-[8px]">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div key={i} className="flex items-center justify-between w-full h-[36px] shrink-0 gap-[8px]">
                        <div className="flex items-center gap-[8px] flex-1">
                          <div className="h-[20px] w-[20px] rounded-full ds-skeleton shrink-0" />
                          <div className="h-[14px] w-[140px] rounded-[4px] ds-skeleton" />
                        </div>
                        <div className="w-[20px] h-[20px] rounded-[4px] ds-skeleton shrink-0" />
                      </div>
                    ))}
                  </div>
                ) : displayUsers.length === 0 ? (
                  <div className="py-8 text-center text-ds-text-muted ds-text-secondary">
                    No users found
                  </div>
                ) : (
                  displayUsers.map((u, index) => {
                    const checked = selectedUsers.includes(u.id);
                    const isCompany = u.type === 'company' || (u as any).type === 'COMPANY' || Boolean((u as any).is_company) || (u as any).account_type === 'company' || (u as any).account_type === 'COMPANY';
                    return (
                      <div
                        key={`${u.id}-${index}`}
                        className="flex items-center justify-between w-full h-[36px] shrink-0 gap-[8px] cursor-pointer group"
                        onClick={() => toggleSelected(u)}
                      >
                        <div className="flex items-center gap-[8px]">
                          <div className={`relative h-[20px] w-[20px] ${isCompany ? 'rounded-[4px]' : 'rounded-full'} overflow-hidden bg-ds-surface-1 flex items-center justify-center text-[10px] text-ds-text-primary shrink-0`}>
                            {isCompany ? (
                              <BusinessBuildingIcon className="w-[12px] h-[12px] text-ds-text-primary" />
                            ) : (
                              <span className="absolute inset-0 flex items-center justify-center">{(u.name || 'U').charAt(0).toUpperCase()}</span>
                            )}
                            {u.avatar && u.avatar !== '/assets/pngegg.png' && (
                              <img src={u.avatar} alt={u.name} className={`absolute inset-0 w-full h-full object-cover z-10 ${isCompany ? 'rounded-[4px]' : 'rounded-full'}`} onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                            )}
                          </div>
                          <span className="text-ds-text-primary ds-text-secondary line-clamp-1">
                            {u.name}
                          </span>
                        </div>
                        {/* Checkbox */}
                        <div className={`w-[20px] h-[20px] rounded-[4px] border shrink-0 ${checked ? 'border-ds-accent bg-ds-accent' : 'border-ds-border bg-ds-surface-1'} flex items-center justify-center transition-colors`}>
                          {checked && (
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
                {isSearchingApi && searchResults.length > 0 && (
                  <div className="flex justify-center py-2 w-full">
                    <Icon icon="line-md:loading-twotone-loop" className="w-4 h-4 text-ds-text-primary" />
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Section */}
            <div className="w-full flex flex-col gap-[12px] mt-2">
              <button
                type="button"
                className="flex items-center gap-[4px] cursor-pointer hover:opacity-80 transition-opacity self-start"
                onClick={() => {
                  navigator.clipboard.writeText(shareUrl);
                  toast.success("Link copied!");
                  if (profileId || entityType === "profile") {
                    universalShare({ entityType: "profile", entityId: (profileId || effectiveEntityId) as string, shareMethod: "copy_link" })
                      .then(() => onShare?.(["copy_link"]))
                      .catch(() => { });
                  } else if (postId) {
                    universalShare({ entityType: "post", entityId: postId, shareMethod: "copy_link" })
                      .then(() => onShare?.(["copy_link"]))
                      .catch(() => { });
                  } else if (effectiveJobId) {
                    universalShare({ entityType: "job", entityId: effectiveJobId, shareMethod: "copy_link" })
                      .then(() => onShare?.(["copy_link"]))
                      .catch(() => { });
                  } else if (effectiveEntityType && effectiveEntityId) {
                    universalShare({ entityType: effectiveEntityType as any, entityId: effectiveEntityId as string, shareMethod: "copy_link" })
                      .then(() => onShare?.(["copy_link"]))
                      .catch(() => { });
                  }
                }}
              >
                <Link className="w-[12px] h-[12px] text-ds-accent" />
                <span className="text-ds-accent ds-text-small">{copyLabel}</span>
              </button>

              <div className="flex items-center justify-center gap-[8px] w-full mt-2">
                <button
                  type="button"
                  onClick={handleSendClick}
                  disabled={selectedUsers.length === 0 || isSending}
                  className="flex justify-center items-center px-[12px] py-[6px] h-[36px] w-[77px] rounded-[100px] ds-text-body-1 cursor-pointer disabled:opacity-50 disabled:cursor-default transition-colors bg-ds-accent text-ds-text-primary disabled:bg-ds-surface-1 disabled:text-ds-text-muted"
                >
                  {isSending ? "..." : "Send"}
                </button>
                <button
                  type="button"
                  onClick={handleClose}
                  className="flex justify-center items-center px-[12px] py-[6px] h-[36px] w-[77px] border border-ds-border rounded-[100px] text-ds-text-primary bg-transparent ds-text-body-1 cursor-pointer hover:bg-ds-border transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>
    </>
  );
}
