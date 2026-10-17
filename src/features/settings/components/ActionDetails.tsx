"use client";

import React from 'react';
import { ChevronLeft } from 'lucide-react';
import { ActionDetail } from '@/features/settings/api/reports';

export type { ActionDetail as Action };

interface ActionDetailsProps {
  action: ActionDetail;
  onBack: () => void;
}

export function ActionDetails({ action, onBack }: ActionDetailsProps) {
  return (
    <div className="w-full max-w-[712px] px-2 sm:px-4 py-2 inline-flex flex-col justify-start items-start gap-3 select-none">
      {/* Header */}
      <div className="self-stretch inline-flex justify-start items-center gap-2.5">
        <button
          type="button"
          onClick={onBack}
          className="-ml-1.5 w-8 h-8 rounded-full border border-ds-border hover:bg-ds-surface-1 p-0 flex items-center justify-center cursor-pointer text-ds-text-primary transition-colors ds-focus-ring shrink-0"
          aria-label="Back to account actions list"
        >
          <ChevronLeft className="w-5 h-5 text-ds-text-primary shrink-0" strokeWidth={1.5} />
        </button>
        <div className="justify-center text-ds-text-primary text-base font-semibold font-sans leading-6">
          Action details
        </div>
      </div>

      {/* Row 1: Content type & Date */}
      <div className="self-stretch inline-flex justify-start items-start gap-4">
        <div className="flex-1 inline-flex flex-col justify-start items-start gap-2">
          <div className="justify-center text-ds-text-secondary text-sm font-normal font-sans leading-5">
            Content type
          </div>
          <div className="self-stretch justify-center text-ds-text-primary text-sm font-normal font-sans leading-5">
            {action.affectedContentType
              ? action.affectedContentType.charAt(0).toUpperCase() + action.affectedContentType.slice(1).toLowerCase()
              : 'Account'}
          </div>
        </div>
        <div className="flex-1 inline-flex flex-col justify-start items-start gap-2">
          <div className="justify-center text-ds-text-secondary text-sm font-normal font-sans leading-5">
            Date
          </div>
          <div className="self-stretch justify-center text-ds-text-primary text-sm font-normal font-sans leading-5">
            {action.date}
          </div>
        </div>
      </div>

      {/* Row 2: Action status & Reason */}
      <div className="self-stretch inline-flex justify-start items-start gap-4">
        <div className="flex-1 inline-flex flex-col justify-start items-start gap-2">
          <div className="justify-center text-ds-text-secondary text-sm font-normal font-sans leading-5">
            Action status
          </div>
          <div className="self-stretch justify-center text-ds-text-primary text-sm font-normal font-sans leading-5">
            {action.statusLabel || action.status || 'Active'}
          </div>
        </div>
        <div className="flex-1 inline-flex flex-col justify-start items-start gap-2">
          <div className="justify-center text-ds-text-secondary text-sm font-normal font-sans leading-5">
            Reason
          </div>
          <div className="self-stretch justify-center text-ds-text-primary text-sm font-normal font-sans leading-5">
            {action.reason || 'Notice'}
          </div>
        </div>
      </div>

      {/* Moderator Update */}
      {action.moderatorNote && (
        <div className="self-stretch pt-1.5 flex flex-col justify-start items-start gap-2">
          <div className="justify-center text-ds-text-secondary text-sm font-normal font-sans leading-5">
            Moderator update
          </div>
          <div className="self-stretch p-4 bg-ds-surface-1 rounded-3xl flex flex-col justify-start items-start">
            <div className="self-stretch justify-center text-ds-text-primary text-sm font-normal font-sans leading-5">
              {action.moderatorNote}
            </div>
          </div>
        </div>
      )}

      {/* Affected Content Preview */}
      {action.affectedContentTitle && (
        <div className="self-stretch pt-1.5 flex flex-col justify-start items-start gap-2">
          <div className="justify-center text-ds-text-secondary text-sm font-normal font-sans leading-5">
            Affected content preview
          </div>
          <div className="self-stretch p-4 bg-ds-surface-1 rounded-3xl flex flex-col justify-start items-start">
            <p className="ds-text-secondary text-ds-text-secondary">
              {action.affectedContentType
                ? action.affectedContentType.charAt(0).toUpperCase() + action.affectedContentType.slice(1).toLowerCase()
                : 'Content'}{' '}
              <span className="font-medium text-ds-text-primary">
                &ldquo;{action.affectedContentTitle}&rdquo;
              </span>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
