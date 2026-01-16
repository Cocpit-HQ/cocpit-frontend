"use client";

import React from "react";
import { Briefcase, MessageSquare, CheckCircle2, X } from "lucide-react";
import { Experience, Post } from "@/types/entities";
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
          <div className={`group relative px-3 py-1.5 rounded-lg text-sm border transition-all flex items-center gap-2 cursor-default ${
             hasProof
               ? "bg-primary/10 text-primary border-primary/20 hover:bg-primary/20"
               : "bg-muted text-muted-foreground border-transparent hover:bg-muted/80"
          }`}>
            <span>{skill}</span>

            {hasProof && (
              <div className="flex items-center gap-1 pl-1 border-l border-primary/20">
                 {mentionedInPosts.length > 0 && (
                    <MessageSquare className="w-3 h-3 text-primary opacity-80" />
                 )}
              </div>
            )}

            {onDelete && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(skill);
                  }}
                  className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                >
                    <X className="w-3 h-3" />
                </button>
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
