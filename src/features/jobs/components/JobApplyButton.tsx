import React from 'react';
import { Icon } from '@iconify/react';
import { useFeatureFlags } from '@/context/FeatureFlagContext';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { FeatureDisabledTooltip } from '@/components/feature-flags';

interface JobApplyButtonProps {
  isApplied: boolean;
  isSaved: boolean;
  onApply: () => void;
  onSave: () => void;
}

export const JobApplyButton: React.FC<JobApplyButtonProps> = ({
  isApplied,
  isSaved,
  onApply,
  onSave
}) => {
  const { flags } = useFeatureFlags();

  return (
    <div className="w-full bg-white p-4 rounded-3xl outline outline-1 outline-offset-[-1px] outline-indigo-50/100 flex justify-between items-center gap-4 shadow-[0px_4px_24px_rgba(99,102,241,0.02)]">
      {flags?.saved_jobs === false ? (
        <Tooltip delayDuration={100}>
          <TooltipTrigger asChild>
            <div tabIndex={0} className="focus:outline-none flex items-center gap-2 px-5 py-3 rounded-2xl outline outline-1 outline-gray-200 bg-gray-50 opacity-60 cursor-default font-medium text-sm font-['Poppins'] text-gray-500">
              <Icon
                icon="solar:bookmark-linear"
                className="w-5 h-5 text-gray-400"
              />
              <span>Save Job</span>
            </div>
          </TooltipTrigger>
          <TooltipContent
            side="top"
            align="center"
            sideOffset={8}
            className="py-2 px-3 bg-gray-900 border-none text-white text-xs font-['Poppins'] z-[9999] shadow-lg rounded-xl"
          >
            Feature under maintenance
          </TooltipContent>
        </Tooltip>
      ) : (
        <button
          onClick={onSave}
          className="flex items-center gap-2 px-5 py-3 rounded-2xl outline outline-1 outline-indigo-100 hover:bg-slate-50 transition-all font-medium text-sm font-['Poppins'] text-gray-700 active:scale-95"
        >
          <Icon
            icon={isSaved ? 'solar:bookmark-bold' : 'solar:bookmark-linear'}
            className={`w-5 h-5 ${isSaved ? 'text-indigo-500' : 'text-gray-500'}`}
          />
          <span>{isSaved ? 'Saved' : 'Save Job'}</span>
        </button>
      )}

      <FeatureDisabledTooltip featureKey="enableJobApplications" disabledMessage="Job applications are temporarily paused by administration.">
        <button
          onClick={onApply}
          disabled={isApplied}
          className={`flex-1 py-3 px-6 rounded-2xl flex justify-center items-center gap-2 font-semibold text-sm font-['Poppins'] transition-all active:scale-95 ${isApplied
              ? 'bg-emerald-500 text-white cursor-default'
              : 'bg-indigo-500 hover:bg-indigo-600 text-white shadow-md shadow-indigo-500/10'
            }`}
        >
          <Icon icon={isApplied ? 'lucide:check-circle' : 'lucide:send'} className="w-5 h-5" />
          <span>{isApplied ? 'Already Applied' : 'Apply Now'}</span>
        </button>
      </FeatureDisabledTooltip>
    </div>
  );
};

export default JobApplyButton;
