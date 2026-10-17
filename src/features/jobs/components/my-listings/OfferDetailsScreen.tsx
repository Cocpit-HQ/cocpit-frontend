import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Icon } from '@iconify/react';
import WithdrawOfferModal from './WithdrawOfferModal';
import { toast } from 'sonner';
import api from '@/lib/axios';
import { useActiveProfile } from '@/context/ActiveProfileContext';
import { useCompanyPermissions } from '@/features/businessProfile';
import { formatSalaryRange, getCurrencyIcon } from '../../utils/currency.utils';

interface OfferDetailsScreenProps {
  offerGroup: {
    id: string;
    title: string;
    company: string;
    sentCount: number;
    acceptedCount: number;
    pendingCount: number;
    declinedCount: number;
    job_type?: string;
    work_mode?: string;
    location?: string;
    experience_level?: string;
    salary_min?: number;
    salary_max?: number;
    salary_currency?: string;
    salary_period?: string;
  };
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
  orgId?: string; // org_id of the company that sent the offer (null for personal offers)
}

export const OfferDetailsScreen: React.FC<OfferDetailsScreenProps> = ({
  offerGroup,
  onBack,
  onViewListingDetails,
}) => {
  const router = useRouter();
  const [candidates, setCandidates] = useState<OfferCandidate[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCandId, setSelectedCandId] = useState<string | null>(null);
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
  const { activeProfile } = useActiveProfile();
  const isCompanyMode = activeProfile?.type === 'COMPANY';
  const companyPermissions = useCompanyPermissions({ viewer_role_data: activeProfile?.viewer_role_data });
  const canJobsChat = !isCompanyMode || companyPermissions.canJobsChat;
  const [expandedNotes, setExpandedNotes] = useState<Record<string, boolean>>({});

  const toggleNoteExpanded = (candidateId: string) => {
    setExpandedNotes((prev) => ({
      ...prev,
      [candidateId]: !prev[candidateId],
    }));
  };

  const getCompanyId = useCallback(() => {
    if (activeProfile && activeProfile.type === 'COMPANY') {
      return activeProfile.id;
    }
    return '';
  }, [activeProfile]);

  const fetchRecipients = useCallback(async () => {
    const companyId = getCompanyId();
    if (!offerGroup.id) return;
    setIsLoading(true);
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
      setIsLoading(false);
    }
  }, [offerGroup.id, getCompanyId]);

  useEffect(() => {
    fetchRecipients();
  }, [fetchRecipients]);

  const handleWithdrawClick = (candId: string) => {
    setSelectedCandId(candId);
    setIsWithdrawOpen(true);
  };

  const handleConfirmWithdraw = async () => {
    if (!selectedCandId) return;

    // Find the candidate to get the orgId from the offer itself — more reliable
    // than relying on the currently active profile, which may have switched.
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

  const activeCandidates = candidates;

  // Removed common note logic to support per-candidate notes instead


  return (
    <div className={`w-full max-w-[960px] mx-auto bg-white ${isCompanyMode ? 'dark:bg-[#0F1115]' : 'dark:bg-[#0B0F19]'} md:dark:bg-white flex flex-col justify-start items-start md:items-center gap-[16px] overflow-x-hidden animate-in fade-in duration-300 px-4 md:px-0`}>

      {/* Header Row (Frame 2608623) */}
      <div className="w-full h-[48px] self-stretch flex flex-row items-center p-0 gap-[16px] mt-4 md:mt-0">
        <button
          onClick={onBack}
          type="button"
          className={`w-12 h-12 box-border p-2 rounded-[100px] border border-[#DADADA] ${isCompanyMode ? 'dark:border-[#2A2D35]' : 'dark:border-[#2E3445]'} md:dark:border-[#DADADA] backdrop-blur-[12px] flex flex-row justify-center items-center gap-2.5 hover:bg-slate-50 ${isCompanyMode ? 'dark:hover:bg-[#121B2B]' : 'dark:hover:bg-[#1C2340]'} md:dark:hover:bg-slate-50 transition-colors active:scale-95 text-gray-500 shadow-sm`}
        >
          <Icon icon="lucide:chevron-left" className="w-6 h-6 text-gray-500" />
        </button>
        <div className="flex flex-col items-start p-0 gap-0">
          <div className={`text-left text-[#000000] ${isCompanyMode ? 'dark:text-[#FFFFFF]' : 'dark:text-[#F9FAFB]'} md:dark:text-[#000000] text-[18px] font-medium font-['Poppins'] leading-[26px]`}>Offer details</div>
          <div className="text-left text-[#6B7280] hidden md:block text-[12px] font-normal font-['Poppins'] leading-[16px]">View, and manage this listing</div>
          <div className={`text-left text-[#6B7280] ${isCompanyMode ? 'dark:text-[#A1A8B3]' : 'dark:text-[#9CA3AF]'} block md:hidden text-[12px] font-normal font-['Poppins'] leading-[16px]`}>View the offer details and status.</div>
        </div>
      </div>

      {/* Desktop Horizontal Stats Bar */}
      <div className={`hidden md:flex box-border flex-row justify-between items-center p-[16px_0px_24px] gap-[12px] w-full h-[100px] border-b border-[#EEF2FF] ${isCompanyMode ? 'dark:border-[#2A2D35]' : 'dark:border-[#2E3445]'} flex-none self-stretch grow-0`}>

        {/* Role details */}
        <div className="flex flex-col items-start p-0 gap-[4px] flex-1">
          <span className={`w-full font-['Poppins'] font-medium text-[16px] leading-[24px] text-black ${isCompanyMode ? 'dark:text-[#FFFFFF]' : 'dark:text-[#F9FAFB]'} truncate capitalize`}>
            {offerGroup.title}
          </span>
          <span className={`w-full font-['Poppins'] font-normal text-[14px] leading-[20px] text-[#6B7280] ${isCompanyMode ? 'dark:text-[#A1A8B3]' : 'dark:text-[#9CA3AF]'} truncate`}>
            {offerGroup.company}
          </span>
        </div>

        {/* Sent candidates */}
        <div className="flex flex-col justify-center items-start p-[8px_16px] gap-[4px] flex-1">
          <span className={`font-['Poppins'] font-semibold text-[14px] leading-[20px] text-center text-black ${isCompanyMode ? 'dark:text-[#FFFFFF]' : 'dark:text-[#F9FAFB]'}`}>
            {offerGroup.sentCount}
          </span>
          <span className={`font-['Poppins'] font-normal text-[12px] leading-[16px] text-center text-[#6B7280] ${isCompanyMode ? 'dark:text-[#A1A8B3]' : 'dark:text-[#9CA3AF]'}`}>
            Sent candidates
          </span>
        </div>

        {/* Accepted */}
        <div className="flex flex-col justify-center items-start p-[8px_16px] gap-[4px] flex-1">
          <span className={`font-['Poppins'] font-semibold text-[14px] leading-[20px] text-center text-black ${isCompanyMode ? 'dark:text-[#FFFFFF]' : 'dark:text-[#F9FAFB]'}`}>
            {offerGroup.acceptedCount}
          </span>
          <span className={`font-['Poppins'] font-normal text-[12px] leading-[16px] text-center text-[#6B7280] ${isCompanyMode ? 'dark:text-[#A1A8B3]' : 'dark:text-[#9CA3AF]'}`}>
            Accepted
          </span>
        </div>

        {/* Pending */}
        <div className="flex flex-col justify-center items-start p-[8px_16px] gap-[4px] flex-1">
          <span className={`font-['Poppins'] font-semibold text-[14px] leading-[20px] text-center text-black ${isCompanyMode ? 'dark:text-[#FFFFFF]' : 'dark:text-[#F9FAFB]'}`}>
            {offerGroup.pendingCount}
          </span>
          <span className={`font-['Poppins'] font-normal text-[12px] leading-[16px] text-center text-[#6B7280] ${isCompanyMode ? 'dark:text-[#A1A8B3]' : 'dark:text-[#9CA3AF]'}`}>
            Pending
          </span>
        </div>

        {/* Declined */}
        <div className="flex flex-col justify-center items-start p-[8px_16px] gap-[4px] flex-1">
          <span className={`font-['Poppins'] font-semibold text-[14px] leading-[20px] text-center text-black ${isCompanyMode ? 'dark:text-[#FFFFFF]' : 'dark:text-[#F9FAFB]'}`}>
            {offerGroup.declinedCount}
          </span>
          <span className={`font-['Poppins'] font-normal text-[12px] leading-[16px] text-center text-[#6B7280] ${isCompanyMode ? 'dark:text-[#A1A8B3]' : 'dark:text-[#9CA3AF]'}`}>
            Declined
          </span>
        </div>

        {/* View job details link */}
        <div className="flex flex-row justify-end items-center p-[8px_0px] gap-[10px] w-[110px] flex-none">
          <button
            onClick={onViewListingDetails}
            className={`font-['Poppins'] font-normal text-[14px] leading-[20px] text-right ${isCompanyMode ? 'text-[#1A73E8] dark:text-[#4D9CFF]' : 'text-[#818CF8] dark:text-[#818CF8]'} hover:underline`}
          >
            View job details
          </button>
        </div>
      </div>

      {/* Mobile Job Info Card */}
      <div className={`flex md:hidden flex-col w-full bg-white ${isCompanyMode ? 'dark:bg-[#0F1115] dark:border-[#2A2D35]' : 'dark:bg-[#0B0F19] dark:border-[#2E3445]'} rounded-[24px] shadow-sm border border-[#EEF2FF] p-5 gap-4`}>
        {/* Title & Logo */}
        <div className="flex flex-row items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-black shrink-0 overflow-hidden relative flex items-center justify-center text-white">
            <Icon icon="lucide:infinity" className="w-8 h-8 text-white" />
          </div>
          <div className="flex-1 flex flex-col justify-center min-w-0">
            <span className={`font-['Poppins'] font-semibold text-[18px] leading-[26px] text-black ${isCompanyMode ? 'dark:text-[#FFFFFF]' : 'dark:text-[#F9FAFB]'} capitalize truncate w-full`}>
              {offerGroup.title}
            </span>
            <span className={`font-['Poppins'] font-normal text-[14px] leading-[20px] text-gray-500 ${isCompanyMode ? 'dark:text-[#A1A8B3]' : 'dark:text-[#9CA3AF]'} truncate w-full`}>
              {offerGroup.company}
            </span>
          </div>
        </div>

        {/* Stats Row */}
        <div className="flex flex-row items-center justify-between mt-2 px-1">
          <div className="flex flex-col items-start gap-1">
            <span className={`font-['Poppins'] font-bold text-[16px] leading-[24px] text-black ${isCompanyMode ? 'dark:text-[#FFFFFF]' : 'dark:text-[#F9FAFB]'}`}>
              {offerGroup.acceptedCount}
            </span>
            <span className={`font-['Poppins'] font-normal text-[12px] leading-[16px] text-gray-500 ${isCompanyMode ? 'dark:text-[#A1A8B3]' : 'dark:text-[#9CA3AF]'}`}>
              Accepted
            </span>
          </div>
          <div className="flex flex-col items-start gap-1">
            <span className={`font-['Poppins'] font-bold text-[16px] leading-[24px] text-black ${isCompanyMode ? 'dark:text-[#FFFFFF]' : 'dark:text-[#F9FAFB]'}`}>
              {offerGroup.pendingCount}
            </span>
            <span className={`font-['Poppins'] font-normal text-[12px] leading-[16px] text-gray-500 ${isCompanyMode ? 'dark:text-[#A1A8B3]' : 'dark:text-[#9CA3AF]'}`}>
              Pending
            </span>
          </div>
          <div className="flex flex-col items-start gap-1">
            <span className={`font-['Poppins'] font-bold text-[16px] leading-[24px] text-black ${isCompanyMode ? 'dark:text-[#FFFFFF]' : 'dark:text-[#F9FAFB]'}`}>
              {offerGroup.declinedCount}
            </span>
            <span className={`font-['Poppins'] font-normal text-[12px] leading-[16px] text-gray-500 ${isCompanyMode ? 'dark:text-[#A1A8B3]' : 'dark:text-[#9CA3AF]'}`}>
              Declined
            </span>
          </div>
        </div>

        {/* View job details link */}
        <button
          type="button"
          onClick={onViewListingDetails}
          className={`w-full pt-5 pb-1 mt-1 border-t border-[#EEF2FF] ${isCompanyMode ? 'dark:border-[#2A2D35]' : 'dark:border-[#2E3445]'} font-['Poppins'] font-normal text-[14px] ${isCompanyMode ? 'text-[#1A73E8] dark:text-[#4D9CFF]' : 'text-indigo-500 dark:text-[#818CF8]'} cursor-pointer relative z-10 active:scale-95 transition-transform`}
        >
          View job details
        </button>
      </div>

      {/* Note section removed here to display per-candidate notes below */}

      {/* Candidates List Section (Frame 2609090) */}
      <div className="w-full flex flex-col items-start p-0 gap-[16px]">
        {/* Header Row (Frame 2608889) */}
        <div className="w-full md:w-[166px] h-[32px] flex flex-row items-center p-0 gap-[16px]">
          {/* Title */}
          <div className="w-auto md:w-[107px] h-[26px] py-[3px] flex items-center justify-center">
            <span className={`font-['Poppins'] font-semibold md:font-medium text-[20px] md:text-[18px] leading-[26px] text-center text-black ${isCompanyMode ? 'dark:text-[#FFFFFF]' : 'dark:text-[#F9FAFB]'}`}>
              Candidates
            </span>
          </div>
          {/* Count Badge Frame 2608517 */}
          <div className={`box-sizing: border-box w-[43px] h-[32px] bg-white dark:bg-transparent md:dark:bg-white border border-[#EEF2FF] ${isCompanyMode ? 'dark:border-[#2A2D35]' : 'dark:border-[#2E3445]'} md:dark:border-[#EEF2FF] rounded-[24px] flex flex-row justify-center items-center p-[8px_16px] gap-[10px]`}>
            <span className={`font-['Poppins'] font-medium md:font-normal text-[12px] leading-[16px] text-center ${isCompanyMode ? 'text-[#1A73E8] dark:text-[#4D9CFF] md:dark:text-[#1A73E8]' : 'text-[#6366F1] dark:text-[#818CF8] md:dark:text-[#6366F1]'}`}>
              {activeCandidates.length}
            </span>
          </div>
        </div>

        {/* Candidates list with gap 16px */}
        <div className="w-full flex flex-col gap-[24px] md:gap-[16px]">
          {activeCandidates.length === 0 ? (
            <div className="py-12 text-center text-gray-400 text-xs font-['Poppins'] bg-slate-50/50 rounded-2xl">
              All offers have been withdrawn.
            </div>
          ) : (
            activeCandidates.map((cand) => (
              /* Candidate card container containing details row and note */
              <div
                key={cand.id}
                className={`w-full bg-white ${isCompanyMode ? 'dark:bg-[#0F1115]' : 'dark:bg-[#0B0F19]'} md:dark:bg-transparent rounded-[12px] flex flex-col p-0 md:py-[8px] gap-[8px] overflow-hidden md:overflow-visible`}
              >
                {/* Candidate card Row Frame 2608732 */}
                <div className="w-full md:w-full h-auto md:h-[44px] flex flex-row justify-between items-center p-0 box-border">
                  {/* User Frame 2608774 */}
                  <div className="flex flex-row items-center md:items-start p-0 gap-[12px] md:gap-[8px] h-[48px] md:h-[44px]">
                    {/* User Avatar */}
                    <div className="relative w-[48px] h-[48px] md:w-[40px] md:h-[40px] rounded-full bg-[#EEF2FF] text-[#6366F1] flex items-center justify-center font-semibold text-sm flex-shrink-0 overflow-hidden font-['Poppins'] select-none">
                      <span>{(cand.name || 'C').charAt(0).toUpperCase()}</span>
                      {cand.avatar && cand.avatar !== '/assets/pngegg.png' ? (
                        <img
                          className="absolute inset-0 w-full h-full object-cover"
                          src={cand.avatar}
                          alt={cand.name}
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      ) : null}
                    </div>
                    {/* Text Frame 2609008 */}
                    <div className="flex flex-col justify-center items-start h-[44px]">
                      <span className={`font-['Poppins'] font-medium text-[16px] leading-[24px] text-black ${isCompanyMode ? 'dark:text-[#FFFFFF]' : 'dark:text-[#F9FAFB]'} md:dark:text-black text-left`}>
                        {cand.name}
                      </span>
                      <span className={`font-['Poppins'] font-normal text-[14px] leading-[20px] text-[#6B7280] ${isCompanyMode ? 'dark:text-[#A1A8B3]' : 'dark:text-[#9CA3AF]'} md:dark:text-[#6B7280] text-left max-w-[140px] md:max-w-none truncate`}>
                        {cand.role}{cand.companyName ? ` at ${cand.companyName}` : ''}
                      </span>
                    </div>
                  </div>

                  {/* Button Frame 2608617 */}
                  {cand.status === 'chat' && (
                    <button
                      onClick={() => {
                        if (!canJobsChat) return;
                        const params = new URLSearchParams();
                        params.set('userId', cand.userId);
                        const companyId = getCompanyId();
                        if (companyId) {
                          params.set('companyId', companyId);
                        }
                        params.set('offerContext', cand.id);
                        router.push(`/messaging?${params.toString()}`);
                      }}
                      disabled={!canJobsChat}
                      title={!canJobsChat ? "Permission required to chat with job candidates" : ""}
                      type="button"
                      className={`box-sizing: border-box w-[100px] md:w-[120px] h-[40px] ${!canJobsChat
                          ? 'opacity-50 cursor-default bg-gray-300 dark:bg-gray-700 text-gray-500'
                          : isCompanyMode
                            ? 'bg-[#1A73E8] dark:bg-[#4D9CFF] text-white dark:text-[#0F1115] hover:opacity-90 active:scale-95 cursor-pointer'
                            : 'bg-[#6366F1] dark:bg-[#818CF8] text-white dark:text-[#0B0F19] hover:opacity-90 active:scale-95 cursor-pointer'
                        } border border-white dark:border-transparent rounded-[24px] flex flex-row justify-center items-center p-[8px_16px] gap-[10px] transition-all`}
                    >
                      <span className="font-['Poppins'] font-normal text-[14px] leading-[20px] text-center">
                        Chat
                      </span>
                    </button>
                  )}
                  {cand.status === 'withdraw' && (
                    <button
                      onClick={() => handleWithdrawClick(cand.id)}
                      type="button"
                      className={`box-sizing: border-box w-[100px] md:w-[120px] h-[40px] border border-[#6B7280] rounded-[24px] flex flex-row justify-center items-center p-[8px_16px] gap-[10px] hover:bg-slate-50 transition-all active:scale-95 bg-white dark:bg-transparent md:dark:bg-white`}
                    >
                      <span className={`font-['Poppins'] font-normal text-[14px] leading-[20px] text-center text-[#6B7280] ${isCompanyMode ? 'dark:text-[#A1A8B3]' : 'dark:text-[#9CA3AF]'} md:dark:text-[#6B7280]`}>
                        Withdraw
                      </span>
                    </button>
                  )}
                  {cand.status === 'declined' && (
                    <div className={`box-sizing: border-box w-[100px] md:w-[120px] h-[40px] border border-red-200 dark:border-red-900/50 bg-red-50/50 ${isCompanyMode ? 'dark:bg-[#4A1C1C]' : 'dark:bg-[#4A1C1C]'} rounded-[24px] flex flex-row justify-center items-center p-[8px_16px] gap-[10px]`}>
                      <span className="font-['Poppins'] font-normal text-[14px] leading-[20px] text-center text-red-500 dark:text-[#F87171] font-semibold">
                        Declined
                      </span>
                    </div>
                  )}
                  {cand.status === 'withdrawn' && (
                    <div className={`box-sizing: border-box w-[100px] md:w-[120px] h-[40px] border border-gray-200 ${isCompanyMode ? 'dark:border-[#2A2D35] bg-gray-50 dark:bg-[#121B2B]' : 'dark:border-[#2E3445] bg-gray-50 dark:bg-[#1C2340]/40'} rounded-[24px] flex flex-row justify-center items-center p-[8px_16px] gap-[10px]`}>
                      <span className={`font-['Poppins'] font-normal text-[14px] leading-[20px] text-center text-gray-400 ${isCompanyMode ? 'dark:text-[#A1A8B3]' : 'dark:text-[#9CA3AF]'}`}>
                        Withdrawn
                      </span>
                    </div>
                  )}
                </div>

                {/* Expandable note bar */}
                {cand.note && (
                  <div className="w-full flex flex-col items-start transition-all duration-300 mt-4 md:mt-0 gap-[8px] px-0 md:px-0 md:pb-0">

                    {/* Note Label */}
                    <span className={`font-['Poppins'] font-semibold text-[16px] md:text-[18px] md:font-medium leading-[24px] md:leading-[26px] text-black ${isCompanyMode ? 'dark:text-[#FFFFFF]' : 'dark:text-[#F9FAFB]'} mb-0 md:mb-0 md:mt-0`}>
                      Note
                    </span>

                    {/* Always Open Note Box */}
                    <div className={`flex w-full flex-col gap-2 rounded-[16px] md:rounded-[0px_16px_16px_16px] border-l-[3px] md:border-l-[2px] ${isCompanyMode ? 'border-[#1A73E8] bg-blue-50 dark:bg-[#121B2B]' : 'border-[#6366F1] bg-[#F9FAFF] dark:bg-[#1C2340]/40'} p-4 md:p-[12px_16px]`}>
                      <div className="flex flex-row justify-start items-center gap-[8px] w-full">
                        <div className={`w-[32px] h-[32px] md:w-[40px] md:h-[40px] rounded-full ${isCompanyMode ? 'bg-blue-100 dark:bg-[#16365F] text-[#1A73E8] dark:text-[#4D9CFF] border-blue-50 dark:border-[#2A2D35]' : 'bg-indigo-100 dark:bg-[#1C2340] text-indigo-500 dark:text-[#818CF8] border-slate-100 dark:border-[#2E3445]'} flex items-center justify-center font-semibold font-['Poppins'] text-xs border`}>
                          {cand.sentByName ? cand.sentByName.substring(0, 2).toUpperCase() : 'RC'}
                        </div>
                        <div className="flex flex-col justify-center items-start">
                          <span className={`font-['Poppins'] font-medium md:font-normal text-[12px] leading-[16px] ${isCompanyMode ? 'text-[#1A73E8] dark:text-[#4D9CFF]' : 'text-[#6366F1] dark:text-[#818CF8]'} tracking-wide md:tracking-normal`}>
                            {cand.sentByName || 'RECRUITER'}
                          </span>
                          {cand.sentByHeadline && (
                            <span className={`font-['Poppins'] font-normal text-[10px] md:text-[12px] leading-[14px] md:leading-[16px] ${isCompanyMode ? 'text-blue-400 dark:text-[#82B8FF]' : 'text-indigo-400 md:text-[#6366F1] dark:text-[#5B66D6]'} tracking-normal`}>
                              {cand.sentByHeadline}
                            </span>
                          )}
                        </div>
                      </div>
                      <p className={`font-['Poppins'] font-normal text-[14px] md:text-[12px] leading-[22px] md:leading-[16px] text-gray-500 md:text-[#6B7280] ${isCompanyMode ? 'dark:text-[#A1A8B3]' : 'dark:text-gray-400'} whitespace-pre-line mt-1 md:mt-0`}>
                        "{cand.note}"
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
    </div>
  );
};

export default OfferDetailsScreen;
