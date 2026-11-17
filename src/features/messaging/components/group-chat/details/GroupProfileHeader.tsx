"use client";

import React from "react";
import Image from "next/image";
import {
    LeftArrowIcon,
    GroupActionAddIcon,
    GroupActionSearchIcon,
    GroupActionBellIcon,
    GroupActionMoreIcon
} from "@/components/icons";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
    PopoverClose
} from "@/components/ui/popover";
import { GroupDetails } from "@/types/group-chat";
import { MAX_GROUP_MEMBERS } from "@/constants/messaging";

interface GroupProfileHeaderProps {
    activeGroup: GroupDetails;
    memberCount: number;
    isAdmin: boolean;
    onBack: () => void;
    onEditClick: () => void;
    onAddMember: () => void;
    onSearchClick: () => void;
    onBellClick: () => void;
    onLeaveClick: () => void;
    onDeleteClick: () => void;
    onReportClick?: () => void;
}

export const GroupProfileHeader: React.FC<GroupProfileHeaderProps> = ({
    activeGroup,
    memberCount,
    isAdmin,
    onBack,
    onEditClick,
    onAddMember,
    onSearchClick,
    onBellClick,
    onLeaveClick,
    onDeleteClick,
    onReportClick
}) => {
    return (
        <div className="flex flex-col shrink-0 w-full font-['DM_Sans']">
            {/* 1. Header Back Button (Frame 2609475: 16px from top, 16px from left, gap: 8px, 65px x 24px) */}
            <div className="pt-4 pl-4 pb-2 flex items-center shrink-0">
                <button
                    onClick={onBack}
                    type="button"
                    aria-label="Back to conversations"
                    className="flex flex-row items-center gap-2 w-[65px] h-[24px] p-0 cursor-pointer hover:opacity-80 transition-opacity outline-none bg-transparent border-none"
                >
                    <LeftArrowIcon
                        size={20}
                        className="w-5 h-5 shrink-0 text-[var(--ds-text-primary)]"
                        fill="var(--ds-text-primary)"
                    />
                    <span className="font-['DM_Sans'] font-medium text-[16px] leading-[24px] text-center text-[var(--ds-text-primary)]">
                        Back
                    </span>
                </button>
            </div>

            {/* 2. Group Details Profile Box (Frame 2608635: 24px below back, max-w-[618px], gap: 8px, rounded: 24px) */}
            <div className="mt-6 flex flex-col items-center gap-2 max-w-[618px] mx-auto w-full px-4 rounded-[24px] text-center shrink-0">
                {/* Logo (Ellipse 2: 80px x 80px) */}
                <div className="w-[80px] h-[80px] rounded-full overflow-hidden bg-[var(--ds-surface-1)] flex items-center justify-center shrink-0">
                    {activeGroup.group_avatar ? (
                        <Image
                            src={activeGroup.group_avatar}
                            alt={activeGroup.conversation_name}
                            width={80}
                            height={80}
                            className="object-cover w-full h-full"
                        />
                    ) : (
                        <span className="font-['DM_Sans'] font-bold text-2xl text-[var(--ds-accent)]">
                            {(activeGroup.conversation_name || "G").substring(0, 2).toUpperCase()}
                        </span>
                    )}
                </div>

                {/* Group Name (8px below: 16px font-medium, leading 24px, var(--ds-text-primary)) */}
                <h1 className="font-['DM_Sans'] font-medium text-[16px] leading-[24px] text-[var(--ds-text-primary)] text-center flex items-center justify-center">
                    {activeGroup.conversation_name}
                </h1>

                {/* Edit Group Name and Photo Link (8px below: 12px, font-normal, leading 16px, var(--ds-accent)) */}
                {isAdmin && (
                    <button
                        onClick={onEditClick}
                        type="button"
                        className="font-['DM_Sans'] font-normal text-[12px] leading-[16px] text-[var(--ds-accent)] hover:opacity-85 transition-opacity hover:no-underline cursor-pointer outline-none bg-transparent border-none p-0 flex items-center justify-center"
                    >
                        Edit group name and photo
                    </button>
                )}

                {/* Headline & Member Count Box (Frame 2608645: 8px below, gap: 16px, height: 16px) */}
                <div className="flex flex-row items-center justify-center gap-4 h-[16px]">
                    {activeGroup.group_headline && (
                        <span className="font-['DM_Sans'] font-normal text-[12px] leading-[16px] text-[var(--ds-text-secondary)] truncate max-w-[200px]">
                            {activeGroup.group_headline}
                        </span>
                    )}

                    {/* Member Count Box (Frame 2608646: gap: 8px, height: 16px) */}
                    <div className="flex flex-row items-center gap-2 h-[16px]">
                        {/* Dot Badge (Ellipse 15: 6px x 6px var(--ds-text-secondary)) */}
                        <span className="w-[6px] h-[6px] rounded-full bg-[var(--ds-text-secondary)] shrink-0" />
                        <span className="font-['DM_Sans'] font-normal text-[12px] leading-[16px] text-[var(--ds-text-secondary)]">
                            {memberCount}/{MAX_GROUP_MEMBERS} Members
                        </span>
                    </div>
                </div>

                {/* Action Buttons Box (Frame 2610093: 8px below, gap: 12px, height: 36px) */}
                <div className="flex flex-row justify-center items-center gap-3 h-[36px] mt-1">
                    {isAdmin && (
                        <button
                            type="button"
                            onClick={onAddMember}
                            title="Add members"
                            aria-label="Add members"
                            className="p-0 border-none bg-transparent cursor-pointer hover:opacity-90 transition-opacity outline-none"
                        >
                            <GroupActionAddIcon size={36} className="w-[36px] h-[36px]" />
                        </button>
                    )}

                    <button
                        type="button"
                        onClick={onSearchClick}
                        title="Search in group"
                        aria-label="Search in group"
                        className="p-0 border-none bg-transparent cursor-pointer hover:opacity-90 transition-opacity outline-none"
                    >
                        <GroupActionSearchIcon size={36} className="w-[36px] h-[36px]" />
                    </button>

                    <button
                        type="button"
                        onClick={onBellClick}
                        title="Group actions"
                        aria-label="Group notifications"
                        className="p-0 border-none bg-transparent cursor-pointer hover:opacity-90 transition-opacity outline-none"
                    >
                        <GroupActionBellIcon size={36} className="w-[36px] h-[36px]" />
                    </button>

                    <Popover>
                        <PopoverTrigger asChild>
                            <button
                                type="button"
                                title="More options"
                                aria-label="More options"
                                className="p-0 border-none bg-transparent cursor-pointer hover:opacity-90 transition-opacity outline-none"
                            >
                                <GroupActionMoreIcon size={36} className="w-[36px] h-[36px]" />
                            </button>
                        </PopoverTrigger>
                        <PopoverContent
                            align="end"
                            sideOffset={6}
                            className="w-auto min-w-[110px] p-3 flex flex-col items-start gap-4 !bg-[var(--ds-bg)] !border !border-[var(--ds-border)] rounded-[8px] shadow-2xl z-[100] outline-none"
                        >
                            <PopoverClose asChild>
                                <button
                                    type="button"
                                    onClick={onReportClick}
                                    className="font-['DM_Sans'] font-normal text-[14px] leading-[20px] text-[var(--ds-text-secondary)] hover:text-[var(--ds-text-primary)] cursor-pointer outline-none bg-transparent border-none p-0 text-left transition-colors"
                                >
                                    Report group
                                </button>
                            </PopoverClose>
                            {isAdmin && (
                                <PopoverClose asChild>
                                    <button
                                        type="button"
                                        onClick={onDeleteClick}
                                        className="font-['DM_Sans'] font-normal text-[14px] leading-[20px] text-[var(--ds-error)] hover:opacity-80 cursor-pointer outline-none bg-transparent border-none p-0 text-left transition-opacity"
                                    >
                                        Delete group
                                    </button>
                                </PopoverClose>
                            )}
                            <PopoverClose asChild>
                                <button
                                    type="button"
                                    onClick={onLeaveClick}
                                    className="font-['DM_Sans'] font-normal text-[14px] leading-[20px] text-[var(--ds-error)] hover:opacity-80 cursor-pointer outline-none bg-transparent border-none p-0 text-left transition-opacity"
                                >
                                    Leave group
                                </button>
                            </PopoverClose>
                        </PopoverContent>
                    </Popover>
                </div>
            </div>
        </div>
    );
};
