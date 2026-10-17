"use client"

import React from "react"
import { ChevronDown } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export type ChatFilterOption = 'All' | 'Groups'

interface ChatFilterDropdownProps {
  value: ChatFilterOption
  onChange: (value: ChatFilterOption) => void
}

export function ChatFilterDropdown({ value, onChange }: ChatFilterDropdownProps) {
  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <button className="flex flex-row justify-center items-center px-[8px] py-[4px] gap-[2px] h-[28px] bg-[#FFFFFF] border border-[#C7D2FE] rounded-[100px] outline-none">
          <span className="font-['Poppins'] font-normal text-[14px] leading-[20px] text-[#000000]">
            {value}
          </span>
          <ChevronDown className="w-[18px] h-[18px] text-[#000000]" strokeWidth={1.5} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent id="chat-filter-dropdown" align="end" className="flex flex-col items-start p-[8px] gap-[4px] min-w-[67px] min-h-[60px] bg-[#FFFFFF] border border-[#C7D2FE] rounded-[12px] shadow-sm z-[100]">
        <DropdownMenuItem 
            className={`w-full justify-start font-['Poppins'] font-normal text-[14px] leading-[20px] rounded-[8px] cursor-pointer outline-none ${value === 'All' ? 'text-[#6366F1]' : 'text-[#000000]'}`}
            onSelect={() => onChange('All')}
        >
          All
        </DropdownMenuItem>
        <DropdownMenuItem 
            className={`w-full justify-start font-['Poppins'] font-normal text-[14px] leading-[20px] rounded-[8px] cursor-pointer outline-none ${value === 'Groups' ? 'text-[#6366F1]' : 'text-[#000000]'}`}
            onSelect={() => onChange('Groups')}
        >
          Groups
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
