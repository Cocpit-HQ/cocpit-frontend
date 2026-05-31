"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Search, X } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { searchUsers, getSuggestedUsers, UserMention } from "@/services/api/users";
import debounce from "lodash.debounce";

interface TagPeopleSelectorProps {
    taggedUsers: UserMention[];
    onTaggedUsersChange: (users: UserMention[]) => void;
    onCancel: () => void;
    onConfirm: () => void;
}

export function TagPeopleSelector({
    taggedUsers,
    onTaggedUsersChange,
    onCancel,
    onConfirm,
}: TagPeopleSelectorProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<UserMention[]>([]);

    const loadInitialUsers = useCallback(async () => {
        try {
            const suggested = await getSuggestedUsers();
            setSearchResults(suggested);
        } catch (err) {
            console.error("Failed to load suggested users", err);
        }
    }, []);

    const debouncedSearch = useCallback(
        debounce(async (query: string) => {
            if (!query.trim()) {
                loadInitialUsers();
                return;
            }
            try {
                const results = await searchUsers(query);
                setSearchResults(results);
            } catch (err) {
                console.error("User search failed", err);
            }
        }, 300),
        [loadInitialUsers]
    );

    useEffect(() => {
        loadInitialUsers();
    }, [loadInitialUsers]);

    const handleSearchChange = (query: string) => {
        setSearchQuery(query);
        debouncedSearch(query);
    };

    const toggleUserTag = (user: UserMention) => {
        const exists = taggedUsers.find(u => u.id === user.id);
        if (exists) {
            onTaggedUsersChange(taggedUsers.filter(u => u.id !== user.id));
        } else {
            onTaggedUsersChange([...taggedUsers, user]);
        }
    };

    return (
        <div className="w-[400px] h-[624px] bg-white dark:bg-[#1a1a2e] rounded-[24px] p-4 flex flex-col items-center shadow-xl font-poppins border border-border dark:border-[#2a2a4a]">

            <DialogHeader className="sr-only">
                <DialogTitle>Tag People</DialogTitle>
                <DialogDescription>Search and select people to tag in your post.</DialogDescription>
            </DialogHeader>

            {/* Top close button — 368×24px per Figma */}
            <div className="w-[368px] h-6 flex justify-end items-center mb-2.5 shrink-0">
                <button
                    onClick={onCancel}
                    className="w-6 h-6 flex items-center justify-center text-[#FF6B6B] hover:bg-[#FF6B6B]/10 rounded-full transition-colors"
                    aria-label="Close"
                >
                    <X size={18} strokeWidth={2.5} />
                </button>
            </div>

            {/* Main content container — 368px wide, fills remaining height */}
            <div className="w-[368px] flex-1 flex flex-col gap-4 min-h-0">

                {/* Search input */}
                <div className="h-10 relative shrink-0">
                    <input
                        type="text"
                        placeholder="Search"
                        value={searchQuery}
                        onChange={(e) => handleSearchChange(e.target.value)}
                        className="w-full h-full bg-card border border-[#6B7280] rounded-[24px] px-4 pr-10 text-[16px] font-medium font-poppins focus:outline-none placeholder:text-[#6B7280] text-black dark:text-white"
                    />
                    <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-[#6B7280] w-5 h-5 pointer-events-none" />
                </div>

                {/* Chips row */}
                {taggedUsers.length > 0 && (
                    <div className="h-10 flex gap-4 overflow-x-auto shrink-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                        {taggedUsers.map(user => (
                            <div
                                key={user.id}
                                className="flex items-center gap-2 h-10 px-4 bg-[#EEF2FF] border border-[#EEF2FF] rounded-lg shrink-0"
                            >
                                <span className="text-[#6366F1] text-sm font-medium font-roboto leading-5 tracking-tight">
                                    {user.full_name}
                                </span>
                                <button
                                    onClick={() => toggleUserTag(user)}
                                    className="text-[#6366F1] w-4 h-4 flex items-center justify-center"
                                    aria-label={`Remove ${user.full_name}`}
                                >
                                    <X size={12} strokeWidth={2.5} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {/* User list — scrollable, fills remaining space */}
                <div className="flex-1 overflow-y-auto min-h-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                    <div className="flex flex-col gap-2">
                        {searchResults.map(user => {
                            const isSelected = taggedUsers.some(u => u.id === user.id);
                            return (
                                <div
                                    key={user.id}
                                    onClick={() => toggleUserTag(user)}
                                    className="flex items-center justify-between h-12 px-2 rounded-xl cursor-pointer hover:bg-slate-50 dark:hover:bg-[#2a2a4a]/50 transition-colors"
                                >
                                    <div className="flex items-center gap-2 min-w-0">
                                        <Avatar className="w-8 h-8 flex-shrink-0 border border-[#6366F1]/20">
                                            <AvatarImage src={user.avatar_url} />
                                            <AvatarFallback className="text-sm font-medium bg-[#EEF2FF] text-[#6366F1]">
                                                {user.full_name?.[0]}
                                            </AvatarFallback>
                                        </Avatar>
                                        <span className="text-[16px] font-normal font-poppins text-black dark:text-white truncate">
                                            {user.full_name}
                                        </span>
                                    </div>

                                    {/* Checkbox — 48×48 click target, 18×18 visual */}
                                    <div className="w-12 h-12 flex items-center justify-center flex-shrink-0">
                                        <div className={cn(
                                            "w-[18px] h-[18px] rounded-[2px] border transition-colors flex items-center justify-center",
                                            isSelected
                                                ? "bg-[#6366F1] border-[#6366F1]"
                                                : "bg-card border-border"
                                        )}>
                                            {isSelected && (
                                                <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                                                    <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                                                </svg>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Footer — 368×40px per Figma */}
                <div className="h-10 flex gap-4 justify-center items-center shrink-0">
                    <button
                        onClick={onCancel}
                        className="w-[142px] h-10 rounded-[24px] border border-[#818CF8] bg-white dark:bg-[#1a1a2e] text-[#818CF8] text-sm font-normal font-poppins leading-5 hover:bg-slate-50 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={taggedUsers.length === 0}
                        className="w-[142px] h-10 rounded-[24px] bg-[#6366F1] border border-white text-white text-sm font-normal font-poppins leading-5 hover:bg-[#6366F1]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Add people
                    </button>
                </div>

            </div>
        </div>
    );
}
