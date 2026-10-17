import React from 'react';
import Image from 'next/image';
import { Icon } from '@iconify/react';

interface ChannelEmptyStateProps {
  onCreateChannel: () => void;
}

export default function ChannelEmptyState({ onCreateChannel }: ChannelEmptyStateProps) {
  return (
    <div className="w-full flex flex-col pt-2">
      {/* Top Banner */}
      <div className="w-full bg-[#F2F7FF] dark:bg-[#121B2B] rounded-[24px] px-8 py-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex flex-col max-w-[700px] gap-1">
          <h1 className="text-[#000000] dark:text-[#FFFFFF] text-[32px] font-semibold font-['Poppins'] leading-[40px]">
            Channel
          </h1>
          <p className="text-[#6B7280] dark:text-[#A1A8B3] text-[14px] font-normal font-['Poppins'] leading-[23px]">
            Assemble a specialized network of experts. Leverage AI tools to manage and scale your influence
          </p>
        </div>
        <div className="flex-shrink-0">
          <Image
            src="/images/CHANNEL/CHANNEL.png"
            alt="Channel Illustration"
            width={180}
            height={133}
            className="w-[180px] h-auto object-contain"
            priority
          />
        </div>
      </div>

      {/* Empty State Content */}
      <div className="w-full flex flex-col items-center justify-center gap-5 mt-20 text-center">
        <div className="flex flex-col items-center gap-3">
          <h2 className="text-[#000000] dark:text-[#FFFFFF] text-[24px] font-bold font-['Poppins'] tracking-tight">
            No active channel yet
          </h2>
          <p className="max-w-[420px] text-[#6B7280] dark:text-[#A1A8B3] text-[14px] font-normal font-['Poppins'] leading-relaxed">
            Ignite your professional growth. Create your own circle of Influence or explore trending hubs curated by AI.
          </p>
        </div>

        <button
          onClick={onCreateChannel}
          className="mt-2 flex justify-center items-center px-4 py-2 rounded-[24px] bg-[#1A73E8] hover:opacity-90 dark:bg-[#4D9CFF] text-white text-[16px] font-medium font-['Poppins'] leading-[20px] transition-all active:scale-95 shadow-sm"
        >
          Create channel
        </button>

        <div className="mt-4 flex flex-row items-center gap-[12px] px-[20px] py-[10px] rounded-full bg-[#F2F7FF] shadow-sm dark:bg-[#1A2435] text-[#1A73E8] dark:text-[#4D9CFF] text-[14px] font-normal font-['Poppins'] leading-[20px]">
          <img src="/assets/AI 2.svg" className="w-6 h-6 flex-shrink-0" alt="AI Icon" />
          <span>Channel foster 40% faster knowledge sharing.</span>
        </div>
      </div>
    </div>
  );
}
