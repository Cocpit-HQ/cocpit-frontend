import React from 'react';
import { JobListing } from '../../types/jobs.types';
import { Icon } from '@iconify/react';

interface ListingsTabProps {
  listings: JobListing[];
  onSelectListing?: (listing: JobListing) => void;
}

export const ListingsTab: React.FC<ListingsTabProps> = ({ listings, onSelectListing }) => {
  const getStatusStyle = (status: string) => {
    switch (status.toUpperCase()) {
      case 'ACTIVE':
        return 'bg-emerald-50 text-emerald-600 border border-emerald-100';
      case 'IN REVIEW':
        return 'bg-indigo-50 text-indigo-600 border border-indigo-100';
      case 'DRAFT':
        return 'bg-slate-50 text-slate-600 border border-slate-200';
      case 'CLOSED':
        return 'bg-gray-100 text-gray-500 border border-gray-200';
      default:
        return 'bg-gray-50 text-gray-600 border border-gray-200';
    }
  };

  return (
    <div className="w-full flex flex-col gap-4">
      {/* Tab Sub-Header */}
      <div className="flex justify-between items-center pb-2 border-b border-indigo-50/50">
        <div className="flex flex-col">
          <h3 className="text-black text-lg font-bold font-['Poppins']">Posted Jobs</h3>
          <span className="text-gray-400 text-xs font-normal font-['Poppins']">
            Total jobs - {listings.length}
          </span>
        </div>
        <button className="p-2 hover:bg-slate-50 rounded-full transition-colors flex items-center justify-center border border-gray-100">
          <Icon icon="solar:sort-linear" className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      {/* Listings List */}
      <div className="flex flex-col divide-y divide-slate-100">
        {listings.length === 0 ? (
          <div className="py-12 flex flex-col items-center justify-center gap-3 text-center">
            <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center border border-slate-100">
              <Icon icon="lucide:briefcase" className="w-5 h-5 text-gray-400" />
            </div>
            <h4 className="text-gray-700 text-sm font-semibold font-['Poppins']">No listings found</h4>
            <p className="text-gray-400 text-xs font-['Poppins'] max-w-xs">
              Create a job listing by clicking the "Create job" button above to get started.
            </p>
          </div>
        ) : (
          listings.map((item) => (
            <div
              key={item.id}
              onClick={() => onSelectListing && onSelectListing(item)}
              className={`py-4 flex items-center justify-between gap-4 transition-colors ${
                onSelectListing ? 'cursor-pointer hover:bg-slate-55/50 rounded-xl px-2' : ''
              }`}
            >
              {/* Job Info */}
              <div className="flex flex-col gap-0.5">
                <span className="text-black text-sm font-bold font-['Poppins']">
                  {item.title}
                </span>
                <span className="text-gray-400 text-xs font-normal font-['Poppins']">
                  {item.posted_at || item.last_edited || 'Posted recently'}
                </span>
              </div>

              {/* Status Badge */}
              <span
                className={`px-3 py-1 rounded-full text-[10px] font-bold font-['Poppins'] tracking-wider uppercase ${getStatusStyle(
                  item.status
                )}`}
              >
                {item.status}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ListingsTab;
