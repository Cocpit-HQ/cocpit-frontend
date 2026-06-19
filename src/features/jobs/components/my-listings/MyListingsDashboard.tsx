import React, { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import * as jobsService from '../../services/jobs.service';
import { JobListing } from '../../types/jobs.types';
import { CreateJobScreen } from './CreateJobScreen';
import ListingsTab from './ListingsTab';
import DraftsTab from './DraftsTab';
import SendOfferTab from './SendOfferTab';
import { toast } from 'sonner';

interface MyListingsDashboardProps {
  onBack: () => void;
}

type SubTab = 'Listings' | 'Send offer' | 'Drafts';
type ViewState = 'dashboard' | 'create-job';

export const MyListingsDashboard: React.FC<MyListingsDashboardProps> = ({ onBack }) => {
  const [view, setView] = useState<ViewState>('dashboard');
  const [activeSubTab, setActiveSubTab] = useState<SubTab>('Listings');
  const [listings, setListings] = useState<JobListing[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchListings = async () => {
    setIsLoading(true);
    try {
      const data = await jobsService.getMyListings();
      setListings(data);
    } catch (error) {
      console.error('Failed to load job listings:', error);
      toast.error('Failed to load job listings.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchListings();
  }, []);

  const handleCreateJob = async (title: string, status: string) => {
    try {
      const success = await jobsService.createJobListing(title, status);
      if (success) {
        await fetchListings();
        setView('dashboard');
        setActiveSubTab('Listings');
      } else {
        toast.error('Failed to create job listing.');
      }
    } catch (error) {
      console.error('Error creating job listing:', error);
      toast.error('Failed to create job listing.');
    }
  };

  if (view === 'create-job') {
    return (
      <CreateJobScreen
        onBack={() => setView('dashboard')}
        onSubmit={handleCreateJob}
      />
    );
  }

  return (
    <div className="w-full flex flex-col gap-6 animate-in fade-in duration-300">
      {/* Header Row */}
      <div className="flex items-center gap-4">
        <button
          onClick={onBack}
          className="w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center bg-white hover:bg-slate-50 active:scale-95 transition-all text-gray-700 shadow-sm"
        >
          <Icon icon="lucide:arrow-left" className="w-5 h-5" />
        </button>
        <div className="flex flex-col">
          <h2 className="text-black text-xl font-bold font-['Poppins'] leading-tight">My listings</h2>
          <span className="text-gray-400 text-xs font-normal font-['Poppins']">
            Post, manage, and track all your job listings in one place
          </span>
        </div>
      </div>

      {/* Sub-Tabs & Action Button Row */}
      <div className="w-full flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-2 border-b border-indigo-50/50">
        <div className="flex items-center gap-3">
          {(['Listings', 'Send offer', 'Drafts'] as SubTab[]).map(tab => {
            const isActive = activeSubTab === tab;
            return (
              <button
                key={tab}
                onClick={() => setActiveSubTab(tab)}
                className={`h-10 px-5 py-1.5 rounded-3xl outline outline-1 outline-offset-[-1px] flex justify-center items-center text-sm font-semibold font-['Poppins'] transition-all duration-200 active:scale-95 ${
                  isActive
                    ? 'bg-indigo-50 outline-indigo-50 text-indigo-500 shadow-sm'
                    : 'bg-white outline-indigo-400/50 hover:outline-indigo-400 text-indigo-400/80 hover:text-indigo-400'
                }`}
              >
                {tab}
              </button>
            );
          })}
        </div>

        {/* Create Job Action Button */}
        <button
          onClick={() => setView('create-job')}
          className="h-10 px-5 py-1.5 rounded-3xl border border-indigo-200 hover:border-indigo-400 text-indigo-500 hover:text-indigo-600 bg-white hover:bg-indigo-50/20 flex justify-center items-center gap-2 text-sm font-semibold font-['Poppins'] transition-all duration-200 active:scale-95 shadow-sm"
        >
          <Icon icon="lucide:plus" className="w-4 h-4" />
          <span>Create job</span>
        </button>
      </div>

      {/* Loading state / Content state */}
      {isLoading ? (
        <div className="w-full py-20 flex flex-col items-center justify-center gap-4">
          <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-500 rounded-full animate-spin" />
          <p className="text-gray-500 text-sm font-['Poppins']">Loading listings...</p>
        </div>
      ) : (
        <div className="w-full">
          {activeSubTab === 'Listings' && (
            <ListingsTab listings={listings} />
          )}
          {activeSubTab === 'Drafts' && (
            <DraftsTab listings={listings} />
          )}
          {activeSubTab === 'Send offer' && (
            <SendOfferTab listings={listings} />
          )}
        </div>
      )}
    </div>
  );
};

export default MyListingsDashboard;
