import React from 'react';
import { Button } from '@/components/ui/button';

interface StageNavigationButtonsProps {
  currentStage: number;
  isNextDisabled?: boolean;
  onNext: () => void;
  onBack: () => void;
  onCancel?: () => void;
  onPublish?: () => void;
}

const StageNavigationButtons = React.memo(function StageNavigationButtons({
  currentStage,
  isNextDisabled = false,
  onNext,
  onBack,
  onCancel,
  onPublish
}: StageNavigationButtonsProps) {
  if (currentStage === 0) return null; // No buttons on Choose Organization page

  return (
    <div className="flex items-center justify-end gap-2 pt-6 mt-10 w-full max-w-[944px] mx-auto">
      <Button 
        variant="outline" 
        className="rounded-[24px] px-4 py-2 border border-[#6B7280] text-[#6B7280] hover:bg-slate-50 font-poppins font-normal text-[14px] leading-[20px] h-[40px] w-[140px] flex items-center justify-center flex-none" 
        onClick={onBack}
      >
        Back
      </Button>

      {currentStage === 3 ? (
        <Button 
          className="rounded-[24px] px-4 py-2 bg-[#1A73E8] hover:bg-[#1557b0] text-white font-poppins font-normal text-[14px] leading-[20px] h-[40px] w-[140px] disabled:bg-[#E0E0E7] disabled:text-white disabled:opacity-100 flex items-center justify-center flex-none" 
          onClick={onPublish}
          disabled={isNextDisabled}
        >
          Publish
        </Button>
      ) : (
        <Button 
          className="rounded-[24px] px-4 py-2 bg-[#1A73E8] hover:bg-[#1557b0] text-white font-poppins font-normal text-[14px] leading-[20px] h-[40px] w-[140px] disabled:bg-[#E0E0E7] disabled:text-white disabled:opacity-100 flex items-center justify-center flex-none" 
          onClick={onNext}
          disabled={isNextDisabled}
        >
          Next Step
        </Button>
      )}
    </div>
  );
});

export default StageNavigationButtons;
