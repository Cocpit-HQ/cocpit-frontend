import React from 'react';
import { NotificationOffIcon } from '@/components/icons';

interface NotificationEmptyStateProps {
  title?: string;
  description?: string;
}

export const NotificationEmptyState: React.FC<NotificationEmptyStateProps> = ({
  title = 'No Notifications Received',
  description = "You'll see your latest updates and alerts here",
}) => {
  return (
    <div className="flex-1 min-h-[360px] flex flex-col items-center justify-center text-center select-none py-12">

      {/* IconFrame — 56×56, bg-ds-surface-1, rounded-full, p-3 */}
      <div className="mb-6 shrink-0 flex flex-row items-start p-3 w-14 h-14 bg-ds-surface-1 rounded-full">
        {/* 32×32 notification-off from design system icon library */}
        <NotificationOffIcon size={32} className="text-ds-text-muted" />
      </div>


      {/* Heading */}
      <h3 className="ds-text-body-2 font-['DM_Sans'] text-ds-text-primary m-0 mb-1 p-0">
        {title}
      </h3>

      {/* Subtitle */}
      <p className="ds-text-secondary font-['DM_Sans'] text-ds-text-secondary m-0 p-0">
        {description}
      </p>
    </div>
  );
};
