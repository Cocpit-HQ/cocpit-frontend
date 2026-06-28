import React, { useState, useEffect, useCallback } from 'react';
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
    job_type?: string;
    work_mode?: string;
    location?: string;
    experience_level?: string;
    salary_min?: number;
    salary_max?: number;
    salary_currency?: string;
    salary_period?: string;
    company_logo?: string;
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
  const [candidates, setCandidates] = useState<OfferCandidate[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCandId, setSelectedCandId] = useState<string | null>(null);
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
  const { activeProfile, userCompanies } = useActiveProfile();

  const getCompanyId = useCallback(() => {
    if (activeProfile && activeProfile.type === 'COMPANY') {
      return activeProfile.id;
    }
    if (userCompanies && userCompanies.length > 0) {
      return userCompanies[0].org_id || userCompanies[0].company_id || '';
    }
    return '';
  }, [activeProfile, userCompanies]);

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
        companyName: item.sent_by_name || 'Recruiter',
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

  // Load recruiter note if present from the first candidate who has a note
  const noteCandidate = candidates.find(c => c.note);
  const showNote = !!noteCandidate;


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

      {/* Job Details Card Preview (Frame 2608861) */}
      <div className="w-[998px] h-[196px] box-border p-[16px] rounded-[24px] border border-[#EEF2FF] flex flex-col items-end gap-[12px] bg-white">

        {/* Frame 2608947: Top row (role, company, full-time, and company logo) */}
        <div className="w-[966px] h-[80px] self-stretch flex flex-row justify-between items-start p-0 gap-[10px]">

          {/* Frame 2608946: Role details */}
          <div className="h-[80px] flex flex-col items-start p-0 gap-[8px]">
            {/* UI/UX Designer */}
            <span className="font-['Poppins'] font-medium text-[16px] leading-[24px] text-black">
              {offerGroup.title}
            </span>
            {/* Starlight Technologies */}
            <span className="font-['Poppins'] font-normal text-[14px] leading-[20px] text-[#6B7280]">
              {offerGroup.company}
            </span>
            {/* Full time */}
            <span className="font-['Poppins'] font-semibold text-[14px] leading-[20px] text-[#6B7280]">
              {offerGroup.job_type || 'Full time'}
            </span>
          </div>

          {/* Company Avatar Frame 2608516 */}
          {offerGroup.company_logo === 'sphere' ? (
            <div className="w-[56px] h-[40px] rounded-[24px] bg-slate-100 flex items-center justify-center overflow-hidden border border-slate-200 flex-shrink-0">
              <div className="w-[20px] h-[20px] rounded-full bg-gradient-to-br from-indigo-300 to-indigo-500 shadow-sm" />
            </div>
          ) : offerGroup.company_logo === 'coreloom' ? (
            <div className="w-[56px] h-[40px] rounded-[24px] bg-[#E0E7FF] flex items-center justify-center overflow-hidden border border-indigo-100 flex-shrink-0">
              <Icon icon="solar:globus-linear" className="w-[24px] h-[24px] text-[#6366F1]" />
            </div>
          ) : offerGroup.company_logo === 'prismforge' ? (
            <div className="w-[56px] h-[40px] rounded-[24px] bg-[#FFE4E6] flex items-center justify-center overflow-hidden border border-rose-100 flex-shrink-0">
              <Icon icon="solar:fire-linear" className="w-[24px] h-[24px] text-rose-500" />
            </div>
          ) : offerGroup.company_logo === 'mindstack' ? (
            <div className="w-[56px] h-[40px] rounded-[24px] bg-[#ECFDF5] flex items-center justify-center overflow-hidden border border-emerald-100 flex-shrink-0">
              <Icon icon="solar:atom-linear" className="w-[24px] h-[24px] text-emerald-500" />
            </div>
          ) : offerGroup.company_logo && !['coreloom', 'prismforge', 'mindstack', 'sphere'].includes(offerGroup.company_logo) ? (
            <div className="w-[56px] h-[40px] rounded-[24px] bg-slate-50 flex items-center justify-center overflow-hidden border border-slate-100 flex-shrink-0">
              <img
                src={offerGroup.company_logo}
                alt={offerGroup.company}
                className="w-[24px] h-[24px] object-contain rounded-full"
              />
            </div>
          ) : (
            <div className="w-[56px] h-[40px] rounded-[24px] bg-indigo-50 flex items-center justify-center border border-indigo-100 flex-shrink-0">
              <Icon icon="hugeicons:job-search" className="w-[24px] h-[24px] text-indigo-500" />
            </div>
          )}
        </div>

        {/* Row 2: Specifications (Experience, location, bullet point, salary) */}
        <div className="w-[966px] h-[20px] self-stretch flex flex-row justify-between items-center p-0">
          <div className="flex flex-row items-center p-0">
            {/* Experience Frame 2608943 */}
            <div className="flex flex-row items-center p-0 gap-[8px] h-[20px]">
              <Icon icon="hugeicons:job-search" className="w-[20px] h-[20px] text-black" />
              <span className="font-['Poppins'] font-normal text-[14px] leading-[20px] text-black">
                {offerGroup.experience_level || '0-2Yrs'}
              </span>
            </div>

            {/* Bullet Point / Ellipse 15 */}
            <div className="w-[6px] h-[6px] bg-black rounded-full mx-[8px]" />

            {/* Location Frame 2608944 */}
            <div className="flex flex-row items-center p-0 gap-[8px] h-[20px]">
              <Icon icon="lucide:map-pin" className="w-[20px] h-[20px] text-black" />
              <span className="font-['Poppins'] font-normal text-[14px] leading-[20px] text-black">
                {offerGroup.work_mode && offerGroup.work_mode.toLowerCase() === 'remote'
                  ? 'Remote'
                  : `${offerGroup.work_mode || 'Hybrid'} - ${offerGroup.location || 'Kolhapur'}`}
              </span>
            </div>
          </div>

          <div className="py-[2px] flex items-center h-[16px] gap-1">
            {offerGroup.salary_min || offerGroup.salary_max ? (
              <>
                <Icon icon={getCurrencyIcon(offerGroup.salary_currency)} className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
                <span className="font-['Poppins'] font-medium text-[12px] leading-[16px] text-black">
                  {formatSalaryRange(offerGroup.salary_min, offerGroup.salary_max, offerGroup.salary_currency)}
                </span>
              </>
            ) : (
              <span className="font-['Poppins'] font-normal text-[12px] leading-[16px] text-gray-400">
                Salary not disclosed
              </span>
            )}
          </div>
        </div>

        {/* Row 3: Eye Icon Frame 2609037 */}
        <button
          onClick={onViewListingDetails}
          type="button"
          className="w-[56px] h-[40px] flex items-center justify-center rounded-[24px] hover:bg-[#EEF2FF]/40 active:scale-95 transition-all text-black"
          title="Open in job details page"
        >
          <Icon icon="lucide:eye" className="w-[24px] h-[24px]" />
        </button>

      </div>

      {/* Note Section (Frame 2609091) */}
      {showNote ? (
        <div className="w-[998px] flex flex-col items-start p-0 gap-[8px]">
          {/* Note Title */}
          <div className="w-[43px] h-[26px] flex items-center justify-center">
            <span className="font-['Poppins'] font-medium text-[18px] leading-[26px] text-center text-black">
              Note
            </span>
          </div>

          {/* Note Container (Frame 2609030) */}
          <div className="w-[998px] box-border flex flex-col items-start p-[12px_16px] gap-[8px] bg-[#F9FAFF] border-l-2 border-l-[#6366F1] rounded-[0px_16px_16px_16px]">
            {/* Sender Info Row (Frame 2609033) */}
            <div className="flex flex-row justify-start items-center p-0 gap-[8px] w-[282px] h-[40px]">
              <div className="w-[40px] h-[40px] rounded-full bg-indigo-100 flex items-center justify-center text-indigo-500 font-semibold font-['Poppins'] text-xs border border-slate-100">
                {noteCandidate?.sentByName ? noteCandidate.sentByName.substring(0, 2).toUpperCase() : 'RC'}
              </div>
              <div className="flex flex-col justify-center items-start">
                <span className="font-['Poppins'] font-normal text-[12px] leading-[16px] text-[#6366F1] uppercase">
                  {noteCandidate?.sentByName || 'RECRUITER'}
                </span>
                <span className="font-['Poppins'] font-normal text-[12px] leading-[16px] text-[#6366F1] uppercase">
                  RECRUITER
                </span>
              </div>
            </div>

            {/* Note Content */}
            <div className="w-[966px] font-['Poppins'] font-normal text-[12px] leading-[16px] text-[#6B7280]">
              "{noteCandidate?.note}"
            </div>
          </div>
        </div>
      ) : null}

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
              /* Candidate card Frame 2608732 */
              <div
                key={cand.id}
                className="w-[998px] h-[60px] bg-white border border-[#EEF2FF]/60 rounded-[12px] flex flex-row justify-between items-center p-[8px_16px] box-border"
              >
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
                      {cand.role} at {cand.companyName}
                    </span>
                  </div>
                </div>

                {/* Button Frame 2608617 */}
                {cand.status === 'chat' && (
                  <button
                    type="button"
                    className="box-sizing: border-box w-[120px] h-[40px] bg-[#6366F1] border border-white rounded-[24px] flex flex-row justify-center items-center p-[8px_16px] gap-[10px] hover:opacity-90 transition-all active:scale-95"
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
