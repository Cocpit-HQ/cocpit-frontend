import React, { useState, useRef, useEffect } from 'react';
import { Icon } from '@iconify/react';

export const AudienceTab = ({ data }: { data?: any }) => {
  const [locationType, setLocationType] = useState<'Cities' | 'Countries'>('Cities');
  const [dateOption, setDateOption] = useState('Last 30 Days');
  const [dateDropdownOpen, setDateDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDateDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="flex flex-col w-full mt-6">
      {/* Header */}
      <div className="flex flex-row items-center py-0 gap-[10px] w-full h-[26px] mb-6">
        <span className="w-[815px] h-[26px] text-[18px] font-medium text-black font-['Poppins'] leading-[26px] flex-1">
          Audience overview
        </span>
        
        <div className="relative" ref={dropdownRef}>
          <div 
            className="flex flex-row items-center p-0 gap-[8px] w-[103px] h-[20px] cursor-pointer"
            onClick={() => setDateDropdownOpen(!dateDropdownOpen)}
          >
            <span className="text-[12px] font-normal text-[#6B7280] font-['Poppins'] leading-[16px] w-[75px] h-[16px]">
              {dateOption}
            </span>
            <Icon 
              icon="lucide:chevron-down" 
              className={`w-[20px] h-[20px] text-[#6B7280] transition-transform ${dateDropdownOpen ? 'rotate-180' : ''}`} 
              strokeWidth={1.5} 
            />
          </div>
          
          {dateDropdownOpen && (
            <div className="absolute top-8 right-0 z-50 flex flex-col items-center p-2 w-[157px] bg-white border border-[#EEF2FF] rounded-[24px] shadow-lg">
              {['Last 7 Days', 'Last 30 Days', 'Last 90 Days', 'All Time'].map((option) => (
                <div
                  key={option}
                  className={`flex flex-row items-center px-4 py-2 gap-[10px] w-[141px] h-[36px] bg-white rounded-[24px] cursor-pointer hover:bg-gray-50 transition-colors ${
                    dateOption === option ? 'text-[#6366F1]' : 'text-black'
                  }`}
                  onClick={() => {
                    setDateOption(option);
                    setDateDropdownOpen(false);
                  }}
                >
                  <span className="text-[14px] font-normal font-['Poppins'] leading-[20px]">
                    {option}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Top Metrics Row */}
      <div className="flex flex-row justify-start items-start p-0 gap-[16px] w-full h-[112px] mb-6">
        <div className="flex flex-col items-start p-[16px] gap-[8px] w-[309.33px] h-[112px] bg-[#FFFFFF] shadow-[0px_1px_2px_rgba(99,102,241,0.08)] rounded-[24px]">
          <span className="h-[16px] font-['Poppins'] font-medium text-[12px] leading-[16px] flex items-center text-[#6B7280]">Overall reach</span>
          <span className="w-full h-[32px] font-['Poppins'] font-semibold text-[24px] leading-[32px] flex items-center text-[#000000]">14,208</span>
          <div className="flex flex-row items-center p-0 gap-[8px] h-[16px]">
            <Icon icon="lucide:trending-up" className="w-[12px] h-[12px] text-[#22C55E]" />
            <span className="h-[16px] font-['Poppins'] font-normal text-[12px] leading-[16px] flex items-center text-[#22C55E]">+24% last 30 days</span>
          </div>
        </div>

        <div className="flex flex-col items-start p-[16px] gap-[8px] w-[309.33px] h-[112px] bg-[#FFFFFF] shadow-[0px_1px_2px_rgba(99,102,241,0.08)] rounded-[24px]">
          <span className="h-[16px] font-['Poppins'] font-medium text-[12px] leading-[16px] flex items-center text-[#6B7280]">Profile Views</span>
          <span className="w-full h-[32px] font-['Poppins'] font-semibold text-[24px] leading-[32px] flex items-center text-[#000000]">3,450</span>
          <div className="flex flex-row items-center p-0 gap-[8px] h-[16px]">
            <Icon icon="lucide:trending-up" className="w-[12px] h-[12px] text-[#22C55E]" />
            <span className="h-[16px] font-['Poppins'] font-normal text-[12px] leading-[16px] flex items-center text-[#22C55E]">+5.2% last 30 days</span>
          </div>
        </div>

        <div className="flex flex-col items-start p-[16px] gap-[8px] w-[309.34px] h-[112px] bg-[#FFFFFF] shadow-[0px_1px_2px_rgba(99,102,241,0.08)] rounded-[24px]">
          <span className="h-[16px] font-['Poppins'] font-medium text-[12px] leading-[16px] flex items-center text-[#6B7280]">Engagement rate</span>
          <span className="w-full h-[32px] font-['Poppins'] font-semibold text-[24px] leading-[32px] flex items-center text-[#000000]">4.8%</span>
          <div className="flex flex-row items-center p-0 gap-[8px] h-[16px]">
            <Icon icon="lucide:trending-down" className="w-[12px] h-[12px] text-[#FF6B6B]" />
            <span className="h-[16px] font-['Poppins'] font-normal text-[12px] leading-[16px] flex items-center text-[#FF6B6B]">0.7% from 30 days</span>
          </div>
        </div>
      </div>

      {/* Middle section: Demographics and Industries */}
      <div className="flex flex-row items-start p-0 gap-[24px] w-full h-[312px] mb-6">
        {/* Left column: Cities/Countries */}
        <div className="flex flex-col items-start p-[16px] gap-[24px] w-[468px] h-[312px] bg-[#FFFFFF] shadow-[0px_1px_2px_rgba(99,102,241,0.08)] rounded-[24px]">
          <div className="flex flex-row justify-between items-center p-0 gap-[24px] w-[436px] h-[40px]">
            <span className="w-[46px] h-[24px] font-['Poppins'] font-medium text-[16px] leading-[24px] flex items-center text-[#000000]">Cities</span>
            <div className="flex flex-row justify-center items-center p-[8px] gap-[8px] w-[188px] h-[40px] bg-[#EEF2FF] rounded-[100px]">
              <button 
                onClick={() => setLocationType('Cities')}
                className={`flex flex-row justify-center items-center px-[8px] py-[4px] gap-[10px] w-[82px] h-[24px] rounded-[100px] transition-colors ${locationType === 'Cities' ? 'bg-[#FFFFFF]' : 'bg-[#EEF2FF]'}`}
              >
                <span className={`w-[34px] h-[16px] font-['Poppins'] text-[12px] leading-[16px] flex items-center ${locationType === 'Cities' ? 'font-medium text-[#6366F1]' : 'font-normal text-[#6366F1]'}`}>
                  Cities
                </span>
              </button>
              <button 
                onClick={() => setLocationType('Countries')}
                className={`flex flex-row justify-center items-center px-[8px] py-[4px] gap-[10px] w-[82px] h-[24px] rounded-[100px] transition-colors ${locationType === 'Countries' ? 'bg-[#FFFFFF]' : 'bg-[#EEF2FF]'}`}
              >
                <span className={`w-[58px] h-[16px] font-['Poppins'] text-[12px] leading-[16px] flex items-center ${locationType === 'Countries' ? 'font-medium text-[#6366F1]' : 'font-normal text-[#6366F1]'}`}>
                  Countries
                </span>
              </button>
            </div>
          </div>
          {[
            { name: 'Mumbai', value: 45, textW: '58px', valW: '30px' },
            { name: 'Bengaluru', value: 22, textW: '72px', valW: '28px' },
            { name: 'Dubai', value: 18, textW: '42px', valW: '26px' },
            { name: 'Delhi', value: 10, textW: '35px', valW: '26px' },
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

        {/* Right column: Audience Industry */}
        <div className="flex flex-col items-start p-[16px] gap-[24px] w-[468px] h-[312px] bg-[#FFFFFF] shadow-[0px_1px_2px_rgba(99,102,241,0.08)] rounded-[24px]">
          <span className="w-[147px] h-[24px] font-['Poppins'] font-medium text-[16px] leading-[24px] flex items-center text-[#000000]">Audience industry</span>
          {[
            { name: 'Software development', value: 45, textW: '160px', valW: '30px' },
            { name: 'Fintech & banking', value: 22, textW: '126px', valW: '28px' },
            { name: 'UX/UI design agencies', value: 18, textW: '157px', valW: '26px' },
            { name: 'Healthcare', value: 10, textW: '78px', valW: '26px' },
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
            <li className="font-['Poppins'] font-normal text-[16px] leading-[24px] text-[#6B7280]">Your profile is most popular among technology professionals in Bengaluru</li>
            <li className="font-['Poppins'] font-normal text-[16px] leading-[24px] text-[#6B7280]">Articles generate more engagement than media posts</li>
            <li className="font-['Poppins'] font-normal text-[16px] leading-[24px] text-[#6B7280]">Your engagement increased by 5.2% this month</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
