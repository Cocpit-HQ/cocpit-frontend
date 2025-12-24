import React from 'react';
import { User } from '@/types/user';

interface SkillOverlapProps {
  currentUserSkills: string[];
  profileUserSkills: string[];
}

export function SkillOverlap({ currentUserSkills, profileUserSkills }: SkillOverlapProps) {
  const commonSkills = currentUserSkills.filter(skill => profileUserSkills.includes(skill));

  if (commonSkills.length === 0) {
    return null;
  }

  return (
    <div className="rounded-xl border p-4 mb-6 bg-card border-border">
      <div className="flex items-center gap-2 mb-2">
        <div className="flex -space-x-2">
           {/* Abstract "overlap" visualization using simple circles if no avatars */}
           <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center border-2 border-background text-[10px] text-primary font-bold">You</div>
           <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center border-2 border-background text-[10px] text-muted-foreground font-bold">User</div>
        </div>
        <h3 className="text-sm font-medium text-foreground">You both have shared skills</h3>
      </div>
      <p className="text-sm text-muted-foreground">
        You and this user both know <span className="text-foreground font-medium">{commonSkills.join(', ')}</span>.
      </p>
    </div>
  );
}
