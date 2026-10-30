import React, { useState } from 'react';
import { JobOffer } from '../../types/jobs.types';
import OfferCard from '../cards/OfferCard';
import OfferCardSkeleton from '../skeletons/OfferCardSkeleton';
import { Icon } from '@iconify/react';
import { OfferIcon } from '@/components/icons';
import { Drawer, DrawerContent, DrawerTitle } from "@/components/ui/drawer";

interface OffersTabProps {
  offers: JobOffer[];
  isLoading: boolean;
  onAccept: (id: string) => void;
  onDecline: (id: string) => void;
}

export const OffersTab: React.FC<OffersTabProps> = ({
  offers,
  isLoading,
  onAccept,
  onDecline,
}) => {
  const [activeFilter, setActiveFilter] = useState<'All' | 'Current' | 'Decline' | 'Expired'>('All');
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  const filteredOffers = React.useMemo(() => {
    if (activeFilter === 'All') return offers;
    if (activeFilter === 'Current') {
      return offers.filter(o => o.status === 'pending' || o.status === 'accepted');
    }
    if (activeFilter === 'Decline') {
      return offers.filter(o => o.status === 'declined');
    }
    if (activeFilter === 'Expired') {
      return offers.filter(o => o.status === 'expired' || o.status === 'withdrawn');
    }
    return offers;
  }, [offers, activeFilter]);

  if (offers.length === 0 && !isLoading) {
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
      {/* Official Job Offers Header */}
      <div className="w-full h-10 flex items-center">
        <h2 className="text-ds-text-primary ds-text-body font-normal">
          Official Job Offers
        </h2>
      </div>

      {/* Sub-tabs Row (All, Current, Decline, Expired - without full bottom divider) */}
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

        <button
          type="button"
          onClick={() => setMobileFilterOpen(true)}
          className="md:hidden p-1.5 rounded-full hover:bg-ds-surface-1 text-ds-text-secondary hover:text-ds-text-primary transition-colors cursor-pointer"
        >
          <Icon icon="iconoir:filter-list" className="size-5" />
        </button>
      </div>

      {/* Mobile Filter Drawer */}
      <Drawer open={mobileFilterOpen} onOpenChange={setMobileFilterOpen}>
        <DrawerContent className="bg-ds-bg border-t border-ds-border rounded-t-2xl z-[80] pb-8 pt-4 text-ds-text-primary">
          <DrawerTitle className="sr-only">Filter Offers</DrawerTitle>
          <div className="flex flex-col px-4 gap-1">
            {(['All', 'Current', 'Decline', 'Expired'] as const).map((subTab) => (
              <button
                type="button"
                key={subTab}
                onClick={() => {
                  setActiveFilter(subTab);
                  setMobileFilterOpen(false);
                }}
                className={`w-full py-3 px-4 text-left font-dm-sans ds-text-secondary transition-colors rounded-xl cursor-pointer ${
                  activeFilter === subTab
                    ? 'text-ds-accent bg-ds-surface-1 font-medium'
                    : 'text-ds-text-secondary hover:bg-ds-surface-1'
                }`}
              >
                {subTab}
              </button>
            ))}
          </div>
        </DrawerContent>
      </Drawer>

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
  );
};

export default OffersTab;
