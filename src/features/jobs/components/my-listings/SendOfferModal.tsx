import React, { useState } from 'react';
import { Icon } from '@iconify/react';
import { JobListing } from '../../types/jobs.types';

interface SendOfferModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeListings: JobListing[];
  onSubmit: (jobTitle: string, candidateNames: string[], note: string) => void;
}

interface SelectableCandidate {
  id: string;
  name: string;
  avatar: string;
}

const MOCK_SELECTABLE_CANDIDATES: SelectableCandidate[] = [
  { id: 'sel-1', name: 'Sarah Chen', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=120' },
  { id: 'sel-2', name: 'Marcus Avery', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=120' },
  { id: 'sel-3', name: 'Amara Okora', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=120' },
  { id: 'sel-4', name: 'Alex Rivera', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=120' }
];

export const SendOfferModal: React.FC<SendOfferModalProps> = ({
  isOpen,
  onClose,
  activeListings,
  onSubmit,
}) => {
  const [stage, setStage] = useState<1 | 2 | 3>(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedJobId, setSelectedJobId] = useState('');
  const [selectedCandidates, setSelectedCandidates] = useState<string[]>([]); // Array of candidate IDs
  const [personalNote, setPersonalNote] = useState('');

  if (!isOpen) return null;

  // Search logic for listings
  const filteredListings = activeListings.filter((l) =>
    l.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedJob = activeListings.find((l) => l.id === selectedJobId);

  const toggleCandidateSelection = (candId: string) => {
    setSelectedCandidates((prev) =>
      prev.includes(candId) ? prev.filter((id) => id !== candId) : [...prev, candId]
    );
  };

  const handleCancelClick = () => {
    setStage(1);
    setSelectedJobId('');
    setSelectedCandidates([]);
    setPersonalNote('');
    onClose();
  };

  const handleSendClick = () => {
    if (!selectedJob) return;
    const names = MOCK_SELECTABLE_CANDIDATES.filter((c) =>
      selectedCandidates.includes(c.id)
    ).map((c) => c.name);

    onSubmit(selectedJob.title, names, personalNote);
    
    // Reset state
    setStage(1);
    setSelectedJobId('');
    setSelectedCandidates([]);
    setPersonalNote('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-[420px] h-[520px] bg-white rounded-3xl p-6 flex flex-col justify-between items-stretch shadow-xl border border-indigo-50/50 animate-in zoom-in-95 duration-200">
        
        {/* Stage Header */}
        <div className="flex flex-col gap-2 relative">
          <button
            onClick={handleCancelClick}
            type="button"
            className="absolute right-0 top-0 w-8 h-8 rounded-full flex items-center justify-center hover:bg-slate-50 transition-colors text-gray-400"
          >
            <Icon icon="lucide:x" className="w-5 h-5" />
          </button>
          
          <div className="flex flex-col gap-1 pr-8">
            <h3 className="text-black text-lg font-bold font-['Poppins'] leading-tight">Send offer</h3>
            <p className="text-gray-500 text-xs font-normal font-['Poppins']">
              Choose or create a job to send an offer.
            </p>
          </div>
        </div>

        {/* Stage Content */}
        <div className="flex-grow flex flex-col justify-start items-stretch gap-4 mt-4 overflow-y-auto pr-1">
          {/* Search bar for Stage 1 & Stage 2 */}
          {stage !== 3 && (
            <div className="relative w-full">
              <input
                type="text"
                placeholder="Search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-4 pr-11 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-black text-sm font-semibold font-['Poppins'] focus:outline-none focus:border-indigo-400 transition-colors"
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center justify-center text-gray-400 pointer-events-none">
                <Icon icon="lucide:search" className="w-4 h-4" />
              </div>
            </div>
          )}

          {/* STAGE 1: Choose Job */}
          {stage === 1 && (
            <div className="flex flex-col gap-2 flex-grow">
              <span className="text-gray-500 text-xs font-semibold font-['Poppins'] uppercase tracking-wider">
                Recent jobs
              </span>
              <div className="flex flex-col gap-2 overflow-y-auto max-h-[260px] pr-0.5 scrollbar-thin">
                {filteredListings.length === 0 ? (
                  <div className="py-12 text-center text-gray-400 text-xs font-['Poppins']">
                    No active job listings found.
                  </div>
                ) : (
                  filteredListings.map((job) => {
                    const isSelected = job.id === selectedJobId;
                    return (
                      <div
                        key={job.id}
                        onClick={() => setSelectedJobId(job.id)}
                        className={`p-3 rounded-xl inline-flex justify-between items-center cursor-pointer transition-all border ${
                          isSelected
                            ? 'bg-indigo-50/50 border-indigo-200 shadow-sm'
                            : 'bg-white hover:bg-slate-50 border-slate-100'
                        }`}
                      >
                        <div className="flex flex-col items-start gap-1">
                          <span className="text-black text-sm font-semibold font-['Poppins']">{job.title}</span>
                          <span className="text-gray-400 text-[10px] font-normal font-['Poppins']">
                            {job.posted_at || 'Posted recently'}
                          </span>
                        </div>
                        <div className="px-2 py-0.5 bg-green-50 rounded-full text-green-500 text-[9px] font-bold font-['Poppins'] uppercase">
                          ACTIVE
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* STAGE 2: Choose Candidates */}
          {stage === 2 && (
            <div className="flex flex-col gap-2 flex-grow">
              <span className="text-gray-500 text-xs font-semibold font-['Poppins'] uppercase tracking-wider">
                Choose candidates
              </span>
              <div className="flex flex-col gap-2 overflow-y-auto max-h-[260px] pr-0.5 scrollbar-thin">
                {MOCK_SELECTABLE_CANDIDATES.filter((c) =>
                  c.name.toLowerCase().includes(searchQuery.toLowerCase())
                ).map((cand) => {
                  const isChecked = selectedCandidates.includes(cand.id);
                  return (
                    <div
                      key={cand.id}
                      onClick={() => toggleCandidateSelection(cand.id)}
                      className={`p-3 rounded-xl inline-flex justify-between items-center cursor-pointer transition-all border ${
                        isChecked
                          ? 'bg-indigo-50/30 border-indigo-100 shadow-sm'
                          : 'bg-white hover:bg-slate-50 border-slate-100'
                      }`}
                    >
                      <div className="flex justify-start items-center gap-3">
                        <img className="w-10 h-10 rounded-full object-cover border border-slate-100" src={cand.avatar} alt={cand.name} />
                        <span className="text-black text-sm font-medium font-['Poppins']">{cand.name}</span>
                      </div>
                      <div className="flex items-center justify-center">
                        <Icon
                          icon={isChecked ? "solar:check-square-bold" : "solar:square-linear"}
                          className={`w-5 h-5 ${isChecked ? 'text-indigo-500' : 'text-gray-300'}`}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* STAGE 3: Personal Note */}
          {stage === 3 && (
            <div className="flex flex-col gap-4 flex-grow">
              {/* Selected Candidate Avatars */}
              <div className="flex justify-start items-center gap-4 py-2 border-b border-gray-100">
                {MOCK_SELECTABLE_CANDIDATES.filter((c) =>
                  selectedCandidates.includes(c.id)
                ).map((c) => (
                  <div key={c.id} className="relative">
                    <img className="w-12 h-12 rounded-full object-cover border border-slate-100" src={c.avatar} alt={c.name} />
                    <div className="absolute -bottom-1 -right-1 size-5 bg-indigo-500 rounded-full flex items-center justify-center border-2 border-white text-white">
                      <Icon icon="lucide:check" className="w-3 h-3 text-white" />
                    </div>
                    <span className="text-[9px] font-semibold text-gray-500 font-['Poppins'] mt-1 block text-center max-w-[50px] truncate leading-tight">
                      {c.name.split(' ')[0]}
                    </span>
                  </div>
                ))}
              </div>

              {/* Personal message textarea */}
              <div className="flex flex-col gap-1.5 flex-grow">
                <textarea
                  value={personalNote}
                  onChange={(e) => setPersonalNote(e.target.value)}
                  placeholder="Add a personal note..."
                  className="w-full flex-grow min-h-[140px] p-3 bg-slate-50 border border-slate-200 rounded-2xl text-black text-sm font-medium font-['Poppins'] focus:outline-none focus:border-indigo-400 transition-colors resize-none placeholder-gray-400"
                />
              </div>
            </div>
          )}
        </div>

        {/* Stage Footer Buttons */}
        <div className="self-stretch flex justify-center items-center gap-4 mt-2">
          {stage === 1 ? (
            <>
              <button
                onClick={handleCancelClick}
                type="button"
                className="flex-grow h-11 rounded-3xl border border-indigo-300 text-indigo-500 font-semibold font-['Poppins'] text-sm hover:bg-indigo-50/10 active:scale-95 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={() => setStage(2)}
                disabled={!selectedJobId}
                type="button"
                className="flex-grow h-11 rounded-3xl bg-indigo-500 hover:bg-indigo-600 disabled:bg-slate-200 disabled:text-slate-400 text-white font-semibold font-['Poppins'] text-sm active:scale-95 transition-all shadow-sm"
              >
                Continue
              </button>
            </>
          ) : stage === 2 ? (
            <>
              <button
                onClick={() => setStage(1)}
                type="button"
                className="flex-grow h-11 rounded-3xl border border-indigo-300 text-indigo-500 font-semibold font-['Poppins'] text-sm hover:bg-indigo-50/10 active:scale-95 transition-all"
              >
                Back
              </button>
              <button
                onClick={() => setStage(3)}
                disabled={selectedCandidates.length === 0}
                type="button"
                className="flex-grow h-11 rounded-3xl bg-indigo-500 hover:bg-indigo-600 disabled:bg-slate-200 disabled:text-slate-400 text-white font-semibold font-['Poppins'] text-sm active:scale-95 transition-all shadow-sm"
              >
                Continue
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setStage(2)}
                type="button"
                className="flex-grow h-11 rounded-3xl border border-indigo-300 text-indigo-500 font-semibold font-['Poppins'] text-sm hover:bg-indigo-50/10 active:scale-95 transition-all"
              >
                Back
              </button>
              <button
                onClick={handleSendClick}
                type="button"
                className="flex-grow h-11 rounded-3xl bg-indigo-500 hover:bg-indigo-600 text-white font-semibold font-['Poppins'] text-sm active:scale-95 transition-all shadow-sm"
              >
                Send
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default SendOfferModal;
