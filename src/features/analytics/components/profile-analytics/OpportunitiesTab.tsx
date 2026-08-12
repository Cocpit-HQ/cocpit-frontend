import React, { useState, useEffect, useRef } from 'react';
import { Icon } from '@iconify/react';

export const OpportunitiesTab = ({ data }: { data?: any }) => {
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
          Opportunity overview
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

      {/* High-Level Summary Card */}
      <div className="box-border flex flex-row items-center p-[24px] gap-[16px] w-[960px] h-[124px] bg-[#FFFFFF] border border-[#EEF2FF] rounded-[24px] mb-6 relative">
        <div className="absolute left-0 right-0 top-0 bottom-[0.22px] rounded-[8px] z-0" />
        
        <div className="flex flex-row justify-center items-center p-0 w-[60px] h-[60px] bg-[#EEF2FF] rounded-[12px] shrink-0 z-10">
          <div className="flex flex-col items-start p-0 w-[33px] h-[33px]">
            <Icon icon="lucide:sparkles" className="w-[33px] h-[33px] text-[#6366F1]" />
          </div>
        </div>
        
        <div className="flex flex-col items-start p-0 gap-[8px] w-[834px] h-[74px] flex-1 z-20">
          <span className="w-full h-[26px] font-['Poppins'] font-medium text-[18px] leading-[26px] flex items-center text-[#6366F1]">
            The trajectory summary
          </span>
          <span className="w-full h-[40px] font-['Poppins'] font-normal text-[14px] leading-[20px] flex items-center text-[#6B7280]">
            Your strongest areas are growth and team leadership, while P&L management and strategic influence are your biggest gaps for the target role
          </span>
        </div>
      </div>

      {/* Top Metrics Row */}
      <div className="flex flex-row items-start p-0 gap-[24px] w-full h-[120px] mb-6">
        {/* Left card */}
        <div className="flex flex-row justify-between items-center p-[24px] w-[468px] h-[120px] bg-[#F9FAFF] rounded-[24px]">
          <div className="flex flex-col items-start p-0 gap-[4px] w-[216px] h-[72px]">
            <span className="h-[16px] font-['Poppins'] font-medium text-[12px] leading-[16px] flex items-center text-[#000000]">Opportunity activity</span>
            <span className="w-full h-[32px] font-['Poppins'] font-semibold text-[24px] leading-[32px] flex items-center text-[#6366F1]">42 recruiter views</span>
            <span className="h-[16px] font-['Poppins'] font-normal text-[12px] leading-[16px] flex items-center text-[#22C55E]">+15% from last period</span>
          </div>
          <div className="flex flex-row justify-center items-center w-[64px] h-[64px] bg-white/20 rounded-full">
            <Icon icon="lucide:trending-up" className="w-[30px] h-[30px] text-[#2F2EBE]" strokeWidth={2} />
          </div>
        </div>

        {/* Right card */}
        <div className="flex flex-row justify-between items-center p-[24px] w-[468px] h-[120px] bg-[#FFFFFF] shadow-[0_1px_2px_rgba(99,102,241,0.08)] rounded-[24px]">
          <div className="flex flex-col items-start p-0 gap-[4px] w-[304px] h-[72px]">
            <span className="h-[16px] font-['Poppins'] font-medium text-[12px] leading-[16px] flex items-center text-[#6B7280]">Repeat organization visitors</span>
            <span className="h-[32px] font-['Poppins'] font-semibold text-[24px] leading-[32px] flex items-center text-[#000000]">24%</span>
            <span className="h-[16px] font-['Poppins'] font-normal text-[12px] leading-[16px] flex items-center text-[#6B7280]">10 recruiters returned to your profile multiple times.</span>
          </div>
          <div className="flex flex-row justify-center items-center w-[48px] h-[48px] bg-[#EEF2FF] rounded-[9999px]">
            <Icon icon="hugeicons:repost" className="w-[24px] h-[24px] text-[#6366F1]" />
          </div>
        </div>
      </div>

      {/* Middle section: Top Organizations and Organization industry */}
      <div className="flex flex-row items-start p-0 gap-[24px] w-full h-[312px] mb-6">
        {/* Left column: Top Organizations */}
        <div className="flex flex-col items-start p-[16px] gap-[16px] w-[468px] h-[312px] bg-[#FFFFFF] shadow-[0px_1px_2px_rgba(99,102,241,0.08)] rounded-[24px]">
          <span className="w-[436px] h-[24px] font-['Poppins'] font-medium text-[16px] leading-[24px] flex items-center text-[#000000]">
            Top Organizations
          </span>
          {[
            { name: 'Driftline Agency', industry: 'SaaS', visits: '12 visits', role: 'VP of marketing', icon: '/images/analytics/organization1.png' },
            { name: 'SkylineStudio', industry: 'IT Solutions', visits: '2 visits', role: 'No active roles', icon: '/images/analytics/organization2.png' },
            { name: 'Acme.in', industry: 'IT Solutions', visits: '4 visits', role: 'VP of marketing', icon: '/images/analytics/organization3.png' },
            { name: 'Innovators', industry: 'Design agency in Colorado', visits: '2 visits', role: 'VP of marketing', icon: '/images/analytics/orgaization4.png' },
          ].map((org, idx) => (
            <div key={idx} className="flex flex-row justify-between items-center p-0 gap-[8px] w-[436px] h-[40px]">
              <div className="flex flex-row items-center p-0 gap-[8px] flex-1 h-[40px]">
                <div className="w-[40px] h-[40px] rounded-[8px] overflow-hidden flex shrink-0">
                  <img src={org.icon} alt={org.name} className="w-full h-full object-cover" />
                </div>
                <div className="flex flex-col items-start p-0 gap-[4px] flex-1 h-[39px]">
                  <span className="w-full h-[20px] font-['Poppins'] font-semibold text-[14px] leading-[20px] flex items-center text-[#000000]">{org.name}</span>
                  <span className="w-full h-[15px] font-['Poppins'] font-normal text-[10px] leading-[15px] flex items-center text-[#6B7280]">{org.industry}</span>
                </div>
              </div>
              <div className="flex flex-col items-end p-0 gap-[4px] shrink-0 h-[35px]">
                <span className="h-[16px] font-['Poppins'] font-normal text-[12px] leading-[16px] flex items-center text-[#000000] text-right">{org.visits}</span>
                <span className="h-[15px] font-['Poppins'] font-normal text-[10px] leading-[15px] flex items-center text-[#6B7280] text-right">{org.role}</span>
              </div>
            </div>
          ))}
          <div className="flex flex-row justify-center items-center p-0 w-[436px] h-[16px]">
            <span className="w-[112px] h-[16px] font-['Poppins'] font-medium text-[12px] leading-[16px] flex items-center justify-center text-[#6366F1] cursor-pointer hover:underline">
              See all companies
            </span>
          </div>
        </div>

        {/* Right column: Organization industry */}
        <div className="flex flex-col items-start p-[16px] gap-[24px] w-[468px] h-[312px] bg-[#FFFFFF] shadow-[0px_1px_2px_rgba(99,102,241,0.08)] rounded-[24px]">
          <span className="w-[175px] h-[24px] font-['Poppins'] font-medium text-[16px] leading-[24px] flex items-center text-[#000000]">
            Organization industry
          </span>
          {[
            { name: 'Software development', value: 45, textW: '160px', valW: '30px' },
            { name: 'Fintech & banking', value: 22, textW: '126px', valW: '28px' },
            { name: 'UX/UI design agencies', value: 18, textW: '157px', valW: '26px' },
            { name: 'University', value: 10, textW: '68px', valW: '26px' },
          ].map((item, idx) => (
            <div key={idx} className="flex flex-col items-start p-0 gap-[8px] w-[436px] h-[36px]">
              <div className="flex flex-row justify-between items-start p-0 w-[436px] h-[20px]">
                <span className={`h-[20px] font-['Poppins'] font-normal text-[14px] leading-[20px] flex items-center text-[#000000]`} style={{ width: item.textW }}>{item.name}</span>
                <span className={`h-[20px] font-['Poppins'] font-semibold text-[14px] leading-[20px] flex items-center text-[#000000]`} style={{ width: item.valW }}>{item.value}%</span>
              </div>
              <div className="relative w-[436px] h-[8px] bg-[#EEF2FF] rounded-[9999px]">
                <div className="absolute top-0 left-0 h-[8px] bg-[#6366F1] rounded-[9999px]" style={{ right: `${100 - item.value}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Progress towards North Star */}
      <div className="flex flex-row justify-center items-start p-0 gap-[16px] w-full h-[212px] mb-6">
        
        {/* Left card: Progress */}
        <div className="flex flex-col items-start px-[16px] py-[40px] gap-[8px] w-[444px] h-[212px] bg-[#FFFFFF] flex-1">
          <span className="h-[20px] font-['Poppins'] font-normal text-[14px] leading-[20px] flex items-center text-[#000000]">
            CURRENT PROGRESS
          </span>
          <div className="flex flex-col items-start py-[6px] px-0 gap-[8px] w-[412px] h-[64px]">
            <div className="flex flex-row justify-between items-end p-0 w-[412px] h-[32px]">
              <span className="h-[32px] font-['Poppins'] font-semibold text-[24px] leading-[32px] flex items-center text-[#6366F1]">
                VP of Marketing
              </span>
              <span className="h-[20px] font-['Poppins'] font-semibold text-[14px] leading-[20px] flex items-center text-[#6366F1]">
                68%
              </span>
            </div>
            <div className="relative w-[412px] h-[12px] bg-[#EEF2FF] rounded-[12px]">
              <div className="absolute left-0 top-0 bottom-0 bg-[#6366F1] rounded-[12px]" style={{ right: '32%' }} />
            </div>
          </div>
          <span className="w-[412px] h-[32px] font-['Poppins'] font-normal text-[12px] leading-[16px] flex items-center text-[#6B7280]">
            Focused growth in P&L Management and Strategic Influence remaining.
          </span>
        </div>

        {/* Arrow (Line 168) */}
        <Icon icon="lucide:arrow-right" className="w-[24px] h-[24px] text-[#DADADA] shrink-0 mt-[108px]" strokeWidth={2} />

        {/* Right card: Next Best Action */}
        <div className="flex flex-col justify-center items-start p-[16px] gap-[8px] w-[444px] h-[212px] bg-[#EEF2FF] rounded-[24px] flex-1">
          <span className="h-[20px] font-['Poppins'] font-normal text-[14px] leading-[20px] flex items-center text-[#6366F1]">
            NEXT BEST ACTION
          </span>
          <span className="w-[412px] h-[64px] font-['Poppins'] font-semibold text-[24px] leading-[32px] flex items-center text-[#6366F1]">
            Enroll in 'Strategic Finance for Marketers'
          </span>
          <span className="w-[412px] h-[32px] font-['Poppins'] font-normal text-[12px] leading-[16px] flex items-center text-[#6366F1]">
            This 4-week executive certification will bridge your largest skill gap: P&L Management.
          </span>
          <div className="flex flex-row justify-center items-center px-[24px] py-[10px] w-[95px] h-[40px] bg-[#6366F1] rounded-[100px] mt-[8px] cursor-pointer">
            <span className="font-['Poppins'] font-medium text-[14px] leading-[20px] text-[#FFFFFF]">Start</span>
          </div>
        </div>
      </div>
    </div>
  );
};
