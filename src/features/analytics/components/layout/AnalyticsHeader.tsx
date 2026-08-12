import React from 'react';

interface AnalyticsHeaderProps {
  userName: string;
}

export function AnalyticsHeader({ userName }: AnalyticsHeaderProps) {
  return (
    <div className="w-full max-w-[960px] h-[120px] bg-[#EEF2FF] border border-[#E0E7FF] rounded-[24px] py-6 px-8 flex flex-col justify-center items-start">
      <h1 className="text-[32px] font-semibold text-[#6366F1] font-['Poppins'] leading-[48px]">
        Hello, {userName}
      </h1>
      <p className="text-[16px] font-medium text-[#6366F1] font-['Poppins'] leading-[24px]">
        Ready to see where your career is headed?
      </p>
    </div>
  );
}
