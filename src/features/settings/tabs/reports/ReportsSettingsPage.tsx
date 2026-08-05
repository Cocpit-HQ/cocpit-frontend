"use client";

import React from 'react';
import { UserCircle2, BarChart2, Image as ImageIcon, FileEdit, Loader2, AlertTriangle, Trash2, Ban } from 'lucide-react';
import { ReportDetails } from './ReportDetails';
import { ActionDetails } from './ActionDetails';
import { useSettingsStore } from '@/store/settings.store';
import { useUserReports, useReportDetail, useAccountActions, useActionDetail } from '../../hooks/useReports';
import { useActiveProfile } from '@/context/ActiveProfileContext';

export function ReportsSettingsPage() {
  const { isCompany } = useActiveProfile();
  // Which pill is active, and which row is selected, live in the shared
  // settings store — only the *id* is stored there (never the fetched
  // detail object, per settings.store.ts's separation-of-concerns rule).
  // The ids feed directly into useReportDetail/useActionDetail below, which
  // is what actually fetches + caches the detail via TanStack Query.
  const activeTab = useSettingsStore((state) => state.reports.activeTab);
  const setActiveTab = useSettingsStore((state) => state.setReportsTab);
  const selectedReportId = useSettingsStore((state) => state.reports.selectedReportId);
  const selectedActionId = useSettingsStore((state) => state.reports.selectedActionId);
  const selectReport = useSettingsStore((state) => state.selectReport);
  const selectAction = useSettingsStore((state) => state.selectAction);

  // Server state — all four now go through TanStack Query instead of
  // manual useEffect + useState + try/catch fetching.
  const { reports: reportsData, isLoading: isLoadingReports } = useUserReports();
  const { report: selectedReport, isLoading: isLoadingReport } = useReportDetail(selectedReportId);
  // Actions only fetch once that pill is active — mirrors the
  // `enabled: activeTab === 'Explore'` gating pattern from useJobs.ts.
  const { actions: actionsData, isLoading: isLoadingActions } = useAccountActions(activeTab === 'actions');
  const { action: selectedAction, isLoading: isLoadingAction } = useActionDetail(selectedActionId);

  const getReportIcon = (type: string) => {
    const upper = type.toUpperCase();
    if (upper.includes('USER') || upper.includes('PROFILE')) return <UserCircle2 className={`w-8 h-8 ${isCompany ? 'text-[#1A73E8] dark:text-company-primary' : 'text-[#6366F1] dark:text-primary'}`} strokeWidth={1.5} />;
    if (upper.includes('POLL'))    return <BarChart2  className={`w-8 h-8 ${isCompany ? 'text-[#1A73E8] dark:text-company-primary' : 'text-[#6366F1] dark:text-primary'}`} strokeWidth={1.5} />;
    if (upper.includes('ARTICLE')) return <FileEdit   className={`w-8 h-8 ${isCompany ? 'text-[#1A73E8] dark:text-company-primary' : 'text-[#6366F1] dark:text-primary'}`} strokeWidth={1.5} />;
    return <ImageIcon className={`w-8 h-8 ${isCompany ? 'text-[#1A73E8] dark:text-company-primary' : 'text-[#6366F1] dark:text-primary'}`} strokeWidth={1.5} />;
  };

  const getActionIcon = (actionType: string) => {
    if (actionType === 'warning')          return <AlertTriangle className="w-8 h-8 text-[#EF4444]" strokeWidth={1.5} />;
    if (actionType === 'post_removed' || actionType === 'comment_removed') return <Trash2 className="w-8 h-8 text-[#EF4444]" strokeWidth={1.5} />;
    if (actionType === 'suspension' || actionType === 'ban')               return <Ban   className="w-8 h-8 text-[#EF4444]" strokeWidth={1.5} />;
    return <AlertTriangle className="w-8 h-8 text-[#EF4444]" strokeWidth={1.5} />;
  };

  // Full-screen loading overlay while fetching a detail view
  if ((selectedReportId !== null && isLoadingReport) || (selectedActionId !== null && isLoadingAction)) {
    return (
      <div className="flex flex-col w-full h-full min-h-full font-poppins pb-20">
        <div className="flex justify-center items-center py-24">
          <Loader2 className={`w-8 h-8 animate-spin ${isCompany ? 'text-[#1A73E8] dark:text-company-primary' : 'text-[#6366F1] dark:text-primary'}`} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full h-full min-h-full font-poppins pb-20">
      <div className="w-full relative flex-1 flex flex-col py-2 px-4 gap-4 max-w-[698px]">

        {selectedReportId !== null && selectedReport ? (
          <ReportDetails report={selectedReport} onBack={() => selectReport(null)} />
        ) : selectedActionId !== null && selectedAction ? (
          <ActionDetails action={selectedAction} onBack={() => selectAction(null)} />
        ) : (
          <>
            {/* Header */}
            <div className="flex flex-col items-start justify-center mb-2">
              <h1 className="text-[24px] font-semibold text-black dark:text-foreground leading-[32px]">Account status</h1>
              <p className="text-[16px] font-normal text-[#6B7280] dark:text-muted-foreground leading-[24px] mt-1">View reports and account actions</p>

              {/* Tabs */}
              <div className="flex flex-row items-center gap-3 mt-4 mb-2">
                <button
                  onClick={() => setActiveTab('reports')}
                  className={`px-4 py-1.5 rounded-full text-[14px] font-medium leading-[20px] transition-colors ${
                    activeTab === 'reports'
                      ? (isCompany ? 'bg-blue-50 text-[#1A73E8]' : 'bg-[#EEF2FF] text-[#6366F1]')
                      : (isCompany ? 'border border-[#E5E7EB] dark:border-border text-[#1A73E8] hover:bg-blue-50 dark:hover:bg-primary-tint' : 'border border-[#E5E7EB] dark:border-border text-[#6366F1] hover:bg-[#EEF2FF]')
                  }`}
                >
                  Your reports
                </button>
                <button
                  onClick={() => setActiveTab('actions')}
                  className={`px-4 py-1.5 rounded-full text-[14px] font-medium leading-[20px] transition-colors ${
                    activeTab === 'actions'
                      ? (isCompany ? 'bg-blue-50 text-[#1A73E8]' : 'bg-[#EEF2FF] text-[#6366F1]')
                      : (isCompany ? 'border border-[#E5E7EB] dark:border-border text-[#1A73E8] hover:bg-blue-50 dark:hover:bg-primary-tint' : 'border border-[#E5E7EB] dark:border-border text-[#6366F1] hover:bg-[#EEF2FF]')
                  }`}
                >
                  Account actions
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex flex-col gap-6 w-full mt-2">
              {activeTab === 'reports' ? (
                isLoadingReports ? (
                  <div className="flex justify-center items-center py-12">
                    <Loader2 className={`w-8 h-8 animate-spin ${isCompany ? 'text-[#1A73E8] dark:text-company-primary' : 'text-[#6366F1] dark:text-primary'}`} />
                  </div>
                ) : reportsData.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 gap-3">
                    <FileEdit className="w-12 h-12 text-[#D1D5DB]" strokeWidth={1.5} />
                    <p className="text-[14px] text-[#6B7280] dark:text-muted-foreground">You haven&apos;t submitted any reports yet.</p>
                  </div>
                ) : (
                  reportsData.map((report) => (
                    <div
                      key={report.id}
                      className="flex flex-row items-center gap-4 w-full cursor-pointer group"
                      onClick={() => selectReport(report.id)}
                    >
                      <div className="w-[76px] h-[76px] flex items-center justify-center bg-[#EEF2FF] rounded-[12px] flex-shrink-0 group-hover:bg-[#E0E7FF] transition-colors">
                        {getReportIcon(report.type)}
                      </div>
                      <div className="flex flex-col justify-center gap-1 w-full">
                        <div className="flex flex-row items-center gap-2">
                          <span className="text-[14px] font-normal text-[#6B7280] dark:text-muted-foreground leading-[20px]">{report.date}</span>
                          <div className="w-1 h-1 bg-[#6B7280] rounded-full" />
                          <span className={`text-[12px] font-medium ${isCompany ? 'text-[#1A73E8] dark:text-company-primary' : 'text-[#6366F1] dark:text-primary'} leading-[16px]`}>{report.reason}</span>
                        </div>
                        <h3 className={`text-[14px] font-semibold text-black dark:text-foreground leading-[20px] transition-colors ${isCompany ? 'group-hover:text-[#1A73E8]' : 'group-hover:text-[#6366F1]'}`}>
                          {report.title}
                        </h3>
                        <span className="text-[12px] font-medium text-[#6B7280] dark:text-muted-foreground leading-[16px] mt-0.5">
                          {report.statusLabel}
                        </span>
                      </div>
                    </div>
                  ))
                )
              ) : (
                isLoadingActions ? (
                  <div className="flex justify-center items-center py-12">
                    <Loader2 className={`w-8 h-8 animate-spin ${isCompany ? 'text-[#1A73E8] dark:text-company-primary' : 'text-[#6366F1] dark:text-primary'}`} />
                  </div>
                ) : actionsData.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 gap-3">
                    <AlertTriangle className="w-12 h-12 text-[#D1D5DB]" strokeWidth={1.5} />
                    <p className="text-[14px] text-[#6B7280] dark:text-muted-foreground">No account actions have been taken against your account.</p>
                  </div>
                ) : (
                  actionsData.map((action) => (
                    <div
                      key={action.id}
                      className="flex flex-row items-center gap-4 w-full cursor-pointer group"
                      onClick={() => selectAction(action.id)}
                    >
                      <div className="w-[76px] h-[76px] flex items-center justify-center bg-[#FEF2F2] rounded-[12px] flex-shrink-0 group-hover:bg-[#FEE2E2] transition-colors">
                        {getActionIcon(action.actionType)}
                      </div>
                      <div className="flex flex-col justify-center gap-1 w-full">
                        <div className="flex flex-row items-center gap-2">
                          <span className="text-[14px] font-normal text-[#6B7280] dark:text-muted-foreground leading-[20px]">{action.date}</span>
                          <div className="w-1 h-1 bg-[#6B7280] rounded-full" />
                          <span className="text-[12px] font-medium text-[#EF4444] leading-[16px]">{action.reason}</span>
                        </div>
                        <h3 className="text-[14px] font-semibold text-black dark:text-foreground leading-[20px] group-hover:text-[#EF4444] transition-colors">
                          {action.label}
                        </h3>
                        <span className="text-[12px] font-medium text-[#6B7280] dark:text-muted-foreground leading-[16px] mt-0.5">
                          {action.statusLabel}
                        </span>
                      </div>
                    </div>
                  ))
                )
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
