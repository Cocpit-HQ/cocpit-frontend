import React, { useState, useEffect, useCallback } from 'react';
import { JobListing } from '../../types/jobs.types';
import { Icon } from '@iconify/react';
import { toast } from 'sonner';
import SendOfferModal, { SelectableCandidate } from './SendOfferModal';
import api from '@/lib/axios';
import { useActiveProfile } from '@/context/ActiveProfileContext';
import { useQueryClient } from '@tanstack/react-query';
import Image from 'next/image';

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
  const queryClient = useQueryClient();

  // Sent Offers state
  const [sentOffers, setSentOffers] = useState<SentOfferGroup[]>([]);
  const [isLoadingOffers, setIsLoadingOffers] = useState(false);

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

  const fetchSentOffers = useCallback(async () => {
    let companyId = '';
    if (activeProfile && activeProfile.type === 'COMPANY') {
      companyId = activeProfile.id;
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
      setIsLoadingOffers(false);
    }
  }, [activeProfile, userCompanies]);

  useEffect(() => {
    fetchSentOffers();
  }, [fetchSentOffers, refreshTrigger]);

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
    <div className={`w-full flex flex-col gap-[16px] bg-white ${isCompanyMode ? 'dark:bg-[#0F1115]' : 'dark:bg-[#0B0F19]'} rounded-[24px] p-[16px] min-h-[708px] animate-in fade-in duration-300`}>
      {/* Header Row */}
      {sentOffers.length > 0 && (
        <div className="w-full flex flex-col gap-[4px] px-0">
          <h3 className={`font-['Poppins'] font-medium text-[18px] leading-[26px] text-black ${isCompanyMode ? 'dark:text-[#FFFFFF]' : 'dark:text-[#F9FAFB]'}`}>
            Sent offers
          </h3>
          <span className={`font-['Poppins'] font-normal text-[12px] leading-[16px] text-[#6B7280] ${isCompanyMode ? 'dark:text-[#A1A8B3]' : 'dark:text-[#9CA3AF]'}`}>
            Total offers - {sentOffers.length}
          </span>
        </div>
      )}

      {/* Job Cards list with Scroll */}
      <div className="w-full flex flex-col gap-[16px] overflow-y-auto max-h-[600px] pr-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {isLoadingOffers ? (
          <div className="flex justify-center py-8">
            <Icon icon="lucide:loader-2" className="w-6 h-6 animate-spin text-indigo-500" />
          </div>
        ) : sentOffers.length === 0 ? (
          <div className="h-96 flex flex-col justify-center items-center gap-4 w-full mt-4">
            <Image 
              src="/images/companyonboarding/offer.png" 
              alt="No offers sent" 
              width={112} 
              height={112} 
              className="w-28 h-auto flex-shrink-0 animate-in fade-in duration-300" 
            />
            <div className="flex flex-col justify-start items-center gap-2">
              <div className={`text-center justify-center text-black text-base font-semibold font-['Poppins'] leading-6 ${isCompanyMode ? 'dark:text-[#FFFFFF]' : 'dark:text-[#F9FAFB]'}`}>No offers sent yet</div>
              <div className={`w-80 text-center justify-center text-gray-500 text-xs font-normal font-['Poppins'] leading-4 ${isCompanyMode ? 'dark:text-[#A1A8B3]' : 'dark:text-[#9CA3AF]'}`}>Start reaching out to qualified candidates and manage offer responses from your dashboard.</div>
            </div>
            <button
              onClick={() => onOpenSendOfferModal ? onOpenSendOfferModal() : setIsSendOpen(true)}
              type="button"
              className={`w-48 px-4 py-2 transition-all active:scale-95 rounded-3xl outline outline-1 outline-offset-[-1px] inline-flex justify-center items-center gap-2.5 text-white ${
                isCompanyMode ? 'bg-[#1A73E8] dark:bg-[#4D9CFF] outline-blue-50 dark:outline-[#1A2435]' : 'bg-indigo-500 dark:bg-[#818CF8] outline-indigo-50 dark:outline-[#2E3445]'
              }`}
            >
              <span className="text-center justify-start text-sm font-semibold font-['Poppins'] leading-5">Send Offer</span>
            </button>
          </div>
        ) : (
          sentOffers.map((item, index) => (
            <div
              key={`${item.id}-${index}`}
              onClick={() => handleSelectGroup(item)}
              className={`w-full bg-white ${isCompanyMode ? 'dark:bg-[#0F1115] border-[#EEF2FF]/60 dark:border-[#2A2D35]/60 hover:bg-slate-50 dark:hover:bg-[#121B2B]' : 'dark:bg-[#0B0F19] border-[#EEF2FF]/60 dark:border-[#2E3445]/60 hover:bg-slate-50 dark:hover:bg-[#1C2340]'} border-b last:border-b-0 transition-colors cursor-pointer`}
            >
              {/* Desktop View */}
              <div className="hidden md:flex flex-row items-center justify-between py-4 px-4 gap-4 h-[88px] w-full">
                {/* Job Title & Company */}
                <div className="flex flex-col items-start gap-1 w-[30%] min-w-[200px]">
                  <span className={`font-['Poppins'] font-semibold text-sm text-black capitalize truncate w-full ${isCompanyMode ? 'dark:text-[#FFFFFF]' : 'dark:text-[#F9FAFB]'}`}>
                    {item.title}
                  </span>
                  <span className={`font-['Poppins'] font-normal text-xs text-gray-500 truncate w-full ${isCompanyMode ? 'dark:text-[#A1A8B3]' : 'dark:text-[#9CA3AF]'}`}>
                    {item.company}
                  </span>
                </div>

                {/* Sent candidates */}
                <div className="flex flex-col items-start gap-1 w-[15%] min-w-[100px]">
                  <span className={`font-['Poppins'] font-bold text-sm text-black ${isCompanyMode ? 'dark:text-[#FFFFFF]' : 'dark:text-[#F9FAFB]'}`}>
                    {item.sentCount}
                  </span>
                  <span className={`font-['Poppins'] font-normal text-xs text-gray-500 ${isCompanyMode ? 'dark:text-[#A1A8B3]' : 'dark:text-[#9CA3AF]'}`}>
                    Sent candidates
                  </span>
                </div>

                {/* Accepted */}
                <div className="flex flex-col items-start gap-1 w-[15%] min-w-[90px]">
                  <span className={`font-['Poppins'] font-bold text-sm text-black ${isCompanyMode ? 'dark:text-[#FFFFFF]' : 'dark:text-[#F9FAFB]'}`}>
                    {item.acceptedCount}
                  </span>
                  <span className={`font-['Poppins'] font-normal text-xs text-gray-500 ${isCompanyMode ? 'dark:text-[#A1A8B3]' : 'dark:text-[#9CA3AF]'}`}>
                    Accepted
                  </span>
                </div>

                {/* Pending */}
                <div className="flex flex-col items-start gap-1 w-[15%] min-w-[90px]">
                  <span className={`font-['Poppins'] font-bold text-sm text-black ${isCompanyMode ? 'dark:text-[#FFFFFF]' : 'dark:text-[#F9FAFB]'}`}>
                    {item.pendingCount}
                  </span>
                  <span className={`font-['Poppins'] font-normal text-xs text-gray-500 ${isCompanyMode ? 'dark:text-[#A1A8B3]' : 'dark:text-[#9CA3AF]'}`}>
                    Pending
                  </span>
                </div>

                {/* Declined */}
                <div className="flex flex-col items-start gap-1 w-[15%] min-w-[90px]">
                  <span className={`font-['Poppins'] font-bold text-sm text-black ${isCompanyMode ? 'dark:text-[#FFFFFF]' : 'dark:text-[#F9FAFB]'}`}>
                    {item.declinedCount}
                  </span>
                  <span className={`font-['Poppins'] font-normal text-xs text-gray-500 ${isCompanyMode ? 'dark:text-[#A1A8B3]' : 'dark:text-[#9CA3AF]'}`}>
                    Declined
                  </span>
                </div>
              </div>

              {/* Mobile View */}
              <div className="flex md:hidden flex-row items-center py-4 px-1 gap-4 w-full">
                {/* Logo Placeholder */}
                <div className={`w-14 h-14 rounded-2xl bg-black shrink-0 overflow-hidden relative flex items-center justify-center text-white shadow-sm border border-slate-100 ${isCompanyMode ? 'dark:border-[#2A2D35]' : 'dark:border-[#2E3445]'}`}>
                  <Icon icon="lucide:infinity" className="w-8 h-8 text-white" />
                </div>
                
                {/* Info */}
                <div className="flex-1 flex flex-col justify-center min-w-0">
                  <span className={`font-['Poppins'] font-medium text-[16px] leading-[24px] text-black ${isCompanyMode ? 'dark:text-[#FFFFFF]' : 'dark:text-[#F9FAFB]'} capitalize truncate w-full`}>
                    {item.title}
                  </span>
                  <span className={`font-['Poppins'] font-normal text-[14px] leading-[20px] text-gray-500 ${isCompanyMode ? 'dark:text-[#A1A8B3]' : 'dark:text-[#9CA3AF]'} truncate w-full mt-0.5`}>
                    Sent to {item.sentCount} candidates • {item.acceptedCount} accepted
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
