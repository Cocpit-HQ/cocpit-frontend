import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Icon } from '@iconify/react';
import { LeftArrowIcon } from '@/components/icons';
import WithdrawOfferModal from './WithdrawOfferModal';
import { toast } from 'sonner';
import api from '@/lib/axios';
import { useActiveProfile } from '@/context/ActiveProfileContext';
import { useCompanyPermissions } from '@/features/businessProfile';
import { JobListing } from '../../types/jobs.types';
import Avatar from '@/components/shared/Avatar';
import { useSocket } from '@/context/SocketContext';
import { useJobStore } from '@/store/job.store';

interface OfferDetailsScreenProps {
  offerGroup: {
    id: string;
    title: string;
    company: string;
    sentCount: number;
    acceptedCount: number;
    pendingCount: number;
    declinedCount: number;
    applicationsCount?: number;
    shortlistedCount?: number;
    job_type?: string;
    work_mode?: string;
    location?: string;
    experience_level?: string;
    salary_min?: number;
    salary_max?: number;
    salary_currency?: string;
    salary_period?: string;
  };
  matchingListing?: JobListing;
  refreshTrigger?: number;
  onBack: () => void;
  onViewListingDetails: () => void;
}

interface OfferCandidate {
  id: string;
  userId: string;
  name: string;
  role: string;
  companyName: string;
  avatar: string;
  status: 'chat' | 'withdraw' | 'declined' | 'withdrawn';
  note?: string;
  sentByName?: string;
  sentByHeadline?: string;
  orgId?: string;
}

export const OfferDetailsScreen: React.FC<OfferDetailsScreenProps> = ({
  offerGroup,
  matchingListing,
  refreshTrigger,
  onBack,
  onViewListingDetails,
}) => {
  const router = useRouter();
  const applicationsCount = matchingListing?.applicants_count ?? offerGroup.applicationsCount ?? 0;
  const shortlistedCount = matchingListing?.shortlisted_count ?? offerGroup.shortlistedCount ?? offerGroup.acceptedCount ?? 0;
  const offersSentCount = offerGroup.sentCount ?? matchingListing?.offers_count ?? 0;
  const postedDisplay = matchingListing?.posted_at ? `Posted ${matchingListing.posted_at}` : (offerGroup.company || 'Posted recently');
  const [candidates, setCandidates] = useState<OfferCandidate[]>([]);
  const isFirstLoadRef = useRef(true);
  const respondedOffers = useJobStore((state) => state.respondedOffers);
  const { socket } = useSocket();

  const displayCandidates = React.useMemo(() => {
    return candidates.map((cand) => {
      const localResp = respondedOffers ? (respondedOffers[cand.id] || (cand.userId ? respondedOffers[cand.userId] : undefined)) : undefined;
      if (localResp) {
        return {
          ...cand,
          status: (localResp === 'decline' ? 'declined' : 'chat') as OfferCandidate['status'],
        };
      }
      return cand;
    });
  }, [candidates, respondedOffers]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCandId, setSelectedCandId] = useState<string | null>(null);
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
  const { activeProfile } = useActiveProfile();
  const isCompanyMode = activeProfile?.type === 'COMPANY';
  const companyPermissions = useCompanyPermissions({ viewer_role_data: activeProfile?.viewer_role_data });
  const canJobsChat = !isCompanyMode || companyPermissions.canJobsChat;

  const getCompanyId = useCallback(() => {
    if (activeProfile && activeProfile.type === 'COMPANY') {
      return activeProfile.id;
    }
    return '';
  }, [activeProfile]);

  const fetchRecipients = useCallback(async (silent = false) => {
    const companyId = getCompanyId();
    if (!offerGroup.id) return;
    if (!silent && isFirstLoadRef.current) {
      setIsLoading(true);
    }
    try {
      const endpoint = companyId
        ? `/jobs/companies/${companyId}/offers/job/${offerGroup.id}/recipients`
        : `/jobs/offers/job/${offerGroup.id}/recipients`;
      const response = await api.get(endpoint);
      const mapped: OfferCandidate[] = (response.data || []).map((item: any) => ({
        id: item.offer_id,
        userId: item.user_id,
        name: item.full_name || 'Anonymous User',
        role: item.headline || 'Candidate',
        companyName: item.candidate_company_name || '',
        avatar: item.avatar_url || '',
        status: item.status === 'accepted' ? 'chat' : (item.status === 'pending' ? 'withdraw' : (item.status === 'declined' ? 'declined' : 'withdrawn')),
        note: item.message || undefined,
        sentByName: item.sent_by_name,
        sentByHeadline: item.sent_by_headline || undefined,
        orgId: item.org_id || undefined,
      }));
      setCandidates(mapped);
    } catch (error) {
      console.error('Failed to fetch offer recipients:', error);
    } finally {
      if (!silent) {
        setIsLoading(false);
      }
      isFirstLoadRef.current = false;
    }
  }, [offerGroup.id, getCompanyId]);

  useEffect(() => {
    fetchRecipients();
  }, [fetchRecipients, refreshTrigger]);

  useEffect(() => {
    const handleFocus = () => {
      fetchRecipients(true);
    };
    const handleVisibility = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        fetchRecipients(true);
      }
    };
    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibility);
    const interval = setInterval(() => fetchRecipients(true), 4000);

    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibility);
      clearInterval(interval);
    };
  }, [fetchRecipients]);

  useEffect(() => {
    if (!socket) return;
    const handleNotification = (data: Record<string, unknown>) => {
      if (
        data?.type === 'job_offer_declined' ||
        data?.type === 'offer_accepted' ||
        data?.type === 'job_offer'
      ) {
        fetchRecipients(true);
      }
    };
    socket.on('notification', handleNotification);
    return () => {
      socket.off('notification', handleNotification);
    };
  }, [socket, fetchRecipients]);

  const handleWithdrawClick = (candId: string) => {
    setSelectedCandId(candId);
    setIsWithdrawOpen(true);
  };

  const handleConfirmWithdraw = async () => {
    if (!selectedCandId) return;

    const candidate = candidates.find((c) => c.id === selectedCandId);
    const orgId = candidate?.orgId || getCompanyId();

    try {
      const endpoint = orgId
        ? `/jobs/companies/${orgId}/offers/${selectedCandId}`
        : `/jobs/offers/${selectedCandId}`;
      await api.delete(endpoint);
      setCandidates((prev) =>
        prev.map((c) => (c.id === selectedCandId ? { ...c, status: 'withdrawn' } : c))
      );
      toast.success('Offer withdrawn successfully.');
    } catch (error: any) {
      console.error('Failed to withdraw offer:', error);
      const errMsg = error.response?.data?.message || 'Failed to withdraw offer.';
      toast.error(errMsg);
    } finally {
      setIsWithdrawOpen(false);
      setSelectedCandId(null);
    }
  };

  return (
    <>
      {/* Fixed top-left Back button matching design system */}
      <button
        type="button"
        onClick={onBack}
        aria-label="Back"
        className="fixed top-[40px] left-[40px] z-[60] inline-flex items-center gap-2 p-0 text-ds-text-primary cursor-pointer bg-transparent border-none outline-none focus-visible:ring-2 focus-visible:ring-ds-accent"
      >
        <LeftArrowIcon size={20} className="size-5 text-ds-text-primary shrink-0" />
        <span className="font-dm-sans font-medium text-base leading-6">Back</span>
      </button>

      <div className="w-full max-w-[800px] mx-auto flex flex-col gap-5 font-dm-sans animate-in fade-in duration-300 px-4 sm:px-0">
        {/* Page Title & Subtitle */}
        <div className="w-full flex flex-col items-start gap-1">
          <h2 className="text-ds-text-primary text-base font-normal font-dm-sans leading-6">
            Offer details
          </h2>
          <p className="text-ds-text-secondary text-xs font-normal font-dm-sans leading-4">
            View the offer details and status.
          </p>
        </div>

        {/* Job Summary Banner Row with Divider */}
        <div className="w-full pr-3 border-b border-ds-border pb-3 flex flex-col justify-center items-start gap-2">
          {/* Top Row: Frame 2609981 (Job Title + Posted time / Company) */}
          <div className="w-full min-h-[68px] py-2 flex flex-row items-center gap-4 self-stretch min-w-0">
            {/* Frame 2609064 */}
            <div className="flex-1 w-full min-h-[52px] flex flex-col justify-center items-start gap-2 self-stretch min-w-0">
              <span className="text-ds-text-primary text-base font-medium font-dm-sans leading-6 h-6 flex items-center line-clamp-1 truncate w-full">
                {offerGroup.title}
              </span>
              <span className="text-ds-text-secondary text-sm font-normal font-dm-sans leading-5 h-5 flex items-center truncate w-full">
                {postedDisplay}
              </span>
            </div>
          </div>

          {/* Bottom Row: Frame 2609982 (3 Metric Columns on Left + View job details Button on Right) */}
          <div className="w-full h-auto sm:h-[60px] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 self-stretch">
            {/* Frame 2609980: 3 Metric Columns */}
            <div className="w-full sm:flex-1 h-auto sm:h-[60px] flex flex-row items-center gap-3">
              {/* Frame 2608617: Applications */}
              <div className="flex-1 sm:w-[203px] h-[60px] py-2 rounded-3xl flex flex-col justify-center items-start gap-2 min-w-0">
                <span className="text-ds-text-primary text-sm font-semibold font-dm-sans leading-5">
                  {applicationsCount}
                </span>
                <span className="text-ds-text-secondary text-xs font-normal font-dm-sans leading-4 whitespace-nowrap">
                  Applications
                </span>
              </div>

              {/* Frame 2609065: Shortlisted */}
              <div className="flex-1 sm:w-[203px] h-[60px] py-2 rounded-3xl flex flex-col justify-center items-start gap-2 min-w-0">
                <span className="text-ds-text-primary text-sm font-semibold font-dm-sans leading-5">
                  {shortlistedCount}
                </span>
                <span className="text-ds-text-secondary text-xs font-normal font-dm-sans leading-4 whitespace-nowrap">
                  Shortlisted
                </span>
              </div>

              {/* Frame 2609240: Offer sent */}
              <div className="flex-1 sm:w-[203px] h-[60px] py-2 rounded-3xl flex flex-col justify-center items-start gap-2 min-w-0">
                <span className="text-ds-text-primary text-sm font-semibold font-dm-sans leading-5">
                  {offersSentCount}
                </span>
                <span className="text-ds-text-secondary text-xs font-normal font-dm-sans leading-4 whitespace-nowrap">
                  Offer sent
                </span>
              </div>
            </div>

            {/* secondary button: View job details */}
            <button
              type="button"
              onClick={onViewListingDetails}
              className="w-auto sm:w-[143px] h-9 px-3 py-1.5 rounded-full border border-ds-border text-ds-text-primary transition-all active:scale-95 text-base font-medium font-dm-sans leading-6 flex items-center justify-center gap-2.5 whitespace-nowrap cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ds-accent shrink-0"
            >
              <span className="whitespace-nowrap">View job details</span>
            </button>
          </div>
        </div>

        {/* Candidates Section */}
        <div className="w-full flex flex-col justify-start items-start gap-4">
          <div className="text-ds-text-primary text-base font-normal font-dm-sans leading-6">
            Candidates
          </div>

          {isLoading ? (
            <div className="w-full flex justify-center py-12">
              <Icon icon="lucide:loader-2" className="size-6 animate-spin text-ds-accent" />
            </div>
          ) : displayCandidates.length === 0 ? (
            <div className="w-full py-16 flex flex-col justify-center items-center gap-3 bg-ds-surface-1 rounded-2xl border border-ds-border font-dm-sans">
              <div className="size-12 rounded-full bg-ds-surface-2 border border-ds-border flex items-center justify-center text-ds-accent">
                <Icon icon="solar:users-group-two-rounded-linear" className="size-6" />
              </div>
              <div className="flex flex-col justify-start items-center gap-1 max-w-sm px-4 text-center">
                <h4 className="text-ds-text-primary text-base font-medium font-dm-sans">
                  No offers active
                </h4>
                <p className="text-ds-text-secondary text-xs font-normal font-dm-sans">
                  All candidate offers for this listing have been withdrawn or completed.
                </p>
              </div>
            </div>
          ) : (
            displayCandidates.map((cand) => (
              <div key={cand.id} className="w-full flex flex-col justify-center items-start gap-3">
                {/* Candidate Row */}
                <div className="w-full py-2 flex flex-row justify-between items-center gap-3">
                  {/* Left: Avatar + Name & Headline */}
                  <div className="flex flex-row items-center gap-3 min-w-0">
                    <Avatar
                      src={cand.avatar}
                      name={cand.name}
                      isCompany={false}
                      className="size-8"
                    />
                    <div className="flex flex-col justify-center items-start min-w-0">
                      <span className="text-ds-text-primary text-base font-medium font-dm-sans leading-6 truncate">
                        {cand.name}
                      </span>
                      <span className="text-ds-text-secondary text-xs font-normal font-dm-sans leading-4 truncate">
                        {cand.role}{cand.companyName ? ` at ${cand.companyName}` : ''}
                      </span>
                    </div>
                  </div>

                  {/* Right: Action Buttons */}
                  <div className="shrink-0 flex items-center justify-end">
                    {cand.status === 'chat' && (
                      <button
                        type="button"
                        onClick={() => {
                          if (!canJobsChat) return;
                          const params = new URLSearchParams();
                          params.set('userId', cand.userId);
                          const companyId = getCompanyId();
                          if (companyId) params.set('companyId', companyId);
                          params.set('offerContext', cand.id);
                          router.push(`/messaging?${params.toString()}`);
                        }}
                        disabled={!canJobsChat}
                        title={!canJobsChat ? "Permission required to chat with job candidates" : ""}
                        className={`w-[98px] h-9 px-3 py-1.5 rounded-full text-ds-text-primary text-base font-medium font-dm-sans leading-6 flex items-center justify-center gap-2.5 whitespace-nowrap transition-all active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ds-accent cursor-pointer ${
                          !canJobsChat ? 'opacity-50 cursor-not-allowed bg-ds-surface-2' : 'bg-ds-accent'
                        }`}
                      >
                        Chat
                      </button>
                    )}

                    {cand.status === 'withdraw' && (
                      <button
                        type="button"
                        onClick={() => handleWithdrawClick(cand.id)}
                        className="w-[98px] h-9 px-3 py-1.5 rounded-full border border-ds-border text-ds-text-primary transition-all active:scale-95 text-base font-medium font-dm-sans leading-6 flex items-center justify-center gap-2.5 whitespace-nowrap cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ds-accent"
                      >
                        Withdraw
                      </button>
                    )}

                    {cand.status === 'declined' && (
                      <div className="w-[98px] h-9 px-3 py-1.5 rounded-full border border-ds-error/30 bg-ds-error/10 text-ds-error text-base font-medium font-dm-sans leading-6 flex items-center justify-center whitespace-nowrap select-none">
                        Declined
                      </div>
                    )}

                    {cand.status === 'withdrawn' && (
                      <span className="text-ds-text-secondary text-base font-normal font-dm-sans leading-6 select-none">
                        Withdrawn
                      </span>
                    )}
                  </div>
                </div>

                {/* Note Bubble (if note is present) */}
                {cand.note && (
                  <div className="w-full flex flex-col justify-start items-start gap-1">
                    <span className="text-ds-text-primary text-base font-medium font-dm-sans leading-6">
                      Note
                    </span>
                    <div className="w-full p-3 bg-ds-surface-1 rounded-tr-2xl rounded-bl-2xl rounded-br-2xl border-l-2 border-ds-accent flex flex-col justify-start items-start gap-2">
                      <div className="flex flex-row items-center gap-2">
                        <Avatar
                          src={null}
                          name={cand.sentByName}
                          isCompany={Boolean(cand.orgId)}
                          className="size-8"
                        />
                        <div className="flex flex-col justify-center items-start">
                          <span className="text-ds-text-primary text-base font-semibold font-dm-sans leading-6">
                            {cand.sentByName || 'Recruiter'}
                          </span>
                          {cand.sentByHeadline && (
                            <span className="text-ds-text-secondary text-[10px] font-normal font-dm-sans leading-3">
                              {cand.sentByHeadline}
                            </span>
                          )}
                        </div>
                      </div>
                      <p className="text-ds-text-secondary text-xs font-normal font-dm-sans leading-4 whitespace-pre-line">
                        {cand.note}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Withdraw Modal Popup */}
      <WithdrawOfferModal
        isOpen={isWithdrawOpen}
        onClose={() => setIsWithdrawOpen(false)}
        onConfirm={handleConfirmWithdraw}
      />
    </>
  );
};

export default OfferDetailsScreen;
