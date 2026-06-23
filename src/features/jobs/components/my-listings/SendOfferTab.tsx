import React, { useState } from 'react';
import { JobListing } from '../../types/jobs.types';
import { Icon } from '@iconify/react';
import { toast } from 'sonner';
import SendOfferModal from './SendOfferModal';
import OfferDetailsScreen from './OfferDetailsScreen';

interface SendOfferTabProps {
  listings: JobListing[];
  onSelectListing?: (listing: JobListing) => void;
}

interface SentOfferGroup {
  id: string;
  title: string;
  company: string;
  sentCount: number;
  acceptedCount: number;
  pendingCount: number;
}

export const SendOfferTab: React.FC<SendOfferTabProps> = ({ listings, onSelectListing }) => {
  const [view, setView] = useState<'dashboard' | 'details'>('dashboard');
  const [selectedOfferGroup, setSelectedOfferGroup] = useState<SentOfferGroup | null>(null);
  const [isSendOpen, setIsSendOpen] = useState(false);

  // Sent Offers state
  const [sentOffers, setSentOffers] = useState<SentOfferGroup[]>([
    { id: 'so-1', title: 'UI/UX Designer', company: 'Starlight Technologies', sentCount: 3, acceptedCount: 2, pendingCount: 1 },
    { id: 'so-2', title: 'Jr. UI designer', company: 'Starlight Technologies', sentCount: 10, acceptedCount: 5, pendingCount: 5 },
    { id: 'so-3', title: 'Sr. UI/UX Designer', company: 'Starlight Technologies', sentCount: 1, acceptedCount: 0, pendingCount: 1 }
  ]);

  const activeListings = listings.filter(item => item.status?.toUpperCase() === 'ACTIVE');

  // Stats counters
  const totalOffersSent = sentOffers.reduce((sum, item) => sum + item.sentCount, 0);
  const totalAccepted = sentOffers.reduce((sum, item) => sum + item.acceptedCount, 0);

  const handleSelectGroup = (group: SentOfferGroup) => {
    setSelectedOfferGroup(group);
    setView('details');
  };

  const handleSendOfferSubmit = (jobTitle: string, candidateNames: string[], note: string) => {
    toast.success(`Offers sent successfully to: ${candidateNames.join(', ')}`);

    setSentOffers((prev) => {
      const existingIdx = prev.findIndex((item) => item.title.toLowerCase() === jobTitle.toLowerCase());
      if (existingIdx > -1) {
        const updated = [...prev];
        updated[existingIdx] = {
          ...updated[existingIdx],
          sentCount: updated[existingIdx].sentCount + candidateNames.length,
          pendingCount: updated[existingIdx].pendingCount + candidateNames.length,
        };
        return updated;
      } else {
        return [
          ...prev,
          {
            id: `so-${Date.now()}`,
            title: jobTitle,
            company: 'Starlight Technologies',
            sentCount: candidateNames.length,
            acceptedCount: 0,
            pendingCount: candidateNames.length,
          },
        ];
      }
    });
  };

  const handleViewListingDetails = () => {
    if (!selectedOfferGroup || !onSelectListing) return;
    const matchingListing = listings.find(
      (l) => l.title.toLowerCase() === selectedOfferGroup.title.toLowerCase()
    );
    if (matchingListing) {
      onSelectListing(matchingListing);
    } else {
      // Mock one if not explicitly found in listing state
      const mockListing: JobListing = {
        id: 'list-mock',
        title: selectedOfferGroup.title,
        company: selectedOfferGroup.company,
        status: 'ACTIVE',
        posted_at: 'Posted 2 hours ago',
      };
      onSelectListing(mockListing);
    }
  };

  if (view === 'details' && selectedOfferGroup) {
    return (
      <OfferDetailsScreen
        offerGroup={selectedOfferGroup}
        onBack={() => setView('dashboard')}
        onViewListingDetails={handleViewListingDetails}
      />
    );
  }

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
      <div className="w-full max-w-[960px] bg-white rounded-[24px] p-0 flex flex-col items-center gap-[24px]">
        <div className="w-full h-[94px] flex flex-row items-start p-0 gap-[24px] flex-none self-stretch">
          {/* Card 1: Offer Sent */}
          <div className="flex-1 h-[94px] bg-white border border-[#EEF2FF] rounded-[24px] p-[16px] flex flex-col justify-center items-start gap-[8px] box-border">
            <span className="font-['Poppins'] font-semibold text-[24px] leading-[32px] text-[#6366F1]">
              {totalOffersSent}
            </span>
            <span className="font-['Poppins'] font-normal text-[14px] leading-[20px] text-black">
              Offers sent
            </span>
          </div>

          {/* Card 2: Accepted */}
          <div className="flex-1 h-[94px] bg-white border border-[#EEF2FF] rounded-[24px] p-[16px] flex flex-col justify-center items-start gap-[8px] box-border">
            <span className="font-['Poppins'] font-semibold text-[24px] leading-[32px] text-[#6366F1]">
              {totalAccepted}
            </span>
            <span className="font-['Poppins'] font-normal text-[14px] leading-[20px] text-black">
              Accepted
            </span>
          </div>
        </div>

        {/* Job Cards list with Scroll */}
        <div className="w-full flex flex-col gap-[16px] overflow-y-auto max-h-[460px] pr-1 scrollbar-thin">
          {sentOffers.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center gap-3 text-center w-full">
              <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center border border-slate-100">
                <Icon icon="solar:gift-linear" className="w-5 h-5 text-gray-400" />
              </div>
              <h4 className="text-gray-700 text-sm font-semibold font-['Poppins']">No offers sent yet</h4>
              <p className="text-gray-400 text-xs font-['Poppins'] max-w-xs">
                Click "Send offer" above to select candidates and extend an official offer.
              </p>
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
