import React from 'react';
import { ChevronLeft } from 'lucide-react';
import { ReportDetail, ReviewNote } from '@/features/settings/api/reports';

// Re-export Report type for backwards compatibility with ReportsSettingsPage
export type { ReportDetail as Report };

interface ReportDetailsProps {
  report: ReportDetail;
  onBack: () => void;
}

export function ReportDetails({ report, onBack }: ReportDetailsProps) {
  return (
    <div className="flex flex-col gap-6 w-full mt-2">
      {/* Header */}
      <div className="flex flex-row items-center gap-4">
        <button
          onClick={onBack}
          className="flex items-center justify-center w-12 h-12 rounded-full border border-[#DADADA] hover:bg-gray-50 transition-colors flex-shrink-0"
        >
          <ChevronLeft className="w-6 h-6 text-[#6B7280]" strokeWidth={1.5} />
        </button>
        <div className="flex flex-col">
          <h1 className="text-[18px] font-medium text-black leading-[26px]">Report details</h1>
          <p className="text-[12px] font-normal text-[#6B7280] leading-[16px]">View the details and current status of your submitted report</p>
        </div>
      </div>

      {/* Info Grid */}
      <div className="flex flex-col gap-4 mt-2">
        <div className="flex flex-row gap-4 w-full">
          <div className="flex flex-col gap-2 flex-1">
            <span className="text-[14px] font-normal text-[#6B7280] leading-[20px]">Content type</span>
            <span className="text-[14px] font-normal text-black leading-[20px]">{report.type}</span>
          </div>
          <div className="flex flex-col gap-2 flex-1">
            <span className="text-[14px] font-normal text-[#6B7280] leading-[20px]">Date submitted</span>
            <span className="text-[14px] font-normal text-black leading-[20px]">{report.date}</span>
          </div>
        </div>
        <div className="flex flex-row gap-4 w-full">
          <div className="flex flex-col gap-2 flex-1">
            <span className="text-[14px] font-normal text-[#6B7280] leading-[20px]">Report status</span>
            <span className="text-[14px] font-normal text-black leading-[20px]">{report.statusLabel}</span>
          </div>
          <div className="flex flex-col gap-2 flex-1">
            <span className="text-[14px] font-normal text-[#6B7280] leading-[20px]">Reason</span>
            <span className="text-[14px] font-normal text-black leading-[20px]">{report.reason}</span>
          </div>
        </div>
      </div>

      {/* Review Notes Timeline */}
      {report.reviewNotes && report.reviewNotes.length > 0 && (
        <div className="flex flex-col w-full mt-2 gap-0">
          {report.reviewNotes.map((note: ReviewNote, index: number) => (
            <div key={note.id}>
              <div className="flex flex-col gap-2 w-full pt-[5.5px]">
                <span className="text-[14px] font-normal text-[#6B7280] leading-[20px]">Review update</span>
                <div className="bg-[#EEF2FF] rounded-[24px] p-4 px-5 w-full min-h-[72px] flex items-center">
                  <p className="text-[14px] font-normal text-black leading-[20px]">{note.message}</p>
                </div>
              </div>

              {/* Connector between notes */}
              {index < report.reviewNotes.length - 1 && (
                <div className="flex flex-row justify-center items-center w-[46px] h-[44px]">
                  <div className="w-[1.5px] h-full bg-[#EEF2FF]" />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
