import React from 'react';
import { useRouter } from 'next/navigation';
import { useJobOffers } from '../hooks/useJobOffers';
import { OfferCard } from '../components/OfferCard';
import OfferCardSkeleton from '../components/skeletons/OfferCardSkeleton';
import * as jobsService from '../services/jobs.service';
import { Icon } from '@iconify/react';

export const JobOffersPage: React.FC = () => {
  const router = useRouter();
  const { offers, isLoading, handleAccept, handleDecline } = useJobOffers();

  // Hidden scrollbar logic: show on scroll and hover for 3 seconds
  const [showScrollbar, setShowScrollbar] = React.useState(false);
  const scrollbarTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  const triggerScrollbar = () => {
    setShowScrollbar(true);
    if (scrollbarTimeoutRef.current) {
      clearTimeout(scrollbarTimeoutRef.current);
    }
    scrollbarTimeoutRef.current = setTimeout(() => {
      setShowScrollbar(false);
    }, 3000);
  };

  React.useEffect(() => {
    return () => {
      if (scrollbarTimeoutRef.current) {
        clearTimeout(scrollbarTimeoutRef.current);
      }
    };
  }, []);

  // Tabs layout specification
  const tabs = [
    { id: 'Explore', label: 'Explore' },
    { id: 'My Applications', label: 'My Applications' },
    { id: 'Offers', label: 'Offers' },
    { id: 'Saved', label: 'Saved' }
  ];

  const handleTabClick = (tabId: string) => {
    router.push(`/jobs?tab=${tabId}`);
  };

  return (
    <div className="w-full max-w-[998px] h-auto min-h-[814px] mx-auto bg-white pt-[20px] px-4 md:px-[20px] pb-[20px] flex flex-col items-center gap-6 border border-slate-100/50 rounded-3xl">
      
      {/* Section 1 — Tabs row */}
      <div className="w-full flex flex-col md:flex-row justify-between items-start md:items-center pb-2 gap-4">
        <div className="flex flex-wrap justify-start items-center gap-2 md:gap-3 w-full md:w-auto">
          {tabs.map(tab => {
            const isActive = tab.id === 'Offers';
            return (
              <button
                key={tab.id}
                onClick={() => {
                  if (tab.id !== 'Offers') {
                    handleTabClick(tab.id);
                  }
                }}
                className={`h-10 px-4 md:px-5 py-1.5 rounded-3xl flex justify-center items-center text-sm font-semibold font-['Poppins'] transition-all duration-200 active:scale-95 border ${
                  isActive
                    ? 'bg-[#EEF2FF] border-transparent text-[#6366F1]'
                    : 'bg-white border-[#6366F1]/30 hover:border-[#6366F1] text-[#6366F1]/70 hover:text-[#6366F1]'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* My Listings tab link */}
        <button
          onClick={() => {
            router.push('/jobs?tab=My Listings');
          }}
          className="h-10 px-4 md:px-5 py-1.5 rounded-3xl flex justify-center items-center gap-2 text-sm font-semibold font-['Poppins'] transition-all duration-200 active:scale-95 border bg-white border-[#6366F1]/30 hover:border-[#6366F1] text-[#6366F1]/70 hover:text-[#6366F1] w-full md:w-auto"
        >
          <span>My Listings</span>
          <Icon icon="lucide:chevron-right" className="w-4 h-4" />
        </button>
      </div>

      {/* Section 2 — Title row (margin-top 24px) */}
      <div className="w-full flex flex-row items-center flex-none">
        <h1 className="font-['Poppins'] font-semibold text-lg leading-6 text-black">
          Official Job Offers
        </h1>
      </div>

      {/* Section 3 — Offers list (margin-top 24px) */}
      <div 
        onScroll={triggerScrollbar}
        onMouseEnter={triggerScrollbar}
        onMouseMove={triggerScrollbar}
        className={`job-scroll-container w-full h-auto min-h-[500px] flex-grow overflow-y-auto pr-2 pb-12 flex flex-col gap-6 [scrollbar-width:thin] [&::-webkit-scrollbar]:w-[6px] [&::-webkit-scrollbar-track]:bg-transparent transition-all duration-300 ${
          showScrollbar
            ? "[scrollbar-color:rgba(209,213,219,0.8)_transparent] dark:[scrollbar-color:rgba(55,65,81,0.8)_transparent] [&::-webkit-scrollbar-thumb]:bg-gray-300/80 [&::-webkit-scrollbar-thumb]:rounded-full dark:[&::-webkit-scrollbar-thumb]:bg-[#374151]/80"
            : "[scrollbar-color:transparent_transparent] [&::-webkit-scrollbar-thumb]:bg-transparent"
        }`}
      >
        {isLoading ? (
          <div className="w-full flex flex-col gap-6">
            {[1, 2, 3].map(n => (
              <OfferCardSkeleton key={n} />
            ))}
          </div>
        ) : offers.length === 0 ? (
          <div className="w-full py-16 flex flex-col items-center justify-center gap-4 bg-slate-50 rounded-3xl outline outline-1 outline-offset-[-1px] outline-indigo-50">
            <div className="w-16 h-16 rounded-full bg-indigo-50 flex items-center justify-center text-[#6366F1]">
              <Icon icon="solar:letter-linear" className="w-8 h-8" />
            </div>
            <h4 className="text-black text-lg font-semibold font-['Poppins']">No active offers</h4>
            <p className="text-gray-500 text-sm font-['Poppins'] max-w-xs text-center">
              You don't have any job offers right now. Keep applying to matching roles to get scouted by recruiters!
            </p>
            <button
              onClick={() => handleTabClick('Explore')}
              className="px-6 py-2.5 bg-[#6366F1] hover:bg-[#6366F1]/90 text-white rounded-[24px] text-sm font-semibold font-['Poppins'] transition-all"
            >
              Browse Jobs
            </button>
          </div>
        ) : (
          offers.map(offer => (
            <OfferCard
              key={offer.id}
              offer={offer}
              onAccept={handleAccept}
              onDecline={handleDecline}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default JobOffersPage;
