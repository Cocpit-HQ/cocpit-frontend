import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
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
import { BriefcaseIcon, LeftArrowIcon } from '@/components/icons';
import { FeatureDisabledTooltip } from '@/components/feature-flags';

interface MyListingsDashboardProps {
  onBack: () => void;
  isCompanyMode?: boolean;
}

type SubTab = 'Job listings' | 'Sent offers';
type ViewState = 'dashboard' | 'create-job' | 'view-listing' | 'applicants' | 'offer-details';

export const MyListingsDashboard: React.FC<MyListingsDashboardProps> = ({ onBack, isCompanyMode = false }) => {
  const router = useRouter();
  const queryClient = useQueryClient();
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
    router.replace(`${window.location.pathname}?${params.toString()}`);
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
    router.replace(`${window.location.pathname}?${params.toString()}`);
  }, [setStatusFilterRaw, router]);

  const [initialOfferJobId, setInitialOfferJobId] = useState<string | undefined>(undefined);
  const [isSendOfferModalOpen, setIsSendOfferModalOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const [selectedListing, setSelectedListing] = useState<JobListing | null>(null);
  const [listingReferrer, setListingReferrer] = useState<'dashboard' | 'applicants'>('dashboard');
  const { selectedOfferGroup, setSelectedOfferGroup } = useJobStore();

  // Helper to transition views and update URL query parameters atomically
  const transitionTo = useCallback((nextView: ViewState, nextJobId?: string | null) => {
    setView(nextView);
    if (nextView === 'dashboard') {
      setSelectedListing(null);
    }
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
    router.replace(`${window.location.pathname}?${params.toString()}`, { scroll: false });
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
    // Prevent race condition where stale URL searchParams clears state during view transitions
    if (view !== 'dashboard' && !urlJobId) return;
    if (urlJobId) {
      const matched = listings.find(l => l.id === urlJobId);
      if (matched) {
        setSelectedListing(matched);
      } else {
        jobsService.getJobById(urlJobId).then(j => j && setSelectedListing(j as any));
      }
    } else if (!urlJobId && view === 'dashboard') {
      setSelectedListing(null);
    }
  }, [urlJobId, listings, view]);

  const handleCreateJob = useCallback(async (title: string, status: string, details?: Partial<JobListing>) => {
    try {
      const listingData = selectedListing ? { ...details, id: selectedListing.id } : details;
      const actorType = activeProfile?.type === 'COMPANY' ? 'ORGANIZATION' : 'USER';
      const actorId = activeProfile?.type === 'COMPANY' ? activeProfile.id : undefined;
      const newListing = await jobsService.createJobListing(title, status, listingData, actorType, actorId);
      if (newListing) {
        refresh();
        if (status === 'ACTIVE') {
          setActiveSubTabLocal('Job listings');
          transitionTo('dashboard');
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
       queryClient.setQueriesData({ queryKey: ['myListings'] }, (oldData: any) => {
          if (!oldData?.pages) return oldData;
          return {
            ...oldData,
            pages: oldData.pages.map((page: any) => ({
              ...page,
              data: page.data?.filter((item: any) => item.id !== id),
            }))
          };
        }); 
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
  }, [refresh, transitionTo, orgId, queryClient]);

  // Memoize stable callbacks for child components
  // Memoize stable callbacks for child components
  const handleCreateJobBack = useCallback(() => {
    setSelectedListing(null);
    refresh();
    transitionTo('dashboard');
  }, [refresh, transitionTo]);

  const handleSendOfferInit = useCallback((listing: JobListing) => {
    setInitialOfferJobId(listing.id);
    setIsSendOfferModalOpen(true);
  }, []);

  const handleSelectListing = useCallback((listing: JobListing) => {
    setSelectedListing(listing);
    const isDraft = (listing.status || '').toUpperCase() === 'DRAFT';
    if (isDraft) {
      transitionTo('create-job', listing.id);
    } else {
      setListingReferrer('dashboard');
      transitionTo('applicants', listing.id);
    }
  }, [transitionTo]);

  const handleViewApplicants = useCallback((listing: JobListing) => {
    setSelectedListing(listing);
    const isDraft = (listing.status || '').toUpperCase() === 'DRAFT';
    if (isDraft) {
      transitionTo('create-job', listing.id);
    } else {
      setListingReferrer('dashboard');
      transitionTo('applicants', listing.id);
    }
  }, [transitionTo]);

  const handleSelectOfferGroup = useCallback((group: any) => {
    setSelectedOfferGroup(group);
    // Persist jobId in query parameters for offer-details view
    transitionTo('offer-details', group.id || group.job_id);
  }, [transitionTo]);

  if (view === 'create-job') {
    return (
      <CreateJobFlow
        onBack={handleCreateJobBack}
        onSubmit={handleCreateJob}
        onDelete={() => refresh()}
        initialListing={selectedListing}
      />
    );
  }

  // Render OfferDetailsScreen when viewing offer details either from in-memory selection or via direct URL link
  const offerGroup = selectedOfferGroup || (urlJobId ? { id: urlJobId, title: '', company: '', sentCount: 0, acceptedCount: 0, pendingCount: 0, declinedCount: 0 } : null);
  if (view === 'offer-details' && offerGroup) {
    const matchingListing = listings.find(
      (l) => l.id === offerGroup.id || l.title?.toLowerCase() === offerGroup.title?.toLowerCase()
    );
    return (
      <OfferDetailsScreen
        offerGroup={offerGroup}
        matchingListing={matchingListing}
        refreshTrigger={refreshTrigger}
        onOfferWithdrawn={() => refresh()}
        onBack={() => {
          transitionTo('dashboard');
          setSelectedOfferGroup(null);
        }}
        onViewListingDetails={() => {
          const matched = listings.find(
            (l) => l.title?.toLowerCase() === offerGroup.title?.toLowerCase()
          );
          if (typeof window !== 'undefined') {
            sessionStorage.setItem('coming_from_send_offer_details', 'true');
          }
          if (matched) {
            setSelectedListing(matched);
            transitionTo('view-listing', matched.id);
          } else if (offerGroup.id) {
            transitionTo('view-listing', offerGroup.id);
          } else {
            toast.error('Listing details not found.');
          }
        }}
      />
    );
  }

  if (view === 'view-listing') {
    const matchedFromListings = urlJobId ? listings.find(l => l.id === urlJobId) : null;
    const listingToUse = selectedListing || matchedFromListings || (urlJobId ? ({ id: urlJobId, title: 'Job Listing', status: 'ACTIVE' } as JobListing) : null);
    if (listingToUse) {
      return (
        <ListingDetailsScreen
          listing={listingToUse}
          onBack={() => {
            const returnTo = searchParams?.get('returnTo');
            if (returnTo) {
              router.push(returnTo);
              return;
            }
            const fromOffers = typeof window !== 'undefined' && sessionStorage.getItem('coming_from_send_offer_details') === 'true';
            if (fromOffers) {
              if (typeof window !== 'undefined') {
                sessionStorage.removeItem('coming_from_send_offer_details');
              }
              setRefreshTrigger(prev => prev + 1);
              transitionTo('offer-details');
            } else if (listingReferrer === 'applicants') {
              transitionTo('applicants', listingToUse.id);
            } else {
              transitionTo('dashboard');
            }
          }}
          onCloseListing={handleCloseJob}
          onDeleteListing={handleDeleteJob}
        />
      );
    }
    // Never fall through to the dashboard while transitioning/resolving listing
    return null;
  }

  if (view === 'applicants') {
    const matchedFromListings = urlJobId ? listings.find(l => l.id === urlJobId) : null;
    const listingToUse = selectedListing || matchedFromListings || (urlJobId ? ({ id: urlJobId, title: 'Job Listing', status: 'ACTIVE' } as JobListing) : null);
    if (listingToUse) {
      // Guard against opening draft jobs in applicants view
      if ((listingToUse.status || '').toUpperCase() === 'DRAFT') {
        transitionTo('create-job', listingToUse.id);
        return null;
      }

      return (
        <ApplicantsDashboard
          listing={listingToUse}
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
          onViewDetails={() => {
            setListingReferrer('applicants');
            transitionTo('view-listing', listingToUse.id);
          }}
        />
      );
    }
    // Never fall through to the dashboard while transitioning/resolving listing
    return null;
  }

  return (
    <>
      {/* Desktop Back Button (Preserved 100%) */}
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          aria-label="Back"
          className="hidden md:inline-flex fixed top-[40px] left-[40px] z-[60] items-center gap-2 p-0 text-ds-text-primary cursor-pointer bg-transparent border-none outline-none focus-visible:ring-2 focus-visible:ring-ds-accent"
        >
          <LeftArrowIcon size={20} className="size-5 text-ds-text-primary shrink-0" />
          <span className="font-dm-sans font-medium text-base leading-6">Back</span>
        </button>
      )}

      <div className="w-full max-w-[800px] mx-auto flex flex-col gap-5 font-dm-sans animate-in fade-in duration-300">
        {/* Mobile In-flow Back Button (Figma Frame 2609713) */}
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            aria-label="Back"
            className="flex md:hidden items-center gap-2 p-0 text-ds-text-primary cursor-pointer bg-transparent border-none outline-none self-start"
          >
            <LeftArrowIcon size={20} className="size-5 text-ds-text-primary shrink-0" />
            <span className="font-dm-sans font-medium text-base leading-6">Back</span>
          </button>
        )}

        {/* Top Banner Card: Frame 2609959 (mobile: transparent bg, desktop: #1A1A20; border: #2C2C33, r: 16px) */}
        <div className="w-full h-auto sm:h-24 p-4 sm:p-6 bg-transparent sm:bg-ds-surface-1 rounded-2xl border border-ds-border flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-0 box-border">
          <div className="w-full flex flex-col items-start justify-center gap-1">
            <h2 className="text-ds-text-primary ds-text-body-2 font-semibold text-base leading-6 flex items-center">
              <span className="md:hidden">{activeSubTab === 'Sent offers' ? 'Send job offers' : 'Posted jobs'}</span>
              <span className="hidden md:inline">
                {activeSubTab === 'Job listings' ? 'Post jobs & find talent' : 'Send job offers'}
              </span>
            </h2>
            <p className="text-ds-text-secondary ds-text-secondary font-normal text-sm leading-5 flex items-center">
              <span className="md:hidden">
                {activeSubTab === 'Sent offers'
                  ? 'Send and track personalized job offers and candidate responses'
                  : 'Manage and track your personalized job offers and candidate responses'}
              </span>
              <span className="hidden md:inline">
                {activeSubTab === 'Job listings' 
                  ? 'Manage your core network, track subscriber growth, and publish thought leadership across the Cocpit ecosystem.'
                  : 'Hire top talent faster by sending personalized job offers and tracking candidate responses in one place.'}
              </span>
            </p>
          </div>

          {/* Mobile Action Button inside banner (Figma Frame 2609971 spec: w-103px, h-36px, bg-#1A1A20) */}
          <div className="flex md:hidden self-start shrink-0">
            <FeatureDisabledTooltip 
              featureKey={activeSubTab === 'Job listings' ? "enableJobCreation" : "enableJobOffers"}
              disabledMessage={activeSubTab === 'Job listings' ? "Job creation is temporarily disabled by admin." : "Sending job offers is temporarily disabled by admin."}
            >
              <button
                type="button"
                onClick={() => {
                  if (activeSubTab === 'Job listings') {
                    transitionTo('create-job');
                  } else {
                    setInitialOfferJobId(undefined);
                    setIsSendOfferModalOpen(true);
                  }
                }}
                className="w-[103px] h-9 px-3 py-1.5 bg-transparent hover:bg-ds-surface-1 text-ds-text-primary rounded-full flex items-center justify-center font-dm-sans font-medium text-base leading-6 whitespace-nowrap transition-all active:scale-95 cursor-pointer outline-none border border-ds-border shrink-0"
              >
                {activeSubTab === 'Job listings' ? 'Create job' : 'Send offer'}
              </button>
            </FeatureDisabledTooltip>
          </div>
        </div>

        {/* Sub-Tabs & Action Row: Frame 2609960 */}
        <div className="w-full flex justify-between items-center select-none">
          {/* Left: Job listings & Sent Offers tabs */}
          <div className="flex items-center gap-3">
            {(['Job listings', 'Sent offers'] as SubTab[]).map(tab => {
              const isActive = activeSubTab === tab;
              const label = tab === 'Sent offers' ? 'Sent Offers' : tab;
              return (
                <button
                  type="button"
                  key={tab}
                  onClick={() => setActiveSubTab(tab)}
                  className={`relative h-9 px-3 py-1.5 flex flex-col justify-center items-center text-base font-medium font-dm-sans transition-colors whitespace-nowrap cursor-pointer shrink-0 focus:outline-none ${
                    isActive ? 'text-ds-text-primary' : 'text-ds-text-secondary hover:text-ds-text-primary'
                  }`}
                >
                  <span>{label}</span>
                  {isActive && (
                    <span className="absolute bottom-0 left-0 right-0 h-[1.5px] bg-ds-accent shadow-[0px_2px_4px_0px_rgba(255,236,230,0.08)]" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Right: Create job button (Desktop only, on mobile it is inside the banner card per Figma) */}
          <div className="hidden md:flex">
            <FeatureDisabledTooltip 
              featureKey={activeSubTab === 'Job listings' ? "enableJobCreation" : "enableJobOffers"}
              disabledMessage={activeSubTab === 'Job listings' ? "Job creation is temporarily disabled by admin." : "Sending job offers is temporarily disabled by admin."}
            >
              <button
                type="button"
                onClick={() => {
                  if (activeSubTab === 'Job listings') {
                    transitionTo('create-job');
                  } else {
                    setInitialOfferJobId(undefined);
                    setIsSendOfferModalOpen(true);
                  }
                }}
                className="w-[103px] h-9 px-3 py-1.5 bg-transparent hover:bg-ds-surface-1 border border-ds-border text-ds-text-primary rounded-full flex items-center justify-center ds-text-body-1 font-medium text-base leading-6 whitespace-nowrap transition-all active:scale-95 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-ds-accent shrink-0"
              >
                {activeSubTab === 'Job listings' ? 'Create job' : 'Send offer'}
              </button>
            </FeatureDisabledTooltip>
          </div>
        </div>

        {/* Content state */}
        <div className="w-full">
          {activeSubTab === 'Job listings' && (
            counts.all === 0 && !isLoading ? (
              <div className="w-full max-w-[800px] h-[538px] flex flex-col justify-center items-center gap-4 select-none animate-in fade-in duration-200">
                {/* IconFrame: 64x64px, padding 12px, bg #1A1A20 (--ds-surface-1), rounded-full */}
                <div className="w-16 h-16 p-3 bg-ds-surface-1 rounded-full flex items-center justify-center shrink-0">
                  <BriefcaseIcon size={40} className="w-10 h-10 text-ds-text-muted shrink-0" fill="currentColor" />
                </div>

                {/* Text Container */}
                <div className="flex flex-col justify-start items-center gap-2 text-center">
                  <h3 className="text-ds-text-primary text-base font-semibold font-dm-sans leading-6">
                    No jobs listing yet
                  </h3>
                  <p className="w-80 max-w-full text-ds-text-secondary text-sm font-normal font-dm-sans leading-5">
                    Create your first job posting and begin receiving applications from top talent.
                  </p>
                </div>

                {/* Action Button */}
                <FeatureDisabledTooltip 
                  featureKey="enableJobCreation"
                  disabledMessage="Job creation is temporarily disabled by admin."
                >
                  <button
                    onClick={() => {
                      transitionTo('create-job');
                    }}
                    type="button"
                    className="w-[260px] h-9 px-3 py-1.5 bg-ds-accent hover:opacity-90 active:scale-95 text-ds-text-primary rounded-[100px] inline-flex justify-center items-center gap-2.5 ds-text-body-1 font-medium font-dm-sans text-base leading-6 transition-all shadow-sm cursor-pointer border-none outline-none focus-visible:ring-2 focus-visible:ring-ds-accent"
                  >
                    Create job
                  </button>
                </FeatureDisabledTooltip>
              </div>
            ) : (
              <ListingsTab
                listings={listings}
                targetJobId={urlJobId}
                hasMore={hasMore}
                isFetchingMore={isFetchingMore}
                loadMore={loadMore}
                counts={counts}
                statusFilter={statusFilter}
                onStatusFilterChange={setStatusFilter}
                onSelectListing={handleSelectListing}
                onViewApplicants={handleViewApplicants}
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
