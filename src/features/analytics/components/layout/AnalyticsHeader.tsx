import React from 'react';

interface AnalyticsHeaderProps {
  userName: string;
}

export function AnalyticsHeader({ userName }: AnalyticsHeaderProps) {
  return (
    <div className="box-border flex flex-col justify-center items-start p-[24px] w-full max-w-[846.67px] h-[96px] bg-ds-surface-1 border border-ds-border shadow-sm rounded-[16px] flex-none order-0 self-stretch grow-0 font-['DM_Sans']">
      <div className="flex flex-col items-start p-0 gap-[4px] w-full h-[48px] flex-none order-0 self-stretch grow-0">
        <h1 className="h-[24px] font-['DM_Sans'] font-semibold text-[16px] leading-[24px] flex items-center text-ds-text-primary flex-none order-0 grow-0 m-0">
          Hello, {userName}
        </h1>
        <p className="w-full h-[20px] font-['DM_Sans'] font-normal text-[14px] leading-[20px] flex items-center text-ds-text-secondary flex-none order-1 self-stretch grow-0 m-0">
          Ready to see where your career is headed?
        </p>
      </div>
    </div>
  );
}
