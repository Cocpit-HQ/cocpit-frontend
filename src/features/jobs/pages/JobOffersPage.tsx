import React from 'react';
import { useRouter } from 'next/navigation';
import { useJobOffers } from '../hooks/useJobOffers';
import { OfferCard } from '../components/OfferCard';
import OfferCardSkeleton from '../components/skeletons/OfferCardSkeleton';
import * as jobsService from '../services/jobs.service';
import { Icon } from '@iconify/react';
import {
  Drawer,
  DrawerContent,
  DrawerTitle,
} from "@/components/ui/drawer";
import { useActiveProfile } from '@/context/ActiveProfileContext';

export const JobOffersPage: React.FC = () => {
  const router = useRouter();
  const { isCompany, activeProfile } = useActiveProfile();
  const isCompanyMode = isCompany && activeProfile;
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

  const [activeFilter, setActiveFilter] = React.useState<'All' | 'Current' | 'Decline' | 'Expired'>('All');
  const [mobileFilterOpen, setMobileFilterOpen] = React.useState(false);

  const filteredOffers = React.useMemo(() => {
    if (activeFilter === 'All') return offers;
    if (activeFilter === 'Current') return offers.filter(o => o.status === 'pending');
    if (activeFilter === 'Decline') return offers.filter(o => o.status === 'declined');
    if (activeFilter === 'Expired') return offers.filter(o => o.status === 'expired');
    return offers;
  }, [offers, activeFilter]);

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

  const subTabs = ['All', 'Current', 'Decline', 'Expired'] as const;

  return (
    <div className={`w-full max-w-[998px] h-auto min-h-[814px] mx-auto bg-white ${isCompanyMode ? 'dark:bg-[#0F1115]' : 'dark:bg-[#0B0F19]'} pt-[20px] px-4 md:px-[20px] pb-[20px] flex flex-col items-center gap-6 border border-slate-100/50 ${isCompanyMode ? 'dark:border-[#2A2D35]' : 'dark:border-[#2E3445]'} rounded-3xl`}>
      
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
                    ? `bg-[#EEF2FF] ${isCompanyMode ? 'dark:bg-[#16365F]' : 'dark:bg-[#1C2340]'} border-transparent text-[#6366F1] ${isCompanyMode ? 'dark:text-[#4D9CFF]' : 'dark:text-[#818CF8]'}`
                    : `bg-white ${isCompanyMode ? 'dark:bg-[#0F1115]' : 'dark:bg-[#0B0F19]'} border-[#6366F1]/30 ${isCompanyMode ? 'dark:border-[#4D9CFF]/30' : 'dark:border-[#818CF8]/30'} hover:border-[#6366F1] ${isCompanyMode ? 'dark:hover:border-[#4D9CFF]' : 'dark:hover:border-[#818CF8]'} text-[#6366F1]/70 ${isCompanyMode ? 'dark:text-[#4D9CFF]/70' : 'dark:text-[#818CF8]/70'} hover:text-[#6366F1] ${isCompanyMode ? 'dark:hover:text-[#4D9CFF]' : 'dark:hover:text-[#818CF8]'}`
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
          className={`h-10 px-4 md:px-5 py-1.5 rounded-3xl flex justify-center items-center gap-2 text-sm font-semibold font-['Poppins'] transition-all duration-200 active:scale-95 border bg-white ${isCompanyMode ? 'dark:bg-[#0F1115]' : 'dark:bg-[#0B0F19]'} border-[#6366F1]/30 ${isCompanyMode ? 'dark:border-[#4D9CFF]/30' : 'dark:border-[#818CF8]/30'} hover:border-[#6366F1] ${isCompanyMode ? 'dark:hover:border-[#4D9CFF]' : 'dark:hover:border-[#818CF8]'} text-[#6366F1]/70 ${isCompanyMode ? 'dark:text-[#4D9CFF]/70' : 'dark:text-[#818CF8]/70'} hover:text-[#6366F1] ${isCompanyMode ? 'dark:hover:text-[#4D9CFF]' : 'dark:hover:text-[#818CF8]'} w-full md:w-auto`}
        >
          <span>Posted jobs</span>
          <Icon icon="lucide:chevron-right" className="w-4 h-4" />
        </button>
      </div>

      {/* Section 2 — Title row & Filters (margin-top 24px) */}
      <div className="w-full flex flex-col items-start gap-4 flex-none">
        <div className="w-full flex justify-between items-center">
          <h1 className={`font-['Poppins'] font-semibold text-lg leading-6 text-black ${isCompanyMode ? 'dark:text-[#FFFFFF]' : 'dark:text-[#F9FAFB]'}`}>
            Official Job Offers
          </h1>
          <button 
            onClick={() => setMobileFilterOpen(true)}
            className={`md:hidden p-2 rounded-full hover:bg-gray-100 ${isCompanyMode ? 'dark:hover:bg-[#2A2D35]' : 'dark:hover:bg-[#2E3445]'} transition-colors outline-none`}
          >
            <Icon icon="iconoir:filter-list" className={`w-6 h-6 text-black ${isCompanyMode ? 'dark:text-[#FFFFFF]' : 'dark:text-[#F9FAFB]'}`} />
          </button>
        </div>

        <Drawer open={mobileFilterOpen} onOpenChange={setMobileFilterOpen}>
          <DrawerContent className={`bg-white ${isCompanyMode ? 'dark:bg-[#0F1115]' : 'dark:bg-[#0B0F19]'} border-t border-indigo-100 ${isCompanyMode ? 'dark:border-[#2A2D35]' : 'dark:border-[#2E3445]'} rounded-t-[24px] z-[100] pb-8 pt-4`}>
            <DrawerTitle className="sr-only">Filter Offers</DrawerTitle>
            <div className="flex flex-col px-4">
              {subTabs.map((subTab) => (
                <button
                  key={subTab}
                  onClick={() => {
                    setActiveFilter(subTab);
                    setMobileFilterOpen(false);
                  }}
                  className={`w-full py-4 px-4 text-left font-['Poppins'] text-base transition-colors rounded-xl ${
                    activeFilter === subTab
                      ? `text-indigo-500 ${isCompanyMode ? 'dark:text-[#4D9CFF]' : 'dark:text-[#818CF8]'} font-medium bg-indigo-50/50 ${isCompanyMode ? 'dark:bg-[#16365F]' : 'dark:bg-[#1C2340]'}`
                      : `text-gray-600 ${isCompanyMode ? 'dark:text-[#A1A8B3]' : 'dark:text-[#9CA3AF]'} hover:bg-gray-50 ${isCompanyMode ? 'dark:hover:bg-[#16365F]' : 'dark:hover:bg-[#1C2340]'}`
                  }`}
                >
                  {subTab}
                </button>
              ))}
            </div>
          </DrawerContent>
        </Drawer>
        
        {/* Sub-tabs / Filters (Desktop Only) */}
        <div className={`hidden md:flex w-full items-center border-b border-gray-200 ${isCompanyMode ? 'dark:border-[#2A2D35]' : 'dark:border-[#2E3445]'} gap-6`}>
          {subTabs.map((subTab) => (
            <button
              key={subTab}
              onClick={() => setActiveFilter(subTab)}
              className={`pb-2 text-sm font-medium font-['Poppins'] relative transition-colors ${
                activeFilter === subTab ? `text-[#6366F1] ${isCompanyMode ? 'dark:text-[#4D9CFF]' : 'dark:text-[#818CF8]'}` : `text-gray-500 ${isCompanyMode ? 'dark:text-[#A1A8B3]' : 'dark:text-[#9CA3AF]'} hover:text-gray-900 ${isCompanyMode ? 'dark:hover:text-[#FFFFFF]' : 'dark:hover:text-white'}`
              }`}
            >
              {subTab}
              {activeFilter === subTab && (
                <div className={`absolute bottom-0 left-0 w-full h-[2px] bg-[#6366F1] ${isCompanyMode ? 'dark:bg-[#4D9CFF]' : 'dark:bg-[#818CF8]'} rounded-t-sm`} />
              )}
            </button>
          ))}
        </div>
      </div>



      {/* Section 3 — Offers list */}
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
        ) : filteredOffers.length === 0 ? (
          <div className={`w-full py-16 flex flex-col items-center justify-center gap-4 bg-slate-50 ${isCompanyMode ? 'dark:bg-[#0F1115]' : 'dark:bg-[#0B0F19]'} rounded-3xl outline outline-1 outline-offset-[-1px] outline-indigo-50 ${isCompanyMode ? 'dark:outline-[#2A2D35]' : 'dark:outline-[#2E3445]'}`}>
            <div className={`w-16 h-16 rounded-full bg-indigo-50 ${isCompanyMode ? 'dark:bg-[#16365F]' : 'dark:bg-[#1C2340]'} flex items-center justify-center text-[#6366F1] ${isCompanyMode ? 'dark:text-[#4D9CFF]' : 'dark:text-[#818CF8]'}`}>
              <Icon icon="solar:letter-linear" className="w-8 h-8" />
            </div>
            <h4 className={`text-black ${isCompanyMode ? 'dark:text-[#FFFFFF]' : 'dark:text-[#F9FAFB]'} text-lg font-semibold font-['Poppins']`}>No offers found</h4>
            <p className={`text-gray-500 ${isCompanyMode ? 'dark:text-[#A1A8B3]' : 'dark:text-[#9CA3AF]'} text-sm font-['Poppins'] max-w-xs text-center`}>
              There are no offers in this category.
            </p>
            {activeFilter !== 'All' && (
              <button
                onClick={() => setActiveFilter('All')}
                className="px-6 py-2.5 bg-[#6366F1] hover:bg-[#6366F1]/90 text-white rounded-[24px] text-sm font-semibold font-['Poppins'] transition-all mt-2"
              >
                View All Offers
              </button>
            )}
          </div>
        ) : (
          filteredOffers.map(offer => (
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
