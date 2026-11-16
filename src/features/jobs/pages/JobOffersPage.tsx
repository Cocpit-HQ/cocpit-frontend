import React from 'react';
import { useJobOffers } from '../hooks/useJobOffers';
import OffersTab from '../components/tabs/OffersTab';
import { useRouter } from 'next/navigation';
import { Icon } from '@iconify/react';

export const JobOffersPage: React.FC = () => {
  const router = useRouter();
  const { offers, isLoading, handleAccept, handleDecline } = useJobOffers();

  return (
    <div className="w-full max-w-[800px] mx-auto min-h-screen bg-ds-bg text-ds-text-primary font-dm-sans px-4 py-6 flex flex-col gap-6">
      <div className="w-full flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/jobs')}
            aria-label="Back to Jobs"
            className="size-9 rounded-full border border-ds-border bg-ds-surface-1 text-ds-text-primary flex items-center justify-center cursor-pointer"
          >
            <Icon icon="lucide:chevron-left" className="size-5" />
          </button>
          <h1 className="text-lg font-bold text-ds-text-primary">Official Job Offers</h1>
        </div>
      </div>
      <OffersTab
        offers={offers}
        isLoading={isLoading}
        onAccept={handleAccept}
        onDecline={handleDecline}
      />
    </div>
  );
};

export default JobOffersPage;
