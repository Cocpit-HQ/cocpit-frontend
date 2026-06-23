import React, { useState, useMemo } from 'react';
import { JobListing } from '../../types/jobs.types';

interface ListingsTabProps {
  listings: JobListing[];
  onSelectListing?: (listing: JobListing) => void;
}

export const ListingsTab: React.FC<ListingsTabProps> = ({ listings, onSelectListing }) => {
  const [activeFilter, setActiveFilter] = useState<string>('All');

  const filterChips = ['All', 'Active', 'Closed', 'In review', 'Drafts'];

  const filteredListings = useMemo(() => {
    if (activeFilter === 'All') return listings;
    if (activeFilter === 'Active') {
      return listings.filter((item) => item.status?.toUpperCase() === 'ACTIVE');
    }
    if (activeFilter === 'Closed') {
      return listings.filter((item) => item.status?.toUpperCase() === 'CLOSED');
    }
    if (activeFilter === 'In review') {
      return listings.filter((item) => item.status?.toUpperCase() === 'IN REVIEW');
    }
    if (activeFilter === 'Drafts') {
      return listings.filter((item) => item.status?.toUpperCase() === 'DRAFT');
    }
    return listings;
  }, [listings, activeFilter]);

  const getStatusChip = (status: string) => {
    let bg = '#F0FDF4';
    let text = '#22C55E';
    let label = 'ACTIVE';

    switch (status.toUpperCase()) {
      case 'ACTIVE':
        bg = '#F0FDF4';
        text = '#22C55E';
        label = 'ACTIVE';
        break;
      case 'IN REVIEW':
        bg = '#F1F0FF';
        text = '#4338CA';
        label = 'IN REVIEW';
        break;
      case 'DRAFT':
        bg = '#F1F3F9';
        text = '#6B7280';
        label = 'DRAFT';
        break;
      case 'CLOSED':
        bg = '#F1F3F9';
        text = '#6B7280';
        label = 'CLOSED';
        break;
      default:
        bg = '#F1F3F9';
        text = '#6B7280';
        label = status.toUpperCase();
        break;
    }

    return (
      <div
        className="flex flex-col justify-center items-center rounded-full flex-shrink-0"
        style={{
          padding: '8px',
          width: '70px',
          height: '31px',
          backgroundColor: bg,
        }}
      >
        <span
          className="font-['Poppins'] font-medium text-[10px] leading-[15px] flex items-center text-center uppercase"
          style={{ color: text }}
        >
          {label}
        </span>
      </div>
    );
  };

  return (
    <div
      className="w-full max-w-[960px] h-[708px] bg-white rounded-[24px] p-[16px] flex flex-col items-start gap-[16px] box-border"
    >
      {/* Heading Frame */}
      <div className="w-full flex flex-col gap-[4px] px-0">
        <h3 className="font-['Poppins'] font-medium text-[18px] leading-[26px] text-black">
          All Jobs
        </h3>
        <span className="font-['Poppins'] font-normal text-[12px] leading-[16px] text-[#6B7280]">
          Total jobs - {listings.length}
        </span>
      </div>

      {/* Filter Row Frame (Frame 2608535) */}
      <div className="w-full flex flex-col items-start p-0 gap-[16px] flex-none self-stretch">
        <div className="w-full flex flex-row items-center gap-[8px] border-b border-transparent">
          {filterChips.map((chip) => {
            const isSelected = activeFilter.toLowerCase() === chip.toLowerCase();
            return (
              <div
                key={chip}
                onClick={() => setActiveFilter(chip)}
                className={`font-['Poppins'] text-[14px] leading-[20px] px-[16px] py-[8px] cursor-pointer transition-all border-b-2 ${
                  isSelected
                    ? 'text-[#6366F1] font-semibold border-[#6366F1]'
                    : 'text-[#000000] font-normal border-transparent hover:text-[#6366F1]/80'
                }`}
              >
                {chip}
              </div>
            );
          })}
        </div>
      </div>

      {/* Job Card List with Scroll */}
      <div className="w-full flex-1 overflow-y-auto pr-1 flex flex-col gap-[16px] [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-slate-200 [&::-webkit-scrollbar-thumb]:rounded-full">
        {filteredListings.length === 0 ? (
          <div className="py-12 flex flex-col items-center justify-center gap-3 text-center w-full">
            <h4 className="text-gray-400 text-sm font-semibold font-['Poppins']">No listings found</h4>
            <p className="text-gray-400 text-xs font-['Poppins'] max-w-xs">
              There are no jobs matching the selected filter status.
            </p>
          </div>
        ) : (
          filteredListings.map((item) => (
            <div
              key={item.id}
              onClick={() => onSelectListing && onSelectListing(item)}
              className={`w-full flex flex-row items-center justify-between py-[16px] px-0 gap-[16px] bg-white h-[80px] flex-none border-b border-[#EEF2FF]/60 last:border-b-0 ${
                onSelectListing ? 'cursor-pointer' : ''
              }`}
            >
              {/* Text Frame (Frame 2609064) */}
              <div className="flex flex-col items-start gap-[8px] h-[48px] flex-1 min-w-0">
                <span className="font-['Poppins'] font-medium text-[16px] leading-[24px] text-black capitalize truncate w-full">
                  {item.title}
                </span>
                <span className="font-['Poppins'] font-normal text-[12px] leading-[16px] text-[#6B7280] truncate w-full">
                  {item.posted_at || item.last_edited || 'Posted recently'}
                </span>
              </div>

              {/* Status Badge */}
              {getStatusChip(item.status)}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ListingsTab;
