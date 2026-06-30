import React, { useState, useEffect, useCallback } from 'react';
import { Icon } from '@iconify/react';
import * as jobsService from '../../services/jobs.service';
import { JobListing } from '../../types/jobs.types';
import { useMyListings } from '../../hooks/useMyListings';
import { CreateJobFlow } from '../create-job/CreateJobFlow';
import ListingsTab from './ListingsTab';
import ListingDetailsScreen from './ListingDetailsScreen';
import ApplicantsDashboard from './ApplicantsDashboard';
import SendOfferTab from './SendOfferTab';
import OfferDetailsScreen from './OfferDetailsScreen';
import { toast } from 'sonner';
import ListingsSkeleton from '../skeletons/ListingsSkeleton';

interface MyListingsDashboardProps {
  onBack: () => void;
}

type SubTab = 'Listings' | 'Sent Offers';
type ViewState = 'dashboard' | 'create-job' | 'view-listing' | 'applicants' | 'offer-details';

export const MyListingsDashboard: React.FC<MyListingsDashboardProps> = ({ onBack }) => {
  const [view, setView] = useState<ViewState>('dashboard');
  const [activeSubTab, setActiveSubTab] = useState<SubTab>('Listings');
  const { 
    listings, isLoading, isFetchingMore, hasMore, counts,
    statusFilter, setStatusFilter, loadMore, refresh
  } = useMyListings();

  const [selectedListing, setSelectedListing] = useState<JobListing | null>(null);
  const [selectedOfferGroup, setSelectedOfferGroup] = useState<any | null>(null);

  const handleCreateJob = async (title: string, status: string, details?: Partial<JobListing>) => {
    try {
      const listingData = selectedListing ? { ...details, id: selectedListing.id } : details;
      const newListing = await jobsService.createJobListing(title, status, listingData);
      if (newListing) {
        refresh();
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.error('Error creating/updating job listing:', error);
      let errMsg = 'Failed to create/update job listing.';
      if (error.response?.data?.errors && Array.isArray(error.response.data.errors)) {
        errMsg = error.response.data.errors.map((e: { message: string }) => e.message).join(', ');
      } else if (error.response?.data?.message) {
        errMsg = error.response.data.message;
      }
      toast.error(errMsg);
    }
  };

  const handleCloseJob = async (id: string) => {
    try {
      const success = await jobsService.closeJobListing(id);
      if (success) {
        refresh();
        setSelectedListing(prev => prev ? { ...prev, status: 'CLOSED' } : null);
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
        refresh();
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

  if (view === 'offer-details' && selectedOfferGroup) {
    return (
      <OfferDetailsScreen
        offerGroup={selectedOfferGroup}
        onBack={() => {
          setView('dashboard');
          setSelectedOfferGroup(null);
        }}
        onViewListingDetails={() => {
          const matchingListing = listings.find(
            (l) => l.title.toLowerCase() === selectedOfferGroup.title.toLowerCase()
          );
          if (typeof window !== 'undefined') {
            sessionStorage.setItem('coming_from_send_offer_details', 'true');
          }
          if (matchingListing) {
            setSelectedListing(matchingListing);
            setView('view-listing');
          } else {
            const mockListing: JobListing = {
              id: 'list-mock',
              title: selectedOfferGroup.title,
              company: selectedOfferGroup.company,
              status: 'ACTIVE',
              posted_at: 'Posted 2 hours ago',
            };
            setSelectedListing(mockListing);
            setView('view-listing');
          }
        }}
      />
    );
  }

  if (view === 'view-listing' && selectedListing) {
    return (
      <ListingDetailsScreen
        listing={selectedListing}
        onBack={() => {
          const fromOffers = typeof window !== 'undefined' && sessionStorage.getItem('coming_from_send_offer_details') === 'true';
          if (fromOffers) {
            if (typeof window !== 'undefined') {
              sessionStorage.removeItem('coming_from_send_offer_details');
            }
            setView('offer-details');
          } else if (selectedListing.status?.toUpperCase() === 'ACTIVE') {
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
        onBack={() => {
          const fromOffers = typeof window !== 'undefined' && sessionStorage.getItem('coming_from_send_offer_details') === 'true';
          if (fromOffers) {
            if (typeof window !== 'undefined') {
              sessionStorage.removeItem('coming_from_send_offer_details');
            }
            setView('offer-details');
          } else {
            setView('dashboard');
          }
        }}
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
          className="size-12 p-2 rounded-[100px] outline outline-1 outline-offset-[-1px] outline-zinc-300 backdrop-blur-md flex justify-center items-center gap-2.5 hover:bg-slate-50 transition-colors active:scale-95 text-gray-500"
        >
          <Icon icon="lucide:chevron-left" className="w-6 h-6 text-gray-500" />
        </button>
        <div className="inline-flex flex-col justify-start items-start">
          <div className="text-center justify-start text-black text-lg font-medium font-['Poppins'] leading-6">My Listings</div>
          <div className="text-center justify-start text-gray-500 text-xs font-normal font-['Poppins'] leading-4">Post, manage, and track all your job listings in one place</div>
        </div>
      </div>

      {/* Sub-Tabs & Action Button Row */}
      <div className="w-full flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-2 border-b border-indigo-50/50">
        <div className="flex items-center gap-3">
          {(['Listings', 'Sent Offers'] as SubTab[]).map(tab => {
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
        <ListingsSkeleton />
      ) : (
        <div className="w-full">
          {activeSubTab === 'Listings' && (
            counts.all === 0 && !isLoading ? (
              <div className="h-[693px] flex flex-col justify-center items-center gap-4 w-full">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="size-28 flex-shrink-0">
                  <g fillRule="evenodd" clipRule="evenodd">
                    {/* Magnifying Glass overlay in Black */}
                    <path
                      fill="#000000"
                      d="M21.954 10.509a4.08 4.08 0 0 0 1.995-3.064a6 6 0 0 0-.658-3.602a5.5 5.5 0 0 0-2.395-2.375a5 5 0 0 0-3.393-.38a9.3 9.3 0 0 0-2.664 1.048a5.4 5.4 0 0 0-1.487 1.327a5.54 5.54 0 0 0-.848 4.212a4.99 4.99 0 0 0 2.355 3.532a5.05 5.05 0 0 0 2.235.569c1.108.008 2.212-.15 3.273-.47a.27.27 0 0 0 .19-.219q.232.543.519 1.058q.147.251.329.48a6 6 0 0 0 .38.448c.318.34.658.649.997.998a.32.32 0 0 0 .459 0a.32.32 0 0 0 0-.449c-.24-.39-.45-.788-.688-1.168a6 6 0 0 0-.33-.479a4 4 0 0 0-.36-.449c-.229-.25-.468-.469-.708-.698h.12q.358-.121.679-.32m-4.84.568a4.14 4.14 0 0 1-1.876-.559a4.12 4.12 0 0 1-1.796-2.993a4.56 4.56 0 0 1 .758-3.403a4.5 4.5 0 0 1 1.567-1.247a8.8 8.8 0 0 1 1.996-.719a4 4 0 0 1 2.694.25a4.65 4.65 0 0 1 1.996 1.896a5.1 5.1 0 0 1 .678 3.053a3.4 3.4 0 0 1-1.547 2.575a3.2 3.2 0 0 1-.648.3c-1.188.368-1.397 1.047-3.872.847z"
                    />
                    {/* Briefcase outline in Indigo/Blue */}
                    <path
                      fill="#6366F1"
                      d="M19.16 13.722a1.6 1.6 0 0 1-.62.14c-.578.11-1.286.11-2.105.11H14.25c-.798.07-1.527.139-2.076.209v-.4a1.92 1.92 0 0 0-1.307-1.516a1.74 1.74 0 0 0-1.886.638c-.297.368-.487.81-.549 1.278v.15c-.808-.06-2.604-.14-4.2-.32a16 16 0 0 1-1.667-.26a2.2 2.2 0 0 1-.829-.299a2.4 2.4 0 0 1-.788-1.556a14.6 14.6 0 0 1 .05-3.124a.3.3 0 0 0 0-.14c1.297.1 2.584.21 3.892.24h2.445c1.227 0 2.444-.09 3.662-.1a.32.32 0 0 0 .34-.31a.32.32 0 0 0-.36-.338a52 52 0 0 0-3.573-.29H6.317q.082-.659.27-1.297c.053-.259.194-.491.398-.659c.21-.141.449-.236.699-.28q.453-.112.918-.159q.996-.105 1.996-.09a.32.32 0 0 0 .379-.289a.34.34 0 0 0-.3-.36a12.5 12.5 0 0 0-2.514-.239a3.33 3.33 0 0 0-1.826.589a1.9 1.9 0 0 0-.54.998a7 7 0 0 0-.07 1.796H4.372c-1.228.03-2.375.14-3.603.2C.36 8.044 0 11.187 0 11.975c.029.853.387 1.661.998 2.256a4.7 4.7 0 0 0 2.395.728q2.494.126 4.99 0c0 .36.06.719.11.998a.3.3 0 0 0 .308.26a.29.29 0 0 0 .26-.25a5.8 5.8 0 0 1 .11-1.646c.084-.309.245-.59.469-.819a.83.83 0 0 1 .878-.19a.87.87 0 0 1 .569.69c0 .169.05.358.07.548v.17q.045.429 0 .858a2 2 0 0 1-.32.898a1.7 1.7 0 0 1-.569.459a.69.69 0 0 1-.578.09a.36.36 0 0 1-.16-.14c-.06-.1-.11-.21-.16-.31a.33.33 0 0 0-.429-.159a.31.31 0 0 0-.16.43q.09.248.22.478q.132.194.33.32a1.28 1.28 0 0 0 .997.1c.447-.13.85-.379 1.168-.72c.302-.359.51-.787.609-1.247a4.6 4.6 0 0 0 .1-.828c.548 0 1.277.1 2.085.11c.639 0 1.307 0 1.946-.07a8 8 0 0 0 3.323-.788a.33.33 0 0 0 0-.45a.33.33 0 0 0-.4-.03"
                    />
                    <path
                      fill="#6366F1"
                      d="M18.89 15.229a.32.32 0 0 0-.34.309l-.209 4.091q.02.605-.1 1.198a.93.93 0 0 1-.289.519a2.5 2.5 0 0 1-1.118.439q-1.037.15-2.085.16h-2.714c-2.146-.07-4.281-.22-6.427-.23a19 19 0 0 1-2.525 0a2.2 2.2 0 0 1-1.317-.48a.9.9 0 0 1-.23-.508a5.6 5.6 0 0 1 0-1.158v-2.993c0-.41 0-.828.05-1.248a.29.29 0 0 0-.469-.245a.28.28 0 0 0-.1.196c-.05.429-.079.858-.099 1.277c-.05.998-.06 1.996-.12 2.994a8 8 0 0 0 0 1.297c.022.369.166.72.41.998a2.7 2.7 0 0 0 1.347.738a15.6 15.6 0 0 0 3.113.21c2.136 0 4.271.21 6.406.26c.929 0 1.857 0 2.795-.05a14 14 0 0 0 2.225-.25a3.4 3.4 0 0 0 1.517-.689c.27-.272.45-.62.519-.998q.11-.689.08-1.387l.05-4.061a.32.32 0 0 0-.213-.38a.3.3 0 0 0-.157-.01"
                    />
                  </g>
                </svg>
                <div className="flex flex-col justify-start items-center">
                  <div className="text-center justify-center text-black text-base font-medium font-['Poppins'] leading-6">No jobs listing yet</div>
                  <div className="w-80 text-center justify-center text-gray-500 text-xs font-normal font-['Poppins'] leading-4">Create your first job posting and begin receiving applications from top talent.</div>
                </div>
                <button
                  onClick={() => {
                    setSelectedListing(null);
                    setView('create-job');
                  }}
                  type="button"
                  className="w-48 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 transition-all active:scale-95 rounded-3xl outline outline-1 outline-offset-[-1px] outline-indigo-50 inline-flex justify-center items-center gap-2.5 text-white"
                >
                  <Icon icon="lucide:plus" className="w-4 h-4 text-white" />
                  <div className="text-center justify-start text-sm font-semibold font-['Poppins'] leading-5">Create job</div>
                </button>
              </div>
            ) : (
              <ListingsTab
                listings={listings}
                hasMore={hasMore}
                isFetchingMore={isFetchingMore}
                loadMore={loadMore}
                counts={counts}
                statusFilter={statusFilter}
                onStatusFilterChange={setStatusFilter}
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
            )
          )}
          {activeSubTab === 'Sent Offers' && (
            <SendOfferTab
              listings={listings}
              onSelectListing={(listing, viewType) => {
                setSelectedListing(listing);
                if (viewType) {
                  setView(viewType);
                } else {
                  const status = listing.status?.toUpperCase();
                  if (status === 'ACTIVE') {
                    setView('applicants');
                  } else if (status === 'DRAFT') {
                    setView('create-job');
                  } else {
                    setView('view-listing');
                  }
                }
              }}
              onSelectOfferGroup={(group) => {
                setSelectedOfferGroup(group);
                setView('offer-details');
              }}
            />
          )}
        </div>
      )}
    </div>
  );
};

export default MyListingsDashboard;
