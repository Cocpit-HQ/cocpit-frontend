import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { JobOffer } from '../../types/jobs.types';
import { CocpitConfirmBox } from '@/shared/commonComponents/CocpitConfirmBox';
import { UserIcon } from '@/components/icons';
import { Icon } from '@iconify/react';
import { toast } from 'sonner';
import { FeatureDisabledTooltip } from '@/components/feature-flags';

interface OfferCardProps {
  offer: JobOffer;
  onAccept: (id: string) => void;
  onDecline: (id: string) => void;
}

export const OfferCard: React.FC<OfferCardProps> = ({ offer, onAccept, onDecline }) => {
  const router = useRouter();
  const [showAcceptConfirm, setShowAcceptConfirm] = useState(false);
  const [showDeclineConfirm, setShowDeclineConfirm] = useState(false);
  const [avatarError, setAvatarError] = useState(false);

  const rawOffer = offer as Record<string, any>;
  const displayCompany = offer.company_name || rawOffer.company || rawOffer.org_name || rawOffer.organization?.name || 'Company';
  const expiryText = rawOffer.offer_expiry_text || (offer.days_remaining ? `Offer ends in ${offer.days_remaining} day${offer.days_remaining === 1 ? '' : 's'}` : 'Offer ends soon');

  return (
    <div className="w-full max-w-[801px] flex flex-col items-center select-none font-dm-sans">
      {/* Main Offer Card Container */}
      <div
        onClick={() => router.push(`/jobs/${offer.job_id || offer.id}`)}
        className="w-full p-3 bg-ds-bg rounded-2xl border border-ds-border flex flex-col gap-3 cursor-pointer"
      >
        {offer.status === 'pending' ? (
          /* Pending layout: Frame 2609051 with Frame 2609971 on top and Frame 2609973 on bottom */
          <div className="w-full flex flex-col gap-3">
            {/* Top Row (Frame 2609971): Job Title left, Expiry countdown right */}
            <div className="w-full flex items-center justify-between gap-2.5">
              <h3 className="text-ds-text-primary ds-text-body-1 font-medium truncate">
                {offer.job_role}
              </h3>

              <div className="shrink-0 flex items-center justify-end">
                {expiryText && (
                  <span className="text-ds-warning ds-text-small font-normal">
                    {expiryText}
                  </span>
                )}
              </div>
            </div>

            {/* Bottom Row (Frame 2609973): Company + Location left, Accept/Decline buttons right */}
            <div className="w-full flex items-end justify-between gap-3">
              <div className="flex flex-col items-start gap-1 min-w-0">
                <span className="text-ds-text-secondary ds-text-secondary font-normal truncate">
                  {displayCompany}
                </span>
                <div className="flex items-center gap-2 text-ds-text-secondary ds-text-secondary font-normal">
                  <span>{rawOffer.work_mode || rawOffer.work_model || 'Hybrid'}</span>
                  <span className="size-1 rounded-full bg-ds-text-muted shrink-0" />
                  <span>{offer.location || 'Kolhapur'}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                <FeatureDisabledTooltip featureKey="enableJobOffers" disabledMessage="Responding to job offers is temporarily disabled by admin.">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowAcceptConfirm(true)}
                      className="h-9 px-4 rounded-full bg-ds-accent hover:opacity-90 active:scale-95 text-ds-text-primary ds-text-body-1 transition-all shadow-sm flex items-center justify-center cursor-pointer border-none outline-none"
                    >
                      Accept
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowDeclineConfirm(true)}
                      className="h-9 px-4 rounded-full border border-ds-border hover:bg-ds-surface-1/50 active:scale-95 text-ds-text-primary ds-text-body-1 transition-all flex items-center justify-center cursor-pointer outline-none"
                    >
                      Decline
                    </button>
                  </div>
                </FeatureDisabledTooltip>
              </div>
            </div>
          </div>
        ) : (
          /* Normal / Without Thoughts layout: Frame 2609050 with 3-line info stack on left and Chat/Status on right */
          <div className="w-full flex items-center justify-between gap-3 min-h-[72px]">
            <div className="flex flex-col items-start gap-1 min-w-0">
              <h3 className="text-ds-text-primary ds-text-body-1 font-medium truncate">
                {offer.job_role}
              </h3>
              <span className="text-ds-text-secondary ds-text-secondary font-normal truncate">
                {displayCompany}
              </span>
              <div className="flex items-center gap-2 text-ds-text-secondary ds-text-secondary font-normal">
                <span>{rawOffer.work_mode || rawOffer.work_model || 'Hybrid'}</span>
                <span className="size-1 rounded-full bg-ds-text-muted shrink-0" />
                <span>{offer.location || 'Kolhapur'}</span>
              </div>
            </div>

            <div className="shrink-0 flex items-center justify-end" onClick={(e) => e.stopPropagation()}>
              {offer.status === 'accepted' ? (
                <button
                  type="button"
                  onClick={async () => {
                    if (offer.recruiter.id) {
                      const params = new URLSearchParams();
                      if (offer.org_id) params.set('companyId', offer.org_id);
                      else params.set('userId', offer.recruiter.id);
                      if (offer.offer_id) params.set('offerContext', offer.offer_id);
                      router.push(`/messaging?${params.toString()}`);
                    } else {
                      toast.error('Recruiter information is unavailable.');
                    }
                  }}
                  className="h-9 px-4 rounded-full bg-ds-accent hover:opacity-90 active:scale-95 text-ds-text-primary ds-text-body-1 transition-all shadow-sm flex items-center justify-center cursor-pointer border-none outline-none shrink-0"
                >
                  Chat
                </button>
              ) : offer.status === 'expired' ? (
                <span className="text-ds-error ds-text-small px-3 py-1.5 text-center flex items-center">
                  Offer expired
                </span>
              ) : offer.status === 'declined' ? (
                <span className="text-ds-text-muted ds-text-small px-3 py-1.5 text-center flex items-center">
                  Offer declined
                </span>
              ) : offer.status === 'withdrawn' ? (
                <span className="text-ds-text-muted ds-text-small px-3 py-1.5 text-center flex items-center">
                  Offer withdrawn
                </span>
              ) : null}
            </div>
          </div>
        )}
      </div>

      {/* Recruiter Speech Card below Offer Card with Vector 9 Elbow Branch Connector (Frame 2609970 / Group 21) */}
      {offer.note && (
        <div className="w-full relative flex justify-end pl-[68px] sm:pr-[33px] pr-2">
          {/* Vector 9: Elbow Branch Connector (starts at left: 33px under job card, drops 67px, curves into note box at left: 68px) */}
          <div
            className="absolute left-[33px] top-0 w-[35px] h-[67px] border-l border-b border-ds-border rounded-bl-2xl pointer-events-none z-10"
          />

          {/* Frame 2609030: Recruiter Note Box (starts 16px below main card, min-h-[84px] h-auto for fluid 3-4 line expansion) */}
          <div className="w-full max-w-[700px] min-h-[84px] h-auto mt-4 p-3 bg-ds-surface-1 border-l-2 border-ds-accent rounded-r-2xl rounded-bl-2xl rounded-tl-none flex flex-col items-start gap-2 shadow-sm transition-[height] duration-200">
            {/* Frame 2609968 */}
            <div className="flex items-center gap-2 h-9">
              {/* Rectangle 29: Avatar (32px x 32px, rounded-full) */}
              <div className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center shrink-0 flex-none bg-ds-surface-2">
                {offer.recruiter.avatar && !avatarError ? (
                  <img
                    src={offer.recruiter.avatar}
                    alt={offer.recruiter.name || displayCompany}
                    className="w-full h-full object-cover rounded-full"
                    onError={() => setAvatarError(true)}
                  />
                ) : (
                  <UserIcon className="w-full h-full p-1.5 text-ds-text-primary" />
                )}
              </div>
              {/* Frame 2609931 */}
              <div className="flex flex-col items-start justify-center h-9 min-w-0">
                <span className="font-dm-sans font-semibold text-base leading-6 text-ds-text-primary truncate">
                  {offer.recruiter.name || displayCompany}
                </span>
                <span className="font-dm-sans font-normal text-[10px] leading-3 text-ds-text-secondary truncate">
                  {offer.recruiter.headline || (displayCompany ? `Recruiter at ${displayCompany}` : 'Hiring Team')}
                </span>
              </div>
            </div>

            <p className="font-dm-sans font-normal text-xs leading-4 text-ds-text-secondary self-stretch m-0 whitespace-pre-line break-words">
              {offer.note}
            </p>
          </div>
        </div>
      )}

      {/* Confirmation Modals */}
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
