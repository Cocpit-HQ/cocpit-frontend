import React, { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import * as jobsService from '../../services/jobs.service';
import { JobListing } from '../../types/jobs.types';
import { CreateJobFlow } from '../create-job/CreateJobFlow';
import ListingsTab from './ListingsTab';
import ListingDetailsScreen from './ListingDetailsScreen';
import ApplicantsDashboard from './ApplicantsDashboard';
import SendOfferTab from './SendOfferTab';
import { toast } from 'sonner';

interface MyListingsDashboardProps {
  onBack: () => void;
}

type SubTab = 'Listings' | 'Send offer';
type ViewState = 'dashboard' | 'create-job' | 'view-listing' | 'applicants';

export const MyListingsDashboard: React.FC<MyListingsDashboardProps> = ({ onBack }) => {
  const [view, setView] = useState<ViewState>('dashboard');
  const [activeSubTab, setActiveSubTab] = useState<SubTab>('Listings');
  const [listings, setListings] = useState<JobListing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedListing, setSelectedListing] = useState<JobListing | null>(null);

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

  const handleCreateJob = async (title: string, status: string, details?: Partial<JobListing>) => {
    try {
      const listingData = selectedListing ? { ...details, id: selectedListing.id } : details;
      const newListing = await jobsService.createJobListing(title, status, listingData);
      if (newListing) {
        await fetchListings();
        setView('dashboard');
        setActiveSubTab('Listings');
        setSelectedListing(null);
        if (status === 'ACTIVE') {
          toast.success('Job listing published successfully!');
        } else {
          toast.success('Job draft saved successfully!');
        }
      } else {
        toast.error('Failed to create/update job listing.');
      }
    } catch (error) {
      console.error('Error creating/updating job listing:', error);
      toast.error('Failed to create/update job listing.');
    }
  };

  const handleCloseJob = async (id: string) => {
    try {
      const success = await jobsService.closeJobListing(id);
      if (success) {
        await fetchListings();
        setView('dashboard');
        toast.success('Job listing closed.');
      } else {
        toast.error('Failed to close job listing.');
      }
    } catch (error) {
      console.error('Error closing job listing:', error);
      toast.error('Failed to close job listing.');
    }
  };

  const handleDeleteJob = async (id: string) => {
    try {
      const success = await jobsService.deleteJobListing(id);
      if (success) {
        await fetchListings();
        setView('dashboard');
        toast.success('Job listing deleted.');
      } else {
        toast.error('Failed to delete job listing.');
      }
    } catch (error) {
      console.error('Error deleting job listing:', error);
      toast.error('Failed to delete job listing.');
    }
  };

  if (view === 'create-job') {
    return (
      <CreateJobFlow
        onBack={() => {
          setSelectedListing(null);
          setView('dashboard');
        }}
        onSubmit={handleCreateJob}
        initialListing={selectedListing}
      />
    );
  }

  if (view === 'view-listing' && selectedListing) {
    return (
      <ListingDetailsScreen
        listing={selectedListing}
        onBack={() => {
          if (selectedListing.status?.toUpperCase() === 'ACTIVE') {
            setView('applicants');
          } else {
            setView('dashboard');
          }
        }}
        onCloseListing={handleCloseJob}
        onDeleteListing={handleDeleteJob}
      />
    );
  }

  if (view === 'applicants' && selectedListing) {
    return (
      <ApplicantsDashboard
        listing={selectedListing}
        onBack={() => setView('dashboard')}
        onViewDetails={() => setView('view-listing')}
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
          {(['Listings', 'Send offer'] as SubTab[]).map(tab => {
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
          onClick={() => {
            setSelectedListing(null);
            setView('create-job');
          }}
          className="w-[140px] h-[40px] bg-white border border-[#818CF8] rounded-[24px] py-[8px] px-[16px] gap-[10px] flex flex-row justify-center items-center font-['Poppins'] font-semibold text-sm text-[#818CF8] hover:bg-indigo-50/10 transition-all duration-200 active:scale-95 cursor-pointer"
        >
          <Icon icon="lucide:plus" className="w-4 h-4 text-[#818CF8]" />
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
            <ListingsTab
              listings={listings}
              onSelectListing={(listing) => {
                setSelectedListing(listing);
                const status = listing.status?.toUpperCase();
                if (status === 'ACTIVE') {
                  setView('applicants');
                } else if (status === 'DRAFT') {
                  setView('create-job');
                } else {
                  setView('view-listing');
                }
              }}
            />
          )}
          {activeSubTab === 'Send offer' && (
            <SendOfferTab
              listings={listings}
              onSelectListing={(listing) => {
                setSelectedListing(listing);
                const status = listing.status?.toUpperCase();
                if (status === 'ACTIVE') {
                  setView('applicants');
                } else if (status === 'DRAFT') {
                  setView('create-job');
                } else {
                  setView('view-listing');
                }
              }}
            />
          )}
        </div>
      )}
    </div>
  );
};

export default MyListingsDashboard;
