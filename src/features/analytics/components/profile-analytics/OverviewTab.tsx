import React, { useState, useEffect, useRef } from 'react';
import { Icon } from '@iconify/react';

export const OverviewTab = ({ data }: { data?: any }) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('Last 30 days');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="flex flex-col w-full mt-6">
      {/* Header */}
      <div className="flex flex-row items-center py-0 gap-[10px] w-full h-[26px] mb-6">
        <span className="w-[815px] h-[26px] font-['Poppins'] font-medium text-[18px] leading-[26px] flex items-center text-[#000000] flex-1">
          Key metrics
        </span>
        <div className="relative" ref={dropdownRef}>
          <div 
            className="flex flex-row items-center p-0 gap-[8px] w-[103px] h-[20px] cursor-pointer"
            onClick={() => setDropdownOpen(!dropdownOpen)}
          >
            <span className="w-[75px] h-[16px] font-['Poppins'] font-normal text-[12px] leading-[16px] flex items-center text-[#6B7280]">
              {selectedFilter === 'Last 30 days' ? 'Last 30 Days' : selectedFilter}
            </span>
            <Icon icon="lucide:chevron-down" className={`w-[20px] h-[20px] text-[#6B7280] transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} strokeWidth={1.5} />
          </div>
          
          {dropdownOpen && (
            <div className="absolute top-8 right-0 z-50 flex flex-col items-center p-2 w-[135px] bg-white border border-[#EEF2FF] rounded-[24px] shadow-lg">
              {['Today', 'Last 7 days', 'Last 30 days', 'All time'].map((filter) => (
                <div
                  key={filter}
                  className={`flex flex-row items-center px-4 py-2 gap-[10px] w-[119px] h-[36px] bg-white rounded-[24px] cursor-pointer hover:bg-gray-50 transition-colors ${
                    selectedFilter === filter ? 'text-[#6366F1]' : 'text-black'
                  }`}
                  onClick={() => {
                    setSelectedFilter(filter);
                    setDropdownOpen(false);
                  }}
                >
                  <span className="text-[14px] font-normal font-['Poppins']">
                    {filter}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Top Row: Chart and Profile Strength */}
      <div className="grid grid-cols-3 gap-6 mb-6 h-[294px]">
        {/* Chart Card */}
        <div className="col-span-2 flex flex-col justify-center items-center p-4 gap-4 bg-white shadow-[0_1px_2px_rgba(99,102,241,0.08)] rounded-[24px]">
          {/* Container (Header) */}
          <div className="flex flex-row justify-between items-center w-full h-[52px]">
            {/* Left Header */}
            <div className="flex flex-col items-start gap-1 w-[75px] h-full">
              <span className="text-[12px] font-medium text-[#6B7280] font-['Poppins'] leading-[16px] flex items-center h-[16px]">Profile views</span>
              <span className="text-[24px] font-semibold text-black font-['Poppins'] leading-[32px] flex items-center h-[32px]">1,284</span>
            </div>
            {/* Right Header (Overlay) */}
            <div className="flex flex-row items-center pt-[6px] gap-[4px] h-[21px] rounded-full">
              <Icon icon="lucide:trending-up" className="w-[10px] h-[10px] text-[#22C55E]" />
              <span className="text-[10px] font-normal text-[#22C55E] font-['Poppins'] leading-[15px] flex items-center h-[15px]">+12% vs last period</span>
            </div>
          </div>
          
          {/* Chart Area */}
          <div className="flex flex-col items-start w-full h-[194px]">
            {/* Chart SVG wrapper */}
            <div className="w-full h-[162px] relative overflow-visible">
              <svg viewBox="-8 0 597 162" className="w-full h-full overflow-visible" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="gradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366F1" stopOpacity="0.12" />
                    <stop offset="100%" stopColor="#6366F1" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path 
                  d="M 0,106 C 70,106 110,118 170,106 C 230,94 260,43 320,43 C 380,43 410,58 470,51 C 530,43 560,23 581,15 L 581,162 L 0,162 Z" 
                  fill="url(#gradient)" 
                />
                <path 
                  d="M 0,106 C 70,106 110,118 170,106 C 230,94 260,43 320,43 C 380,43 410,58 470,51 C 530,43 560,23 581,15" 
                  fill="none" 
                  stroke="#6366F1" 
                  strokeWidth="4.65" 
                  strokeLinecap="round"
                />
              </svg>
              {/* Dates */}
              <span className="absolute bottom-0 left-0 text-[12px] font-normal text-[#6B7280] font-['Poppins'] leading-[16px] flex items-center h-[16px]">01 August 2026</span>
              <span className="absolute bottom-0 right-[6px] text-[12px] font-normal text-[#6B7280] font-['Poppins'] leading-[16px] flex items-center h-[16px]">30 August 2026</span>
            </div>
            
            {/* Footer / Tip */}
            <div className="flex flex-row justify-between items-center pt-[16px] w-full h-[32px]">
              <span className="text-[12px] font-normal text-[#6B7280] font-['Poppins'] leading-[16px] flex items-center h-[16px]">Tip: Your activity peaked after Thursday's post.</span>
            </div>
          </div>
        </div>

        {/* Profile Completeness Card */}
        <div className="col-span-1 flex flex-col items-start p-4 gap-2 bg-white shadow-[0_1px_2px_rgba(99,102,241,0.08)] rounded-[24px]">
          {/* Top Container */}
          <div className="flex flex-col items-start gap-2 w-full h-[66px]">
            <span className="text-[12px] font-medium text-[#6B7280] font-['Poppins'] leading-[16px] flex items-center h-[16px] w-full">Profile strength</span>
            <div className="flex flex-row justify-between items-center w-full h-[26px]">
              <span className="text-[18px] font-medium text-black font-['Poppins'] leading-[26px] flex items-center">92%</span>
              <Icon icon="bitcoin-icons:verify-filled" className="w-[24px] h-[24px] text-[#22C55E]" />
            </div>
          </div>
          {/* Progress Bar Container */}
          <div className="flex flex-col justify-end items-start w-full h-[8px] relative">
            <div className="w-full h-[8px] bg-[#DADADA] rounded-full"></div>
            <div className="absolute top-0 left-0 h-[8px] bg-[#22C55E] rounded-full w-[92%]"></div>
          </div>
          {/* Footer */}
          <div className="flex flex-col items-start pt-[8px] w-full h-[24px]">
            <span className="text-[12px] font-normal text-[#6B7280] font-['Poppins'] leading-[16px] flex items-center h-[16px]">Add 'project' & 'education' to hit 100%</span>
          </div>
        </div>
      </div>

      {/* Grid Metrics */}
      <div className="grid grid-cols-3 gap-6 mb-6">
        {[
          { label: 'Search appearances', value: '156', trend: '+24%', isPositive: true },
          { label: 'Connection requests', value: '34', trend: '-2%', isPositive: false },
          { label: 'follower growth', value: '123', trend: '+24%', isPositive: true },
          { label: 'Opportunity views', value: '42', trend: 'Stable', isPositive: null },
          { label: 'Resume views', value: '1,890', trend: 'Stable', isPositive: null },
          { label: 'Resume downloads', value: '342', trend: '+24%', isPositive: true },
        ].map((metric, idx) => (
          <div key={idx} className="flex flex-col justify-center items-start p-[24px] gap-[8px] h-[88px] bg-white shadow-[0_1px_2px_rgba(99,102,241,0.08)] rounded-[24px]">
            <span className="text-[12px] font-medium text-[#6B7280] font-['Poppins'] leading-[16px] flex items-center h-[16px] w-full">
              {metric.label}
            </span>
            <div className="flex flex-row justify-between items-center w-full h-[32px]">
              <span className="text-[24px] font-semibold text-black font-['Poppins'] leading-[32px] flex items-center h-[32px]">
                {metric.value}
              </span>
              {metric.trend === 'Stable' ? (
                <span className="text-[12px] font-normal text-[#6B7280] font-['Poppins'] leading-[16px] flex items-center h-[16px]">
                  {metric.trend}
                </span>
              ) : (
                <div className="flex flex-row items-center gap-[8px] h-[16px]">
                  <Icon 
                    icon={metric.isPositive ? "lucide:trending-up" : "lucide:trending-down"} 
                    className={`w-[12px] h-[12px] ${metric.isPositive ? 'text-[#22C55E]' : 'text-[#FF6B6B]'}`} 
                  />
                  <span className={`text-[12px] font-normal font-['Poppins'] leading-[16px] flex items-center h-[16px] ${metric.isPositive ? 'text-[#22C55E]' : 'text-[#FF6B6B]'}`}>
                    {metric.trend.replace(/[-+]/g, '')}
                  </span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Insights */}
      <div className="flex flex-row items-center p-[16px] gap-[24px] w-full min-h-[138px] bg-[#FFFFFF] border border-[#EEF2FF] rounded-[24px]">
        <div className="flex flex-row justify-center items-center w-[96px] h-[96px] bg-[#EEF2FF] rounded-[12px] shrink-0">
          <Icon icon="lucide:sparkles" className="w-[40px] h-[40px] text-[#6366F1]" />
        </div>
        <div className="flex flex-col items-start p-0 gap-[8px] flex-1">
          <span className="w-full h-[24px] font-['Poppins'] font-medium text-[16px] leading-[24px] flex items-center text-[#6366F1]">
            Insights
          </span>
          <ul className="flex flex-col m-0 pl-[24px] gap-0 list-disc marker:text-[#6B7280]">
            <li className="font-['Poppins'] font-normal text-[16px] leading-[24px] text-[#6B7280]">Profile visibility increased 12%</li>
            <li className="font-['Poppins'] font-normal text-[16px] leading-[24px] text-[#6B7280]">Recruiter interest increased 24%</li>
            <li className="font-['Poppins'] font-normal text-[16px] leading-[24px] text-[#6B7280]">Your articles generated the most profile visits</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
