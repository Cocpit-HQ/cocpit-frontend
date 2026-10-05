"use client";

import React from 'react';
import { ActionListItem } from '@/features/settings/api/reports';
import { ActionWarningIcon, ActionDeleteIcon, ActionBlockIcon, InfoIcon } from '@/components/icons';

interface AccountActionsTabProps {
  actions: ActionListItem[];
  onSelectAction: (id: string) => void;
}

export function AccountActionsEmptyState() {
  return (
    <div className="w-full max-w-[680px] px-5 py-16 flex flex-col justify-center items-center gap-4 mx-auto select-none">
      <div className="p-3 bg-ds-surface-1 rounded-full flex items-center justify-center shrink-0">
        <InfoIcon size={32} className="size-8 text-ds-text-secondary shrink-0" fill="currentColor" />
      </div>
      <div className="self-stretch flex flex-col justify-start items-center gap-1.5 text-center">
        <h3 className="text-ds-text-primary text-base font-semibold font-['DM_Sans'] leading-6 m-0">
          No account issues
        </h3>
        <p className="max-w-[320px] text-center text-ds-text-secondary text-sm font-normal font-['DM_Sans'] leading-5 m-0">
          Your account is in good standing. Any issues or warnings will appear here
        </p>
      </div>
    </div>
  );
}

function getActionIcon(actionType: string = '', label: string = '', reason: string = '') {
  const combined = `${actionType} ${label} ${reason}`.toLowerCase();
  if (combined.includes('remove') || combined.includes('delete') || combined.includes('trash') || combined.includes('spam')) {
    return <ActionDeleteIcon className="size-8 text-ds-error" fill="currentColor" />;
  }
  if (combined.includes('suspend') || combined.includes('ban') || combined.includes('hate') || combined.includes('block')) {
    return <ActionBlockIcon className="size-8 text-ds-error" fill="currentColor" />;
  }
  return <ActionWarningIcon className="size-8 text-ds-error" fill="currentColor" />;
}

function formatDate(dateStr?: string) {
  if (!dateStr) return 'Recently';
  if (/^[A-Za-z]{3}\s\d{1,2},\s\d{4}/.test(dateStr)) return dateStr;
  try {
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }
  } catch {}
  return dateStr;
}

export function AccountActionsTab({ actions, onSelectAction }: AccountActionsTabProps) {
  const displayActions = actions || [];

  if (displayActions.length === 0) {
    return <AccountActionsEmptyState />;
  }

  return (
    <div className="w-full max-w-[680px] flex flex-col justify-start items-start gap-4 select-none">
      {displayActions.map((action) => (
        <div
          key={action.id}
          role="button"
          tabIndex={0}
          aria-label={`${action.label || 'Action'}: ${action.reason || ''}`}
          onClick={() => onSelectAction(action.id)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onSelectAction(action.id);
            }
          }}
          className="w-full pb-4 border-b border-ds-border last:border-b-0 last:pb-0 flex justify-start items-center gap-4 cursor-pointer group hover:opacity-90 transition-opacity rounded-xl p-1 -m-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ds-accent"
        >
          {/* Left 76x76 circular icon container (Exact Figma spec: 76px x 76px, rounded-[100px], bg-ds-surface-1) */}
          <div className="w-[76px] h-[76px] bg-ds-surface-1 rounded-full flex flex-col justify-center items-center overflow-hidden shrink-0">
            <div className="size-8 relative overflow-hidden flex items-center justify-center">
              {getActionIcon(action.actionType, action.label, action.reason)}
            </div>
          </div>

          {/* Right Details */}
          <div className="flex-1 min-w-0 flex flex-col justify-center items-start gap-1.5">
            {/* Line 1: Date & Reason Tag */}
            <div className="w-full flex justify-start items-center gap-2 min-w-0">
              <span className="text-ds-text-secondary ds-text-secondary leading-5 shrink-0">
                {formatDate(action.date)}
              </span>
              <span className="size-1 bg-ds-text-secondary rounded-full shrink-0" />
              <span className="text-ds-error ds-text-small-1 leading-4 truncate">
                {action.reason || action.actionType || 'Notice'}
              </span>
            </div>

            {/* Line 2: Label / Action Title */}
            <div className="w-full text-ds-text-primary ds-text-secondary-1 leading-5 group-hover:text-ds-text-primary line-clamp-2 break-words">
              {action.label || action.reason || 'Account notice'}
            </div>

            {/* Line 3: Status */}
            <div className="w-full text-ds-text-secondary ds-text-small leading-4 truncate">
              {action.statusLabel || action.status || 'Active'}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
export default AccountActionsTab;
