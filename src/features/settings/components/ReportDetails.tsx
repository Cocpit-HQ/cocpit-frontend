"use client";

import React from 'react';
import { ChevronLeft } from 'lucide-react';
import { ReportDetail } from '@/features/settings/api/reports';

export type { ReportDetail as Report };

interface ReportDetailsProps {
  report: ReportDetail;
  onBack: () => void;
}

export function ReportDetails({ report, onBack }: ReportDetailsProps) {
  const defaultNote =
    "Thank you for your report. We've received it and our moderation team will review it as soon as possible. We'll update you if any action is taken";
  const notes =
    report.reviewNotes && report.reviewNotes.length > 0
      ? report.reviewNotes.map((n) => n.message)
      : [defaultNote];

  return (
    <div className="w-full max-w-[712px] px-2 sm:px-4 py-2 inline-flex flex-col justify-start items-start gap-3 select-none">
      {/* Header */}
      <div className="self-stretch inline-flex justify-start items-center gap-2.5">
        <button
          type="button"
          onClick={onBack}
          className="-ml-1.5 w-8 h-8 rounded-full border border-ds-border bg-transparent flex items-center justify-center cursor-pointer text-ds-text-primary hover:bg-ds-surface-1 transition-colors ds-focus-ring shrink-0"
          aria-label="Back to reports list"
        >
          <ChevronLeft className="size-5 text-ds-text-primary shrink-0" />
        </button>
        <div className="justify-center text-ds-text-primary text-base font-semibold font-sans leading-6">
          Report details
        </div>
      </div>

      {/* Row 1: Content type & Date submitted */}
      <div className="self-stretch flex flex-col sm:flex-row justify-start items-start gap-4">
        <div className="flex-1 inline-flex flex-col justify-start items-start gap-2">
          <div className="justify-center text-ds-text-secondary text-sm font-normal font-sans leading-5">
            Content type
          </div>
          <div className="self-stretch justify-center text-ds-text-primary text-sm font-normal font-sans leading-5">
            {report.postType ? (report.postType.charAt(0).toUpperCase() + report.postType.slice(1).toLowerCase()) : (report.type || report.targetType || 'Profile')}
          </div>
        </div>
        <div className="flex-1 inline-flex flex-col justify-start items-start gap-2">
          <div className="justify-center text-ds-text-secondary text-sm font-normal font-sans leading-5">
            Date submitted
          </div>
          <div className="self-stretch justify-center text-ds-text-primary text-sm font-normal font-sans leading-5">
            {report.date}
          </div>
        </div>
      </div>

      {/* Row 2: Report status & Reason */}
      <div className="self-stretch flex flex-col sm:flex-row justify-start items-start gap-4">
        <div className="flex-1 inline-flex flex-col justify-start items-start gap-2">
          <div className="justify-center text-ds-text-secondary text-sm font-normal font-sans leading-5">
            Report status
          </div>
          <div className="self-stretch justify-center text-ds-text-primary text-sm font-normal font-sans leading-5">
            {report.statusLabel || report.status || 'Submitted'}
          </div>
        </div>
        <div className="flex-1 inline-flex flex-col justify-start items-start gap-2">
          <div className="justify-center text-ds-text-secondary text-sm font-normal font-sans leading-5">
            Reason
          </div>
          <div className="self-stretch justify-center text-ds-text-primary text-sm font-normal font-sans leading-5">
            {report.reason || 'Report'}
          </div>
        </div>
      </div>

      {/* Review Updates Timeline */}
      <div className="self-stretch flex flex-col justify-start items-start gap-2">
        {notes.map((message, index) => (
          <React.Fragment key={index}>
            {index > 0 && (
              <div className="w-11 h-16 inline-flex justify-center items-center gap-2.5">
                <div className="w-0 h-16 outline outline-1 outline-offset-[-0.50px] outline-ds-surface-1" />
              </div>
            )}
            <div className="self-stretch pt-1.5 flex flex-col justify-start items-start gap-2">
              <div className="justify-center text-ds-text-secondary text-sm font-normal font-sans leading-5">
                Review update
              </div>
              <div className="self-stretch p-4 bg-ds-surface-1 rounded-3xl flex flex-col justify-start items-start">
                <div className="self-stretch justify-center text-ds-text-primary text-sm font-normal font-sans leading-5">
                  {message}
                </div>
              </div>
            </div>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}
