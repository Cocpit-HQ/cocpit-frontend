import React, { useRef, useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface User {
  user_id?: string;
  id?: string;
  avatar_url?: string;
  full_name?: string;
  account_name?: string;
}

interface CocpitSelectedUserChipsProps {
  users: User[];
  onRemove: (userId: string) => void;
  className?: string;
  maxContainerWidth?: string;
}

export const CocpitSelectedUserChips: React.FC<
  CocpitSelectedUserChipsProps
> = ({ users, onRemove, className = "", maxContainerWidth = "368px" }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = useCallback(() => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 1);
      setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 1);
    }
  }, []);

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const { scrollLeft } = scrollRef.current;
      const scrollTo =
        direction === "left" ? scrollLeft - 150 : scrollLeft + 150;
      scrollRef.current.scrollTo({ left: scrollTo, behavior: "smooth" });
    }
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener("resize", checkScroll);
    return () => window.removeEventListener("resize", checkScroll);
  }, [users, checkScroll]);

  if (users.length === 0) return null;

  return (
    <div
      className={`relative w-full flex items-center group/scroll ${className}`}
      style={{ maxWidth: maxContainerWidth }}
    >
      {canScrollLeft && (
        <button
          onClick={() => scroll("left")}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-20 w-6 h-6 bg-white/80 backdrop-blur-sm shadow-sm rounded-full flex items-center justify-center border border-gray-200 hover:bg-white transition-all -ml-2"
        >
          <ChevronLeft className="w-4 h-4 text-[#6366F1]" />
        </button>
      )}
      <div
        ref={scrollRef}
        onScroll={checkScroll}
        className="w-full flex flex-row items-center p-0 gap-[8px] overflow-x-auto overflow-y-hidden whitespace-nowrap flex-nowrap mb-0 scrollbar-hide"
        style={{
          scrollbarWidth: "none",
          msOverflowStyle: "none",
        }}
      >
        <style
          dangerouslySetInnerHTML={{
            __html: `
          .scrollbar-hide::-webkit-scrollbar {
            display: none;
          }
        `,
          }}
        />
        {users.map((user) => (
          <div
            key={user.user_id || user.id}
            className="h-[36px] bg-[#EEF2FF] rounded-[8px] flex flex-row items-center p-[6px_8px] gap-[6px] w-fit max-w-[120px] shrink-0"
          >
            <div className="w-[20px] h-[20px] rounded-full overflow-hidden shrink-0">
              {user.avatar_url ? (
                <img
                  src={user.avatar_url}
                  className="w-full h-full object-cover"
                  alt={user.full_name || "User"}
                />
              ) : (
                <div className="w-full h-full bg-[#E5E7EB] flex items-center justify-center text-[10px] text-gray-500 font-['Poppins']">
                  {(user.full_name || user.account_name || "?")
                    .substring(0, 1)
                    .toUpperCase()}
                </div>
              )}
            </div>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span
                    title={user.full_name || user.account_name}
                    className="font-['Poppins'] font-normal text-[12px] leading-[16px] text-[#6366F1] whitespace-nowrap overflow-hidden text-ellipsis max-w-[60px] shrink"
                  >
                    {user.full_name || "cocpit user"}
                  </span>
                </TooltipTrigger>
                <TooltipContent className="font-['Poppins'] font-normal text-[11px] rounded-[4px] p-[4px_8px] border-none">
                  <p>{user.account_name || "cocpit user"}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <button
              onClick={() => onRemove((user.user_id || user.id)!)}
              className="w-[16px] h-[16px] border-[1.5px] border-[#6366F1] rounded-full flex items-center justify-center shrink-0 cursor-pointer"
            >
              <X className="w-[10px] h-[10px] text-[#6366F1]" />
            </button>
          </div>
        ))}
      </div>
      {canScrollRight && (
        <button
          onClick={() => scroll("right")}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-20 w-6 h-6 bg-white/80 backdrop-blur-sm shadow-sm rounded-full flex items-center justify-center border border-gray-200 hover:bg-white transition-all -mr-2"
        >
          <ChevronRight className="w-4 h-4 text-[#6366F1]" />
        </button>
      )}
    </div>
  );
};
