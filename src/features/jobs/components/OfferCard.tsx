import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { JobOffer } from '../types/jobs.types';
import { CocpitConfirmBox } from '@/shared/commonComponents/CocpitConfirmBox';
import { Icon } from '@iconify/react';
import { toast } from 'sonner';

interface OfferCardProps {
  offer: JobOffer;
  onAccept: (id: string) => void;
  onDecline: (id: string) => void;
}

export const OfferCard: React.FC<OfferCardProps> = ({ offer, onAccept, onDecline }) => {
  const router = useRouter();
  const [showAcceptConfirm, setShowAcceptConfirm] = useState(false);
  const [showDeclineConfirm, setShowDeclineConfirm] = useState(false);

  const rawOffer = offer as Record<string, any>;
  const expiryText = rawOffer.offer_expiry_text || `Offer ends in ${offer.days_remaining} day${offer.days_remaining === 1 ? '' : 's'}`;
  
  const getExpiryColor = (days: number) => {
    if (days <= 5) return '#FF8D28';
    if (days <= 20) return '#FBBF24';
    return '#6B7280';
  };
  const expiryColorHex = getExpiryColor(offer.days_remaining);

  return (
    <div 
      onClick={() => router.push(`/jobs/${offer.id}`)}
      className="relative w-full flex flex-col items-end cursor-pointer group"
    >
      {/* PART 1 — Job Details Frame (Frame 2609038) */}
      <div 
        style={{ borderWidth: '1px', borderStyle: 'solid' }}
        className="relative w-full h-[90px] rounded-[24px] bg-white p-[16px] flex flex-row justify-between items-center box-border gap-[8px] border-[#EEF2FF] group-hover:border-indigo-200 transition-all duration-300"
      >
        
        {/* LEFT — Job info container (Frame 2609060) */}
        <div className="flex flex-col items-start justify-center p-0 gap-[1px] h-[58px]">
          {/* Role + Deadline Row */}
          <div className="flex flex-row items-center gap-[16px]">
            <span className="font-['Poppins'] font-medium text-[16px] leading-[24px] text-black">
              {offer.job_role}
            </span>
            {expiryText && (
              <span 
                style={{ color: expiryColorHex }}
                className="text-xs font-medium font-['Poppins']"
              >
                {expiryText}
              </span>
            )}
          </div>
          <span className="font-['Poppins'] font-normal text-[12px] leading-[16px] text-[#6B7280] truncate w-full">
            {offer.company_name}
          </span>
          <span className="font-['Poppins'] font-medium text-[12px] leading-[16px] text-[#6B7280] truncate w-full">
            {offer.location}
          </span>
        </div>

        <div className="flex-1" />

        {/* RIGHT — Action buttons (Frame 2609059) */}
        {offer.status === 'pending' ? (
          <div 
            onClick={(e) => e.stopPropagation()}
            className="flex flex-row items-center p-0 gap-[8px] w-[288px] h-[40px] mr-[16px] my-[25px]"
          >
            <button
              onClick={() => setShowDeclineConfirm(true)}
              className="box-border flex justify-center items-center px-[16px] py-[8px] gap-[10px] w-[140px] h-[40px] bg-white border border-[#818CF8] rounded-[24px] font-['Poppins'] font-normal text-[14px] text-[#818CF8] hover:bg-[#818CF8]/5 transition-all duration-200 active:scale-95 cursor-pointer"
            >
              Decline
            </button>
            <button
              onClick={() => setShowAcceptConfirm(true)}
              className="box-border flex justify-center items-center px-[16px] py-[8px] gap-[10px] w-[140px] h-[40px] bg-[#6366F1] border border-white rounded-[24px] font-['Poppins'] font-normal text-[14px] text-white hover:bg-[#6366F1]/90 transition-all duration-200 active:scale-95 cursor-pointer"
            >
              Accept
            </button>
          </div>
        ) : offer.status === 'accepted' ? (
          <div 
            onClick={(e) => e.stopPropagation()}
            className="flex flex-row items-center justify-end w-[288px] h-[40px] mr-[16px] my-[25px] gap-[8px]"
          >
            {offer.is_active === false ? (
              <span className="font-['Poppins'] text-[12px] font-semibold text-red-500 bg-red-50 px-2 py-1 rounded-md">
                Job Deleted
              </span>
            ) : offer.job_status === 'CLOSED' ? (
              <span className="font-['Poppins'] text-[12px] font-semibold text-amber-500 bg-amber-50 px-2 py-1 rounded-md">
                Job Closed
              </span>
            ) : null}
            <button
              onClick={() => {
                if (offer.recruiter.id) {
                  router.push(`/messaging?userId=${offer.recruiter.id}`);
                } else {
                  toast.error('Recruiter information is unavailable.');
                }
              }}
              className="box-border flex justify-center items-center px-[16px] py-[8px] gap-[10px] w-[140px] h-[40px] bg-[#6366F1] border border-white rounded-[24px] font-['Poppins'] font-normal text-[14px] text-white hover:bg-[#6366F1]/90 transition-all duration-200 active:scale-95 cursor-pointer"
            >
              Chat
            </button>
          </div>
        ) : offer.status === 'declined' ? (
          <div 
            onClick={(e) => e.stopPropagation()}
            className="flex flex-row items-center justify-end w-[288px] h-[40px] mr-[16px] my-[25px]"
          >
            <span className="font-['Poppins'] text-sm font-semibold uppercase tracking-wider text-red-500">
              Declined
            </span>
          </div>
        ) : offer.status === 'withdrawn' ? (
          <div 
            onClick={(e) => e.stopPropagation()}
            className="flex flex-row items-center justify-end w-[288px] h-[40px] mr-[16px] my-[25px]"
          >
            <span className="font-['Poppins'] text-sm font-semibold uppercase tracking-wider text-gray-500">
              Withdrawn
            </span>
          </div>
        ) : offer.status === 'expired' ? (
          <div 
            onClick={(e) => e.stopPropagation()}
            className="flex flex-row items-center justify-end w-[288px] h-[40px] mr-[16px] my-[25px]"
          >
            <span className="font-['Poppins'] text-sm font-semibold uppercase tracking-wider text-gray-500">
              Expired
            </span>
          </div>
        ) : null}

        {/* CONNECTOR LINE (Vector 9) between parts */}
        {offer.note && (
          <div
            style={{
              position: 'absolute',
              width: '35px',
              height: '67px',
              left: '25.5px',
              top: '89.5px',
              borderLeft: '1px solid #EEF2FF',
              borderBottom: '1px solid #EEF2FF',
              borderBottomLeftRadius: '24px',
              pointerEvents: 'none'
            }}
          />
        )}
      </div>

      {/* PART 2 — Note Frame (Frame 2609030) */}
      {offer.note && (
        <div 
          style={{
            borderTop: '1px solid #EEF2FF',
            borderRight: '1px solid #EEF2FF',
            borderBottom: '1px solid #EEF2FF',
            borderLeft: '2px solid #6366F1',
            minHeight: '104px'
          }}
          className="box-border flex flex-col items-start p-[12px] px-[16px] gap-[8px] w-[calc(100%-60px)] bg-[#F9FAFF] rounded-tr-[16px] rounded-br-[16px] rounded-bl-[16px] mt-[16px] self-end"
        >
          {/* Recruiter info row (Frame 2609033) */}
          <div className="flex flex-row justify-start items-center p-0 gap-[8px] w-full h-[40px]">
            {/* Avatar */}
            {offer.recruiter.avatar ? (
              <img
                src={offer.recruiter.avatar}
                alt={offer.recruiter.name}
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 border border-slate-200 bg-indigo-50 flex items-center justify-center">
                <Icon icon="solar:user-bold" className="w-5 h-5 text-indigo-400" />
              </div>
            )}
            
            {/* Name + Headline container */}
            <div className="flex flex-col justify-center py-[4px] h-[32px] flex-1 min-w-0">
              <span className="font-['Poppins'] font-normal text-[12px] leading-[16px] text-[#6366F1] uppercase tracking-wider truncate">
                {offer.recruiter.name}
              </span>
              <span className="font-['Poppins'] font-normal text-[12px] leading-[16px] text-[#6366F1] uppercase tracking-wider truncate">
                {offer.recruiter.headline}
              </span>
            </div>
          </div>

          {/* Note text */}
          <div className="mt-[8px] w-full">
            <p className="font-['Poppins'] font-normal text-[12px] leading-[16px] text-[#6B7280] whitespace-pre-line">
              {offer.note}
            </p>
          </div>
        </div>
      )}

      {/* Confirmation modals */}
      <CocpitConfirmBox
        isOpen={showDeclineConfirm}
        title="Decline Offer?"
        message="Are you sure you want to decline this offer?"
        confirmText="Decline"
        cancelText="Cancel"
        onConfirm={() => {
          onDecline(offer.id);
          setShowDeclineConfirm(false);
        }}
        onCancel={() => setShowDeclineConfirm(false)}
      />

      <CocpitConfirmBox
        isOpen={showAcceptConfirm}
        title="Accept Offer?"
        message="Confirm accepting this job offer?"
        confirmText="Accept"
        cancelText="Cancel"
        onConfirm={() => {
          onAccept(offer.id);
          setShowAcceptConfirm(false);
        }}
        onCancel={() => setShowAcceptConfirm(false)}
      />
    </div>
  );
};

export default OfferCard;
