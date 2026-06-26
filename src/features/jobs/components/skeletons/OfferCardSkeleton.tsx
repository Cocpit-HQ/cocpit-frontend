import React from 'react';

export const OfferCardSkeleton: React.FC = () => {
  return (
    <div className="relative w-full flex flex-col items-end animate-pulse">
      {/* PART 1 — Job Details Frame */}
      <div 
        style={{ borderWidth: '1px', borderStyle: 'solid' }}
        className="relative w-full h-auto rounded-[24px] bg-white p-[16px] flex flex-col md:flex-row justify-between items-stretch md:items-center box-border gap-4 border-[#EEF2FF]"
      >
        {/* LEFT — Job info container */}
        <div className="flex flex-col items-start justify-center p-0 gap-[4px] flex-1">
          {/* Role + Deadline Row */}
          <div className="flex flex-row flex-wrap items-center gap-2 sm:gap-[16px]">
            <div className="w-40 h-5 bg-slate-200 rounded" />
            <div className="w-24 h-4 bg-slate-100 rounded" />
          </div>
          {/* Company Name */}
          <div className="w-28 h-4 bg-slate-200 rounded mt-1" />
          {/* Location */}
          <div className="w-20 h-4 bg-slate-200 rounded mt-1" />
        </div>

        {/* RIGHT — Action buttons */}
        <div className="flex flex-row items-center p-0 gap-[8px] w-full md:w-auto h-[40px] justify-end">
          <div className="w-[100px] sm:w-[140px] h-[40px] bg-slate-100 rounded-[24px]" />
          <div className="w-[100px] sm:w-[140px] h-[40px] bg-slate-200 rounded-[24px]" />
        </div>

        {/* CONNECTOR LINE (always show for high-fidelity visual layout) */}
        <div
          style={{
            position: 'absolute',
            width: '35px',
            height: '24px',
            left: '25.5px',
            bottom: '-24px',
            borderLeft: '1px solid #EEF2FF',
            borderBottom: '1px solid #EEF2FF',
            borderBottomLeftRadius: '24px',
            pointerEvents: 'none'
          }}
        />
      </div>

      {/* PART 2 — Note Frame */}
      <div 
        style={{
          borderTop: '1px solid #EEF2FF',
          borderRight: '1px solid #EEF2FF',
          borderBottom: '1px solid #EEF2FF',
          borderLeft: '2px solid #E0E7FF',
          minHeight: '104px'
        }}
        className="box-border flex flex-col items-start p-[12px] px-[16px] gap-[8px] w-[calc(100%-60px)] bg-[#F9FAFF] rounded-tr-[16px] rounded-br-[16px] rounded-bl-[16px] mt-[16px] self-end"
      >
        {/* Recruiter info row */}
        <div className="flex flex-row justify-start items-center p-0 gap-[8px] w-full h-[40px]">
          {/* Avatar circle */}
          <div className="w-10 h-10 rounded-full bg-slate-200" />
          {/* Name & Headline */}
          <div className="flex flex-col justify-center gap-1.5 h-[32px] flex-1">
            <div className="w-24 h-3 bg-slate-200 rounded" />
            <div className="w-32 h-3 bg-slate-200 rounded" />
          </div>
        </div>

        {/* Note text lines */}
        <div className="mt-[8px] w-full flex flex-col gap-2">
          <div className="w-full h-3.5 bg-slate-200 rounded" />
          <div className="w-4/5 h-3.5 bg-slate-200 rounded" />
        </div>
      </div>
    </div>
  );
};

export default OfferCardSkeleton;
