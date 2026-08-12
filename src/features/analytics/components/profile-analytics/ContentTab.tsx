import React, { useState, useEffect, useRef } from 'react';
import { Icon } from '@iconify/react';
import Link from 'next/link';

export const ContentTab = ({ data }: { data?: any }) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('Last 30 days');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);
  const [sortOption, setSortOption] = useState('Top performing');
  const sortDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
      if (sortDropdownRef.current && !sortDropdownRef.current.contains(event.target as Node)) {
        setSortDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="flex flex-col w-full mt-6">
      {/* Format Performance Header */}
      <div className="flex flex-row items-center py-0 gap-[10px] w-full h-[26px] mb-6">
        <span className="w-[815px] h-[26px] font-['Poppins'] font-medium text-[18px] leading-[26px] flex items-center text-[#000000] flex-1">
          Content format performance
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

      {/* Format Cards Grid */}
      <div className="grid grid-cols-4 gap-6 mb-10">
        {[
          { label: 'Articles views', value: '12.4k', icon: 'solar:document-add-linear' },
          { label: 'Media views', value: '8.7k', icon: 'stash:image' },
          { label: 'Polls views', value: '5k', icon: 'fluent:poll-16-regular' },
          { label: 'Text views', value: '1.8k', icon: 'lucide:type' },
        ].map((format, idx) => (
          <div key={idx} className="flex flex-row justify-between items-end p-[16px] gap-[8px] h-[88px] bg-white shadow-[0_1px_2px_rgba(99,102,241,0.08)] rounded-[24px]">
            <div className="flex flex-col items-start gap-[8px]">
              <span className="text-[12px] font-medium text-[#6B7280] font-['Poppins'] leading-[16px] flex items-center h-[16px]">
                {format.label}
              </span>
              <span className="text-[24px] font-semibold text-black font-['Poppins'] leading-[32px] flex items-center h-[32px]">
                {format.value}
              </span>
            </div>
            <Icon icon={format.icon} className="w-[24px] h-[24px] text-[#6B7280] stroke-[1.5px]" />
          </div>
        ))}
      </div>

      {/* Top Performing Posts Header */}
      <div className="flex flex-row justify-center items-center px-4 gap-[10px] w-full h-[46px] mb-6">
        <div className="flex flex-col justify-center items-start gap-1 flex-1 h-[46px]">
          <h3 className="text-[18px] font-medium text-black font-['Poppins'] leading-[26px] m-0 p-0">
            Top performing posts
          </h3>
          <span className="text-[12px] font-normal text-[#6B7280] font-['Poppins'] leading-[16px]">
            Ranked by engagement and professional impact
          </span>
        </div>
        
        {/* Sort by Dropdown */}
        <div className="relative" ref={sortDropdownRef}>
          <div 
            className="flex flex-row items-center gap-[8px] cursor-pointer h-[20px]"
            onClick={() => setSortDropdownOpen(!sortDropdownOpen)}
          >
            <span className="text-[12px] font-normal text-[#6B7280] font-['Poppins'] flex items-center leading-[16px] h-[16px]">
              Sort by
            </span>
            <Icon icon="lucide:chevron-down" className={`w-[20px] h-[20px] text-[#6B7280] transition-transform ${sortDropdownOpen ? 'rotate-180' : ''}`} strokeWidth={1.5} />
          </div>
          
          {sortDropdownOpen && (
            <div className="absolute top-8 right-0 z-50 flex flex-col items-center p-2 w-[157px] bg-white border border-[#EEF2FF] rounded-[24px] shadow-lg">
              {['Top performing', 'Most viewed', 'Most liked', 'Most shared'].map((option) => (
                <div
                  key={option}
                  className={`flex flex-row items-center px-4 py-2 gap-[10px] w-[141px] h-[36px] bg-white rounded-[24px] cursor-pointer hover:bg-gray-50 transition-colors ${
                    sortOption === option ? 'text-[#6366F1]' : 'text-black'
                  }`}
                  onClick={() => {
                    setSortOption(option);
                    setSortDropdownOpen(false);
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

      {/* Posts List */}
      <div className="flex flex-col gap-4 relative z-10">
        {[
          {
            title: 'Redesigning the SaaS Onboarding Experience',
            type: 'Article post',
            date: 'oct 15 2026',
            views: '12.4k',
            likes: '1.2k',
            shares: '342',
            imgSrc: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=120&q=80',
          },
          {
            title: 'Keynote: Building Scalable Design Systems',
            type: 'Media post',
            date: 'mar 14 2026',
            views: '8.9k',
            likes: '945',
            shares: '120',
            imgSrc: 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&w=120&q=80',
          },
          {
            title: '10 Figma Shortcuts for Speed',
            type: 'Achievement post',
            date: 'aug 5 2026',
            views: '5.2k',
            likes: '680',
            shares: '842',
            imgSrc: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?auto=format&fit=crop&w=120&q=80',
          },
          {
            title: 'Thoughts on the new CSS features',
            type: 'Poll post',
            date: 'oct 15 2026',
            views: '3.1k',
            likes: '245',
            shares: '18',
            icon: 'fluent:poll-16-regular',
          },
          {
            title: '10 Figma Shortcuts for Speed',
            type: 'Text post',
            date: 'jan 24 2025',
            views: '23',
            likes: '2',
            shares: '0',
            icon: 'stash:image',
          },
        ].map((post, idx) => (
          <Link href={`/analytics/post/${idx + 1}`} key={idx} className="flex flex-row items-center p-[16px] gap-[16px] w-full h-[92px] bg-white border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors cursor-pointer">
            
            {/* Post thumbnail */}
            <div className="w-[60px] h-[60px] rounded-[12px] overflow-hidden shrink-0 flex items-center justify-center bg-[#EEF2FF]">
              {post.imgSrc ? (
                <img src={post.imgSrc} alt={post.title} className="w-full h-full object-cover" />
              ) : (
                <Icon icon={post.icon!} className="w-[24px] h-[24px] text-[#6366F1]" />
              )}
            </div>

            {/* Post Info Container */}
            <div className="flex flex-col items-start w-[608px] h-[40px] flex-1">
              <span className="w-full h-[20px] text-[14px] font-normal text-black font-['Poppins'] leading-[20px] truncate">
                {post.title}
              </span>
              <div className="flex flex-row items-center gap-[8px] h-[20px]">
                <span className="text-[14px] font-normal text-[#6B7280] font-['Poppins'] leading-[20px]">
                  {post.type}
                </span>
                <div className="w-[4px] h-[4px] rounded-full bg-[#6B7280]" />
                <span className="text-[14px] font-normal text-[#6B7280] font-['Poppins'] leading-[20px]">
                  Published on {post.date}
                </span>
              </div>
            </div>

            {/* Metrics Container */}
            <div className="flex flex-row justify-end items-center gap-[24px] w-[228px] h-[40px] shrink-0">
              
              {/* Views */}
              <div className="flex flex-col items-end gap-[4px] w-[60px] h-[40px]">
                <span className="h-[20px] text-[14px] font-semibold text-black font-['Poppins'] leading-[20px] text-right">
                  {post.views}
                </span>
                <div className="flex flex-row justify-end items-center gap-[4px] w-full h-[16px]">
                  <Icon icon="fluent:eye-16-regular" className="w-[14px] h-[14px] text-[#6B7280]" strokeWidth={1.5} />
                  <span className="h-[16px] text-[12px] font-normal text-[#6B7280] font-['Poppins'] leading-[16px] text-right">
                    Views
                  </span>
                </div>
              </div>

              {/* Likes */}
              <div className="flex flex-col items-end gap-[4px] w-[60px] h-[40px]">
                <span className="h-[20px] text-[14px] font-semibold text-black font-['Poppins'] leading-[20px] text-right">
                  {post.likes}
                </span>
                <div className="flex flex-row justify-end items-center gap-[4px] w-full h-[16px]">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    className="text-[#6B7280]"
                  >
                    <path fill="currentColor" d="m20.975 12.185l-.739-.128zm-.705 4.08l-.74-.128zM6.938 20.477l-.747.065zm-.812-9.393l.747-.064zm7.869-5.863l.74.122zm-.663 4.045l.74.121zm-6.634.411l-.49-.568zm1.439-1.24l.49.569zm2.381-3.653l-.726-.189zm.476-1.834l.726.188zm1.674-.886l-.23.714zm.145.047l.229-.714zM9.862 6.463l.662.353zm4.043-3.215l-.726.188zm-2.23-1.116l-.326-.675zM3.971 21.471l-.748.064zM3 10.234l.747-.064a.75.75 0 0 0-1.497.064zm17.236 1.823l-.705 4.08l1.478.256l.705-4.08zm-6.991 9.193H8.596v1.5h4.649zm-5.56-.837l-.812-9.393l-1.495.129l.813 9.393zm11.846-4.276c-.507 2.93-3.15 5.113-6.286 5.113v1.5c3.826 0 7.126-2.669 7.764-6.357zM13.255 5.1l-.663 4.045l1.48.242l.663-4.044zm-6.067 5.146l1.438-1.24l-.979-1.136L6.21 9.11zm4.056-5.274l.476-1.834-1.452-.376l-.476 1.833zm1.194-2.194l.145.047l.459-1.428l-.145-.047zm-1.915 4.038a8.4 8.4 0 0 0 .721-1.844l-1.452-.377A7 7 0 0 1 9.2 6.11zm2.06-3.991a.89.89 0 0 1 .596.61l1.452-.376a2.38 2.38 0 0 0-1.589-1.662zm-.863.313a.52.52 0 0 1 .28-.33l-.651-1.351c-.532.256-.932.73-1.081 1.305zm.28-.33a.6.6 0 0 1 .438-.03l.459-1.428a2.1 2.1 0 0 0-1.548.107zm2.154 8.176h5.18v-1.5h-5.18zM4.719 21.406L3.747 10.17l-1.494.129l.971 11.236zm-.969.107V10.234h-1.5v11.279zm-.526.022a.263.263 0 0 1 .263-.285v1.5c.726 0 1.294-.622 1.232-1.344zM14.735 5.343a5.5 5.5 0 0 0-.104-2.284l-1.452.377a4 4 0 0 1 .076 1.664zM8.596 21.25a.916.916 0 0 1-.911-.837l-1.494.129a2.416 2.416 0 0 0 2.405 2.208zm.03-12.244c.68-.586 1.413-1.283 1.898-2.19L9.2 6.109c-.346.649-.897 1.196-1.553 1.76zm13.088 3.307a2.416 2.416 0 0 0-2.38-2.829v1.5c.567 0 1 .512.902 1.073zM3.487 21.25c.146 0 .263.118.263.263h-1.5c0 .682.553 1.237 1.237 1.237zm9.105-12.105a1.583 1.583 0 0 0 1.562 1.84v-1.5a.083.083 0 0 1-.082-.098zm-5.72 1.875a.92.92 0 0 1 .316-.774l-.98-1.137a2.42 2.42 0 0 0-.83 2.04z" />
                  </svg>
                  <span className="h-[16px] text-[12px] font-normal text-[#6B7280] font-['Poppins'] leading-[16px] text-right">
                    Likes
                  </span>
                </div>
              </div>

              {/* Shares */}
              <div className="flex flex-col items-end gap-[4px] w-[60px] h-[40px]">
                <span className="h-[20px] text-[14px] font-semibold text-black font-['Poppins'] leading-[20px] text-right">
                  {post.shares}
                </span>
                <div className="flex flex-row justify-end items-center gap-[4px] w-full h-[16px]">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="14"
                    height="14"
                    viewBox="0 0 28 28"
                    className="text-[#6B7280]"
                  >
                    <path fill="currentColor" d="M12.25 3a.75.75 0 1 1 0 1.5h-5A2.75 2.75 0 0 0 4.5 7.25v13.5a2.75 2.75 0 0 0 2.75 2.75h13.5a2.75 2.75 0 0 0 2.75-2.75v-5a.75.75 0 0 1 1.5 0v5A4.25 4.25 0 0 1 20.75 25H7.25A4.25 4.25 0 0 1 3 20.75V7.25A4.25 4.25 0 0 1 7.25 3zm5.179-.928a.75.75 0 0 1 .796.098l8.25 6.75a.75.75 0 0 1 .039 1.127l-8.25 7.75A.75.75 0 0 1 17 17.25v-3.74c-1.166.036-2.463.189-3.854.802c-1.584.698-3.35 2.021-5.16 4.577l-.362.527A.75.75 0 0 1 6.25 19c0-4.406 1.34-7.56 3.51-9.608C11.738 7.527 14.325 6.656 17 6.52V2.75a.75.75 0 0 1 .429-.679m1.07 5.178a.75.75 0 0 1-.75.75c-2.66 0-5.145.772-6.959 2.483c-1.413 1.334-2.474 3.292-2.87 6.046c1.56-1.823 3.12-2.93 4.621-3.59C14.532 12.06 16.349 12 17.75 12a.75.75 0 0 1 .75.75v2.766l6.363-5.978L18.5 4.332z" />
                  </svg>
                  <span className="h-[16px] text-[12px] font-normal text-[#6B7280] font-['Poppins'] leading-[16px] text-right">
                    Shares
                  </span>
                </div>
              </div>

            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};
