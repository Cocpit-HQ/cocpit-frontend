"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { UserCircle2, BarChart2, Image as ImageIcon, FileEdit, Loader2, AlertTriangle, Trash2, Ban } from 'lucide-react';
import { ReportDetails } from './ReportDetails';
import { ActionDetails } from './ActionDetails';
import {
  getUserReports,
  getUserReportById,
  getAccountActions,
  getAccountActionById,
  ReportListItem,
  ReportDetail,
  ActionListItem,
  ActionDetail,
} from '@/features/settings/api/reports';
import { toast } from 'sonner';

export function ReportsSettingsPage() {
  const [activeTab, setActiveTab] = useState<'reports' | 'actions'>('reports');

  // Reports state
  const [reportsData, setReportsData]           = useState<ReportListItem[]>([]);
  const [selectedReport, setSelectedReport]     = useState<ReportDetail | null>(null);
  const [isLoadingReports, setIsLoadingReports] = useState(false);
  const [isLoadingReport, setIsLoadingReport]   = useState(false);

  // Actions state
  const [actionsData, setActionsData]           = useState<ActionListItem[]>([]);
  const [selectedAction, setSelectedAction]     = useState<ActionDetail | null>(null);
  const [isLoadingActions, setIsLoadingActions] = useState(false);
  const [isLoadingAction, setIsLoadingAction]   = useState(false);

  // Guard to prevent refetching actions on every re-render when the list is empty
  const hasFetchedActions = React.useRef(false);

  // Fetch reports list
  const fetchReports = useCallback(async () => {
    setIsLoadingReports(true);
    try {
      const res = await getUserReports();
      setReportsData(res.reports || []);
    } catch {
      toast.error('Failed to fetch reports');
      setReportsData([]);
    } finally {
      setIsLoadingReports(false);
    }
  }, []);

  // Fetch account actions list
  const fetchActions = useCallback(async () => {
    setIsLoadingActions(true);
    try {
      const res = await getAccountActions();
      setActionsData(res.actions || []);
    } catch {
      toast.error('Failed to fetch account actions');
      setActionsData([]);
    } finally {
      setIsLoadingActions(false);
    }
  }, []);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  useEffect(() => {
    if (activeTab === 'actions' && !hasFetchedActions.current) {
      hasFetchedActions.current = true;
      fetchActions();
    }
  }, [activeTab, fetchActions]);

  // Open report detail — fetch full data with review notes
  const handleSelectReport = async (id: number) => {
    setIsLoadingReport(true);
    try {
      const detail = await getUserReportById(id);
      setSelectedReport(detail);
    } catch {
      toast.error('Failed to load report details');
    } finally {
      setIsLoadingReport(false);
    }
  };

  // Open action detail — fetch full data
  const handleSelectAction = async (id: string) => {
    setIsLoadingAction(true);
    try {
      const detail = await getAccountActionById(id);
      setSelectedAction(detail);
    } catch {
      toast.error('Failed to load action details');
    } finally {
      setIsLoadingAction(false);
    }
  };

  const getReportIcon = (type: string) => {
    const upper = type.toUpperCase();
    if (upper.includes('USER') || upper.includes('PROFILE')) return <UserCircle2 className="w-8 h-8 text-[#6366F1]" strokeWidth={1.5} />;
    if (upper.includes('POLL'))    return <BarChart2  className="w-8 h-8 text-[#6366F1]" strokeWidth={1.5} />;
    if (upper.includes('ARTICLE')) return <FileEdit   className="w-8 h-8 text-[#6366F1]" strokeWidth={1.5} />;
    return <ImageIcon className="w-8 h-8 text-[#6366F1]" strokeWidth={1.5} />;
  };

  const getActionIcon = (actionType: string) => {
    if (actionType === 'warning')          return <AlertTriangle className="w-8 h-8 text-[#EF4444]" strokeWidth={1.5} />;
    if (actionType === 'post_removed' || actionType === 'comment_removed') return <Trash2 className="w-8 h-8 text-[#EF4444]" strokeWidth={1.5} />;
    if (actionType === 'suspension' || actionType === 'ban')               return <Ban   className="w-8 h-8 text-[#EF4444]" strokeWidth={1.5} />;
    return <AlertTriangle className="w-8 h-8 text-[#EF4444]" strokeWidth={1.5} />;
  };

  // Full-screen loading overlay while fetching a detail view
  if (isLoadingReport || isLoadingAction) {
    return (
      <div className="flex flex-col w-full h-full min-h-full font-poppins pb-20">
        <div className="flex justify-center items-center py-24">
          <Loader2 className="w-8 h-8 animate-spin text-[#6366F1]" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full h-full min-h-full font-poppins pb-20">
      <div className="w-full relative flex-1 flex flex-col py-2 px-4 gap-4 max-w-[698px]">

        {selectedReport ? (
          <ReportDetails report={selectedReport} onBack={() => setSelectedReport(null)} />
        ) : selectedAction ? (
          <ActionDetails action={selectedAction} onBack={() => setSelectedAction(null)} />
        ) : (
          <>
            {/* Header */}
            <div className="flex flex-col items-start justify-center mb-2">
              <h1 className="text-[24px] font-semibold text-black leading-[32px]">Account status</h1>
              <p className="text-[16px] font-normal text-[#6B7280] leading-[24px] mt-1">View reports and account actions</p>

              {/* Tabs */}
              <div className="flex flex-row items-center gap-3 mt-4 mb-2">
                <button
                  onClick={() => setActiveTab('reports')}
                  className={`px-4 py-1.5 rounded-full text-[14px] font-medium leading-[20px] transition-colors ${
                    activeTab === 'reports'
                      ? 'bg-[#EEF2FF] text-[#6366F1]'
                      : 'border border-[#E5E7EB] text-[#6366F1] hover:bg-[#EEF2FF]'
                  }`}
                >
                  Your reports
                </button>
                <button
                  onClick={() => setActiveTab('actions')}
                  className={`px-4 py-1.5 rounded-full text-[14px] font-medium leading-[20px] transition-colors ${
                    activeTab === 'actions'
                      ? 'bg-[#EEF2FF] text-[#6366F1]'
                      : 'border border-[#E5E7EB] text-[#6366F1] hover:bg-[#EEF2FF]'
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
                    <Loader2 className="w-8 h-8 animate-spin text-[#6366F1]" />
                  </div>
                ) : reportsData.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 gap-3">
                    <FileEdit className="w-12 h-12 text-[#D1D5DB]" strokeWidth={1.5} />
                    <p className="text-[14px] text-[#6B7280]">You haven&apos;t submitted any reports yet.</p>
                  </div>
                ) : (
                  reportsData.map((report) => (
                    <div
                      key={report.id}
                      className="flex flex-row items-center gap-4 w-full cursor-pointer group"
                      onClick={() => handleSelectReport(report.id)}
                    >
                      <div className="w-[76px] h-[76px] flex items-center justify-center bg-[#EEF2FF] rounded-[12px] flex-shrink-0 group-hover:bg-[#E0E7FF] transition-colors">
                        {getReportIcon(report.type)}
                      </div>
                      <div className="flex flex-col justify-center gap-1 w-full">
                        <div className="flex flex-row items-center gap-2">
                          <span className="text-[14px] font-normal text-[#6B7280] leading-[20px]">{report.date}</span>
                          <div className="w-1 h-1 bg-[#6B7280] rounded-full" />
                          <span className="text-[12px] font-medium text-[#6366F1] leading-[16px]">{report.reason}</span>
                        </div>
                        <h3 className="text-[14px] font-semibold text-black leading-[20px] group-hover:text-[#6366F1] transition-colors">
                          {report.title}
                        </h3>
                        <span className="text-[12px] font-medium text-[#6B7280] leading-[16px] mt-0.5">
                          {report.statusLabel}
                        </span>
                      </div>
                    </div>
                  ))
                )
              ) : (
                isLoadingActions ? (
                  <div className="flex justify-center items-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-[#6366F1]" />
                  </div>
                ) : actionsData.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 gap-3">
                    <AlertTriangle className="w-12 h-12 text-[#D1D5DB]" strokeWidth={1.5} />
                    <p className="text-[14px] text-[#6B7280]">No account actions have been taken against your account.</p>
                  </div>
                ) : (
                  actionsData.map((action) => (
                    <div
                      key={action.id}
                      className="flex flex-row items-center gap-4 w-full cursor-pointer group"
                      onClick={() => handleSelectAction(action.id)}
                    >
                      <div className="w-[76px] h-[76px] flex items-center justify-center bg-[#FEF2F2] rounded-[12px] flex-shrink-0 group-hover:bg-[#FEE2E2] transition-colors">
                        {getActionIcon(action.actionType)}
                      </div>
                      <div className="flex flex-col justify-center gap-1 w-full">
                        <div className="flex flex-row items-center gap-2">
                          <span className="text-[14px] font-normal text-[#6B7280] leading-[20px]">{action.date}</span>
                          <div className="w-1 h-1 bg-[#6B7280] rounded-full" />
                          <span className="text-[12px] font-medium text-[#EF4444] leading-[16px]">{action.reason}</span>
                        </div>
                        <h3 className="text-[14px] font-semibold text-black leading-[20px] group-hover:text-[#EF4444] transition-colors">
                          {action.label}
                        </h3>
                        <span className="text-[12px] font-medium text-[#6B7280] leading-[16px] mt-0.5">
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
