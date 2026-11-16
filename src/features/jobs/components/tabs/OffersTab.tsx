import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { JobOffer } from '../../types/jobs.types';
import { formatJobLocation } from '../../utils/location.utils';
import OfferCard from '../cards/OfferCard';
import OfferCardSkeleton from '../skeletons/OfferCardSkeleton';
import { Icon } from '@iconify/react';
import { OfferIcon, UserIcon, Icon as CustomIcon } from '@/components/icons';
import { CocpitConfirmBox } from '@/shared/commonComponents/CocpitConfirmBox';
import { toast } from 'sonner';
import { useBodyScrollLock } from '@/hooks';

interface OffersTabProps {
  offers: JobOffer[];
  isLoading: boolean;
  onAccept: (id: string) => void;
  onDecline: (id: string) => void;
}

const RecruiterAvatar: React.FC<{
  avatar?: string;
  name?: string;
}> = ({ avatar, name }) => {
  const [hasError, setHasError] = useState(false);

  return (
    <div className="size-8 rounded-full overflow-hidden flex items-center justify-center shrink-0 bg-ds-surface-2">
      {avatar && !hasError ? (
        <img
          src={avatar}
          alt={name || 'Recruiter'}
          className="w-full h-full object-cover rounded-full"
          onError={() => setHasError(true)}
        />
      ) : (
        <UserIcon className="w-full h-full p-1.5 text-ds-text-primary" />
      )}
    </div>
  );
};

export const OffersTab: React.FC<OffersTabProps> = ({
  offers,
  isLoading,
  onAccept,
  onDecline,
}) => {
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState<'All' | 'Current' | 'Decline' | 'Expired'>('All');
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  useBodyScrollLock(mobileFilterOpen);
  const [tempFilter, setTempFilter] = useState<'All' | 'Current' | 'Decline' | 'Expired'>('All');

  // Confirmation modal states for mobile
  const [acceptModalId, setAcceptModalId] = useState<string | null>(null);
  const [declineModalId, setDeclineModalId] = useState<string | null>(null);

  const visibleOffers = React.useMemo(() => offers.filter(o => o.status !== 'withdrawn'), [offers]);

  const filteredOffers = React.useMemo(() => {
    if (activeFilter === 'All') return visibleOffers;
    if (activeFilter === 'Current') {
      return visibleOffers.filter(o => o.status === 'pending' || o.status === 'accepted');
    }
    if (activeFilter === 'Decline') {
      return visibleOffers.filter(o => o.status === 'declined');
    }
    if (activeFilter === 'Expired') {
      return visibleOffers.filter(o => o.status === 'expired');
    }
    return visibleOffers;
  }, [visibleOffers, activeFilter]);

  const handleOpenMobileFilter = () => {
    setTempFilter(activeFilter);
    setMobileFilterOpen(true);
  };

  const handleApplyMobileFilter = () => {
    setActiveFilter(tempFilter);
    setMobileFilterOpen(false);
  };

  const handleClearMobileFilter = () => {
    setTempFilter('All');
    setActiveFilter('All');
    setMobileFilterOpen(false);
  };

  if (visibleOffers.length === 0 && !isLoading) {
    return (
      <div className="w-full max-w-[800px] py-28 flex flex-col justify-center items-center gap-2 select-none animate-in fade-in duration-200 font-dm-sans">
        {/* IconFrame: 64x64px, padding 12px, bg #1A1A20 (--ds-surface-1), rounded-full */}
        <div className="w-16 h-16 p-3 bg-ds-surface-1 rounded-full flex items-center justify-center shrink-0">
          <OfferIcon size={40} className="w-10 h-10 text-ds-text-muted shrink-0" fill="currentColor" />
        </div>

        {/* Text Container */}
        <div className="flex flex-col justify-start items-center gap-2 text-center">
          <h3 className="text-ds-text-primary text-base font-semibold font-dm-sans leading-6">
            No jobs offers yet
          </h3>
          <p className="max-w-sm text-ds-text-secondary text-sm font-normal font-dm-sans leading-5">
            Job offers from recruiters and hiring teams will appear here when they match your profile.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[800px] flex flex-col gap-5 font-dm-sans">
      {/* ============================================================ */}
      {/* MOBILE VIEW (< md) 98% Pixel-Perfect to Figma Snippet & Image */}
      {/* ============================================================ */}
      <div className="flex md:hidden flex-col gap-5 w-full">
        {/* Mobile Header Row: 'Official Job Offers' + 20x20 Library Filter Icon */}
        <div className="flex items-center justify-between gap-4 w-full">
          <h2 className="text-ds-text-primary text-base font-normal font-dm-sans leading-6">
            Official Job Offers
          </h2>
          <button
            type="button"
            onClick={handleOpenMobileFilter}
            className="w-5 h-5 flex-none order-1 grow-0 flex items-center justify-center text-ds-text-primary hover:text-ds-accent transition-colors cursor-pointer"
            aria-label="Filter offers"
          >
            <CustomIcon name="filter" size={20} className="w-5 h-5 text-ds-text-primary" />
          </button>
        </div>

        {/* Mobile Offers List */}
        <div className="flex flex-col gap-5 w-full">
          {isLoading ? (
            <div className="flex flex-col gap-5 w-full">
              {[1, 2, 3].map((n) => (
                <OfferCardSkeleton key={n} />
              ))}
            </div>
          ) : filteredOffers.length === 0 ? (
            <div className="w-full py-16 flex flex-col justify-center items-center gap-3 text-center">
              <div className="w-16 h-16 p-3 bg-ds-surface-1 rounded-full flex items-center justify-center shrink-0">
                <OfferIcon size={40} className="w-10 h-10 text-ds-text-muted shrink-0" fill="currentColor" />
              </div>
              <div className="flex flex-col items-center gap-1 max-w-sm px-4 text-center">
                <h4 className="text-ds-text-primary text-base font-semibold font-dm-sans">
                  No offers found
                </h4>
                <p className="text-ds-text-secondary text-sm font-normal font-dm-sans">
                  There are no offers in this category.
                </p>
              </div>
            </div>
          ) : (
            filteredOffers.map((offer) => {
              const rawOffer = offer as Record<string, any>;
              const displayCompany = offer.company_name || rawOffer.company || rawOffer.org_name || rawOffer.organization?.name || 'Company';
              const expiryText = rawOffer.offer_expiry_text || (offer.days_remaining ? `Offer ends in ${offer.days_remaining} day${offer.days_remaining === 1 ? '' : 's'}` : '');
              const offerMessage = offer.note || rawOffer.message || rawOffer.note;
              const formattedLocation = formatJobLocation(offer.location || rawOffer.location) || 'Kolhapur';
              const recruiter = offer.recruiter || rawOffer.recruiter || {};

              return (
                <div
                  key={`mobile-${offer.id}`}
                  className="w-full py-1 flex flex-col justify-start items-end gap-2"
                >
                  {/* Job Details Row: Status/Timeline vertically center-aligned with 3-line info block */}
                  <div
                    onClick={() => router.push(`/jobs/${offer.job_id || offer.id}`)}
                    className="w-full flex flex-row justify-between items-center cursor-pointer gap-3"
                  >
                    <div className="flex flex-col justify-start items-start gap-1 min-w-0 flex-1">
                      <h3 className="text-ds-text-primary text-base font-medium font-dm-sans leading-6 truncate">
                        {offer.job_role}
                      </h3>
                      <span className="text-ds-text-secondary text-sm font-normal font-dm-sans leading-5 truncate">
                        {displayCompany}
                      </span>
                      <div className="flex items-center gap-2 text-ds-text-secondary text-sm font-normal font-dm-sans leading-5">
                        <span>{rawOffer.work_mode || rawOffer.work_model || 'Hybrid'}</span>
                        <span className="size-1 bg-ds-text-muted rounded-full shrink-0" />
                        <span className="truncate">{formattedLocation}</span>
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center justify-end">
                      {offer.status === 'pending' && expiryText ? (
                        <span className="text-ds-warning text-xs font-normal font-dm-sans leading-4">
                          {expiryText}
                        </span>
                      ) : offer.status === 'expired' ? (
                        <span className="text-ds-error text-xs font-normal font-dm-sans leading-4">
                          Offer expired
                        </span>
                      ) : offer.status === 'declined' ? (
                        <span className="text-ds-text-muted text-xs font-normal font-dm-sans leading-4">
                          Offer declined
                        </span>
                      ) : offer.status === 'withdrawn' ? (
                        <span className="text-ds-text-muted text-xs font-normal font-dm-sans leading-4">
                          Offer withdrawn
                        </span>
                      ) : null}
                    </div>
                  </div>

                  {/* Recruiter Speech Bubble Note Box (Figma Frame 2609030) */}
                  {offerMessage && (
                    <div className="w-full max-w-[361px] p-3 bg-ds-surface-1 rounded-tr-2xl rounded-bl-2xl rounded-br-2xl rounded-tl-none border-l-2 border-ds-accent flex flex-col justify-start items-start gap-2 shadow-sm">
                      {/* Frame 2609968 */}
                      <div className="flex items-center gap-2 h-9">
                        <RecruiterAvatar
                          avatar={recruiter.avatar}
                          name={recruiter.name || displayCompany}
                        />
                        <div className="flex flex-col justify-start items-start min-w-0">
                          <span className="text-ds-text-primary text-base font-semibold font-dm-sans leading-6 truncate">
                            {recruiter.name || displayCompany}
                          </span>
                          <span className="text-ds-text-secondary text-[10px] font-normal font-dm-sans leading-3 truncate">
                            {recruiter.headline || (displayCompany ? `Founder and CEO at ${displayCompany}` : 'Hiring Team')}
                          </span>
                        </div>
                      </div>
                      <p className="w-full text-ds-text-secondary text-xs font-normal font-dm-sans leading-4 m-0 whitespace-pre-line break-words">
                        {offerMessage}
                      </p>
                    </div>
                  )}

                  {/* Action buttons */}
                  {offer.status === 'pending' && (
                    <div className="flex items-center justify-end gap-2 mt-1">
                      <button
                        type="button"
                        onClick={() => setAcceptModalId(offer.id)}
                        className="w-20 px-3 py-1.5 bg-ds-accent hover:opacity-90 active:scale-95 text-ds-text-primary rounded-full flex justify-center items-center text-base font-medium font-dm-sans transition-all cursor-pointer border-none outline-none"
                      >
                        Accept
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeclineModalId(offer.id)}
                        className="w-20 px-3 py-1.5 rounded-full border border-ds-border hover:bg-ds-surface-1 text-ds-text-primary flex justify-center items-center text-base font-medium font-dm-sans transition-all active:scale-95 cursor-pointer outline-none"
                      >
                        Decline
                      </button>
                    </div>
                  )}

                  {offer.status === 'accepted' && (
                    <div className="flex items-center justify-end mt-1">
                      <button
                        type="button"
                        onClick={async () => {
                          if (recruiter?.id) {
                            const params = new URLSearchParams();
                            if (offer.org_id) params.set('companyId', offer.org_id);
                            else params.set('userId', recruiter.id);
                            if (offer.offer_id) params.set('offerContext', offer.offer_id);
                            router.push(`/messaging?${params.toString()}`);
                          } else {
                            toast.error('Recruiter information is unavailable.');
                          }
                        }}
                        className="w-24 px-3 py-1.5 bg-ds-accent hover:opacity-90 active:scale-95 text-ds-text-primary rounded-full flex justify-center items-center text-base font-medium font-dm-sans transition-all cursor-pointer border-none outline-none"
                      >
                        Chat
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ============================================================ */}
      {/* DESKTOP VIEW (>= md) Strictly Preserved 1:1                     */}
      {/* ============================================================ */}
      <div className="hidden md:flex flex-col gap-5 w-full">
        {/* Official Job Offers Header */}
        <div className="w-full h-10 flex items-center">
          <h2 className="text-ds-text-primary ds-text-body font-normal">
            Official Job Offers
          </h2>
        </div>

        {/* Sub-tabs Row (All, Current, Decline, Expired) */}
        <div className="w-full flex items-center justify-between select-none">
          <div className="flex items-center gap-3 overflow-x-auto no-scrollbar h-9">
            {(['All', 'Current', 'Decline', 'Expired'] as const).map((subTab) => {
              const isActive = activeFilter === subTab;
              return (
                <button
                  type="button"
                  key={subTab}
                  onClick={() => setActiveFilter(subTab)}
                  className={`relative h-9 px-3 py-1.5 flex flex-col justify-center items-center ds-text-body-1 font-medium focus:outline-none transition-colors whitespace-nowrap cursor-pointer shrink-0 ${
                    isActive ? 'text-ds-text-primary' : 'text-ds-text-secondary hover:text-ds-text-primary'
                  }`}
                >
                  <span>{subTab}</span>
                  {isActive && (
                    <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-ds-accent shadow-sm" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Offers List */}
        <div className="w-full flex flex-col gap-5">
          {isLoading ? (
            <div className="w-full flex flex-col gap-5">
              {[1, 2, 3].map((n) => (
                <OfferCardSkeleton key={n} />
              ))}
            </div>
          ) : filteredOffers.length === 0 ? (
            <div className="w-full py-16 flex flex-col justify-center items-center gap-3 text-center">
              <div className="w-16 h-16 p-3 bg-ds-surface-1 rounded-full flex items-center justify-center shrink-0">
                <OfferIcon size={40} className="w-10 h-10 text-ds-text-muted shrink-0" fill="currentColor" />
              </div>
              <div className="flex flex-col items-center gap-1 max-w-sm px-4 text-center">
                <h4 className="text-ds-text-primary text-base font-semibold font-dm-sans">
                  No offers found
                </h4>
                <p className="text-ds-text-secondary text-sm font-normal font-dm-sans">
                  There are no offers in this category.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-5 w-full">
              {filteredOffers.map((offer) => (
                <OfferCard
                  key={offer.id}
                  offer={offer}
                  onAccept={onAccept}
                  onDecline={onDecline}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ============================================================ */}
      {/* Mobile Filter Bottom Sheet matching Figma layer CSS (more 1) */}
      {/* ============================================================ */}
      {mobileFilterOpen && (
        <div
          className="fixed inset-0 z-50 flex flex-col justify-end bg-black/60 backdrop-blur-xs animate-in fade-in duration-200 md:hidden touch-none"
          onClick={() => setMobileFilterOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-[393px] mx-auto bg-ds-bg border-t border-ds-border rounded-t-[8px] flex flex-col items-start p-[8px_12px_24px] gap-4 animate-in slide-in-from-bottom duration-200 shadow-2xl select-none"
          >
            {/* Frame 2608582: Drag Handle */}
            <div className="w-full h-5 flex flex-col items-center justify-center shrink-0">
              <div className="w-[50px] h-[3px] bg-ds-text-muted rounded-full" />
            </div>

            {/* Frame 2609314: Header */}
            <div className="w-full h-9 flex flex-row justify-between items-center shrink-0">
              <div className="h-9 px-3 py-1.5 rounded-lg flex items-center justify-center">
                <span className="font-dm-sans font-semibold text-base leading-6 text-ds-text-primary">
                  Filter
                </span>
              </div>
              <button
                type="button"
                onClick={handleClearMobileFilter}
                className="h-8 px-3 py-1.5 rounded-lg flex items-center justify-center cursor-pointer"
              >
                <span className="font-dm-sans font-normal text-sm leading-5 text-ds-error">
                  Clear
                </span>
              </button>
            </div>

            {/* Filter Options */}
            <div className="w-full flex flex-col gap-2 shrink-0 px-1">
              {(['All', 'Current', 'Decline', 'Expired'] as const).map((subTab) => {
                const isSelected = tempFilter === subTab;
                return (
                  <button
                    type="button"
                    key={subTab}
                    onClick={() => setTempFilter(subTab)}
                    className={`w-full py-2.5 px-3 text-left font-dm-sans text-sm leading-5 rounded-lg transition-colors cursor-pointer ${
                      isSelected
                        ? 'text-ds-accent font-medium bg-ds-surface-1'
                        : 'text-ds-text-primary hover:bg-ds-surface-1/50'
                    }`}
                  >
                    {subTab}
                  </button>
                );
              })}
            </div>

            {/* Frame 2610025: Apply Button */}
            <div className="w-full h-9 flex flex-row justify-center items-center shrink-0 mt-1">
              <button
                type="button"
                onClick={handleApplyMobileFilter}
                className="w-[250px] h-9 px-3 py-1.5 bg-ds-accent hover:opacity-90 active:scale-95 text-ds-text-primary rounded-full flex flex-row justify-center items-center gap-2.5 transition-all cursor-pointer border-none outline-none"
              >
                <span className="font-dm-sans font-medium text-base leading-6 text-ds-text-primary">
                  Apply
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Accept/Decline Confirmation Modals */}
      <CocpitConfirmBox
        isOpen={declineModalId !== null}
        title="Decline Offer?"
        message="Are you sure you want to decline this offer?"
        confirmText="Decline"
        cancelText="Cancel"
        onConfirm={() => {
          if (declineModalId) {
            onDecline(declineModalId);
            setDeclineModalId(null);
          }
        }}
        onCancel={() => setDeclineModalId(null)}
      />

      <CocpitConfirmBox
        isOpen={acceptModalId !== null}
        title="Accept Offer?"
        message="Confirm accepting this job offer?"
        confirmText="Accept"
        cancelText="Cancel"
        onConfirm={() => {
          if (acceptModalId) {
            onAccept(acceptModalId);
            setAcceptModalId(null);
          }
        }}
        onCancel={() => setAcceptModalId(null)}
      />
    </div>
  );
};

export default OffersTab;
