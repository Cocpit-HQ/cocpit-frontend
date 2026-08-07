"use client";

import React, { useState, useEffect } from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { getReportReasons, createReport, ReportReason } from '@/services/api/report';
import { cn } from '@/lib/utils';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetType: 'POST' | 'USER' | 'COMMENT' | 'COMPANY' | 'THOUGHT';
  targetId: string | number;
}

export function ReportModal({ isOpen, onClose, targetType, targetId }: ReportModalProps) {
  const [reasons, setReasons] = useState<ReportReason[]>([]);
  const [selectedReasonId, setSelectedReasonId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingReasons, setIsFetchingReasons] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const fetchReasons = async () => {
        setIsFetchingReasons(true);
        try {
          const data = await getReportReasons();
          setReasons(data);
        } catch (error) {
          console.error('Failed to fetch report reasons', error);
          toast.error('Failed to load report reasons');
        } finally {
          setIsFetchingReasons(false);
        }
      };
      fetchReasons();
    } else {
      setSelectedReasonId(null);
    }
  }, [isOpen]);

  const handleSubmit = async () => {
    if (!selectedReasonId) {
      toast.error('Please select a reason');
      return;
    }

    setIsLoading(true);
    try {
      await createReport({
        targetType,
        targetId,
        reasonId: selectedReasonId,
      });
      toast.success('Thank you for reporting. Our moderation team will review it.');
      onClose();
    } catch (error: any) {
      console.error('Failed to submit report', error);
      const errorMessage = error.response?.data?.message || 'Failed to submit report';
      toast.error(errorMessage);
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  const getTargetLabel = () => {
    switch (targetType) {
      case 'POST': return 'post';
      case 'COMMENT': return 'comment';
      case 'THOUGHT': return 'thought';
      case 'USER': return 'profile';
      case 'COMPANY': return 'company';
      default: return 'content';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md bg-[#1e2330] border-none text-white sm:rounded-[24px] p-6">
        <DialogHeader className="space-y-3 pb-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-[#ff8a7a]" />
            <DialogTitle className="text-xl font-semibold text-white">Report {getTargetLabel()}</DialogTitle>
          </div>
          <DialogDescription className="text-gray-400 text-sm leading-tight text-left">
            Help us understand what&apos;s happening. Your report is anonymous.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-2 py-2 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
          {isFetchingReasons ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : (
            reasons.map((reason) => (
              <button
                key={reason.id}
                onClick={() => setSelectedReasonId(reason.id)}
                className={cn(
                  "w-full text-left px-4 py-4 rounded-xl transition-all duration-200 border border-transparent",
                  "hover:bg-white/5",
                  selectedReasonId === reason.id 
                    ? "bg-primary/10 border-primary text-white" 
                    : "text-gray-300"
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{reason.label}</span>
                  {selectedReasonId === reason.id && (
                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                  )}
                </div>
              </button>
            ))
          )}
        </div>

        <div className="pt-4">
          <Button
            onClick={handleSubmit}
            disabled={isLoading || !selectedReasonId || isFetchingReasons}
            className="w-full h-12 bg-[#5c7cff] hover:bg-[#4a6fff] text-white rounded-[14px] text-base font-semibold transition-all"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              'Submit Report'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
