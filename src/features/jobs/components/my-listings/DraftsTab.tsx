import React from 'react';
import { JobListing } from '../../types/jobs.types';
import { Icon } from '@iconify/react';

interface DraftsTabProps {
  listings: JobListing[];
  onSelectListing?: (listing: JobListing) => void;
}

export const DraftsTab: React.FC<DraftsTabProps> = ({ listings, onSelectListing }) => {
  const drafts = listings.filter((item) => item.status.toUpperCase() === 'DRAFT');

  return (
    <div className="w-full flex flex-col gap-4">
      {/* Tab Sub-Header */}
      <div className="flex justify-between items-center pb-2 border-b border-indigo-50/50">
        <div className="flex flex-col">
          <h3 className="text-black text-lg font-bold font-['Poppins']">Draft Job Listings</h3>
          <span className="text-gray-400 text-xs font-normal font-['Poppins']">
            Total drafts - {drafts.length}
          </span>
        </div>
      </div>

      {/* Drafts List */}
      <div className="flex flex-col divide-y divide-slate-100">
        {drafts.length === 0 ? (
          <div className="py-16 flex flex-col items-center justify-center gap-4 text-center bg-slate-50/50 rounded-3xl border border-dashed border-slate-200">
            <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center border border-slate-100">
              <Icon icon="solar:document-text-linear" className="w-5 h-5 text-gray-400" />
            </div>
            <div className="flex flex-col gap-1">
              <h4 className="text-gray-700 text-sm font-semibold font-['Poppins']">No drafts found</h4>
              <p className="text-gray-400 text-xs font-['Poppins'] max-w-xs mx-auto">
                You don't have any job listings saved as drafts. Create a job and save it as a draft to see it here.
              </p>
            </div>
          </div>
        ) : (
          drafts.map((item) => (
            <div
              key={item.id}
              onClick={() => onSelectListing && onSelectListing(item)}
              className={`py-4 flex items-center justify-between gap-4 transition-colors ${
                onSelectListing ? 'cursor-pointer hover:bg-slate-50/50 rounded-xl px-2' : ''
              }`}
            >
              {/* Job Info */}
              <div className="flex flex-col gap-0.5">
                <span className="text-black text-sm font-bold font-['Poppins']">
                  {item.title}
                </span>
                <span className="text-gray-400 text-xs font-normal font-['Poppins']">
                  {item.last_edited || item.posted_at || 'Last edited recently'}
                </span>
              </div>

              {/* Status Badge */}
              <span className="px-3 py-1 rounded-full text-[10px] font-bold font-['Poppins'] tracking-wider uppercase bg-slate-50 text-slate-600 border border-slate-200">
                {item.status}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default DraftsTab;
