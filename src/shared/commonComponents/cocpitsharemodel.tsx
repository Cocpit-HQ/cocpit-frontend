"use client";

import React, { useMemo, useState, useEffect, useRef, useCallback } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X, Mail, Facebook, Search, User, Briefcase } from "lucide-react";
import { Icon } from "@iconify/react";
import { useSocial } from "@/context/SocialContext";
import { useActiveProfile } from "@/context/ActiveProfileContext";
import { useAuth } from "@/hooks/use-auth";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getShareUsers, sendMessage } from "@/services/api/messaging";
import { sendMessage as sendGroupMessage } from "@/services/api/group-chat";

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
}

export default function CocpitShareModel({
  isOpen,
  onClose,
  users: propUsers,
  onShare,
  postId,
  profileId,
}: CocpitShareModelProps) {
  const { startChat } = useSocial();
  const { activeProfile } = useActiveProfile();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [isSending, setIsSending] = useState(false);
  const shareUrl = typeof window !== "undefined" ? window.location.href : "";

  // Pagination states
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearchingApi, setIsSearchingApi] = useState(false);
  const [searchCursor, setSearchCursor] = useState<string | null>(null);
  const [hasMoreUsers, setHasMoreUsers] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

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
      }
    },
    [toast]
  );

  useEffect(() => {
    if (propUsers) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!isOpen) return;
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

  const handleClose = () => {
    setSearchTerm("");
    setSelectedUsers([]);
    onClose();
  };

  const toggleSelected = (id: string) => {
    setSelectedUsers((prev) => {
      if (prev.includes(id)) {
        return prev.filter((uId) => uId !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  const handleSendClick = async () => {
    if (selectedUsers.length === 0 || isSending) return;
    setIsSending(true);
    try {
      const isCompany = activeProfile?.type === "COMPANY";
      const effectiveCompanyId = isCompany ? activeProfile?.id : undefined;

      await Promise.all(
        selectedUsers.map((targetUserId) => {
          const target = users.find((u) => u.id === targetUserId);
          if (target && target.type === "GROUP") {
            return sendGroupMessage(
              targetUserId,
              shareUrl,
              "text",
              undefined,
              undefined,
              postId || undefined,
              profileId || undefined
            );
          } else {
            return sendMessage(
              targetUserId,
              shareUrl,
              postId,
              undefined,
              effectiveCompanyId,
              undefined,
              profileId
            );
          }
        })
      );

      toast.success(selectedUsers.length > 1 ? "Messages sent" : "Message sent");

      // Only invalidate conversations (sidebar) — the socket event updates the message list in real time
      queryClient.invalidateQueries({ queryKey: ["conversations"] });

      onShare?.(selectedUsers);
      handleClose();
    } catch (err: any) {
      console.error(err);
      toast.error(err?.response?.data?.message || "Failed to send message");
    } finally {
      setIsSending(false);
    }
  };

  const shareOptions = useMemo(
    () => [
      {
        icon: <Briefcase className="w-5 h-5 text-[var(--muted-foreground)]" />,
        label: "Work in progress",
        onClick: () => {
          toast("This feature is coming soon!");
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
        },
      },
    ],
    [shareUrl, toast]
  );

  return (
    <>
      <DialogPrimitive.Root
        open={isOpen}
        onOpenChange={(open) => {
          if (!open) handleClose();
        }}
      >
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay className="fixed inset-0 z-[9998] bg-black/40 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
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
            className="fixed left-1/2 top-1/2 z-[9999] w-[420px] h-[506px] -translate-x-1/2 -translate-y-1/2 rounded-[24px] bg-[var(--card)] border border-[var(--border)] p-[16px] shadow-2xl outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 flex flex-col"
          >
            <div className="relative text-center">
              <DialogPrimitive.Title className="text-[18px] font-semibold text-[var(--foreground)] font-['Poppins']">
                Share
              </DialogPrimitive.Title>
              <DialogPrimitive.Description className="mt-1 text-[12px] text-[var(--muted-foreground)] font-normal font-['Poppins']">
                Share this with others
              </DialogPrimitive.Description>
              <button
                type="button"
                onClick={handleClose}
                disabled={isSending}
                className="absolute -top-1 -right-1 h-8 w-8 rounded-full flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:outline-none"
                aria-label="Close"
              >
                <X className="h-5 w-5 text-[var(--destructive)]" strokeWidth={1} />
              </button>
            </div>

            <div className="mt-4 flex-1 flex flex-col overflow-hidden">
              <div className="relative">
                <input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search"
                  className="w-full h-[42px] rounded-full border border-[var(--border)] bg-[var(--background)] px-4 pr-11 text-[14px] text-[var(--foreground)] font-['Poppins'] outline-none focus:ring-2 focus:ring-[var(--primary)]/30 focus:border-[var(--primary)]"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]">
                  <Search className="w-5 h-5" strokeWidth={1.5} />
                </div>
              </div>

              {!isSearching ? (
                <div className="flex-1 flex flex-col min-h-0 overflow-y-auto">
                  <div onScroll={handleScroll} tabIndex={-1} className="mt-5 grid grid-cols-3 gap-4 text-center max-h-[280px] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] pb-2">
                    {users.map((u, index) => (
                      <div
                        key={`${u.id}-${index}`}
                        className={`flex flex-col items-center cursor-pointer rounded-lg p-2 transition-colors relative focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-1 ${selectedUsers.includes(u.id) ? "border border-[var(--primary)] bg-[var(--primary-tint)]" : "border border-transparent hover:bg-[var(--primary)]/5"}`}
                        onClick={() => toggleSelected(u.id)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            toggleSelected(u.id);
                          }
                        }}
                        tabIndex={0}
                        role="checkbox"
                        aria-checked={selectedUsers.includes(u.id)}
                        aria-label={u.name}
                      >
                        <div className="relative h-12 w-12">
                          <div className="relative h-full w-full rounded-full bg-[#EEF2FF] text-[#6366F1] flex items-center justify-center font-semibold text-base font-['Poppins'] select-none overflow-hidden">
                            <span>{(u.name || 'U').charAt(0).toUpperCase()}</span>
                            {u.avatar && u.avatar !== '/assets/pngegg.png' ? (
                              <img
                                src={u.avatar}
                                alt={u.name}
                                className="absolute inset-0 w-full h-full object-cover"
                                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                              />
                            ) : null}
                          </div>
                          {selectedUsers.includes(u.id) && (
                            <div className="absolute bottom-0 right-0 h-4.5 w-4.5 rounded-full bg-[var(--primary)] flex items-center justify-center shadow-sm border border-white translate-x-[10%] translate-y-[10%] z-10">
                              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                            </div>
                          )}
                        </div>
                        <div className="mt-2 text-[12px] text-[var(--foreground)] font-medium font-['Poppins'] text-center flex flex-col items-center gap-0.5">
                          <span className="line-clamp-1">{u.name}</span>
                          {u.type === 'COMPANY' && (
                            <span className="text-[9px] bg-[var(--primary-tint)] text-[var(--primary)] font-medium px-1.5 py-0.2 rounded-full">
                              Company
                            </span>
                          )}
                          {u.type === 'GROUP' && (
                            <span className="text-[9px] bg-emerald-50 text-emerald-700 font-medium px-1.5 py-0.2 rounded-full">
                              Group
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {isSearchingApi && searchResults.length > 0 && (
                    <div className="flex justify-center py-2 w-full">
                      <Icon icon="line-md:loading-twotone-loop" className="w-4 h-4 text-[var(--primary)]" />
                    </div>
                  )}
                </div>
              ) : (
                <div onScroll={handleScroll} className="mt-5 max-h-[280px] overflow-auto pr-1 flex-1">
                  {filteredUsers.length === 0 ? (
                    <div className="py-8 text-center text-[13px] text-[var(--muted-foreground)] font-['Poppins']">
                      No users found
                    </div>
                  ) : (
                    filteredUsers.map((u, index) => {
                      const checked = selectedUsers.includes(u.id);
                      return (
                        <div
                          key={`${u.id}-${index}`}
                          className="flex items-center justify-between py-2"
                        >
                          <div
                            className={`flex items-center gap-3 cursor-pointer flex-1 p-1 rounded transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-1 ${checked ? "border border-[var(--primary)] bg-[var(--primary-tint)]" : "border border-transparent hover:bg-[var(--primary)]/5"}`}
                            onClick={() => toggleSelected(u.id)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                toggleSelected(u.id);
                              }
                            }}
                            tabIndex={0}
                            role="checkbox"
                            aria-checked={selectedUsers.includes(u.id)}
                            aria-label={u.name}
                          >
                            <div className="relative h-8 w-8 rounded-full bg-[#EEF2FF] text-[#6366F1] flex items-center justify-center font-semibold text-xs shrink-0 font-['Poppins'] select-none overflow-hidden">
                              <span>{(u.name || 'U').charAt(0).toUpperCase()}</span>
                              {u.avatar && u.avatar !== '/assets/pngegg.png' ? (
                                <img
                                  src={u.avatar}
                                  alt={u.name}
                                  className="absolute inset-0 w-full h-full object-cover"
                                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                />
                              ) : null}
                              {selectedUsers.includes(u.id) && (
                                <div className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full bg-[var(--primary)] flex items-center justify-center shadow-sm border border-white translate-x-[10%] translate-y-[10%] z-10">
                                  <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="20 6 9 17 4 12" />
                                  </svg>
                                </div>
                              )}
                            </div>
                            <div className="flex flex-col text-left">
                              <div className="text-[14px] text-[var(--foreground)] font-normal font-['Poppins'] flex items-center gap-1.5">
                                <span>{u.name}</span>
                                {u.type === 'COMPANY' && (
                                  <span className="text-[10px] bg-[var(--primary-tint)] text-[var(--primary)] font-medium px-1.5 py-0.5 rounded-full">
                                    Company
                                  </span>
                                )}
                                {u.type === 'GROUP' && (
                                  <span className="text-[10px] bg-emerald-50 text-emerald-700 font-medium px-1.5 py-0.5 rounded-full">
                                    Group
                                  </span>
                                )}
                              </div>
                              {u.headline && (
                                <div className="text-[11px] text-[var(--muted-foreground)] font-['Poppins'] truncate max-w-[200px]">
                                  {u.headline}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}

                  {isSearchingApi && searchResults.length > 0 && (
                    <div className="flex justify-center py-2 w-full">
                      <Icon icon="line-md:loading-twotone-loop" className="w-4 h-4 text-[var(--primary)]" />
                    </div>
                  )}
                </div>
              )}

              {selectedUsers.length > 0 ? (
                <div className="mt-auto pt-4 border-t border-[var(--border)]">
                  <button
                    type="button"
                    onClick={handleSendClick}
                    disabled={isSending}
                    className="w-full h-[48px] rounded-[24px] font-['Poppins'] font-normal text-[14px] text-white bg-[#6366F1] hover:opacity-95 transition-opacity cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSending ? "Sending..." : "Send"}
                  </button>
                </div>
              ) : (
                !isSearching && (
                  <div className="mt-auto pt-4 border-t border-[var(--border)]">
                    <div className="flex items-center justify-around">
                      {shareOptions.map((opt) => (
                        <button
                          key={opt.label}
                          type="button"
                          onClick={opt.onClick}
                          className="h-10 w-10 flex items-center justify-center hover:bg-[var(--primary-tint)] transition-colors rounded-full group cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-1"
                          aria-label={opt.label}
                          title={opt.label}
                        >
                          <span className="text-[var(--foreground)] group-hover:text-white">{opt.icon}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )
              )}
            </div>
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>
    </>
  );
}
