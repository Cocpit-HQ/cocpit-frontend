'use client';

import React from 'react';
import { Icon } from '@iconify/react';

interface TeamHeaderProps {
  onCreateRole: () => void;
}

export default function TeamHeader({ onCreateRole }: TeamHeaderProps) {
  return (
    <div className="w-full flex flex-col gap-4">
      <div className="w-full px-8 py-6 bg-company-ultra-light rounded-[24px] inline-flex justify-between items-center overflow-hidden">
        <div className="flex-1 inline-flex flex-col justify-start items-start gap-2">
          <div className="self-stretch flex flex-col justify-start items-start gap-1">
            <h1 className="justify-center text-company-text text-[32px] font-semibold font-['Poppins'] leading-[40px]">
              Manage team
            </h1>
            <p className="self-stretch justify-center text-company-secondary text-[16px] font-normal font-['Poppins'] leading-[26px]">
              Add, remove, and manage your organization&apos;s team members.
            </p>
          </div>
          <button
            onClick={onCreateRole}
            className="mt-2 px-4 py-2 bg-company-primary rounded-[24px] inline-flex justify-center items-center gap-[10px] transition-all active:scale-95 hover:opacity-90 shadow-sm"
          >
            <span className="text-center justify-start text-[#FFFFFF] text-[16px] font-medium font-['Poppins'] leading-[20px]">
              Create role
            </span>
          </button>
        </div>
        <div className="flex-shrink-0">
          <img
            src="/images/Team/create_team.png"
            alt="Team illustration"
            className="w-[180px] h-[134px] object-contain"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        </div>
      </div>
    </div>
  );
}
