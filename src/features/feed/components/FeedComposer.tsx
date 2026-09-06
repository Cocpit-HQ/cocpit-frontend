'use client';

import React from 'react';
import Link from 'next/link';
import { useActiveProfile } from '@/context/ActiveProfileContext';
import { Icon } from '@/components/icons';

export const FeedComposer = ({ onOpenComposer }: { onOpenComposer: () => void }) => {
  const { activeProfile } = useActiveProfile();
  
  const avatarUrl = activeProfile?.avatar_url;
  const initial = activeProfile?.name ? activeProfile.name.charAt(0).toUpperCase() : 'U';

  return (
    <div className="w-full flex flex-col py-[16px] px-[16px] bg-ds-bg border-b border-ds-border max-w-[442px] mx-auto gap-[16px]">
      <div className="flex flex-row items-center gap-[12px] w-full">
        {/* Avatar */}
        <div className="w-[40px] h-[40px] rounded-full overflow-hidden bg-ds-surface-1 flex items-center justify-center shrink-0 border border-ds-border">
          {avatarUrl ? (
            <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
          ) : (
            <span className="text-ds-text-primary text-xs font-medium">{initial}</span>
          )}
        </div>

        {/* Input Placeholder */}
        <div 
          onClick={onOpenComposer}
          className="flex-grow cursor-text py-[8px]"
        >
          <span className="ds-text-body text-ds-text-muted">
            What would you like to share today?
          </span>
        </div>
      </div>

      {/* Composer Actions */}
      <div className="flex flex-row justify-between items-center w-full pl-[52px]">
        {/* Media Icons */}
        <div className="flex flex-row items-center gap-[16px]">
          <button onClick={onOpenComposer} className="text-ds-text-primary outline-none ring-0 focus-visible:ring-2 focus-visible:ring-ds-accent rounded transition-colors">
            <Icon name="image" className="w-[20px] h-[20px]" />
          </button>
          <button onClick={onOpenComposer} className="text-ds-text-primary outline-none ring-0 focus-visible:ring-2 focus-visible:ring-ds-accent rounded transition-colors">
            <Icon name="poll" className="w-[20px] h-[20px]" />
          </button>
          <button onClick={onOpenComposer} className="text-ds-text-primary outline-none ring-0 focus-visible:ring-2 focus-visible:ring-ds-accent rounded transition-colors">
            <Icon name="articles" className="w-[20px] h-[20px]" />
          </button>
        </div>

        {/* Post Button */}
        <button 
          onClick={onOpenComposer}
          className="h-[36px] px-[16px] bg-ds-surface-1 rounded-full ds-text-body-1 text-ds-text-muted outline-none ring-0 focus-visible:ring-2 focus-visible:ring-ds-accent hover:text-ds-text-primary hover:bg-ds-border transition-colors"
        >
          Post
        </button>
      </div>
    </div>
  );
};

export default FeedComposer;
