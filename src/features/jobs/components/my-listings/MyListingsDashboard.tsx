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
import { useActiveProfile } from '@/context/ActiveProfileContext';
import { useRouter, useSearchParams } from 'next/navigation';
import { useJobStore } from '@/store/job.store';
import Image from 'next/image';

interface MyListingsDashboardProps {
  onBack: () => void;
  isCompanyMode?: boolean;
}

type SubTab = 'Job listings' | 'Sent offers';
type ViewState = 'dashboard' | 'create-job' | 'view-listing' | 'applicants' | 'offer-details';

export const MyListingsDashboard: React.FC<MyListingsDashboardProps> = ({ onBack, isCompanyMode = false }) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlView = searchParams?.get('view') as ViewState | null;
  const urlJobId = searchParams?.get('jobId') || null;
  const { activeProfile } = useActiveProfile();
  const orgId = activeProfile?.type === 'COMPANY' ? activeProfile.id : undefined;

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

  // Read initial status filter from URL so refresh preserves the selected tab
  const VALID_FILTERS = ['All', 'Active', 'Closed', 'In review', 'Drafts'] as const;
  const urlFilter = searchParams?.get('filter') || 'All';
  const initialFilter = (VALID_FILTERS as readonly string[]).includes(urlFilter) ? urlFilter : 'All';

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
    statusFilter, setStatusFilter: setStatusFilterRaw, loadMore, refresh
  } = useMyListings(initialFilter);

  // Wrap setStatusFilter to also persist the selected filter tab in the URL
  const setStatusFilter = useCallback((status: string) => {
    setStatusFilterRaw(status);
    const params = new URLSearchParams(window.location.search);
    if (status === 'All') {
      params.delete('filter');
    } else {
      params.set('filter', status);
    }
    router.replace(`/jobs?${params.toString()}`);
  }, [setStatusFilterRaw, router]);

  const [initialOfferJobId, setInitialOfferJobId] = useState<string | undefined>(undefined);
  const [isSendOfferModalOpen, setIsSendOfferModalOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

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
      const actorType = activeProfile?.type === 'COMPANY' ? 'ORGANIZATION' : 'USER';
      const actorId = activeProfile?.type === 'COMPANY' ? activeProfile.id : undefined;
      const newListing = await jobsService.createJobListing(title, status, listingData, actorType, actorId);
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
  }, [selectedListing, refresh, transitionTo, activeProfile]);

  const handleCloseJob = useCallback(async (id: string) => {
    try {
      const success = await jobsService.closeJobListing(id, orgId);
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
  }, [refresh, orgId]);

  const handleDeleteJob = useCallback(async (id: string) => {
    try {
      const success = await jobsService.deleteJobListing(id, orgId);
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
  }, [refresh, transitionTo, orgId]);

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
        {!isCompanyMode && (
          <button
            onClick={onBack}
            className="size-12 p-2 rounded-[100px] outline outline-1 outline-offset-[-1px] outline-zinc-300 dark:outline-[#2E3445] backdrop-blur-md flex justify-center items-center gap-2.5 hover:bg-slate-50 dark:hover:bg-[#2E3445] transition-colors active:scale-95 text-gray-500 dark:text-[#9CA3AF]"
          >
            <Icon icon="lucide:chevron-left" className="w-6 h-6 text-gray-500 dark:text-[#9CA3AF]" />
          </button>
        )}
        <div className="inline-flex flex-col justify-start items-start">
          <div className={`text-center justify-start text-black text-lg font-medium font-['Poppins'] leading-6 ${isCompanyMode ? 'dark:text-[#FFFFFF]' : 'dark:text-[#F9FAFB]'}`}>Posted jobs</div>
          <div className={`text-center justify-start text-gray-500 text-xs font-normal font-['Poppins'] leading-4 ${isCompanyMode ? 'dark:text-[#A1A8B3]' : 'dark:text-[#9CA3AF]'}`}>Post, manage, and track all your job listings in one place</div>
        </div>
      </div>

      {/* Hero Banner */}
      <div className={`w-full rounded-3xl p-8 flex justify-between items-center relative overflow-hidden ${isCompanyMode ? 'bg-[#F0F5FF] dark:bg-[#121B2B]' : 'bg-[#F5F8FF] dark:bg-[#1C2340]'}`}>
        <div className="flex flex-col justify-start items-start max-w-lg z-10">
          <h2 className={`text-black text-3xl font-bold font-['Poppins'] mb-2 ${isCompanyMode ? 'dark:text-[#FFFFFF]' : 'dark:text-[#F9FAFB]'}`}>
            {activeSubTab === 'Job listings' ? 'Post jobs & find talent' : 'Send job offers'}
          </h2>
          <p className={`text-gray-600 text-sm font-normal font-['Poppins'] mb-6 ${isCompanyMode ? 'dark:text-[#A1A8B3]' : 'dark:text-[#9CA3AF]'}`}>
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
            className={`px-6 py-2.5 rounded-[24px] text-white text-sm font-semibold font-['Poppins'] transition-all active:scale-95 shadow-sm ${
              isCompanyMode ? 'bg-[#1A73E8] dark:bg-[#4D9CFF]' : 'bg-[#6366F1] dark:bg-[#818CF8]'
            }`}
          >
            {activeSubTab === 'Job listings' ? 'Create job' : 'Send offer'}
          </button>
        </div>
        
        {/* Illustration */}
        <div className="hidden md:flex absolute right-0 top-0 h-full w-auto">
          <Image
            src={activeSubTab === 'Job listings' ? "/images/companyonboarding/jobpostcompany.png" : "/images/companyonboarding/companyjoboffer.png"}
            alt="Jobs illustration"
            width={350}
            height={200}
            className="h-full w-auto object-cover object-right"
            priority
          />
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
              className={`h-10 px-5 py-1.5 rounded-full flex justify-center items-center text-sm font-semibold font-['Poppins'] transition-all duration-200 active:scale-95 border ${
                isActive
                  ? (isCompanyMode ? 'bg-blue-50 dark:bg-[#1A2435] border-blue-200 dark:border-[#2A2D35] text-[#1A73E8] dark:text-[#4D9CFF]' : 'bg-indigo-50 dark:bg-[#1C2340] border-indigo-200 dark:border-[#2E3445] text-indigo-500 dark:text-[#818CF8]')
                  : `bg-white border-transparent text-gray-500 hover:text-black hover:bg-gray-50 ${isCompanyMode ? 'dark:bg-[#0F1115] dark:hover:bg-[#2A2D35] dark:text-[#A1A8B3] dark:hover:text-[#FFFFFF]' : 'dark:bg-[#0B0F19] dark:hover:bg-[#2E3445] dark:text-[#9CA3AF] dark:hover:text-[#F9FAFB]'}`
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
                <Image 
                  src="/images/companyonboarding/Job.png" 
                  alt="No jobs listing yet" 
                  width={112} 
                  height={112} 
                  className="w-28 h-auto flex-shrink-0 animate-in fade-in duration-300" 
                />
                <div className="flex flex-col justify-start items-center">
                  <div className={`text-center justify-center text-black text-base font-semibold font-['Poppins'] leading-6 ${isCompanyMode ? 'dark:text-[#FFFFFF]' : 'dark:text-[#F9FAFB]'}`}>No jobs listing yet</div>
                  <div className={`w-80 text-center justify-center text-gray-500 text-xs font-normal font-['Poppins'] leading-4 ${isCompanyMode ? 'dark:text-[#A1A8B3]' : 'dark:text-[#9CA3AF]'}`}>Create your first job posting and begin receiving applications from top talent.</div>
                </div>
                <button
                  onClick={() => {
                    transitionTo('create-job');
                  }}
                  type="button"
                  className={`w-48 px-4 py-2 transition-all active:scale-95 rounded-3xl outline outline-1 outline-offset-[-1px] inline-flex justify-center items-center gap-2.5 text-white ${
                    isCompanyMode ? 'bg-[#1A73E8] dark:bg-[#4D9CFF] outline-blue-50 dark:outline-[#1A2435]' : 'bg-indigo-500 dark:bg-[#818CF8] outline-indigo-50 dark:outline-[#2E3445]'
                  }`}
                >
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
              isCompanyMode={isCompanyMode}
              refreshTrigger={refreshTrigger}
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
        activeListings={listings.filter(l => l.status?.toUpperCase() === 'ACTIVE').length > 0
          ? listings.filter(l => l.status?.toUpperCase() === 'ACTIVE')
          : listings /* fallback: show all so modal can render something */}
        onOfferSent={() => {
          setIsSendOfferModalOpen(false);
          setInitialOfferJobId(undefined);
          // Just refresh to pull the updated counts if needed
          refresh();
          setRefreshTrigger(prev => prev + 1);
        }}
        initialJobId={initialOfferJobId}
      />
    </>
  );
};

export default MyListingsDashboard;
