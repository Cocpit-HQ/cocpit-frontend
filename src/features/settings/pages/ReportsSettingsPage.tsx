"use client";

import React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Loader2, ChevronLeft } from 'lucide-react';
import { ReportDetails } from '../components/ReportDetails';
import { ActionDetails } from '../components/ActionDetails';
import { YourReportsTab, AccountActionsTab } from '../components/reports';
import { useSettingsStore } from '@/store/settings.store';
import {
  useUserReports,
  useReportDetail,
  useAccountActions,
  useActionDetail,
} from '../hooks/useReports';

const TABS: { key: 'reports' | 'actions'; label: string }[] = [
  { key: 'reports', label: 'Your reports' },
  { key: 'actions', label: 'Account actions' },
];

export function ReportsSettingsPage() {
  const router = useRouter();
  const pathname = usePathname() || '/settings/reports';
  const match = pathname.match(/^(.*\/settings)/);
  const basePath = match ? match[1] : '/settings';

  const activeTab = useSettingsStore((state) => state.reports.activeTab);
  const setActiveTab = useSettingsStore((state) => state.setReportsTab);
  const selectedReportId = useSettingsStore((state) => state.reports.selectedReportId);
  const selectedActionId = useSettingsStore((state) => state.reports.selectedActionId);
  const selectReport = useSettingsStore((state) => state.selectReport);
  const selectAction = useSettingsStore((state) => state.selectAction);

  const { reports: reportsData, isLoading: isLoadingReports } = useUserReports();
  const { report: selectedReport, isLoading: isLoadingReport } = useReportDetail(selectedReportId);
  const { actions: actionsData, isLoading: isLoadingActions } = useAccountActions(activeTab === 'actions');
  const { action: selectedAction, isLoading: isLoadingAction } = useActionDetail(selectedActionId);

  const scrollContainerRef = React.useRef<HTMLDivElement>(null);

  // Reset scroll position to top whenever activeTab changes
  React.useLayoutEffect(() => {
    const mainEl = scrollContainerRef.current?.closest('main');
    if (mainEl) {
      mainEl.scrollTop = 0;
    }
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
  }, [activeTab]);

  if ((selectedReportId !== null && isLoadingReport) || (selectedActionId !== null && isLoadingAction)) {
    return (
      <div className="flex justify-center items-center py-24 w-full">
        <Loader2 className="w-6 h-6 animate-spin text-ds-accent" />
      </div>
    );
  }

  if (selectedReportId !== null && selectedReport) {
    return <ReportDetails report={selectedReport} onBack={() => selectReport(null)} />;
  }

  if (selectedActionId !== null && selectedAction) {
    return <ActionDetails action={selectedAction} onBack={() => selectAction(null)} />;
  }

  const isLoading = activeTab === 'reports' ? isLoadingReports : isLoadingActions;

  return (
    <div className="w-full max-w-[712px] flex flex-col justify-start items-start select-none">
      {/* ─── Horizontal Tabs (Fixed Header) ─── */}
      <div className="sticky top-0 w-full shrink-0 px-2 sm:px-4 py-2 flex justify-between items-center bg-ds-bg z-30">
        <div className="flex justify-start items-center gap-2 sm:gap-3" role="tablist">
          <button
            type="button"
            onClick={() => router.push(basePath)}
            aria-label="Back to settings menu"
            className="flex md:hidden items-center justify-center w-8 h-8 rounded-full border border-ds-border hover:bg-ds-surface-1 transition-colors shrink-0 ds-focus-ring mr-1"
          >
            <ChevronLeft className="w-5 h-5 text-ds-text-primary" strokeWidth={1.5} />
          </button>
          {TABS.map((tab) => {
            const isSelected = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                role="tab"
                aria-selected={isSelected}
                onClick={() => {
                  setActiveTab(tab.key);
                  const mainEl = scrollContainerRef.current?.closest('main');
                  if (mainEl) {
                    mainEl.scrollTo({ top: 0, behavior: 'instant' });
                  }
                }}
                className="inline-flex flex-col justify-start items-center cursor-pointer bg-transparent border-0 p-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ds-accent rounded-sm"
              >
                <div className="self-stretch px-4 py-1.5 flex flex-col justify-center items-center gap-2">
                  <span
                    className={`ds-text-body-1 transition-colors ${
                      isSelected ? 'text-ds-text-primary' : 'text-ds-text-secondary hover:text-ds-text-primary'
                    }`}
                  >
                    {tab.label}
                  </span>
                </div>
                {isSelected && (
                  <div className="self-stretch h-[2px] bg-ds-accent rounded-full transition-all" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ─── Reports Content Pane (Scrolls Only Inner List, Resets on Tab Change) ─── */}
      <div
        ref={scrollContainerRef}
        key={activeTab}
        className="w-full px-4 py-3 flex flex-col gap-6"
      >
        {isLoading ? (
          <div className="flex justify-center items-center py-20 w-full">
            <Loader2 className="w-6 h-6 animate-spin text-ds-accent" />
          </div>
        ) : (
          <>
            {activeTab === 'reports' && (
              <YourReportsTab
                reports={reportsData}
                onSelectReport={selectReport}
              />
            )}

            {activeTab === 'actions' && (
              <AccountActionsTab
                actions={actionsData}
                onSelectAction={selectAction}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}
export default ReportsSettingsPage;
