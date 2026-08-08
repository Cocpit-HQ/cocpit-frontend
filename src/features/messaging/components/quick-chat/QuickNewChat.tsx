import React, { useState, useEffect, useRef, useCallback } from "react";
import { Search, X, Loader2, ChevronLeft } from "lucide-react";
import { searchUsersForMessaging } from "@/services/api/messaging";

interface QuickNewChatProps {
  onBack: () => void;
  onClose: () => void;
  onSelectUser: (user: any) => void;
}

export function QuickNewChat({ onBack, onClose, onSelectUser }: QuickNewChatProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchCursor, setSearchCursor] = useState<string | null>(null);
  const [hasMoreUsers, setHasMoreUsers] = useState(false);
  
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const runSearch = useCallback(
    async (query: string, cursor?: string, append = false) => {
      setIsSearching(true);
      try {
        const result = await searchUsersForMessaging(
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
      } catch (err) {
        console.error("Search error", err);
      } finally {
        setIsSearching(false);
      }
    },
    []
  );

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setSearchResults([]);
      setSearchCursor(null);
      setHasMoreUsers(false);
      runSearch(searchTerm);
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchTerm, runSearch]);

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
    [handleLoadMore]
  );

  return (
    <div className="flex flex-col h-full bg-white rounded-[12px]">
      {/* Header */}
      <div 
        className="flex justify-between items-center p-4 bg-white rounded-t-[12px] cursor-grab active:cursor-grabbing shrink-0 h-[56px]"
        style={{ touchAction: "none" }}
      >
        <div className="flex items-center gap-2" onPointerDown={(e) => e.stopPropagation()}>
          <button onClick={onBack} className="text-black hover:opacity-70 transition-opacity flex items-center justify-center p-1 -ml-1">
            <ChevronLeft className="w-6 h-6" strokeWidth={1.5} />
          </button>
          <h3 className="font-['Poppins'] font-medium text-[16px] leading-[24px] text-[#0B1C30] select-none">New message</h3>
        </div>
        <button onClick={onClose} onPointerDown={(e) => e.stopPropagation()} className="text-black hover:opacity-70 transition-opacity w-6 h-6 flex items-center justify-center">
          <X className="w-6 h-6" strokeWidth={1.5} />
        </button>
      </div>

      {/* Search Bar Container */}
      <div className="p-2 shrink-0 flex flex-col gap-[10px]">
        <div className="w-full h-[40px] px-[16px] py-[8px] flex flex-row justify-between items-center gap-[8px] border border-[#6B7280] rounded-[24px] bg-white">
          <input
            placeholder="Search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-transparent border-none outline-none text-[16px] leading-[24px] font-['Poppins'] placeholder:text-[#6B7280] text-black"
          />
          <Search className="w-6 h-6 text-[#6B7280]" />
        </div>
      </div>

      {/* User List */}
      <div
        ref={listRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-4 pb-2 scrollbar-hide flex flex-col gap-2"
      >
        {isSearching && searchResults.length === 0 ? (
          <div className="flex flex-col items-center justify-center w-full h-32 gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-[#6366F1]" />
          </div>
        ) : searchResults.length === 0 ? (
          <div className="flex flex-col items-center justify-center w-full h-32 text-center">
            <p className="text-sm font-['Poppins'] text-[#6B7280]">
              {searchTerm.length === 0 ? "Type to search for users" : "No users found"}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-[8px]">
            {searchResults.map((user: any) => {
              const userId = user.user_id || user.id;
              return (
                <div
                  key={userId}
                  onClick={() => onSelectUser(user)}
                  className="flex flex-row items-center py-2 h-[48px] gap-[16px] cursor-pointer hover:bg-[#F9FAFB] rounded-lg transition-colors group"
                >
                  <div className="relative w-[32px] h-[32px] rounded-full bg-[#EEF2FF] text-[#6366F1] flex items-center justify-center font-semibold text-xs overflow-hidden shrink-0 select-none border-[1.5px] border-[#6366F1]">
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
                  <span className="font-['Poppins'] font-normal text-[16px] leading-[24px] text-[#000000] truncate">
                    {user.full_name || user.account_name || "cocpit user"}
                  </span>
                </div>
              );
            })}
            {isSearching && searchResults.length > 0 && (
              <div className="flex justify-center py-2 w-full">
                <Loader2 className="w-4 h-4 animate-spin text-[#6366F1]" />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
