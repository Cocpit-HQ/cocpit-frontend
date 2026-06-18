"use client";

import React from "react";
import { Icon } from "@iconify/react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface TaggedPeoplePopoverProps {
  tags: any[];
}

export function TaggedPeoplePopover({ tags }: TaggedPeoplePopoverProps) {
  if (!tags || tags.length === 0) return null;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="p-1 hover:bg-secondary rounded-full transition-colors outline-none text-[#000000] data-[state=open]:text-primary">
          <Icon icon="la:user-tag" className="w-[24px] h-[24px]" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[180px] p-2 bg-card border border-border rounded-tl-[24px] rounded-bl-[24px] rounded-br-[24px] rounded-tr-[0px] shadow-lg overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] z-[210]"
        align="end"
        sideOffset={8}
      >
        <div className="flex flex-col gap-1">
          {tags.map((tag: any, idx: number) => (
            <div key={idx} className="flex items-center gap-3 px-3 py-2 hover:bg-muted rounded-[12px] transition-colors cursor-pointer">
              <div className="w-8 h-8 min-w-[32px] min-h-[32px] aspect-square rounded-full border border-border flex items-center justify-center overflow-hidden bg-muted flex-shrink-0">
                {tag.avatar_url || tag.avatar ? (
                  <img src={tag.avatar_url || tag.avatar} alt="" className="w-full h-full object-cover rounded-full" />
                ) : (
                  <Icon icon="solar:user-linear" className="w-4 h-4 text-muted-foreground" />
                )}
              </div>
              <span className="text-[14px] leading-[20px] font-normal text-foreground font-[family-name:var(--font-poppins)] transition-colors">
                {tag.full_name || tag.name}
              </span>
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
