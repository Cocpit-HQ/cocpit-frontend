import React, { useState, useEffect, useCallback } from 'react';
import { JobListing } from '../../types/jobs.types';
import { Icon } from '@iconify/react';
import { toast } from 'sonner';
import SendOfferModal, { SelectableCandidate } from './SendOfferModal';
import api from '@/lib/axios';
import { useActiveProfile } from '@/context/ActiveProfileContext';

export interface SentOfferGroup {
  id: string;
  title: string;
  company: string;
  sentCount: number;
  acceptedCount: number;
  pendingCount: number;
  company_logo?: string;
}

interface SendOfferTabProps {
  listings: JobListing[];
  onSelectListing?: (listing: JobListing, viewType?: 'view-listing' | 'applicants') => void;
  onSelectOfferGroup?: (group: SentOfferGroup) => void;
}

export const SendOfferTab: React.FC<SendOfferTabProps> = ({ listings, onSelectListing, onSelectOfferGroup }) => {
  const [isSendOpen, setIsSendOpen] = useState(false);
  const { activeProfile, userCompanies } = useActiveProfile();

  // Sent Offers state
  const [sentOffers, setSentOffers] = useState<SentOfferGroup[]>([]);
  const [isLoadingOffers, setIsLoadingOffers] = useState(false);

  const activeListings = listings.filter(item => item.status?.toUpperCase() === 'ACTIVE');

  // Stats counters
  const totalOffersSent = sentOffers.reduce((sum, item) => sum + item.sentCount, 0);
  const totalAccepted = sentOffers.reduce((sum, item) => sum + item.acceptedCount, 0);

  const fetchSentOffers = useCallback(async () => {
    let companyId = '';
    if (activeProfile && activeProfile.type === 'COMPANY') {
      companyId = activeProfile.id;
    } else if (userCompanies && userCompanies.length > 0) {
      companyId = userCompanies[0].org_id || userCompanies[0].company_id || '';
    }

    setIsLoadingOffers(true);
    try {
      const endpoint = companyId 
        ? `/jobs/companies/${companyId}/offers/sent` 
        : `/jobs/offers/sent`;
      const response = await api.get(endpoint);
      const mapped: SentOfferGroup[] = (response.data || []).map((item: any) => ({
        id: item.job_id,
        title: item.title,
        company: item.company_display_name || item.company_name || 'Starlight Technologies',
        sentCount: Number(item.total_offers || 0),
        acceptedCount: Number(item.accepted_count || 0),
        pendingCount: Number(item.pending_count || 0),
        company_logo: item.company_logo,
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
      setIsLoadingOffers(false);
    }
  }, [activeProfile, userCompanies]);

  useEffect(() => {
    fetchSentOffers();
  }, [fetchSentOffers]);

  const handleSelectGroup = (group: SentOfferGroup) => {
    if (onSelectOfferGroup) {
      onSelectOfferGroup(group);
    }
  };

  const handleSendOfferSubmit = async (jobId: string, candidates: SelectableCandidate[], note: string) => {
    let companyId = '';
    if (activeProfile && activeProfile.type === 'COMPANY') {
      companyId = activeProfile.id;
    } else {
      const selectedJob = listings.find(j => j.id === jobId);
      if (selectedJob && selectedJob.org_id) {
        companyId = selectedJob.org_id;
      } else if (userCompanies && userCompanies.length > 0) {
        companyId = userCompanies[0].org_id || userCompanies[0].company_id || '';
      }
    }

    try {
      const promises = candidates.map((c) => {
        if (companyId) {
          return api.post(`/jobs/companies/${companyId}/offers`, {
            jobId,
            userId: c.id,
            message: note.trim() || undefined
          });
        } else {
          return api.post(`/jobs/offers`, {
            jobId,
            userId: c.id,
            message: note.trim() || undefined
          });
        }
      });

      await Promise.all(promises);
      toast.success(`Offers sent successfully to: ${candidates.map(c => c.name).join(', ')}`);
      fetchSentOffers();
    } catch (error: any) {
      console.error('Failed to send offers:', error);
      const errMsg = error.response?.data?.message || 'Failed to send offers.';
      toast.error(errMsg);
    }
  };


  return (
    <div className="w-full flex flex-col animate-in fade-in duration-300">
      {/* Header Row */}
      <div className="w-full h-[40px] flex flex-row justify-between items-center p-0 gap-[16px] mb-[24px]">
        <h3 className="font-['Poppins'] font-medium text-[18px] leading-[26px] text-black py-[7px]">
          Sent offers
        </h3>
        
        <button
          onClick={() => setIsSendOpen(true)}
          className="flex flex-row items-center gap-[8px] py-[7px] text-[#6366F1] hover:opacity-85 transition-all duration-200 active:scale-95 cursor-pointer font-['Poppins'] font-medium text-[18px] leading-[26px]"
        >
          <Icon icon="iconoir:gift" className="w-[24px] h-[24px]" />
          <span>Send offer</span>
        </button>
      </div>

      {/* Main Stats Frame */}
      <div className="w-full max-w-[998px] bg-white rounded-[24px] p-0 flex flex-col items-center gap-[24px]">
        <div className="w-full flex flex-col sm:flex-row justify-start items-start gap-6 self-stretch">
          <div className="flex-1 p-6 bg-white rounded-3xl outline outline-1 outline-offset-[-1px] outline-indigo-50 inline-flex flex-col justify-center items-start gap-2">
            <div className="self-stretch flex flex-col justify-start items-start">
              <div className="self-stretch justify-center text-indigo-500 text-2xl font-semibold font-['Poppins'] leading-8">{totalOffersSent}</div>
            </div>
            <div className="self-stretch flex flex-col justify-start items-start">
              <div className="self-stretch justify-center text-black text-sm font-normal font-['Poppins'] leading-5">Offer sent</div>
            </div>
          </div>
          <div className="flex-1 p-6 bg-white rounded-3xl outline outline-1 outline-offset-[-1px] outline-indigo-50 inline-flex flex-col justify-center items-start gap-2">
            <div className="self-stretch flex flex-col justify-start items-start">
              <div className="self-stretch justify-center text-indigo-500 text-2xl font-semibold font-['Poppins'] leading-8">{totalAccepted}</div>
            </div>
            <div className="self-stretch flex flex-col justify-start items-start">
              <div className="self-stretch justify-center text-black text-sm font-normal font-['Poppins'] leading-5">Accepted</div>
            </div>
          </div>
        </div>

        {/* Job Cards list with Scroll */}
        <div className="w-full flex flex-col gap-[16px] overflow-y-auto max-h-[460px] pr-1 scrollbar-thin">
          {sentOffers.length === 0 ? (
            <div className="h-96 flex flex-col justify-center items-center gap-4 w-full mt-4">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="size-28 flex-shrink-0 animate-in fade-in duration-300">
                <path
                  fill="#6366F1"
                  d="M23.997 2.486a1.94 1.94 0 0 0-.5-1.311a2.56 2.56 0 0 0-2.003-.24q-1.833.405-3.613 1c-.61.18-1.211.391-1.802.621c-.88.33-1.742.711-2.612 1.091A49 49 0 0 0 8.782 6a26.6 26.6 0 0 0-4.284 3.003l-3.433 3.073l-.791.79a1.7 1.7 0 0 0-.25.34a.4.4 0 0 0 0 .271a.68.68 0 0 0 .4.5c.387.132.792.2 1.201.2c.44 0 1.221 0 1.892.1c.34-.01.678.038 1 .14l.191 2.233c.06.64.09 1.141.09 1.612c0 .75-.1 2.052-.1 3.073a.34.34 0 1 0 .68 0c0-1.001.13-2.323.14-3.073c0-.49 0-1.001-.07-1.672c-.07-.67-.07-1.511-.15-2.002s-.09-.76-1.34-1c-.741-.091-1.762-.141-2.313-.171l-.55-.08l.58-.57l3.453-3.004a24.8 24.8 0 0 1 4.144-2.912a50 50 0 0 1 4.595-2.183c.85-.36 1.712-.71 2.572-1a32 32 0 0 1 5.646-1.522c.9.39.77.73.75 1a7.2 7.2 0 0 1-.27 1.492l-1.29 4.365c-.261.87-.541 1.681-.832 2.472c-.71 1.912-1.491 3.704-2.212 5.776q-.254.706-.6 1.371c-.37.7-.791 1.371-1.182 2.002q-.165.306-.38.58l-.1.12l-.06-.09l-1.001-1.571a25 25 0 0 0-1.582-1.952a21 21 0 0 0-1.791-1.782c-.43-.36-1.642-1.36-2.002-.64c-.1.13-.21.38-.27.45L8.09 17.441l-1.18 2.092c-.421.73-.922 1.421-1.372 2.152c-.19.32-.38.65-.54 1.001a.3.3 0 0 0 .14.4s.28.23.69-.08s.53-.39.76-.57c.231-.18.762-.55 1.132-.811c.37-.26.67-.45 1.001-.68l1.521-1.062c.801-.57 1.572-1.16 2.323-1.791l.17.19a27 27 0 0 1 1.491 1.912l.901 1.541q.139.256.31.49a.55.55 0 0 0 .45.17c.238-.038.46-.142.642-.3c.284-.275.53-.589.73-.93c.41-.631.861-1.322 1.251-2.002q.405-.719.691-1.492c.74-2.062 1.562-3.834 2.282-5.725c.32-.821.611-1.652.881-2.543l1.301-4.404a8 8 0 0 0 .33-2.513M9.102 19.283q-.519.334-1 .72c-.341.27-.661.55-1.002.851l-.75.77c.39-.59.8-1.16 1.16-1.76l1.242-2.003l1.151-1.651c.05-.06.2-.31.26-.41s.2.13.31.21s.451.41.581.52c.34.31.68.66 1.001 1c-.95.632-1.982 1.142-2.953 1.753"
                />
                <path
                  fill="#6366F1"
                  d="M13.687 9.673c-.53.58-1.001 1.191-1.522 1.822a29 29 0 0 0-1.631 2.202c-.11.16-.21.33-.31.49c-.26.792.11.671.8.08l.09-.14c.56-.71 1.191-1.38 1.782-2.001c.95-1.091 2.002-2.092 3.003-3.083L18.12 6.95a135 135 0 0 0 3.253-3.113C22.996.995 18.582 4.998 16.2 7.17c-.87.83-1.711 1.621-2.512 2.502m-.402-3.062a68 68 0 0 0-4.074 3.003L6.05 12.186c-.2.18-.43.37-.66.56c-.48.6-.41.821.68.34c.16-.11.32-.22.45-.33l3.304-2.362l8.228-5.675c.81-.551 1.592-1.102 2.402-1.632c.19-.67-1.23-.2-2.402.49l-.53.32c-1.422.892-2.853 1.762-4.235 2.713"
                />
              </svg>
              <div className="flex flex-col justify-start items-center gap-2">
                <div className="text-center justify-center text-black text-base font-medium font-['Poppins'] leading-6">No offers sent yet</div>
                <div className="w-80 text-center justify-center text-gray-500 text-xs font-normal font-['Poppins'] leading-4">Start reaching out to qualified candidates and manage offer responses from your dashboard.</div>
              </div>
              <button
                onClick={() => setIsSendOpen(true)}
                type="button"
                className="w-48 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 transition-all active:scale-95 rounded-3xl outline outline-1 outline-offset-[-1px] outline-indigo-50 inline-flex justify-center items-center gap-2.5 text-white"
              >
                <span className="text-center justify-start text-sm font-semibold font-['Poppins'] leading-5">Send Offer</span>
              </button>
            </div>
          ) : (
            sentOffers.map((item) => (
              <div
                key={item.id}
                onClick={() => handleSelectGroup(item)}
                className="w-full flex flex-row justify-between items-center p-[16px] gap-[12px] h-[84px] flex-none rounded-[24px] border border-transparent hover:border-[#EEF2FF]/60 hover:bg-indigo-50/5 cursor-pointer transition-all duration-200"
              >
                {/* Job details frame */}
                <div className="flex flex-row items-center p-0 gap-[8px] flex-1 min-w-[240px] h-[52px]">
                  <div className="w-[56px] h-[40px] rounded-[24px] bg-[#E0E7FF] flex items-center justify-center overflow-hidden border border-indigo-100 flex-shrink-0 py-[8px] px-[16px] box-border">
                    <Icon
                      icon="solar:globus-linear"
                      className="w-[24px] h-[24px] text-[#6366F1]"
                    />
                  </div>

                  <div className="flex flex-col items-start p-0 gap-[8px] min-w-[168px] h-[52px] flex-grow">
                    <span className="font-['Poppins'] font-medium text-[16px] leading-[24px] text-black capitalize truncate w-full">
                      {item.title}
                    </span>
                    <span className="font-['Poppins'] font-normal text-[14px] leading-[20px] text-[#6B7280] truncate w-full">
                      {item.company}
                    </span>
                  </div>
                </div>

                {/* Sent count column */}
                <div className="flex flex-row justify-center items-center p-0 gap-[10px] flex-1 min-w-[140px] h-[52px]">
                  <span className="font-['Poppins'] font-normal text-[14px] leading-[20px] text-[#6B7280] text-center">
                    Sent to {item.sentCount} candidate{item.sentCount !== 1 ? 's' : ''}
                  </span>
                </div>

                {/* Accepted count column */}
                <div className="flex flex-row justify-center items-center py-[8px] px-[16px] gap-[10px] flex-1 min-w-[120px] h-[52px] rounded-[24px]">
                  <span className="font-['Poppins'] font-normal text-[14px] leading-[20px] text-black text-center">
                    {item.acceptedCount} Accepted
                  </span>
                </div>

                {/* Pending count column */}
                <div className="flex flex-row justify-center items-center py-[8px] px-[16px] gap-[10px] flex-1 min-w-[120px] h-[52px] rounded-[24px]">
                  <span className="font-['Poppins'] font-normal text-[14px] leading-[20px] text-black text-center">
                    {item.pendingCount} Pending
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Multi-stage Send Offer Modal Popup */}
      <SendOfferModal
        isOpen={isSendOpen}
        onClose={() => setIsSendOpen(false)}
        activeListings={activeListings}
        onSubmit={handleSendOfferSubmit}
      />
    </div>
  );
};

export default SendOfferTab;
