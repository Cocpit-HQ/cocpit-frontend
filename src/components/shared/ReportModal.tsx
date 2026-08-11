"use client";

import React, { useState, useEffect } from 'react';
import { Loader2, Check, X } from 'lucide-react';
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
          setReasons(data.filter(r => r.code !== 'OTHER' && r.label?.toLowerCase() !== 'other'));
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
    </Dialog>
  );
}
