import React from 'react';
import { Button } from '@/components/ui/button';

interface StageNavigationButtonsProps {
  currentStage: number;
  isNextDisabled?: boolean;
  onNext: () => void;
  onBack: () => void;
  onCancel?: () => void;
  onPublish?: () => void;
  isSubmitting?: boolean;
}

const StageNavigationButtons = React.memo(function StageNavigationButtons({
  currentStage,
  isNextDisabled = false,
  onNext,
  onBack,
  onCancel,
  onPublish,
  isSubmitting = false
}: StageNavigationButtonsProps) {
  if (currentStage === 0) return null; // No buttons on Choose Organization page

  return (
    <div className="flex items-center justify-end gap-2 pt-6 mt-10 w-full max-w-[944px] mx-auto">
      <Button 
        variant="outline" 
        className="rounded-[24px] px-4 py-2 border border-[#6B7280] dark:border-[#A1A8B3] text-[#6B7280] dark:text-[#A1A8B3] hover:bg-transparent hover:text-[#6B7280] dark:hover:text-[#A1A8B3] font-poppins font-normal text-[14px] leading-[20px] h-[40px] w-[140px] flex items-center justify-center flex-none" 
        onClick={onBack}
      >
        Back
      </Button>

      {currentStage === 3 ? (
        <Button 
          className="rounded-[24px] px-4 py-2 bg-[#1A73E8] hover:bg-[#1A73E8] text-white font-poppins font-normal text-[14px] leading-[20px] h-[40px] w-[140px] disabled:bg-[#E0E0E7] dark:disabled:bg-[#1C2840] disabled:text-white disabled:opacity-100 flex items-center justify-center flex-none gap-2" 
          onClick={onPublish}
          disabled={isNextDisabled || isSubmitting}
        >
          {isSubmitting && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
          Publish
        </Button>
      ) : (
        <Button 
          className="rounded-[24px] px-4 py-2 bg-[#1A73E8] hover:bg-[#1A73E8] text-white font-poppins font-normal text-[14px] leading-[20px] h-[40px] w-[140px] disabled:bg-[#E0E0E7] dark:disabled:bg-[#1C2840] disabled:text-white disabled:opacity-100 flex items-center justify-center flex-none gap-2" 
          onClick={onNext}
          disabled={isNextDisabled || isSubmitting}
        >
          {isSubmitting && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
          Next Step
        </Button>
      )}
    </div>
  );
});

export default StageNavigationButtons;
