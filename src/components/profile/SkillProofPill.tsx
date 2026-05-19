"use client";

import React from "react";
import { Briefcase, MessageSquare, CheckCircle2, X } from "lucide-react";
import { Experience, Post } from "@/types/entities";
import { Icon } from "@iconify/react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface SkillProofPillProps {
  skill: string;
  experiences: Experience[];
  posts: Post[];
  onDelete?: (skill: string) => void;
  readOnly?: boolean;
}

export function SkillProofPill({ skill, experiences, posts, onDelete, readOnly = false }: SkillProofPillProps) {
  if (!skill) return null;

  // Logic: Check if skill is mentioned in posts (case insensitive search in content or title)
  const mentionedInPosts = posts.filter((post) =>
    post &&
    skill &&
    ((post.content && post.content.toLowerCase().includes(skill.toLowerCase())) ||
      (post.title && post.title.toLowerCase().includes(skill.toLowerCase())))
  );

  const hasProof = mentionedInPosts.length > 0;

  return (
    <TooltipProvider>
      <Tooltip delayDuration={300}>
        <TooltipTrigger asChild>
          <div className="skill-chip group relative cursor-pointer flex items-center transition-all duration-1000 ease-in-out">
            <span className="group-hover:text-[#FF6B6B] transition-colors duration-1000 ease-in-out">
              {skill}
            </span>

            {/* Default Proof Indicator */}
            {hasProof && (
              <div className="absolute -top-3 -right-3 w-6 h-6 rounded-full border-2 border-card overflow-hidden shadow-sm transition-all duration-1000 ease-in-out opacity-100 group-hover:opacity-0 group-hover:scale-50">
                <img
                  src={mentionedInPosts[0]?.authorAvatar || "/assets/avatar.png"}
                  alt="Proof"
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* Hover Delete Icon */}
            {onDelete && (
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(skill);
                }}
                className="flex items-center justify-center overflow-hidden transition-all duration-1000 ease-in-out max-w-0 opacity-0 group-hover:max-w-[24px] group-hover:opacity-100 group-hover:ml-2"
              >
                <Icon icon="fluent:delete-32-regular" className="w-[24px] h-[24px] text-[#FF6B6B]" />
              </div>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs p-3 bg-popover border-border text-popover-foreground">
          <div className="space-y-2">
            <p className="font-semibold text-sm">{skill}</p>

            {mentionedInPosts.length > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1">
                  <MessageSquare className="w-3 h-3" /> Mentioned in Posts:
                </p>
                <p className="text-xs text-foreground">
                  Referenced in {mentionedInPosts.length} post{mentionedInPosts.length !== 1 ? 's' : ''}.
                </p>
              </div>
            )}

            {!hasProof && (
              <p className="text-xs text-muted-foreground italic">No proof detected yet.</p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
