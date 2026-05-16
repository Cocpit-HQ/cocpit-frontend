"use client";

import React, { useMemo, useState } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X, Mail, Facebook, Search, User, Briefcase } from "lucide-react";
import { Icon } from "@iconify/react";
import { useRouter } from "next/navigation";
import { useSocial } from "@/context/SocialContext";

export interface CocpitShareProfileProps {
  isOpen: boolean;
  onClose: () => void;
  users: { id: string; name: string; avatar?: string; slug?: string }[];
  onShare?: (selectedIds: string[]) => void;
}

export default function CocpitShareProfile({
  isOpen,
  onClose,
  users,
  onShare,
}: CocpitShareProfileProps) {
  const router = useRouter();
  const { startChat } = useSocial();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

  const isSearching = searchTerm.length > 0;

  const filteredUsers = useMemo(() => {
    if (!searchTerm.trim()) return users;
    const lowered = searchTerm.toLowerCase();
    return users.filter((u) => u.name.toLowerCase().includes(lowered));
  }, [searchTerm, users]);

  const handleClose = () => {
    setSearchTerm("");
    setSelectedUsers([]);
    onClose();
  };

  const toggleSelected = (id: string) => {
    setSelectedUsers((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const canShare = selectedUsers.length > 0;

  const shareOptions = useMemo(
    () => [
      { key: "business", label: "Business", icon: <Icon icon="ic:outline-business-center" className="w-6 h-6 text-black dark:text-white group-hover:text-white" /> },
      { key: "email", label: "Email", icon: <Icon icon="lucide:mail" className="w-6 h-6 text-black dark:text-white group-hover:text-white" style={{ strokeWidth: 1 }} /> },
      { key: "whatsapp", label: "WhatsApp", icon: <Icon icon="teenyicons:whatsapp-outline" className="w-6 h-6 text-black dark:text-white group-hover:text-white" /> },
      { key: "facebook", label: "Facebook", icon: <Icon icon="teenyicons:facebook-outline" className="w-6 h-6 text-black dark:text-white group-hover:text-white" /> },
    ],
    [],
  );

  return (
    <DialogPrimitive.Root
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) handleClose();
      }}
    >
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-[9998] bg-black/40 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content className="fixed left-1/2 top-1/2 z-[9999] w-[420px] h-[506px] -translate-x-1/2 -translate-y-1/2 rounded-[24px] bg-white dark:bg-[#0B1120] border border-border dark:border-[#334155] p-[16px] shadow-2xl outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 flex flex-col">
          <div className="flex items-start justify-between gap-4">
            <div className="flex flex-col items-center flex-1">
              <DialogPrimitive.Title className="text-[18px] font-semibold text-[#111827] dark:text-[#F9FAFB] font-['Poppins']">
                Share
              </DialogPrimitive.Title>
              <DialogPrimitive.Description className="mt-1 text-[12px] text-[#6B7280] dark:text-[#9CA3AF] font-normal font-['Poppins']">
                Share this with others
              </DialogPrimitive.Description>
            </div>
            <button
              type="button"
              onClick={handleClose}
              className="h-8 w-8 rounded-full flex items-center justify-center hover:bg-black/5 transition-colors"
              aria-label="Close"
            >
              <X className="h-5 w-5 text-[#FF6B6B]" strokeWidth={1} />
            </button>
          </div>

          <div className="mt-4">
            <div className="relative">
              <input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search"
                className="w-full h-[42px] rounded-full border border-[#E5E7EB] dark:border-[#334155] bg-white dark:bg-[#1E293B] px-4 pr-11 text-[14px] text-[#374151] dark:text-[#F9FAFB] font-['Poppins'] outline-none focus:ring-2 focus:ring-[#6366F1]/30 focus:border-[#6366F1]"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] dark:text-[#9CA3AF]">
                <Search className="w-5 h-5" strokeWidth={1.5} />
              </div>
            </div>

            {!isSearching ? (
              <>
                <div className="mt-5 grid grid-cols-3 gap-4 text-center max-h-[280px] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] pb-2">
                  {users.map((u, index) => (
                    <div 
                      key={`${u.id}-${index}`} 
                      className="flex flex-col items-center cursor-pointer hover:bg-gray-50 dark:hover:bg-[#1E293B] rounded-lg p-2 transition-colors relative"
                      onClick={() => toggleSelected(u.id)}
                    >
                      <div className="relative h-12 w-12">
                        <div className="h-full w-full rounded-full overflow-hidden bg-[#EEF2FF] dark:bg-[#1E293B] flex items-center justify-center">
                          {u.avatar ? (
                            <img
                              src={u.avatar}
                              alt={u.name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <User className="w-6 h-6 text-[#6366F1]" strokeWidth={1.5} />
                          )}
                        </div>
                        {selectedUsers.includes(u.id) && (
                          <div className="absolute bottom-0 right-0 h-4.5 w-4.5 rounded-[4px] bg-[#6366F1] flex items-center justify-center shadow-sm border border-white translate-x-[10%] translate-y-[10%] z-10">
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          </div>
                        )}
                      </div>
                      <div className="mt-2 text-[12px] text-[#374151] dark:text-[#F9FAFB] font-medium font-['Poppins'] text-center line-clamp-1">
                        {u.name}
                      </div>
                    </div>
                  ))}
                </div>

                {!canShare && (
                  <div className="mt-5 border-t border-[#E5E7EB] dark:border-[#334155] pt-4">
                    <div className="flex items-center justify-around">
                      {shareOptions.map((opt) => (
                        <button
                          key={opt.key}
                          type="button"
                          className="h-10 w-10 flex items-center justify-center hover:bg-[#C7D2FE] transition-colors rounded-full group"
                          aria-label={opt.label}
                          title={opt.label}
                        >
                          <span className="text-[#111827] dark:text-[#F9FAFB] group-hover:text-white">{opt.icon}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="mt-5 max-h-[280px] overflow-auto pr-1">
                {filteredUsers.length === 0 ? (
                  <div className="py-8 text-center text-[13px] text-[#6B7280] dark:text-[#9CA3AF] font-['Poppins']">
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
                          className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-[#1E293B] flex-1 p-1 rounded transition-colors"
                          onClick={() => toggleSelected(u.id)}
                        >
                          <div className="relative h-8 w-8 rounded-full overflow-hidden bg-[#EEF2FF] dark:bg-[#1E293B] flex items-center justify-center shrink-0">
                            {u.avatar ? (
                              <img
                                src={u.avatar}
                                alt={u.name}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <User className="w-6 h-6 text-[#6366F1]" strokeWidth={1.5} />
                            )}
                            {selectedUsers.includes(u.id) && (
                              <div className="absolute inset-0 bg-black/10 flex items-center justify-center">
                                <div className="h-3 w-3 rounded bg-[#6366F1] flex items-center justify-center shadow-sm border border-white">
                                  <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="20 6 9 17 4 12" />
                                  </svg>
                                </div>
                              </div>
                            )}
                          </div>
                          <div className="text-[14px] text-[#374151] dark:text-[#F9FAFB] font-normal font-['Poppins']">
                            {u.name}
                          </div>
                        </div>
                        <label className="flex items-center cursor-pointer select-none">
                          <input
                            type="checkbox"
                            className="h-4 w-4 accent-[#6366F1]"
                            checked={checked}
                            onChange={() => toggleSelected(u.id)}
                          />
                        </label>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {canShare && (
              <div className="mt-auto pt-4 border-t border-[#E5E7EB] dark:border-[#334155]">
                <button
                  type="button"
                  onClick={() => {
                    onShare?.(selectedUsers);
                    handleClose(); // Close after sending
                  }}
                  className="w-full h-[44px] rounded-full font-['Poppins'] text-[14px] font-medium text-white bg-gradient-to-r from-[#6366F1] to-[#818CF8] hover:opacity-95 transition-opacity"
                >
                  Send
                </button>
              </div>
            )}
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
