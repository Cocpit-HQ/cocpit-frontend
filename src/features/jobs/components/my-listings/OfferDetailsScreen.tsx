import React, { useState } from 'react';
import { Icon } from '@iconify/react';
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

  // Condition to show note: Only display if the note content is present or if it matches the main group
  const showNote = offerGroup.title === 'UI/UX Designer' || offerGroup.id === 'so-1';

  return (
    <div className="w-[960px] mx-auto bg-white flex flex-col justify-start items-center gap-[16px] overflow-hidden animate-in fade-in duration-300">
      
      {/* Header Row (Frame 2608623) */}
      <div className="w-[960px] h-[48px] self-stretch flex flex-row items-center p-0 gap-[16px]">
        <button
          onClick={onBack}
          type="button"
          className="w-12 h-12 box-border p-2 rounded-[100px] border border-[#DADADA] backdrop-blur-[12px] flex flex-row justify-center items-center gap-2.5 hover:bg-slate-50 transition-colors active:scale-95 text-gray-500 shadow-sm"
        >
          <Icon icon="lucide:chevron-left" className="w-6 h-6 text-gray-500" />
        </button>
        <div className="flex flex-col items-start p-0 gap-0">
          <div className="text-left text-[#000000] text-[18px] font-medium font-['Poppins'] leading-[26px]">Offer details</div>
          <div className="text-left text-[#6B7280] text-[12px] font-normal font-['Poppins'] leading-[16px]">View, and manage this listing</div>
        </div>
      </div>

      {/* Job Details Card Preview (Frame 2608861) */}
      <div className="w-[960px] h-[196px] box-border p-[16px] rounded-[24px] border border-[#EEF2FF] flex flex-col items-end gap-[12px] bg-white">
        
        {/* Frame 2608947: Top row (role, company, full-time, and company logo) */}
        <div className="w-[928px] h-[80px] self-stretch flex flex-row justify-between items-start p-0 gap-[10px]">
          
          {/* Frame 2608946: Role details */}
          <div className="h-[80px] flex flex-col items-start p-0 gap-[8px]">
            {/* UI/UX Designer */}
            <span className="font-['Poppins'] font-medium text-[16px] leading-[24px] text-black">
              {offerGroup.title}
            </span>
            {/* Starlight Technologies */}
            <span className="font-['Poppins'] font-normal text-[14px] leading-[20px] text-[#6B7280]">
              {offerGroup.company}
            </span>
            {/* Full time */}
            <span className="font-['Poppins'] font-semibold text-[14px] leading-[20px] text-[#6B7280]">
              Full time
            </span>
          </div>

          {/* Company Avatar Frame 2608516 */}
          <div
            className="w-[56px] h-[40px] rounded-[24px] flex items-center justify-center flex-shrink-0"
            style={{
              backgroundImage: 'url(/assets/company-placeholder.png)',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          />
        </div>

        {/* Row 2: Specifications (Experience, location, bullet point, salary) */}
        <div className="w-[928px] h-[20px] self-stretch flex flex-row justify-between items-center p-0">
          <div className="flex flex-row items-center p-0">
            {/* Experience Frame 2608943 */}
            <div className="flex flex-row items-center p-0 gap-[8px] h-[20px]">
              <Icon icon="lucide:briefcase" className="w-[20px] h-[20px] text-black" />
              <span className="font-['Poppins'] font-normal text-[14px] leading-[20px] text-black">
                0-2Yrs
              </span>
            </div>
            
            {/* Bullet Point / Ellipse 15 */}
            <div className="w-[6px] h-[6px] bg-black rounded-full mx-[8px]" />

            {/* Location Frame 2608944 */}
            <div className="flex flex-row items-center p-0 gap-[8px] h-[20px]">
              <Icon icon="lucide:map-pin" className="w-[20px] h-[20px] text-black" />
              <span className="font-['Poppins'] font-normal text-[14px] leading-[20px] text-black">
                Hybrid - Kolhapur
              </span>
            </div>
          </div>

          {/* Salary range frame */}
          <div className="py-[2px] flex items-center h-[16px]">
            <span className="font-['Poppins'] font-medium text-[12px] leading-[16px] text-black">
              $160k - $210k
            </span>
          </div>
        </div>

        {/* Row 3: Eye Icon Frame 2609037 */}
        <button
          onClick={onViewListingDetails}
          type="button"
          className="w-[56px] h-[40px] flex items-center justify-center rounded-[24px] hover:bg-[#EEF2FF]/40 active:scale-95 transition-all text-black"
          title="Open in job details page"
        >
          <Icon icon="lucide:eye" className="w-[24px] h-[24px]" />
        </button>

      </div>

      {/* Note Section (Frame 2609091) */}
      {showNote ? (
        <div className="w-[960px] flex flex-col items-start p-0 gap-[8px]">
          {/* Note Title */}
          <div className="w-[43px] h-[26px] flex items-center justify-center">
            <span className="font-['Poppins'] font-medium text-[18px] leading-[26px] text-center text-black">
              Note
            </span>
          </div>
          
          {/* Note Container (Frame 2609030) */}
          <div className="w-[960px] box-border flex flex-col items-start p-[12px_16px] gap-[8px] bg-[#F9FAFF] border-l-2 border-l-[#6366F1] rounded-[0px_16px_16px_16px]">
            {/* Sender Info Row (Frame 2609033) */}
            <div className="flex flex-row justify-start items-center p-0 gap-[8px] w-[282px] h-[40px]">
              <img
                className="w-[40px] h-[40px] rounded-full object-cover"
                src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=120"
                alt="Sarah Mitchell"
              />
              <div className="flex flex-col justify-center items-start">
                <span className="font-['Poppins'] font-normal text-[12px] leading-[16px] text-[#6366F1] uppercase">
                  SARAH MITCHELL
                </span>
                <span className="font-['Poppins'] font-normal text-[12px] leading-[16px] text-[#6366F1] uppercase">
                  HEAD OF DESIGN
                </span>
              </div>
            </div>

            {/* Note Content */}
            <div className="w-[928px] font-['Poppins'] font-normal text-[12px] leading-[16px] text-[#6B7280]">
              "Hi cocpit, we were impressed by your portfolio and the way you handled the whiteboarding session. Your approach to scalable design systems is exactly what we need for our next growth phase. We'd love to have you join our team."
            </div>
          </div>
        </div>
      ) : null}

      {/* Candidates List Section (Frame 2609090) */}
      <div className="w-[960px] flex flex-col items-start p-0 gap-[16px]">
        {/* Header Row (Frame 2608889) */}
        <div className="w-[166px] h-[32px] flex flex-row items-center p-0 gap-[16px]">
          {/* Title */}
          <div className="w-[107px] h-[26px] py-[3px] flex items-center justify-center">
            <span className="font-['Poppins'] font-medium text-[18px] leading-[26px] text-center text-black">
              Candidates
            </span>
          </div>
          {/* Count Badge Frame 2608517 */}
          <div className="box-sizing: border-box w-[43px] h-[32px] bg-white border border-[#EEF2FF] rounded-[24px] flex flex-row justify-center items-center p-[8px_16px] gap-[10px]">
            <span className="font-['Poppins'] font-normal text-[12px] leading-[16px] text-center text-[#6366F1]">
              {activeCandidates.length}
            </span>
          </div>
        </div>

        {/* Candidates list with gap 16px */}
        <div className="w-[960px] flex flex-col gap-[16px]">
          {activeCandidates.length === 0 ? (
            <div className="py-12 text-center text-gray-400 text-xs font-['Poppins'] bg-slate-50/50 rounded-2xl">
              All offers have been withdrawn.
            </div>
          ) : (
            activeCandidates.map((cand) => (
              /* Candidate card Frame 2608732 */
              <div
                key={cand.id}
                className="w-[960px] h-[60px] bg-white border border-[#EEF2FF]/60 rounded-[12px] flex flex-row justify-between items-center p-[8px_16px] box-border"
              >
                {/* User Frame 2608774 */}
                <div className="flex flex-row items-start p-0 gap-[8px] h-[44px]">
                  {/* User Avatar */}
                  <img
                    className="w-[40px] h-[40px] rounded-full object-cover"
                    src={cand.avatar}
                    alt={cand.name}
                  />
                  {/* Text Frame 2609008 */}
                  <div className="flex flex-col justify-center items-start h-[44px]">
                    <span className="font-['Poppins'] font-medium text-[16px] leading-[24px] text-black text-left">
                      {cand.name}
                    </span>
                    <span className="font-['Poppins'] font-normal text-[14px] leading-[20px] text-[#6B7280] text-left">
                      {cand.role} at {cand.companyName}
                    </span>
                  </div>
                </div>

                {/* Button Frame 2608617 */}
                {cand.status === 'chat' ? (
                  <button
                    type="button"
                    className="box-sizing: border-box w-[120px] h-[40px] bg-[#6366F1] border border-white rounded-[24px] flex flex-row justify-center items-center p-[8px_16px] gap-[10px] hover:opacity-90 transition-all active:scale-95"
                  >
                    <span className="font-['Poppins'] font-normal text-[14px] leading-[20px] text-center text-white">
                      Chat
                    </span>
                  </button>
                ) : (
                  <button
                    onClick={() => handleWithdrawClick(cand.id)}
                    type="button"
                    className="box-sizing: border-box w-[120px] h-[40px] border border-[#6B7280] rounded-[24px] flex flex-row justify-center items-center p-[8px_16px] gap-[10px] hover:bg-slate-50 transition-all active:scale-95 bg-white"
                  >
                    <span className="font-['Poppins'] font-normal text-[14px] leading-[20px] text-center text-[#6B7280]">
                      Withdraw
                    </span>
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
