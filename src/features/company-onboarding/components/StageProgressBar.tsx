import React from 'react';

interface StageProgressBarProps {
  currentStage: number;
}

const StageProgressBar = React.memo(function StageProgressBar({ currentStage }: StageProgressBarProps) {
  // Only render for stages 1, 2, 3
  if (currentStage < 1 || currentStage > 3) return null;

  const stages = [
    { num: 1, label: 'Stage 1: Identity', textWidthClass: 'w-[156px]', innerWidthClass: 'w-[124px]' },
    { num: 2, label: 'Stage 2: Presence', textWidthClass: 'w-[174px]', innerWidthClass: 'w-[142px]' },
    { num: 3, label: 'Stage 3: Verification', textWidthClass: 'w-[191px]', innerWidthClass: 'w-[159px]' },
  ];

  return (
    <div className="w-[944px] h-[42px] flex flex-row items-start p-0 mx-auto self-stretch flex-none mb-10 select-none">
      {stages.map((stage, idx) => {
        const isActive = currentStage === stage.num;
        const isCompleted = currentStage > stage.num;

        // Col1 (Left progress line) status
        let leftLineColor = 'bg-[#E0E0E7]';
        if (stage.num === 1) {
          leftLineColor = 'bg-transparent'; // No left line on first step
        } else if (stage.num === 2) {
          leftLineColor = currentStage >= 2 ? 'bg-[#1A73E8]' : 'bg-[#E0E0E7]';
        } else if (stage.num === 3) {
          leftLineColor = currentStage >= 3 ? 'bg-[#1A73E8]' : 'bg-[#E0E0E7]';
        }

        // Col3 (Right progress line) status
        let rightLineColor = 'bg-[#E0E0E7]';
        if (stage.num === 3) {
          rightLineColor = 'bg-transparent'; // No right line on last step
        } else if (stage.num === 1) {
          rightLineColor = currentStage >= 2 ? 'bg-[#1A73E8]' : 'bg-[#E0E0E7]';
        } else if (stage.num === 2) {
          rightLineColor = currentStage >= 3 ? 'bg-[#1A73E8]' : 'bg-[#E0E0E7]';
        }

        return (
          <div 
            key={stage.num} 
            className="w-[314.67px] h-[42px] flex flex-col justify-center items-center p-0 gap-2 flex-grow flex-none"
          >
            {/* Row - Circle & Lines */}
            <div className="w-[314.67px] h-4 flex flex-row items-center p-0 self-stretch flex-none">
              
              {/* Col1 - Left Progress Line */}
              <div className="w-[149.33px] h-4 flex flex-row justify-end items-center p-0 flex-grow flex-none">
                <div className={`w-[149.33px] h-[2px] flex-grow flex-none ${leftLineColor}`} />
              </div>

              {/* Col2 - Circle Indicator */}
              <div className="w-4 h-4 flex flex-row justify-center items-center p-0 gap-[10px] flex-none relative">
                {isActive && (
                  <div className="absolute w-4 h-4 rounded-full border-[4px] border-[#1A73E8] bg-white flex-none" />
                )}
                {isCompleted && (
                  <div className="absolute w-4 h-4 rounded-full bg-[#1A73E8] flex items-center justify-center flex-none">
                    <svg width="8" height="6" viewBox="0 0 8 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M1 3L3 5L7 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                )}
                {!isActive && !isCompleted && (
                  <div className="absolute w-4 h-4 rounded-full border-[4px] border-white bg-[#E0E0E7] shadow-[0_0_0_1px_#E0E0E7] flex-none" />
                )}
              </div>

              {/* Col3 - Right Progress Line */}
              <div className="w-[149.33px] h-4 flex flex-row justify-start items-center p-0 flex-grow flex-none">
                <div className={`w-[149.33px] h-[2px] flex-grow flex-none ${rightLineColor}`} />
              </div>

            </div>

            {/* Placeholder - Label Text */}
            <div className={`${stage.textWidthClass} h-[18px] flex flex-row justify-center items-center px-4 flex-none`}>
              <span 
                className={`${stage.innerWidthClass} h-[18px] text-[16px] leading-[18px] font-poppins font-normal text-center flex items-center justify-center tracking-[-0.32px] flex-none transition-colors duration-300
                  ${isActive ? 'text-[#1A73E8]' : 'text-[#6B7280]'}
                `}
              >
                {stage.label}
              </span>
            </div>

          </div>
        );
      })}
    </div>
  );
});

export default StageProgressBar;
