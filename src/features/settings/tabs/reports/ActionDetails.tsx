import React from 'react';
import { ChevronLeft } from 'lucide-react';
import { ActionDetail } from '@/features/settings/api/reports';
import { useActiveProfile } from '@/context/ActiveProfileContext';

// Re-export Action type for backwards compatibility with ReportsSettingsPage
export type { ActionDetail as Action };

interface ActionDetailsProps {
  action: ActionDetail;
  onBack: () => void;
}

export function ActionDetails({ action, onBack }: ActionDetailsProps) {
  const { isCompany } = useActiveProfile();
  return (
    <div className="flex flex-col gap-6 w-full mt-2">
      {/* Header */}
      <div className="flex flex-row items-center gap-4">
        <button
          onClick={onBack}
          className="flex items-center justify-center w-12 h-12 rounded-full border border-[#DADADA] dark:border-border hover:bg-gray-50 dark:hover:bg-secondary transition-colors flex-shrink-0"
        >
          <ChevronLeft className="w-6 h-6 text-[#6B7280] dark:text-muted-foreground" strokeWidth={1.5} />
        </button>
        <div className="flex flex-col">
          <h1 className="text-[18px] font-medium text-black dark:text-foreground leading-[26px]">Action details</h1>
          <p className="text-[12px] font-normal text-[#6B7280] dark:text-muted-foreground leading-[16px]">View warnings and account actions</p>
        </div>
      </div>

      {/* Info Grid */}
      <div className="flex flex-col gap-4 mt-2">
        <div className="flex flex-row gap-4 w-full">
          <div className="flex flex-col gap-2 flex-1">
            <span className="text-[14px] font-normal text-[#6B7280] dark:text-muted-foreground leading-[20px]">Content type</span>
            <span className="text-[14px] font-normal text-black dark:text-foreground leading-[20px]">
              {action.affectedContentType
                ? action.affectedContentType.charAt(0).toUpperCase() + action.affectedContentType.slice(1).toLowerCase()
                : 'Account'}
            </span>
          </div>
          <div className="flex flex-col gap-2 flex-1">
            <span className="text-[14px] font-normal text-[#6B7280] dark:text-muted-foreground leading-[20px]">Date</span>
            <span className="text-[14px] font-normal text-black dark:text-foreground leading-[20px]">{action.date}</span>
          </div>
        </div>
        <div className="flex flex-row gap-4 w-full">
          <div className="flex flex-col gap-2 flex-1">
            <span className="text-[14px] font-normal text-[#6B7280] dark:text-muted-foreground leading-[20px]">Action status</span>
            <span className="text-[14px] font-normal text-black dark:text-foreground leading-[20px]">{action.statusLabel}</span>
          </div>
          <div className="flex flex-col gap-2 flex-1">
            <span className="text-[14px] font-normal text-[#6B7280] dark:text-muted-foreground leading-[20px]">Reason</span>
            <span className="text-[14px] font-normal text-black dark:text-foreground leading-[20px]">{action.reason}</span>
          </div>
        </div>
      </div>

      {/* Moderator Update */}
      {action.moderatorNote && (
        <div className="flex flex-col w-full mt-2">
          <div className="flex flex-col gap-2 w-full pt-[5.5px]">
            <span className="text-[14px] font-normal text-[#6B7280] dark:text-muted-foreground leading-[20px]">Moderator update</span>
            <div className="bg-[#FEF2F2] rounded-[24px] p-4 px-5 w-full min-h-[72px] flex items-center">
              <p className="text-[14px] font-normal text-black dark:text-foreground leading-[20px]">{action.moderatorNote}</p>
            </div>
          </div>
        </div>
      )}

      {/* Affected Content Preview */}
      {action.affectedContentTitle && (
        <div className="flex flex-col gap-2 w-full pt-4">
          <span className="text-[14px] font-normal text-[#6B7280] dark:text-muted-foreground leading-[20px]">Affected content preview</span>
          <div className="bg-white dark:bg-card border border-[#DADADA] dark:border-border rounded-[24px] p-4 px-5 w-full min-h-[72px] flex items-center">
            <p className="text-[14px] font-normal text-[#6B7280] dark:text-muted-foreground leading-[20px]">
              {action.affectedContentType
                ? action.affectedContentType.charAt(0).toUpperCase() + action.affectedContentType.slice(1).toLowerCase()
                : 'Content'}{' '}
              <span className={`cursor-pointer hover:underline ${isCompany ? 'text-[#1A73E8] dark:text-company-primary' : 'text-[#6366F1] dark:text-primary'}`}>
                &ldquo;{action.affectedContentTitle}&rdquo;
              </span>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
