"use client";

import React from 'react';
import { Icon } from '@iconify/react';

const Stage4Live = React.memo(function Stage4Live() {
  return (
    <div className="w-[944px] h-[224px] flex flex-col items-center justify-center gap-4 mx-auto select-none">
      {/* Background Icon Wrapper (80px x 80px) */}
      <div className="w-[80px] h-[80px] bg-[#D8E2FF] rounded-full flex items-center justify-center flex-none">
        <Icon icon="material-symbols:check-circle" className="w-[40px] h-[40px] text-[#1A73E8] flex-none" />
      </div>

      {/* Message Container (424px x 128px) */}
      <div className="w-[424px] h-[128px] flex flex-col items-center justify-start gap-4 flex-none">
        
        {/* Congratulations Heading */}
        <h1 className="w-[424px] h-[56px] font-poppins font-semibold text-[48px] leading-[56px] tracking-[-0.96px] text-[#1A73E8] text-center flex items-center justify-center">
          Congratulations
        </h1>

        {/* Live confirmation message */}
        <p className="w-[424px] h-[56px] font-poppins font-normal text-[18px] leading-[28px] text-[#6B7280] text-center">
          Your company page is now live. You have been assigned as the <span className="font-semibold text-[#1A73E8]">Owner</span>.
        </p>
      </div>
    </div>
  );
});

export default Stage4Live;
