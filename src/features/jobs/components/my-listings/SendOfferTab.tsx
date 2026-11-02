import React, { useState, useEffect, useCallback, useRef } from 'react';
import { JobListing } from '../../types/jobs.types';
import { Icon } from '@iconify/react';
import { OfferIcon } from '@/components/icons';
import { FeatureDisabledTooltip } from '@/components/feature-flags';
import SendOfferModal from './SendOfferModal';
import api from '@/lib/axios';
import { useActiveProfile } from '@/context/ActiveProfileContext';
import { useSocket } from '@/context/SocketContext';

export interface SentOfferGroup {
  id: string;
  title: string;
  company: string;
  sentCount: number;
  acceptedCount: number;
  pendingCount: number;
  declinedCount: number;
}

interface SendOfferTabProps {
  listings: JobListing[];
  onSelectListing?: (listing: JobListing, viewType?: 'view-listing' | 'applicants') => void;
  onSelectOfferGroup?: (group: SentOfferGroup) => void;
  initialOfferJobId?: string;
  onClearInitialOfferJobId?: () => void;
  onOpenSendOfferModal?: () => void;
  isCompanyMode?: boolean;
  refreshTrigger?: number;
}

export const SendOfferTab: React.FC<SendOfferTabProps> = ({ 
  listings, 
  onSelectListing, 
  onSelectOfferGroup,
  initialOfferJobId,
  onClearInitialOfferJobId,
  onOpenSendOfferModal,
  isCompanyMode = false,
  refreshTrigger = 0
}) => {
  const [isSendOpen, setIsSendOpen] = useState(false);
  const { activeProfile, userCompanies } = useActiveProfile();
  const { socket } = useSocket();

  // Sent Offers state
  const [sentOffers, setSentOffers] = useState<SentOfferGroup[]>([]);
  const [isLoadingOffers, setIsLoadingOffers] = useState(false);
  const isFirstLoadOffersRef = useRef(true);

  // Independently fetch ALL active listings for the Send Offer modal.
  // We CANNOT rely on the parent's `listings` prop because that array is
  // paginated and filtered by the current status-filter tab (e.g., "Drafts").
  const [activeListings, setActiveListings] = useState<JobListing[]>([]);

  useEffect(() => {
    const fetchActiveListings = async () => {
      try {
        const isCompany = activeProfile?.type === 'COMPANY';
        const orgId = isCompany ? activeProfile?.id : null;

        let jobs: any[] = [];
        if (isCompany && orgId) {
          // Fetch all ACTIVE company jobs (no limit)
          const res = await api.get(`/organizations/${orgId}/jobs`, {
            params: { scope: 'internal', status: 'ACTIVE', limit: 100 }
          });
          jobs = res.data?.jobs || res.data || [];
        } else {
          // Personal recruiter — fetch their active jobs
          const res = await api.get('/jobs/my', { params: { status: 'ACTIVE', limit: 100 } });
          jobs = res.data?.jobs || res.data || [];
        }

        const mapped: JobListing[] = jobs.map((job: any) => ({
          id: job.job_id || job.id,
          title: job.title,
          status: job.status,
          org_id: job.org_id,
          company: job.company_name,
          location: job.location,
        }));
        setActiveListings(mapped);
      } catch (err) {
        console.error('Failed to fetch active listings for offer modal:', err);
        // Fallback: filter parent listings
        setActiveListings(listings.filter(l => l.status?.toUpperCase() === 'ACTIVE'));
      }
    };

    fetchActiveListings();
  // Re-fetch when profile or parent listings change
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeProfile]);

  const fetchSentOffers = useCallback(async (silent = false) => {
    let companyId = '';
    if (activeProfile && activeProfile.type === 'COMPANY') {
      companyId = activeProfile.id;
    }
    if (!silent && isFirstLoadOffersRef.current) {
      setIsLoadingOffers(true);
    }
    try {
      const endpoint = companyId 
        ? `/jobs/companies/${companyId}/offers/sent` 
        : `/jobs/offers/sent`;
      const response = await api.get(endpoint);
      const mapped: SentOfferGroup[] = (response.data || []).map((item: any) => ({
        id: item.job_id,
        title: item.title,
        company: item.company_display_name || item.company_name || '',
        sentCount: Number(item.total_offers || 0),
        acceptedCount: Number(item.accepted_count || 0),
        pendingCount: Number(item.pending_count || 0),
        declinedCount: Number(item.declined_count || 0),
        // Pass original job details for details page
        job_type: item.job_type || 'Full time',
        work_mode: item.work_mode || 'Remote',
        location: item.location || 'Remote',
        experience_level: item.experience_level || '0-2Yrs',
        salary_min: item.salary_min,
        salary_max: item.salary_max,
        salary_currency: item.salary_currency || 'USD',
        salary_period: item.salary_period || 'YEARLY'
      }));
      setSentOffers(mapped);
    } catch (error) {
      console.error('Failed to fetch sent offers:', error);
    } finally {
      if (!silent) {
        setIsLoadingOffers(false);
      }
      isFirstLoadOffersRef.current = false;
    }
  }, [activeProfile, userCompanies]);

  useEffect(() => {
    fetchSentOffers();
  }, [fetchSentOffers, refreshTrigger]);

  useEffect(() => {
    const handleFocus = () => {
      fetchSentOffers(true);
    };
    const handleVisibility = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        fetchSentOffers(true);
      }
    };
    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibility);
    const interval = setInterval(() => fetchSentOffers(true), 5000);

    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibility);
      clearInterval(interval);
    };
  }, [fetchSentOffers]);

  useEffect(() => {
    if (!socket) return;
    const handleNotification = (data: Record<string, unknown>) => {
      if (
        data?.type === 'job_offer_declined' ||
        data?.type === 'offer_accepted' ||
        data?.type === 'job_offer'
      ) {
        fetchSentOffers(true);
      }
    };
    socket.on('notification', handleNotification);
    return () => {
      socket.off('notification', handleNotification);
    };
  }, [socket, fetchSentOffers]);

  useEffect(() => {
    if (initialOfferJobId) {
      setIsSendOpen(true);
    }
  }, [initialOfferJobId]);

  const handleSelectGroup = (group: SentOfferGroup) => {
    if (onSelectOfferGroup) {
      onSelectOfferGroup(group);
    }
  };


  return (
    <div className="w-full max-w-[800px] flex flex-col gap-4 font-dm-sans animate-in fade-in duration-300">
      {/* Header Row */}
      {sentOffers.length > 0 && (
        <div className="w-full flex flex-col items-start gap-1">
          <h3 className="text-ds-text-primary text-base font-medium font-dm-sans leading-6">
            Sent offers
          </h3>
          <span className="text-ds-text-secondary text-xs font-normal font-dm-sans leading-4">
            Total offers - {sentOffers.length}
          </span>
        </div>
      )}

      {/* Job Cards list */}
      <div className="w-full flex flex-col gap-2">
        {isLoadingOffers ? (
          <div className="flex justify-center py-8">
            <Icon icon="lucide:loader-2" className="size-6 animate-spin text-ds-accent" />
          </div>
        ) : sentOffers.length === 0 ? (
          <div className="w-full max-w-[800px] h-[538px] flex flex-col justify-center items-center gap-4 select-none animate-in fade-in duration-200">
            {/* IconFrame: 64x64px, padding 12px, bg #1A1A20 (--ds-surface-1), rounded-full */}
            <div className="w-16 h-16 p-3 bg-ds-surface-1 rounded-full flex items-center justify-center shrink-0">
              <OfferIcon size={40} className="w-10 h-10 text-ds-text-muted shrink-0" fill="currentColor" />
            </div>

            {/* Text Container */}
            <div className="flex flex-col justify-start items-center gap-2 text-center">
              <h3 className="text-ds-text-primary text-base font-semibold font-dm-sans leading-6">
                No offers sent yet
              </h3>
              <p className="w-80 max-w-full text-ds-text-secondary text-sm font-normal font-dm-sans leading-5">
                Start reaching out to qualified candidates and manage offer responses from your dashboard.
              </p>
            </div>

            {/* Action Button */}
            <FeatureDisabledTooltip
              featureKey="enableJobOffers"
              disabledMessage="Sending job offers is temporarily disabled by admin."
            >
              <button
                onClick={() => onOpenSendOfferModal ? onOpenSendOfferModal() : setIsSendOpen(true)}
                type="button"
                className="w-[260px] h-9 px-3 py-1.5 bg-ds-accent hover:opacity-90 active:scale-95 text-ds-text-primary rounded-[100px] inline-flex justify-center items-center gap-2.5 ds-text-body-1 font-medium font-dm-sans text-base leading-6 transition-all shadow-sm cursor-pointer border-none outline-none focus-visible:ring-2 focus-visible:ring-ds-accent"
              >
                Send offer
              </button>
            </FeatureDisabledTooltip>
          </div>
        ) : (
          sentOffers.map((item, index) => (
            <div
              key={`${item.id}-${index}`}
              role="button"
              tabIndex={0}
              aria-label={`Sent offer details for ${item.title}`}
              onClick={() => handleSelectGroup(item)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleSelectGroup(item);
                }
              }}
              className="w-full max-w-[800px] min-h-[129px] py-3 pr-3 border-b border-ds-border flex flex-col justify-center items-start cursor-pointer select-none transition-colors hover:bg-ds-surface-1/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ds-accent rounded-xl"
            >
              {/* Top Row: Title + Company */}
              <div className="w-full py-1 flex flex-col justify-center items-start gap-1 self-stretch min-w-0">
                <span className="text-ds-text-primary text-base font-medium font-dm-sans leading-6 line-clamp-1 truncate w-full">
                  {item.title}
                </span>
                <span className="text-ds-text-secondary text-sm font-normal font-dm-sans leading-5 truncate w-full">
                  {item.company}
                </span>
              </div>

              {/* Bottom Row: 4 Equal Metric Columns (Responsive CSS Grid) */}
              <div className="w-full grid grid-cols-4 gap-2 sm:gap-3 py-2 self-stretch min-w-0">
                {/* Sent candidates */}
                <div className="flex flex-col justify-center items-start gap-1 min-w-0">
                  <span className="text-ds-text-primary text-sm font-semibold font-dm-sans leading-5">
                    {item.sentCount}
                  </span>
                  <span className="text-ds-text-secondary text-xs font-normal font-dm-sans leading-4 sm:whitespace-nowrap truncate sm:overflow-visible">
                    Sent candidates
                  </span>
                </div>

                {/* Accepted */}
                <div className="flex flex-col justify-center items-start gap-1 min-w-0">
                  <span className="text-ds-text-primary text-sm font-semibold font-dm-sans leading-5">
                    {item.acceptedCount}
                  </span>
                  <span className="text-ds-text-secondary text-xs font-normal font-dm-sans leading-4 sm:whitespace-nowrap truncate sm:overflow-visible">
                    Accepted
                  </span>
                </div>

                {/* Pending */}
                <div className="flex flex-col justify-center items-start gap-1 min-w-0">
                  <span className="text-ds-text-primary text-sm font-semibold font-dm-sans leading-5">
                    {item.pendingCount}
                  </span>
                  <span className="text-ds-text-secondary text-xs font-normal font-dm-sans leading-4 sm:whitespace-nowrap truncate sm:overflow-visible">
                    Pending
                  </span>
                </div>

                {/* Declined */}
                <div className="flex flex-col justify-center items-start gap-1 min-w-0">
                  <span className="text-ds-text-primary text-sm font-semibold font-dm-sans leading-5">
                    {item.declinedCount}
                  </span>
                  <span className="text-ds-text-secondary text-xs font-normal font-dm-sans leading-4 sm:whitespace-nowrap truncate sm:overflow-visible">
                    Declined
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <SendOfferModal
        isOpen={isSendOpen}
        onClose={() => {
          setIsSendOpen(false);
          if (onClearInitialOfferJobId) {
            onClearInitialOfferJobId();
          }
        }}
        activeListings={activeListings}
        onOfferSent={fetchSentOffers}
        initialJobId={initialOfferJobId === 'OPEN_ONLY' ? undefined : initialOfferJobId}
      />
    </div>
  );
};

export default SendOfferTab;
