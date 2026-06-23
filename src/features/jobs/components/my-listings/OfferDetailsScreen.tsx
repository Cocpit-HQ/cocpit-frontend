import React, { useState } from 'react';
import { Icon } from '@iconify/react';
import { JobListing } from '../../types/jobs.types';
import WithdrawOfferModal from './WithdrawOfferModal';
import { toast } from 'sonner';

interface OfferDetailsScreenProps {
  offerGroup: {
    id: string;
    title: string;
    company: string;
    sentCount: number;
    acceptedCount: number;
    pendingCount: number;
  };
  onBack: () => void;
  onViewListingDetails: () => void;
}

interface OfferCandidate {
  id: string;
  name: string;
  role: string;
  companyName: string;
  avatar: string;
  status: 'chat' | 'withdraw' | 'withdrawn';
}

const INITIAL_CANDIDATES: OfferCandidate[] = [
  {
    id: 'off-cand-1',
    name: 'Alex Rivera',
    role: 'Principal Architect',
    companyName: 'Quantum Systems',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=120',
    status: 'chat',
  },
  {
    id: 'off-cand-2',
    name: 'Jordan Smyth',
    role: 'VP Engineering',
    companyName: 'FlowState',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=120',
    status: 'chat',
  },
  {
    id: 'off-cand-3',
    name: 'David Miller',
    role: 'Senior Researcher',
    companyName: 'DeepScale',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=120',
    status: 'withdraw',
  },
];

export const OfferDetailsScreen: React.FC<OfferDetailsScreenProps> = ({
  offerGroup,
  onBack,
  onViewListingDetails,
}) => {
  const [candidates, setCandidates] = useState<OfferCandidate[]>(INITIAL_CANDIDATES);
  const [selectedCandId, setSelectedCandId] = useState<string | null>(null);
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);

  const handleWithdrawClick = (candId: string) => {
    setSelectedCandId(candId);
    setIsWithdrawOpen(true);
  };

  const handleConfirmWithdraw = () => {
    if (!selectedCandId) return;
    setCandidates((prev) =>
      prev.map((c) => (c.id === selectedCandId ? { ...c, status: 'withdrawn' } : c))
    );
    setIsWithdrawOpen(false);
    setSelectedCandId(null);
    toast.success('Offer withdrawn successfully.');
  };

  const activeCandidates = candidates.filter((c) => c.status !== 'withdrawn');

  return (
    <div className="w-[960px] mx-auto bg-white inline-flex flex-col justify-start items-center gap-6 overflow-hidden animate-in fade-in duration-300">
      {/* Header Row */}
      <div className="self-stretch inline-flex justify-start items-center gap-4">
        <button
          onClick={onBack}
          type="button"
          className="size-12 rounded-[100px] outline outline-1 outline-offset-[-1px] outline-zinc-300 backdrop-blur-md flex justify-center items-center gap-2.5 hover:bg-slate-50 active:scale-95 transition-all text-gray-500 shadow-sm"
        >
          <Icon icon="lucide:chevron-left" className="w-5 h-5 text-gray-500" />
        </button>
        <div className="inline-flex flex-col justify-start items-start">
          <div className="text-black text-lg font-medium font-['Poppins'] leading-6">Offer details</div>
          <div className="text-gray-500 text-xs font-normal font-['Poppins'] leading-4">View, and manage this listing</div>
        </div>
      </div>

      {/* Job Details Card Preview */}
      <div className="w-[960px] p-4 rounded-3xl outline outline-1 outline-offset-[-1px] outline-indigo-50 inline-flex flex-col justify-start items-end gap-3 border border-[#EEF2FF] shadow-sm relative">
        <div className="self-stretch inline-flex justify-between items-start">
          <div className="size- inline-flex flex-col justify-start items-start gap-1">
            <h3 className="justify-start text-black text-base font-semibold font-['Poppins'] leading-6">{offerGroup.title}</h3>
            <span className="justify-start text-gray-500 text-sm font-normal font-['Poppins'] leading-5">{offerGroup.company}</span>
            <span className="justify-start text-gray-400 text-sm font-semibold font-['Poppins'] leading-5">Full-time</span>
          </div>
          <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-slate-200 to-slate-400 flex items-center justify-center shadow-inner overflow-hidden border border-slate-300">
            <Icon icon="solar:globus-bold" className="w-8 h-8 text-white opacity-80" />
          </div>
        </div>
        
        <div className="self-stretch inline-flex justify-between items-center border-t border-slate-50 pt-2 text-sm">
          <div className="size- flex justify-start items-center gap-2 text-gray-600 font-medium font-['Poppins']">
            <div className="flex justify-start items-center gap-1">
              <Icon icon="lucide:briefcase" className="w-4 h-4 text-gray-400" />
              <span>0-2Yrs</span>
            </div>
            <span className="text-gray-300">•</span>
            <div className="flex justify-start items-center gap-1">
              <Icon icon="lucide:map-pin" className="w-4 h-4 text-gray-400" />
              <span>Hybrid - Kolhapur</span>
            </div>
          </div>
          
          <div className="flex justify-start items-center gap-2">
            <span className="text-black text-sm font-semibold font-['Poppins']">$160k - $210k</span>
          </div>
        </div>

        {/* View Details Eye Icon Trigger */}
        <button
          onClick={onViewListingDetails}
          type="button"
          className="absolute right-4 bottom-4 p-2 hover:bg-indigo-50 rounded-full transition-colors active:scale-95 text-indigo-400"
          title="View full job details"
        >
          <Icon icon="lucide:eye" className="w-5 h-5 text-indigo-500" />
        </button>
      </div>

      {/* Note Section */}
      <div className="self-stretch flex flex-col justify-start items-start gap-2.5 w-full">
        <span className="text-black text-sm font-semibold font-['Poppins'] leading-tight">Note</span>
        <div className="self-stretch p-4 bg-slate-50/70 border border-[#EEF2FF] rounded-2xl flex items-start gap-3 shadow-sm border-l-4 border-l-indigo-500">
          <img
            className="w-10 h-10 rounded-full object-cover border border-slate-200 mt-0.5"
            src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=120"
            alt="Sarah Mitchell"
          />
          <div className="flex-1 flex flex-col justify-start items-start gap-1">
            <div className="text-black text-sm font-semibold font-['Poppins']">Sarah Mitchell</div>
            <div className="text-gray-400 text-[10px] font-semibold font-['Poppins'] uppercase tracking-wider">
              Head of Design
            </div>
            <p className="text-gray-700 text-xs font-normal font-['Poppins'] leading-relaxed italic mt-1">
              "Hi cocpit, we were impressed by your portfolio and the way you handled the whiteboarding session. Your approach to scalable design systems is exactly what we need for our next growth phase. We'd love to have you join our team."
            </p>
          </div>
        </div>
      </div>

      {/* Candidates List Section */}
      <div className="self-stretch flex flex-col justify-start items-start gap-3 w-full">
        <div className="self-stretch inline-flex justify-start items-center gap-1.5 border-b border-slate-100 pb-2">
          <span className="text-black text-sm font-semibold font-['Poppins']">Candidates</span>
          <span className="px-2 py-0.5 bg-indigo-50 rounded-full text-indigo-500 text-[10px] font-bold font-['Poppins']">
            {activeCandidates.length}
          </span>
        </div>

        <div className="self-stretch flex flex-col gap-3.5">
          {activeCandidates.length === 0 ? (
            <div className="py-12 text-center text-gray-400 text-xs font-['Poppins'] bg-slate-50/50 rounded-2xl">
              All offers have been withdrawn.
            </div>
          ) : (
            activeCandidates.map((cand) => (
              <div
                key={cand.id}
                className="self-stretch p-3 bg-white border border-[#EEF2FF] rounded-2xl inline-flex justify-between items-center shadow-sm"
              >
                <div className="flex justify-start items-center gap-3">
                  <img className="w-11 h-11 rounded-full object-cover border border-slate-100" src={cand.avatar} alt={cand.name} />
                  <div className="inline-flex flex-col justify-start items-start">
                    <span className="text-black text-sm font-semibold font-['Poppins'] leading-tight">{cand.name}</span>
                    <span className="text-gray-400 text-[10px] font-normal font-['Poppins'] mt-0.5">
                      {cand.role} at {cand.companyName}
                    </span>
                  </div>
                </div>

                {cand.status === 'chat' ? (
                  <button
                    type="button"
                    className="h-9 px-5 bg-indigo-500 hover:bg-indigo-600 rounded-3xl text-white text-xs font-semibold font-['Poppins'] transition-all active:scale-95 shadow-sm"
                  >
                    Chat
                  </button>
                ) : (
                  <button
                    onClick={() => handleWithdrawClick(cand.id)}
                    type="button"
                    className="h-9 px-5 border border-slate-350 text-gray-500 hover:text-red-500 hover:border-red-400 rounded-3xl text-xs font-semibold font-['Poppins'] transition-all active:scale-95 bg-white"
                  >
                    Withdraw
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Withdraw Modal Popup */}
      <WithdrawOfferModal
        isOpen={isWithdrawOpen}
        onClose={() => setIsWithdrawOpen(false)}
        onConfirm={handleConfirmWithdraw}
      />
    </div>
  );
};

export default OfferDetailsScreen;
