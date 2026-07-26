import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogTitle
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { searchUsersForMessaging } from "@/services/api/messaging";
import { CocpitSelectedUserChips } from "@/shared/commonComponents/CocpitSelectedUserChips";
import { Check, Loader2, Search, X } from "lucide-react";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useGroupChat } from "./groupChat.context";

interface AddMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInvite: (userId: string) => void;
}

export default function AddMemberModal({
  isOpen,
  onClose,
  onInvite,
}: AddMemberModalProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const { activeGroup } = useGroupChat();
  const { toast } = useToast();

  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchCursor, setSearchCursor] = useState<string | null>(null);
  const [hasMoreUsers, setHasMoreUsers] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [selectedUsersData, setSelectedUsersData] = useState<any[]>([]);

  useEffect(() => {
    const currentResultsSelected = searchResults.filter((u) =>
      selectedUserIds.includes(u.user_id || u.id),
    );
    setSelectedUsersData((prev) => {
      const filtered = prev.filter((u) =>
        selectedUserIds.includes(u.user_id || u.id),
      );
      const newOnes = currentResultsSelected.filter(
        (u) =>
          !filtered.some((f) => (f.user_id || f.id) === (u.user_id || u.id)),
      );
      return [...filtered, ...newOnes];
    });
  }, [selectedUserIds, searchResults]);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const runSearch = useCallback(
    async (query: string, cursor?: string, append = false) => {
      setIsSearching(true);
      setSearchError(null);
      try {
        const result = await searchUsersForMessaging(
          query || undefined,
          cursor,
          20,
        );
        setSearchResults((prev) => {
          const combined = append ? [...prev, ...result.data] : result.data;
          // Deduplicate by user_id or id
          const unique = Array.from(
            new Map(combined.map((u) => [u.user_id || u.id, u])).values(),
          );
          return unique;
        });
        setSearchCursor(result.nextCursor);
        setHasMoreUsers(result.hasMore);
      } catch (err: any) {
        const msg =
          err?.response?.data?.message ||
          err?.message ||
          "Failed to search users";
        setSearchError(msg);
        toast({ title: "Error", description: msg, variant: "destructive" });
      } finally {
        setIsSearching(false);
      }
    },
    [toast],
  );

  useEffect(() => {
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
  }, [searchTerm, isOpen, runSearch]);

  const handleLoadMore = useCallback(() => {
    if (!hasMoreUsers || isSearching) return;
    runSearch(searchTerm, searchCursor ?? undefined, true);
  }, [hasMoreUsers, isSearching, searchTerm, searchCursor, runSearch]);

  const handleScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      const el = e.currentTarget;
      const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 60;
      if (nearBottom) handleLoadMore();
    },
    [handleLoadMore],
  );

  const toggleUserSelection = (userId: string) => {
    setSelectedUserIds((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId],
    );
  };

  const handleConfirm = () => {
    selectedUserIds.forEach((id) => onInvite(id));
    setSelectedUserIds([]);
    setSearchTerm("");
    onClose();
  };

  const handleCancel = () => {
    setSelectedUserIds([]);
    setSearchTerm("");
    onClose();
  };

  const users = searchResults;
  const isLoading = isSearching && searchResults.length === 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="
          shadow-none border-none outline-none
          p-0 !gap-0 [&>button]:hidden
          fixed bottom-0 top-auto left-0 right-0 translate-x-0 translate-y-0 w-full max-w-full h-[85dvh] rounded-t-[24px] rounded-b-none
          data-[state=open]:animate-in data-[state=open]:slide-in-from-bottom data-[state=open]:duration-300
          sm:left-[50%] sm:top-[50%] sm:right-auto sm:bottom-auto sm:translate-x-[-50%] sm:translate-y-[-50%] sm:w-[400px] sm:h-[620px] sm:rounded-[24px] sm:max-w-[400px]
          data-[state=open]:sm:animate-in data-[state=open]:sm:fade-in-90 data-[state=open]:sm:zoom-in-95 data-[state=open]:sm:slide-in-from-bottom-0
        "
      >
        <div
          className="
            w-full h-full flex flex-col items-center
            pt-[10px] px-[16px] pb-[16px]
            rounded-t-[24px] rounded-b-none sm:rounded-[24px]
            overflow-hidden bg-white
          "
        >
          {/* CLOSE ICON ROW */}
          <div className=" flex flex-col items-end flex-none order-0 self-stretch grow-0">
            <button
              onClick={handleCancel}
              className="relative w-6 h-6 flex items-center justify-center hover:bg-gray-50 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-[#F87171]" />
            </button>
          </div>

          {/* INNER BOX */}
          <div
            className="w-full max-w-[368px] py-[8px] px-0 flex flex-col items-center rounded-[24px] bg-white"
            style={{
              filter: "drop-shadow(0px 0px 4px rgba(99, 102, 241, 0.05))",
            }}
          >
            {/* HEADER TITLE */}
            <DialogTitle className="w-[130px] h-[26px] font-['Poppins'] font-medium text-[18px] leading-[26px] text-center text-black flex-none order-0 grow-0 mt-[8px]">
              Add members
            </DialogTitle>
            <DialogDescription className="sr-only">
              Search and select users to add to the group chat.
            </DialogDescription>

            {/* SEARCH BOX */}
            <div className="w-full max-w-[368px] h-[40px] px-[16px] py-[8px] flex flex-row justify-between items-center gap-[10px] border border-[#6B7280] rounded-[24px] flex-none grow-0 mt-[16px] box-border">
              <input
                placeholder="Search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-transparent border-none outline-none text-[14px] font-['Poppins'] placeholder:text-[#6B7280] text-black"
              />
              <Search className="w-4 h-4 text-[#6B7280] flex-none" />
            </div>

            {/* SELECTED USERS ROW */}
            <CocpitSelectedUserChips
              users={selectedUsersData}
              onRemove={toggleUserSelection}
              className="mt-[8px]"
            />

            {/* USER LIST CONTAINER */}
            <div
              ref={listRef}
              onScroll={handleScroll}
              className="w-full max-w-[368px] h-[350px] flex flex-col items-start p-0 gap-[8px] flex-none mt-[16px] overflow-y-auto scrollbar-hide"
            >
              {isLoading ? (
                <div className="flex flex-col items-center justify-center w-full h-full gap-2">
                  <Loader2 className="w-6 h-6 animate-spin text-[#6366F1]" />
                  <p className="text-xs text-[#6B7280] font-['Poppins']">
                    Searching users...
                  </p>
                </div>
              ) : users.length === 0 ? (
                <div className="flex flex-col items-center justify-center w-full h-full text-center">
                  <p className="text-sm text-[#6B7280] font-['Poppins']">
                    {searchTerm.length === 0
                      ? "Type to search for users"
                      : "No users found"}
                  </p>
                </div>
              ) : (
                users
                  .filter(
                    (user: any) =>
                      !activeGroup?.members?.some(
                        (m: any) => m.user_id === (user.user_id || user.id),
                      ),
                  )
                  .map((user: any) => (
                    <div
                      key={user.user_id || user.id}
                      onClick={() =>
                        toggleUserSelection(user.user_id || user.id)
                      }
                      className="w-full h-[48px] flex flex-row justify-between items-center p-0 gap-[16px] flex-none order-0 self-stretch grow-0 mb-[8px] cursor-pointer hover:bg-[#F9FAFB] rounded-lg transition-colors group"
                    >
                      <div className="flex flex-row items-center gap-[8px]">
                        <div className="relative w-[32px] h-[32px] rounded-full bg-[#EEF2FF] text-[#6366F1] flex items-center justify-center font-semibold text-xs overflow-hidden flex-none font-['Poppins'] select-none">
                          <span>{(user.full_name || user.account_name || "U").charAt(0).toUpperCase()}</span>
                          {user.avatar_url && user.avatar_url !== '/assets/pngegg.png' ? (
                            <img
                              src={user.avatar_url}
                              alt={user.full_name}
                              className="absolute inset-0 w-full h-full object-cover"
                              onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                            />
                          ) : null}
                        </div>
                        <span className="font-['Poppins'] font-normal text-[16px] leading-[24px] text-black flex-none order-0 grow-0 whitespace-nowrap py-[4px]">
                          {user.full_name || user.account_name || "cocpit user"}
                        </span>
                      </div>

                      {/* CHECKBOX */}
                      <div className="relative w-[40px] h-[40px]  flex-none order-1 grow-0 z-10">
                        <div
                          className={cn(
                            "absolute inset-0 rounded-[4px] m-[10px] border flex items-center justify-center transition-all",
                            selectedUserIds.includes(user.user_id || user.id)
                              ? "bg-[#6366F1] border-[#6366F1]"
                              : "border-[#6B7280] bg-white",
                          )}
                        >
                          {selectedUserIds.includes(
                            user.user_id || user.id,
                          ) && <Check className="   text-white " />}
                        </div>
                      </div>
                    </div>
                  ))
              )}
              {isSearching && users.length > 0 && (
                <div className="flex justify-center py-2 w-full">
                  <Loader2 className="w-4 h-4 animate-spin text-[#6366F1]" />
                </div>
              )}
            </div>

            {/* ACTION BUTTONS ROW */}
            <div className="w-full max-w-[300px] h-[40px] flex flex-row items-start p-0 gap-[16px] flex-none order-3 grow-0 mt-[16px] mb-[8px] mx-auto">
              {/* CANCEL BUTTON */}
              <button
                onClick={handleCancel}
                className="w-[142px] h-[40px] bg-white border border-[#818CF8] rounded-[24px] flex flex-row justify-center items-center p-[8px_16px] gap-[10px] flex-none order-0 grow text-[#818CF8] font-['Poppins'] font-normal text-[14px] leading-[20px] text-center transition-colors hover:bg-[#F3F4FF]"
              >
                Cancel
              </button>
              {/* ADD PEOPLE BUTTON */}
              <button
                onClick={handleConfirm}
                disabled={selectedUserIds.length === 0}
                className={cn(
                  "w-[142px] h-[40px] border border-white rounded-[24px] flex flex-row justify-center items-center p-[8px_16px] gap-[10px] flex-none order-1 grow text-white font-['Poppins'] font-normal text-[14px] leading-[20px] text-center transition-all",
                  selectedUserIds.length > 0
                    ? "bg-[#6366F1] cursor-pointer hover:bg-[#5254E2]"
                    : "bg-[#C7D2FE] cursor-not-allowed",
                )}
              >
                <span className="w-[81px] h-[20px] flex items-center justify-center">
                  Add people
                </span>
              </button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
