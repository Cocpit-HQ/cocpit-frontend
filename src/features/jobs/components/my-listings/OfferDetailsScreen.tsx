import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Icon } from '@iconify/react';
import WithdrawOfferModal from './WithdrawOfferModal';
import { toast } from 'sonner';
import api from '@/lib/axios';
import { useActiveProfile } from '@/context/ActiveProfileContext';
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
  const { activeProfile, userCompanies } = useActiveProfile();
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
        sentByName: item.sent_by_name
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
    const companyId = getCompanyId();

    try {
      const endpoint = companyId
        ? `/jobs/companies/${companyId}/offers/${selectedCandId}`
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
    <div className="w-[998px] mx-auto bg-white flex flex-col justify-start items-center gap-[16px] overflow-hidden animate-in fade-in duration-300">

      {/* Header Row (Frame 2608623) */}
      <div className="w-[998px] h-[48px] self-stretch flex flex-row items-center p-0 gap-[16px]">
        <button
          onClick={onBack}
          type="button"
          className="w-12 h-12 box-border p-2 rounded-[100px] border border-[#DADADA] backdrop-blur-[12px] flex flex-row justify-center items-center gap-2.5 hover:bg-slate-50 transition-colors active:scale-95 text-gray-500 shadow-sm"
        >
          <Icon icon="lucide:chevron-left" className="w-6 h-6 text-gray-500" />
        </button>
        <div className="flex flex-col items-start p-0 gap-0">
          <div className="text-left text-[#000000] text-[18px] font-medium font-['Poppins'] leading-[26px]">Offer details</div>
          <div className="text-left text-[#6B7280] text-[12px] font-normal font-['Poppins'] leading-[16px]">View, and manage this listing</div>
        </div>
      </div>

      {/* Horizontal Stats Bar (Frame 2609091) */}
      <div className="box-border flex flex-row justify-between items-center p-[16px_0px_24px] gap-[12px] w-[998px] h-[100px] border-b border-[#EEF2FF] flex-none self-stretch grow-0">
        
        {/* Role details (Frame 2608946) */}
        <div className="flex flex-col items-start p-0 gap-[8px] w-[192px] h-[52px] flex-none order-0 grow-[1]">
          <span className="w-full font-['Poppins'] font-medium text-[16px] leading-[24px] text-black truncate capitalize">
            {offerGroup.title}
          </span>
          <span className="w-full font-['Poppins'] font-normal text-[14px] leading-[20px] text-[#6B7280] truncate">
            {offerGroup.company}
          </span>
        </div>

        {/* Sent candidates (Frame 2609054) */}
        <div className="flex flex-col justify-center items-start p-[8px_16px] gap-[8px] w-[192px] h-[60px] bg-white rounded-[24px] flex-none order-1 self-stretch grow-[1] mx-auto">
          <span className="font-['Poppins'] font-semibold text-[14px] leading-[20px] text-center text-black">
            {offerGroup.sentCount}
          </span>
          <span className="font-['Poppins'] font-normal text-[12px] leading-[16px] text-center text-[#6B7280]">
            Sent candidates
          </span>
        </div>

        {/* Accepted (Frame 2609055) */}
        <div className="flex flex-col justify-center items-start p-[8px_16px] gap-[8px] w-[192px] h-[60px] bg-white rounded-[24px] flex-none order-2 self-stretch grow-[1] mx-auto">
          <span className="font-['Poppins'] font-semibold text-[14px] leading-[20px] text-center text-black">
            {offerGroup.acceptedCount}
          </span>
          <span className="font-['Poppins'] font-normal text-[12px] leading-[16px] text-center text-[#6B7280]">
            Accepted
          </span>
        </div>

        {/* Pending (Frame 2609056) */}
        <div className="flex flex-col justify-center items-start p-[8px_16px] gap-[8px] w-[192px] h-[60px] bg-white rounded-[24px] flex-none order-3 self-stretch grow-[1] mx-auto">
          <span className="font-['Poppins'] font-semibold text-[14px] leading-[20px] text-center text-black">
            {offerGroup.pendingCount}
          </span>
          <span className="font-['Poppins'] font-normal text-[12px] leading-[16px] text-center text-[#6B7280]">
            Pending
          </span>
        </div>

        {/* Declined (Frame 2609057) */}
        <div className="flex flex-col justify-center items-start p-[8px_16px] gap-[8px] w-[192px] h-[60px] bg-white rounded-[24px] flex-none order-4 self-stretch grow-[1] mx-auto">
          <span className="font-['Poppins'] font-semibold text-[14px] leading-[20px] text-center text-black">
            {offerGroup.declinedCount}
          </span>
          <span className="font-['Poppins'] font-normal text-[12px] leading-[16px] text-center text-[#6B7280]">
            Declined
          </span>
        </div>
      </div>

      {/* Note section removed here to display per-candidate notes below */}

      {/* Candidates List Section (Frame 2609090) */}
      <div className="w-[998px] flex flex-col items-start p-0 gap-[16px]">
        {/* Header Row (Frame 2608889) */}
        <div className="w-[166px] h-[32px] flex flex-row items-center p-0 gap-[16px]">
          {/* Title */}
          <div className="w-[107px] h-[26px] py-[3px] flex items-center justify-center">
            <span className="font-['Poppins'] font-medium text-[18px] leading-[26px] text-center text-black">
              Candidates
            </span>
          </div>
          {/* Count Badge Frame 2608517 */}
          <div className="box-sizing: border-box w-[43px] h-[32px] bg-white border border-[#EEF2FF] rounded-[24px] flex flex-row justify-center items-center p-[8px_16px] gap-[10px]">
            <span className="font-['Poppins'] font-normal text-[12px] leading-[16px] text-center text-[#6366F1]">
              {activeCandidates.length}
            </span>
          </div>
        </div>

        {/* Candidates list with gap 16px */}
        <div className="w-[998px] flex flex-col gap-[16px]">
          {activeCandidates.length === 0 ? (
            <div className="py-12 text-center text-gray-400 text-xs font-['Poppins'] bg-slate-50/50 rounded-2xl">
              All offers have been withdrawn.
            </div>
          ) : (
            activeCandidates.map((cand) => (
              /* Candidate card container containing details row and note */
              <div
                key={cand.id}
                className="w-[998px] bg-white border border-[#EEF2FF]/60 rounded-[12px] flex flex-col overflow-hidden"
              >
                {/* Candidate card Row Frame 2608732 */}
                <div className="w-[998px] h-[60px] flex flex-row justify-between items-center p-[8px_16px] box-border">
                  {/* User Frame 2608774 */}
                  <div className="flex flex-row items-start p-0 gap-[8px] h-[44px]">
                    {/* User Avatar */}
                    {cand.avatar ? (
                      <img
                        className="w-[40px] h-[40px] rounded-full object-cover"
                        src={cand.avatar}
                        alt={cand.name}
                      />
                    ) : (
                      <div className="w-[40px] h-[40px] rounded-full bg-indigo-100 flex items-center justify-center text-indigo-500 font-semibold font-['Poppins'] text-sm border border-slate-100">
                        {cand.name.substring(0, 2).toUpperCase()}
                      </div>
                    )}
                    {/* Text Frame 2609008 */}
                    <div className="flex flex-col justify-center items-start h-[44px]">
                      <span className="font-['Poppins'] font-medium text-[16px] leading-[24px] text-black text-left">
                        {cand.name}
                      </span>
                      <span className="font-['Poppins'] font-normal text-[14px] leading-[20px] text-[#6B7280] text-left">
                        {cand.role}{cand.companyName ? ` at ${cand.companyName}` : ''}
                      </span>
                    </div>
                  </div>

                  {/* Button Frame 2608617 */}
                  {cand.status === 'chat' && (
                    <button
                      onClick={() => router.push('/messaging')}
                      type="button"
                      className="box-sizing: border-box w-[120px] h-[40px] bg-[#6366F1] border border-white rounded-[24px] flex flex-row justify-center items-center p-[8px_16px] gap-[10px] hover:opacity-90 transition-all active:scale-95 cursor-pointer"
                    >
                      <span className="font-['Poppins'] font-normal text-[14px] leading-[20px] text-center text-white">
                        Chat
                      </span>
                    </button>
                  )}
                  {cand.status === 'withdraw' && (
                    <button
                      onClick={() => handleWithdrawClick(cand.id)}
                      type="button"
                      className="box-sizing: border-box w-[120px] h-[40px] border border-[#6B7280] rounded-[24px] flex flex-row justify-center items-center p-[8px_16px] gap-[10px] hover:bg-slate-50 transition-all active:scale-95 bg-white"
                    >
                      <span className="font-['Poppins'] font-normal text-[14px] leading-[20px] text-center text-[#6B7280]">
                        Withdraw
                      </span>
                    </button>
                  )}
                  {cand.status === 'declined' && (
                    <div className="box-sizing: border-box w-[120px] h-[40px] border border-red-200 bg-red-50/50 rounded-[24px] flex flex-row justify-center items-center p-[8px_16px] gap-[10px]">
                      <span className="font-['Poppins'] font-normal text-[14px] leading-[20px] text-center text-red-500 font-semibold">
                        Declined
                      </span>
                    </div>
                  )}
                  {cand.status === 'withdrawn' && (
                    <div className="box-sizing: border-box w-[120px] h-[40px] border border-gray-200 bg-gray-50 rounded-[24px] flex flex-row justify-center items-center p-[8px_16px] gap-[10px]">
                      <span className="font-['Poppins'] font-normal text-[14px] leading-[20px] text-center text-gray-400">
                        Withdrawn
                      </span>
                    </div>
                  )}
                </div>

                {/* Expandable note bar */}
                {cand.note && (
                  <div className="w-full border-t border-[#EEF2FF] bg-[#F9FAFF] flex flex-col items-start transition-all duration-300">
                    {/* Collapsed Bar */}
                    <div
                      onClick={() => toggleNoteExpanded(cand.id)}
                      className="w-full flex flex-row justify-between items-center p-[10px_16px] cursor-pointer hover:bg-slate-50/50 select-none"
                    >
                      <div className="flex-1 flex flex-row items-center gap-[4px] min-w-0">
                        <span className="font-['Poppins'] font-medium text-[12px] leading-[16px] text-[#6366F1] flex-shrink-0">
                          Note :
                        </span>
                        <span className="font-['Poppins'] font-normal text-[12px] leading-[16px] text-[#6B7280] truncate flex-1">
                          {cand.note}
                        </span>
                      </div>
                      <div className="w-[20px] h-[20px] rounded-full border border-black flex items-center justify-center flex-shrink-0">
                        <Icon
                          icon={expandedNotes[cand.id] ? "lucide:chevron-up" : "lucide:chevron-down"}
                          className="w-3.5 h-3.5 text-black"
                        />
                      </div>
                    </div>

                    {/* Expanded Detail Box */}
                    {expandedNotes[cand.id] && (
                      <div className="w-full px-[16px] pb-[16px] pt-1 flex flex-col gap-2 animate-in fade-in duration-200">
                        <div className="flex flex-row justify-start items-center gap-[8px] w-full h-[40px] border-t border-dashed border-[#EEF2FF] pt-2 mt-1">
                          <div className="w-[32px] h-[32px] rounded-full bg-indigo-100 flex items-center justify-center text-indigo-500 font-semibold font-['Poppins'] text-xs border border-slate-100">
                            {cand.sentByName ? cand.sentByName.substring(0, 2).toUpperCase() : 'RC'}
                          </div>
                          <div className="flex flex-col justify-center items-start">
                            <span className="font-['Poppins'] font-normal text-[11px] leading-[14px] text-[#6366F1] uppercase">
                              {cand.sentByName || 'RECRUITER'}
                            </span>
                            <span className="font-['Poppins'] font-normal text-[10px] leading-[12px] text-muted-foreground uppercase">
                              RECRUITER
                            </span>
                          </div>
                        </div>
                        <p className="font-['Poppins'] font-normal text-[12px] leading-[18px] text-[#6B7280] whitespace-pre-line mt-1">
                          {cand.note}
                        </p>
                      </div>
                    )}
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
