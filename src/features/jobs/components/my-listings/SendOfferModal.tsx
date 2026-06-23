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
      <div className="w-[416px] p-4 bg-white rounded-3xl flex flex-col justify-start items-center overflow-hidden shadow-xl border border-indigo-50/50 animate-in zoom-in-95 duration-200">
        
        {/* STAGE 1: Choose Job */}
        {stage === 1 && (
          <>
            {/* Header Close button */}
            <div className="self-stretch flex flex-col justify-start items-end gap-2.5">
              <button
                onClick={handleCancelClick}
                type="button"
                className="w-6 h-6 relative overflow-hidden flex items-center justify-center hover:opacity-75 transition-opacity"
              >
                <Icon icon="lucide:x" className="w-5 h-5 text-red-400" />
              </button>
            </div>

            {/* Content Container */}
            <div className="w-full flex flex-col justify-start items-center gap-4">
              {/* Title Header */}
              <div className="w-full flex flex-col justify-start items-center gap-2">
                <div className="text-center justify-start text-black text-lg font-medium font-['Poppins'] leading-6">Send offer</div>
                <div className="text-center justify-start text-gray-500 text-xs font-normal font-['Poppins'] leading-4">Choose or create a job to send an offer.</div>
              </div>

              {/* Search input */}
              <div data-property-1="SEARCH" className="w-96 px-4 py-2 rounded-3xl outline outline-1 outline-offset-[-1px] outline-gray-200 bg-white inline-flex justify-between items-center focus-within:outline-indigo-400 transition-colors">
                <input
                  type="text"
                  placeholder="Search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 bg-transparent border-0 p-0 text-black text-base font-normal font-['Poppins'] leading-6 focus:ring-0 placeholder-gray-400 text-sm"
                />
                <div className="w-6 h-6 relative overflow-hidden flex items-center justify-center text-gray-450 pointer-events-none">
                  <Icon icon="lucide:search" className="w-4 h-4 text-gray-400" />
                </div>
              </div>

              {/* Job Listings List */}
              <div className="w-96 flex flex-col justify-start items-start gap-4">
                <div className="text-center justify-start text-black text-xs font-normal font-['Poppins'] leading-4">Recent jobs</div>
                <div className="self-stretch flex flex-col gap-2 max-h-[220px] overflow-y-auto pr-1 w-full [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-slate-200 [&::-webkit-scrollbar-thumb]:rounded-full">
                  {filteredListings.length === 0 ? (
                    <div className="py-12 text-center text-gray-400 text-xs font-['Poppins'] w-full">
                      No active job listings found.
                    </div>
                  ) : (
                    filteredListings.map((job) => {
                      const isSelected = job.id === selectedJobId;
                      return (
                        <div
                          key={job.id}
                          onClick={() => setSelectedJobId(job.id)}
                          className={`self-stretch px-4 py-2 rounded-xl inline-flex justify-start items-start gap-4 cursor-pointer border transition-all ${
                            isSelected
                              ? 'bg-indigo-50 border-indigo-100 shadow-sm'
                              : 'bg-white hover:bg-slate-50 border-transparent'
                          }`}
                        >
                          <div className="flex-1 inline-flex flex-col justify-start items-start gap-2 min-w-0">
                            <div className="justify-center text-black text-base font-medium font-['Poppins'] capitalize leading-6 truncate w-full text-left">{job.title}</div>
                            <div className="self-stretch justify-center text-gray-500 text-xs font-normal font-['Poppins'] leading-4 text-left">{job.posted_at || 'Posted recently'}</div>
                          </div>
                          <div className="w-16 p-2 bg-green-50 rounded-full inline-flex flex-col justify-center items-center flex-shrink-0">
                            <div className="justify-center text-green-500 text-[10px] font-medium font-['Poppins'] uppercase">ACTIVE</div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="self-stretch inline-flex justify-start items-start gap-4 w-full">
                <button
                  onClick={handleCancelClick}
                  type="button"
                  className="flex-1 h-10 px-4 py-2 bg-white rounded-3xl outline outline-1 outline-offset-[-1px] outline-indigo-400 flex justify-center items-center gap-2.5 hover:bg-indigo-50/10 active:scale-95 transition-all text-indigo-400 text-sm font-normal font-['Poppins'] leading-5"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setStage(2);
                    setSearchQuery('');
                  }}
                  disabled={!selectedJobId}
                  type="button"
                  className="flex-1 h-10 px-4 py-2 bg-indigo-500 rounded-3xl outline outline-1 outline-offset-[-1px] outline-white flex justify-center items-center gap-2.5 hover:bg-indigo-600 active:scale-95 transition-all text-white text-sm font-normal font-['Poppins'] leading-5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Continue
                </button>
              </div>
            </div>
          </>
        )}

        {/* STAGE 2: Choose Candidates */}
        {stage === 2 && (
          <>
            {/* Header Close button */}
            <div className="self-stretch flex flex-col justify-start items-end gap-2.5">
              <button
                onClick={handleCancelClick}
                type="button"
                className="w-6 h-6 relative overflow-hidden flex items-center justify-center hover:opacity-75 transition-opacity"
              >
                <Icon icon="lucide:x" className="w-5 h-5 text-red-400" />
              </button>
            </div>

            {/* Content Container */}
            <div className="w-full flex flex-col justify-start items-center gap-4">
              {/* Title Header */}
              <div className="w-full flex flex-col justify-start items-center gap-2">
                <div className="text-center justify-start text-black text-lg font-medium font-['Poppins'] leading-6">Send offer</div>
                <div className="text-center justify-start text-gray-500 text-xs font-normal font-['Poppins'] leading-4">Choose or create a job to send an offer.</div>
              </div>

              {/* Search input */}
              <div data-property-1="SEARCH" className="w-96 px-4 py-2 rounded-3xl outline outline-1 outline-offset-[-1px] outline-gray-200 bg-white inline-flex justify-between items-center focus-within:outline-indigo-400 transition-colors">
                <input
                  type="text"
                  placeholder="Search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 bg-transparent border-0 p-0 text-black text-base font-normal font-['Poppins'] leading-6 focus:ring-0 placeholder-gray-400 text-sm"
                />
                <div className="w-6 h-6 relative overflow-hidden flex items-center justify-center text-gray-400 pointer-events-none">
                  <Icon icon="lucide:search" className="w-4 h-4 text-gray-400" />
                </div>
              </div>

              {/* Candidates selection */}
              <div className="self-stretch flex flex-col justify-start items-start gap-2 w-full px-2 box-border">
                <div className="text-left justify-start text-black text-xs font-normal font-['Poppins'] leading-4">Choose candidates</div>
                
                <div className="self-stretch flex flex-col justify-start items-start gap-2 max-h-[220px] overflow-y-auto pr-1 w-full [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-slate-200 [&::-webkit-scrollbar-thumb]:rounded-full">
                  {MOCK_SELECTABLE_CANDIDATES.filter((c) =>
                    c.name.toLowerCase().includes(searchQuery.toLowerCase())
                  ).map((cand) => {
                    const isChecked = selectedCandidates.includes(cand.id);
                    return (
                      <div
                        key={cand.id}
                        onClick={() => toggleCandidateSelection(cand.id)}
                        className="self-stretch h-12 inline-flex justify-between items-center cursor-pointer hover:bg-indigo-50/20 rounded-xl px-2 transition-colors w-full box-border"
                      >
                        <div className="flex justify-start items-center gap-2">
                          {cand.avatar ? (
                            <img
                              className="w-8 h-8 rounded-full object-cover border border-slate-100"
                              src={cand.avatar}
                              alt={cand.name}
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-500 font-semibold font-['Poppins'] text-xs">
                              {cand.name.substring(0, 2).toUpperCase()}
                            </div>
                          )}
                          <div className="inline-flex flex-col justify-center items-start">
                            <div className="text-left text-black text-base font-normal font-['Poppins'] leading-6">{cand.name}</div>
                          </div>
                        </div>
                        
                        {/* Checkbox */}
                        {isChecked ? (
                          <div className="p-1 inline-flex flex-col justify-center items-center">
                            <div className="w-5 h-5 rounded bg-indigo-500 flex items-center justify-center border border-indigo-500">
                              <Icon icon="lucide:check" className="w-3.5 h-3.5 text-white stroke-[3]" />
                            </div>
                          </div>
                        ) : (
                          <div className="p-1 inline-flex flex-col justify-center items-center">
                            <div className="w-5 h-5 rounded border border-gray-300 bg-white" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Footer Buttons */}
              <div className="self-stretch inline-flex justify-start items-start gap-4 w-full">
                <button
                  onClick={() => {
                    setStage(1);
                    setSearchQuery('');
                  }}
                  type="button"
                  className="flex-1 h-10 px-4 py-2 bg-white rounded-3xl outline outline-1 outline-offset-[-1px] outline-indigo-400 flex justify-center items-center gap-2.5 hover:bg-indigo-50/10 active:scale-95 transition-all text-indigo-400 text-sm font-normal font-['Poppins'] leading-5"
                >
                  Back
                </button>
                <button
                  onClick={() => {
                    setStage(3);
                    setSearchQuery('');
                  }}
                  disabled={selectedCandidates.length === 0}
                  type="button"
                  className="flex-1 h-10 px-4 py-2 bg-indigo-500 rounded-3xl outline outline-1 outline-offset-[-1px] outline-white flex justify-center items-center gap-2.5 hover:bg-indigo-600 active:scale-95 transition-all text-white text-sm font-normal font-['Poppins'] leading-5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Continue
                </button>
              </div>
            </div>
          </>
        )}

        {/* STAGE 3: Personal Note & Send */}
        {stage === 3 && (
          <>
            {/* Header Close button */}
            <div className="self-stretch flex flex-col justify-start items-end gap-2.5">
              <button
                onClick={handleCancelClick}
                type="button"
                className="w-6 h-6 relative overflow-hidden flex items-center justify-center hover:opacity-75 transition-opacity"
              >
                <Icon icon="lucide:x" className="w-5 h-5 text-red-400" />
              </button>
            </div>

            {/* Content Container */}
            <div className="w-full flex flex-col justify-start items-center gap-4">
              {/* Title Header */}
              <div className="w-full flex flex-col justify-start items-center gap-2">
                <div className="text-center justify-start text-black text-lg font-medium font-['Poppins'] leading-6">Send offer</div>
                <div className="text-center justify-start text-gray-500 text-xs font-normal font-['Poppins'] leading-4">Choose or create a job to send an offer.</div>
              </div>

              {/* Candidate avatars list */}
              <div className="w-96 py-2 inline-flex justify-start items-start gap-y-4 gap-x-2 flex-wrap max-h-[140px] overflow-y-auto pr-1 [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-slate-200 [&::-webkit-scrollbar-thumb]:rounded-full">
                {MOCK_SELECTABLE_CANDIDATES.filter((c) =>
                  selectedCandidates.includes(c.id)
                ).map((c) => (
                  <div key={c.id} className="w-24 h-16 relative">
                    <img className="w-10 h-10 left-[28px] top-0 absolute rounded-full object-cover border border-slate-100" src={c.avatar} alt={c.name} />
                    <div className="left-0 right-0 text-center top-[48px] absolute text-gray-500 text-xs font-normal font-['Poppins'] leading-4 truncate px-1 capitalize">
                      {c.name.split(' ')[0]} {c.name.split(' ')[1] ? c.name.split(' ')[1].toLowerCase() : ''}
                    </div>
                    <div className="w-[18px] h-[18px] p-[2px] left-[50px] top-[24px] absolute rounded-full bg-indigo-500 border-2 border-white inline-flex justify-center items-center shadow-sm">
                      <Icon icon="lucide:check" className="w-2.5 h-2.5 text-white stroke-[3]" />
                    </div>
                  </div>
                ))}
              </div>

              {/* Personal message textarea */}
              <div className="self-stretch h-24 px-4 py-2 bg-white/10 rounded-2xl outline outline-1 outline-offset-[-1px] outline-zinc-200 backdrop-blur-md inline-flex justify-start items-start gap-2.5 w-full box-border">
                <textarea
                  value={personalNote}
                  onChange={(e) => setPersonalNote(e.target.value)}
                  placeholder="Add a personal note...."
                  className="flex-1 w-full h-full bg-transparent border-0 p-0 text-black text-sm font-normal font-['Poppins'] leading-5 focus:outline-none focus:ring-0 resize-none placeholder-gray-500"
                />
              </div>

              {/* Footer Buttons */}
              <div className="self-stretch inline-flex justify-start items-start gap-4 w-full">
                <button
                  onClick={() => setStage(2)}
                  type="button"
                  className="flex-1 h-10 px-4 py-2 bg-white rounded-3xl outline outline-1 outline-offset-[-1px] outline-indigo-400 flex justify-center items-center gap-2.5 hover:bg-indigo-50/10 active:scale-95 transition-all text-indigo-400 text-sm font-normal font-['Poppins'] leading-5"
                >
                  Back
                </button>
                <button
                  onClick={handleSendClick}
                  type="button"
                  className="flex-1 h-10 px-4 py-2 bg-indigo-500 rounded-3xl outline outline-1 outline-offset-[-1px] outline-white flex justify-center items-center gap-2.5 hover:bg-indigo-600 active:scale-95 transition-all text-white text-sm font-normal font-['Poppins'] leading-5"
                >
                  Send
                </button>
              </div>
            </div>
          </>
        )}

      </div>
    </div>
  );
};

export default SendOfferModal;
