"use client";

import React, { useState, useEffect } from 'react';
import { Loader2, X, ArrowLeft } from 'lucide-react';
// import {
//   Dialog,
//   DialogContent,
//   DialogHeader,
//   DialogTitle,
//   DialogDescription,
// } from '@/components/ui/dialog';
import {
  Dialog,
  BareDialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { CommentActionSnackbar } from '@/features/feed/components/comments/CommentActionSnackbar';
import { getReportReasons, createReport, ReportReason } from '@/services/api/report';
import { cn } from '@/lib/utils';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  targetType: 'POST' | 'USER' | 'COMMENT' | 'COMPANY' | 'THOUGHT';
  targetId: string | number;
}

export function ReportModal({ isOpen, onClose, onSuccess, targetType, targetId }: ReportModalProps) {
//   const [reasons, setReasons] = useState<ReportReason[]>([]);
//   const [selectedReasonId, setSelectedReasonId] = useState<number | null>(null);
//   const [isLoading, setIsLoading] = useState(false);
//   const [isFetchingReasons, setIsFetchingReasons] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  const [reasons, setReasons] = useState<ReportReason[]>([]);
  const [selectedReasonId, setSelectedReasonId] = useState<number | null>(null);
  const [additionalInfo, setAdditionalInfo] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingReasons, setIsFetchingReasons] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const fetchReasons = async () => {
        setIsFetchingReasons(true);
        try {
          const data = await getReportReasons();
          setReasons(data.filter(r => r.code !== 'OTHER' && r.label?.toLowerCase() !== 'other'));
        } catch (error) {
          console.error('Failed to fetch report reasons', error);
          toast.error('Failed to load report reasons');
        } finally {
          setIsFetchingReasons(false);
        }
      };
      fetchReasons();
//     } else {
//       setSelectedReasonId(null);
//     }
    } else {
      setSelectedReasonId(null);
      setStep(1);
      setAdditionalInfo('');
    }
  }, [isOpen]);

  const handleContinue = () => {
    if (!selectedReasonId) {
      toast.error('Please select a reason');
      return;
    }
    setStep(2);
  };

//   const handleSubmit = async () => {
//     if (!selectedReasonId) {
//       toast.error('Please select a reason');
//       return;
//     }
// 
//     setIsLoading(true);
//     try {
//       await createReport({
//         targetType,
//         targetId,
//         reasonId: selectedReasonId,
//       });
//       toast.success('Thank you for reporting. Our moderation team will review it.');
//       onClose();
//     } catch (error: any) {
//       console.error('Failed to submit report', error);
//       const errorMessage = error.response?.data?.message || 'Failed to submit report';
//       toast.error(errorMessage);
//       onClose();
//     } finally {
//       setIsLoading(false);
//     }
//   };
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
        customReason: additionalInfo.trim() || undefined,
      });
      if (targetType === 'COMMENT') {
        // Handled by onSuccess callback inline
      } else {
        toast.success('Thank you for reporting. Our moderation team will review it.');
      }
      onSuccess?.();
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
      {/*
      <DialogContent className="max-w-[400px] bg-white border-none text-black sm:rounded-[24px] p-4">
        <DialogHeader className="space-y-2 pb-2">
          <DialogTitle className="text-[18px] leading-[26px] font-medium text-black text-center font-poppins">Report</DialogTitle>
          <DialogDescription className="text-[#6B7280] text-[12px] leading-[16px] text-center font-poppins">
            Help us understand whats happening. Your report is anonymous.
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
                  "w-full text-left py-3 rounded-xl transition-all duration-200",
                  selectedReasonId === reason.id 
                    ? "text-black" 
                    : "text-black hover:bg-gray-50"
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[16px] leading-[24px] font-normal text-black font-poppins">{reason.label}</span>
                  {selectedReasonId === reason.id && (
                    <div className="w-[18px] h-[18px] rounded-[2px] bg-[#6366F1] flex items-center justify-center flex-shrink-0">
                      <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
                    </div>
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
            className="w-full h-10 bg-[#6366F1] hover:bg-[#4e5bd6] text-white rounded-[24px] text-[14px] leading-[20px] font-normal font-poppins transition-all"
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Submitting...
              </div>
            ) : (
              'Submit report'
            )}
          </Button>
        </div>
      </DialogContent>
      */}
      <BareDialogContent 
        /* Modal background set to #030303 as per updated Figma design specification */
        className="max-w-none sm:max-w-[400px] w-full border rounded-t-[16px] rounded-b-none sm:rounded-[16px] p-4 flex flex-col gap-3 font-sans shadow-lg bg-[#030303] border-ds-border !top-auto bottom-0 !translate-y-0 !translate-x-0 !left-0 sm:!top-[50%] sm:bottom-auto sm:!translate-y-[-50%] sm:!translate-x-[-50%] sm:!left-[50%]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Actions Row */}
        <div className={cn("flex flex-row items-center w-full min-h-[20px] p-0 m-0", step === 2 ? "justify-between" : "justify-end")}>
          {step === 2 && (
            <button 
              onClick={() => setStep(1)}
              className="flex items-center justify-center w-[20px] h-[20px] text-ds-text-primary hover:opacity-80 transition-opacity"
            >
              <ArrowLeft className="w-5 h-5" strokeWidth={1.5} />
            </button>
          )}
          <DialogClose asChild>
            <button className="flex items-center justify-center w-[20px] h-[20px] text-ds-text-primary hover:opacity-80 transition-opacity">
              <X className="w-5 h-5" strokeWidth={1.5} />
            </button>
          </DialogClose>
        </div>

        <DialogHeader className="flex flex-row items-center justify-center p-0 m-0 h-[24px]">
          <DialogTitle className="ds-text-body-1 text-ds-text-primary text-center leading-[24px]">
            Report
          </DialogTitle>
        </DialogHeader>

        {step === 1 ? (
          <>
            <div className="flex flex-col gap-2 p-0 m-0 w-full max-h-[60vh] overflow-y-auto custom-scrollbar">
              {isFetchingReasons ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-ds-accent" />
                </div>
              ) : (
                reasons.map((reason) => (
                  /* Reason item selection style fix: transparent background and orange text highlight when selected per Figma design */
                  <button
                    key={reason.id}
                    onClick={() => setSelectedReasonId(selectedReasonId === reason.id ? null : reason.id)}
                    className={cn(
                      "flex items-center w-full min-h-[36px] px-3 py-2 rounded-lg transition-colors duration-150 outline-none text-left cursor-pointer bg-transparent",
                      selectedReasonId === reason.id
                        ? "text-ds-accent"
                        : "text-ds-text-primary hover:text-ds-accent"
                    )}
                  >
                    <span className="ds-text-body-1 font-medium leading-[24px]">
                      {reason.label}
                    </span>
                  </button>
                ))
              )}
            </div>

            <div className="flex flex-row justify-center items-center p-0 m-0 w-full min-h-[36px]">
              {/* Fix button hover color to #EC6229 (bg-ds-accent) overriding default purple button hover */}
              <Button
                onClick={handleContinue}
                disabled={!selectedReasonId || isFetchingReasons}
                className="flex flex-row justify-center items-center gap-[10px] w-auto min-h-[36px] px-[16px] py-[6px] ds-text-body-1 bg-ds-accent hover:bg-ds-accent hover:opacity-90 active:scale-[0.98] text-white rounded-full transition-all disabled:!bg-ds-surface-1 disabled:opacity-100 disabled:!text-ds-text-muted disabled:pointer-events-none focus-visible:ring-2 focus-visible:ring-ds-accent cursor-pointer"
              >
                Continue
              </Button>
            </div>
          </>
        ) : (
          <>
            {/* Multi-line textarea for additional details */}
            <textarea
              className="w-full min-h-[80px] bg-transparent border border-ds-border rounded-[16px] p-[10px] ds-text-secondary text-ds-text-primary placeholder:text-ds-text-muted focus:outline-none focus:border-ds-accent resize-none custom-scrollbar m-0"
              placeholder="Additional information (optional)"
              value={additionalInfo}
              onChange={(e) => setAdditionalInfo(e.target.value)}
            />
            
            <div className="flex flex-row justify-center items-center gap-[8px] p-0 m-0 w-full min-h-[36px]">
              {/* Fix submit button hover color to #EC6229 (bg-ds-accent) overriding default purple button hover */}
              <Button
                onClick={handleSubmit}
                disabled={isLoading}
                className="flex flex-row justify-center items-center gap-[10px] min-w-[77px] min-h-[36px] px-[16px] py-[6px] ds-text-body-1 bg-ds-accent hover:bg-ds-accent hover:opacity-90 active:scale-[0.98] text-white rounded-full transition-all disabled:!bg-ds-surface-1 disabled:opacity-100 disabled:!text-ds-text-muted disabled:pointer-events-none focus-visible:ring-2 focus-visible:ring-ds-accent cursor-pointer"
              >
                {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : 'Submit'}
              </Button>
              <DialogClose asChild>
                <Button
                  disabled={isLoading}
                  variant="outline"
                  className="flex flex-row justify-center items-center gap-[10px] min-w-[77px] min-h-[36px] px-[16px] py-[6px] ds-text-body-1 bg-transparent border border-ds-border hover:bg-ds-surface-1 text-ds-text-primary rounded-full transition-all disabled:opacity-100 disabled:text-ds-text-muted disabled:border-ds-border focus-visible:ring-2 focus-visible:ring-ds-accent cursor-pointer"
                >
                  Cancel
                </Button>
              </DialogClose>
            </div>
          </>
        )}
      </BareDialogContent>
    </Dialog>
  );
}
