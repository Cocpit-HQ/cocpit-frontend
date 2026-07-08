import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
import SendOfferModal from './SendOfferModal';
import { toast } from 'sonner';
import ListingsSkeleton from '../skeletons/ListingsSkeleton';
import { useRouter, useSearchParams } from 'next/navigation';
import { useJobStore } from '@/store/job.store';

interface MyListingsDashboardProps {
  onBack: () => void;
}

type SubTab = 'Job listings' | 'Sent offers';
type ViewState = 'dashboard' | 'create-job' | 'view-listing' | 'applicants' | 'offer-details';

export const MyListingsDashboard: React.FC<MyListingsDashboardProps> = ({ onBack }) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlView = searchParams?.get('view') as ViewState | null;
  const urlJobId = searchParams?.get('jobId') || null;

  // Initialize the local view state based on URL, defaulting to 'dashboard'
  const [view, setView] = useState<ViewState>(() => {
    if (urlView && ['dashboard', 'create-job', 'view-listing', 'applicants', 'offer-details'].includes(urlView)) {
      return urlView;
    }
    return 'dashboard';
  });

  const urlSubTab = searchParams?.get('subtab');
  const [activeSubTab, setActiveSubTabLocal] = useState<SubTab>(() => {
    if (urlSubTab === 'Sent offers' || urlSubTab === 'Sent Offers') return 'Sent offers';
    return 'Job listings';
  });

  // Wrap setActiveSubTab to also update URL
  const setActiveSubTab = useCallback((tab: SubTab) => {
    setActiveSubTabLocal(tab);
    const params = new URLSearchParams(window.location.search);
    if (tab === 'Job listings') {
      params.delete('subtab');
    } else {
      params.set('subtab', tab);
    }
    router.replace(`/jobs?${params.toString()}`);
  }, [router]);
  const {
    listings, isLoading, isFetchingMore, hasMore, counts,
    statusFilter, setStatusFilter, loadMore, refresh
  } = useMyListings();

  const [initialOfferJobId, setInitialOfferJobId] = useState<string | undefined>(undefined);
  const [isSendOfferModalOpen, setIsSendOfferModalOpen] = useState(false);

  const [selectedListing, setSelectedListing] = useState<JobListing | null>(null);
  const { selectedOfferGroup, setSelectedOfferGroup } = useJobStore();

  // Helper to transition views and update URL query parameters atomically
  const transitionTo = useCallback((nextView: ViewState, nextJobId?: string | null) => {
    setView(nextView);
    const params = new URLSearchParams(window.location.search);
    if (nextView === 'dashboard') {
      params.delete('view');
      params.delete('jobId');
      params.delete('step');
      params.delete('title');
      params.delete('subtab');
    } else {
      params.set('view', nextView);
      if (nextJobId) {
        params.set('jobId', nextJobId);
      } else {
        params.delete('jobId');
      }
      
      // Clear wizard-specific query parameters when not deep linking into the wizard
      if (nextView !== 'create-job') {
        params.delete('step');
        params.delete('title');
      } else if (!nextJobId) {
        // If we are starting a FRESH create-job flow, wipe any lingering URL parameters
        params.delete('step');
        params.delete('title');
      }
    }
    router.replace(`/jobs?${params.toString()}`);
  }, [router]);

  // Synchronize local view state with URL view parameter (browser navigation)
  useEffect(() => {
    const currentUrlView = searchParams?.get('view') as ViewState | null;
    if (currentUrlView) {
      setView(currentUrlView);
    } else {
      setView('dashboard');
    }
  }, [searchParams]);

  // Resolve selectedListing if urlJobId is present in URL
  useEffect(() => {
    if (urlJobId && listings.length > 0) {
      const matched = listings.find(l => l.id === urlJobId);
      if (matched) {
        setSelectedListing(matched);
      }
    } else if (!urlJobId) {
      setSelectedListing(null);
    }
  }, [urlJobId, listings]);

  const handleCreateJob = useCallback(async (title: string, status: string, details?: Partial<JobListing>) => {
    try {
      const listingData = selectedListing ? { ...details, id: selectedListing.id } : details;
      const newListing = await jobsService.createJobListing(title, status, listingData);
      if (newListing) {
        refresh();
        setActiveSubTabLocal('Job listings');
        transitionTo('dashboard');
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
  }, [selectedListing, refresh, transitionTo]);

  const handleCloseJob = useCallback(async (id: string) => {
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
  }, [refresh]);

  const handleDeleteJob = useCallback(async (id: string) => {
    try {
      const success = await jobsService.deleteJobListing(id);
      if (success) {
        refresh();
        transitionTo('dashboard');
        toast.success('Job listing deleted.');
      } else {
        toast.error('Failed to delete job listing.');
      }
    } catch (error) {
      console.error('Error deleting job listing:', error);
      toast.error('Failed to delete job listing.');
    }
  }, [refresh, transitionTo]);

  // Memoize stable callbacks for child components
  // Memoize stable callbacks for child components
  const handleCreateJobBack = useCallback(() => {
    transitionTo('dashboard');
  }, [transitionTo]);

  const handleSendOfferInit = useCallback((listing: JobListing) => {
    setInitialOfferJobId(listing.id);
    setIsSendOfferModalOpen(true);
  }, []);

  const handleSelectListing = useCallback((listing: JobListing) => {
    const status = listing.status?.toUpperCase();
    if (status === 'ACTIVE') {
      transitionTo('applicants', listing.id);
    } else if (status === 'DRAFT') {
      transitionTo('create-job', listing.id);
    } else {
      transitionTo('view-listing', listing.id);
    }
  }, [transitionTo]);

  const handleSelectOfferGroup = useCallback((group: any) => {
    setSelectedOfferGroup(group);
    transitionTo('offer-details');
  }, [transitionTo]);

  if (view === 'create-job') {
    return (
      <CreateJobFlow
        onBack={handleCreateJobBack}
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
          transitionTo('dashboard');
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
            transitionTo('view-listing', matchingListing.id);
          } else {
            const mockListing: JobListing = {
              id: 'list-mock',
              title: selectedOfferGroup.title,
              company: selectedOfferGroup.company,
              status: 'ACTIVE',
              posted_at: 'Posted 2 hours ago',
            };
            setSelectedListing(mockListing);
            transitionTo('view-listing');
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
            transitionTo('offer-details');
          } else if (selectedListing.status?.toUpperCase() === 'ACTIVE') {
            transitionTo('applicants', selectedListing.id);
          } else {
            transitionTo('dashboard');
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
            transitionTo('offer-details');
          } else {
            transitionTo('dashboard');
          }
        }}
        onViewDetails={() => transitionTo('view-listing', selectedListing.id)}
      />
    );
  }

  return (
    <>
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
          <div className="text-center justify-start text-black text-lg font-medium font-['Poppins'] leading-6">Posted jobs</div>
          <div className="text-center justify-start text-gray-500 text-xs font-normal font-['Poppins'] leading-4">Post, manage, and track all your job listings in one place</div>
        </div>
      </div>

      {/* Hero Banner */}
      <div className="w-full bg-[#F5F8FF] rounded-3xl p-8 flex justify-between items-center relative overflow-hidden">
        <div className="flex flex-col justify-start items-start max-w-lg z-10">
          <h2 className="text-black text-3xl font-bold font-['Poppins'] mb-2">
            {activeSubTab === 'Job listings' ? 'Post jobs & find talent' : 'Send job offers'}
          </h2>
          <p className="text-gray-600 text-sm font-normal font-['Poppins'] mb-6">
            {activeSubTab === 'Job listings' 
              ? 'Manage your core network, track subscriber growth, and publish thought leadership across the Cocpit ecosystem.'
              : 'Hire top talent faster by sending personalized job offers and tracking candidate responses in one place.'}
          </p>
          <button
            onClick={() => {
              if (activeSubTab === 'Job listings') {
                transitionTo('create-job');
              } else {
                setInitialOfferJobId(undefined);
                setIsSendOfferModalOpen(true);
              }
            }}
            className="px-6 py-2.5 bg-[#6366F1] hover:bg-indigo-600 rounded-[24px] text-white text-sm font-semibold font-['Poppins'] transition-all active:scale-95 shadow-sm"
          >
            {activeSubTab === 'Job listings' ? 'Create job' : 'Send offer'}
          </button>
        </div>
        
        {/* Placeholder Illustration (replace with real assets when available) */}
        <div className="hidden md:flex absolute right-8 top-1/2 -translate-y-1/2 w-64 h-40 bg-indigo-100 rounded-xl justify-center items-center opacity-50 z-0">
           <Icon icon="lucide:image" className="w-10 h-10 text-indigo-300" />
        </div>
      </div>

      {/* Sub-Tabs Row */}
      <div className="w-full flex justify-start items-center gap-4">
        {(['Job listings', 'Sent offers'] as SubTab[]).map(tab => {
          const isActive = activeSubTab === tab;
          return (
            <button
              key={tab}
              onClick={() => setActiveSubTab(tab)}
              className={`h-10 px-5 py-1.5 rounded-full flex justify-center items-center text-sm font-semibold font-['Poppins'] transition-all duration-200 active:scale-95 border ${isActive
                  ? 'bg-indigo-50 border-indigo-200 text-indigo-500'
                  : 'bg-white border-transparent hover:bg-gray-50 text-gray-500 hover:text-black'
                }`}
            >
              {tab}
            </button>
          );
        })}
      </div>

      {/* Content state */}
      <div className="w-full">
        {activeSubTab === 'Job listings' && (
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
                    transitionTo('create-job');
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
                onSelectListing={handleSelectListing}
                onSendOffer={handleSendOfferInit}
                onCloseListing={handleCloseJob}
                onDeleteListing={handleDeleteJob}
                isLoading={isLoading}
              />
            )
          )}
          {activeSubTab === 'Sent offers' && (
            <SendOfferTab
              listings={listings}
              onSelectListing={(listing, viewType) => {
                if (viewType) {
                  transitionTo(viewType, listing.id);
                } else {
                  handleSelectListing(listing);
                }
              }}
              onSelectOfferGroup={handleSelectOfferGroup}
              onOpenSendOfferModal={() => setIsSendOfferModalOpen(true)}
            />
          )}
        </div>
      </div>
      
      <SendOfferModal
        isOpen={isSendOfferModalOpen}
        onClose={() => {
          setIsSendOfferModalOpen(false);
          setInitialOfferJobId(undefined);
        }}
        activeListings={listings.filter(l => l.status?.toUpperCase() === 'ACTIVE')}
        onOfferSent={() => {
          setIsSendOfferModalOpen(false);
          setInitialOfferJobId(undefined);
          // Just refresh to pull the updated counts if needed
          refresh();
        }}
        initialJobId={initialOfferJobId}
      />
    </>
  );
};

export default MyListingsDashboard;
