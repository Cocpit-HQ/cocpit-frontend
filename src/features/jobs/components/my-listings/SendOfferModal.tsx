import React, { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import { JobListing } from '../../types/jobs.types';
import { useSession } from 'next-auth/react';
import api from '@/lib/axios';

export interface SelectableCandidate {
  id: string;
  name: string;
  avatar: string;
}

interface SendOfferModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeListings: JobListing[];
  onSubmit: (jobId: string, candidates: SelectableCandidate[], notes: Record<string, string>) => void;
}

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
  const [personalNotes, setPersonalNotes] = useState<Record<string, string>>({});
  const [candidatesList, setCandidatesList] = useState<SelectableCandidate[]>([]);
  const [allFetchedCandidates, setAllFetchedCandidates] = useState<Record<string, SelectableCandidate>>({});
  const [isLoadingCandidates, setIsLoadingCandidates] = useState(false);
  const [alreadyOfferedCandidates, setAlreadyOfferedCandidates] = useState<Record<string, string>>({});
  const [isFetchingRecipients, setIsFetchingRecipients] = useState(false);
  const { data: session } = useSession();
  const currentUserId = (session?.user as any)?.user_id || (session?.user as any)?.id;

  useEffect(() => {
    if (!isOpen) return;

    const fetchCandidates = async () => {
      setIsLoadingCandidates(true);
      try {
        let endpoint = '/users/suggested';
        if (searchQuery.trim().length > 0) {
          endpoint = `/users/search?q=${encodeURIComponent(searchQuery.trim())}`;
        }
        const response = await api.get(endpoint);
        const mapped = (response.data || []).map((item: any) => ({
          id: item.id || item.user_id,
          name: item.full_name || 'Anonymous User',
          avatar: item.avatar_url || ''
        })).filter((c: SelectableCandidate) => c.id !== currentUserId);
        setCandidatesList(mapped);
        setAllFetchedCandidates(prev => {
          const updated = { ...prev };
          mapped.forEach((c: SelectableCandidate) => {
            updated[c.id] = c;
          });
          return updated;
        });
      } catch (error) {
        console.error('Failed to fetch candidates:', error);
      } finally {
        setIsLoadingCandidates(false);
      }
    };

    const timer = setTimeout(fetchCandidates, searchQuery ? 300 : 0);
    return () => clearTimeout(timer);
  }, [isOpen, searchQuery]);

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
    setPersonalNotes({});
    onClose();
  };

  const handleSendClick = () => {
    if (!selectedJob) return;
    const selectedList = selectedCandidates.map(id => allFetchedCandidates[id]).filter(Boolean);

    onSubmit(selectedJob.id, selectedList, personalNotes);
    
    // Reset state
    setStage(1);
    setSelectedJobId('');
    setSelectedCandidates([]);
    setPersonalNotes({});
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
                  className="flex-1 bg-transparent border-0 p-0 text-black text-base font-normal font-['Poppins'] leading-6 focus:ring-0 focus:outline-none placeholder-gray-400 text-sm"
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
                  onClick={async () => {
                    if (!selectedJob) return;
                    setIsFetchingRecipients(true);
                    try {
                      const companyId = selectedJob.org_id || (selectedJob as any).company_id;
                      const endpoint = companyId 
                        ? `/jobs/companies/${companyId}/offers/job/${selectedJobId}/recipients`
                        : `/jobs/offers/job/${selectedJobId}/recipients`;
                      const res = await api.get(endpoint);
                      const offeredMap: Record<string, string> = {};
                      res.data.forEach((r: any) => {
                        offeredMap[r.user_id] = r.status;
                      });
                      setAlreadyOfferedCandidates(offeredMap);
                      setStage(2);
                      setSearchQuery('');
                    } catch (err) {
                      console.error("Failed to fetch recipients", err);
                      setStage(2);
                      setSearchQuery('');
                    } finally {
                      setIsFetchingRecipients(false);
                    }
                  }}
                  disabled={!selectedJobId || isFetchingRecipients}
                  type="button"
                  className="flex-1 h-10 px-4 py-2 bg-indigo-500 rounded-3xl outline outline-1 outline-offset-[-1px] outline-white flex justify-center items-center gap-2.5 hover:bg-indigo-600 active:scale-95 transition-all text-white text-sm font-normal font-['Poppins'] leading-5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isFetchingRecipients ? <Icon icon="lucide:loader-2" className="w-4 h-4 animate-spin" /> : "Continue"}
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
                  className="flex-1 bg-transparent border-0 p-0 text-black text-base font-normal font-['Poppins'] leading-6 focus:ring-0 focus:outline-none placeholder-gray-400 text-sm"
                />
                <div className="w-6 h-6 relative overflow-hidden flex items-center justify-center text-gray-400 pointer-events-none">
                  <Icon icon="lucide:search" className="w-4 h-4 text-gray-400" />
                </div>
              </div>

              {/* Candidates selection */}
              <div className="self-stretch flex flex-col justify-start items-start gap-2 w-full px-2 box-border">
                <div className="text-left justify-start text-black text-xs font-normal font-['Poppins'] leading-4">Choose candidates</div>
                
                <div className="self-stretch flex flex-col justify-start items-start gap-2 max-h-[220px] overflow-y-auto pr-1 w-full [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-slate-200 [&::-webkit-scrollbar-thumb]:rounded-full">
                  {candidatesList.map((cand) => {
                    const isChecked = selectedCandidates.includes(cand.id);
                    const offerStatus = alreadyOfferedCandidates[cand.id];
                    const isAlreadyOffered = offerStatus && ['pending', 'accepted', 'declined'].includes(offerStatus);

                    return (
                      <div
                        key={cand.id}
                        onClick={() => {
                          if (!isAlreadyOffered) toggleCandidateSelection(cand.id);
                        }}
                        className={`self-stretch h-12 inline-flex justify-between items-center rounded-xl px-2 transition-colors w-full box-border ${isAlreadyOffered ? 'opacity-50 cursor-not-allowed bg-slate-50' : 'cursor-pointer hover:bg-indigo-50/20'}`}
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
                            <div className="flex items-center gap-2">
                              <span className="text-left text-black text-base font-normal font-['Poppins'] leading-6">{cand.name}</span>
                              {isAlreadyOffered && (
                                <span className="px-1.5 py-0.5 rounded-md bg-gray-200 text-gray-600 text-[10px] uppercase font-semibold font-['Poppins'] tracking-wider">
                                  {offerStatus}
                                </span>
                              )}
                            </div>
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
                            <div className={`w-5 h-5 rounded border bg-white ${isAlreadyOffered ? 'border-gray-200' : 'border-gray-300'}`} />
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

              {/* Individual Candidate Textareas */}
              <div className="w-full max-h-[300px] overflow-y-auto flex flex-col gap-4 pr-2 [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-slate-200 [&::-webkit-scrollbar-thumb]:rounded-full">
                {selectedCandidates.map((id) => {
                  const c = allFetchedCandidates[id];
                  if (!c) return null;
                  return (
                    <div key={c.id} className="w-full flex flex-col gap-2 p-3 bg-slate-50/50 rounded-xl border border-slate-100">
                      <div className="flex items-center gap-3">
                        {c.avatar ? (
                          <img className="w-8 h-8 rounded-full object-cover border border-slate-200" src={c.avatar} alt={c.name} />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-500 font-semibold font-['Poppins'] text-[10px] border border-slate-200">
                            {c.name.substring(0, 2).toUpperCase()}
                          </div>
                        )}
                        <span className="text-black text-sm font-medium font-['Poppins'] leading-tight">{c.name}</span>
                      </div>
                      <div className="self-stretch h-20 px-3 py-2 bg-white rounded-lg outline outline-1 outline-zinc-200 inline-flex justify-start items-start w-full box-border">
                        <textarea
                          value={personalNotes[c.id] || ''}
                          onChange={(e) => setPersonalNotes({ ...personalNotes, [c.id]: e.target.value })}
                          placeholder={`Add a personal note for ${c.name.split(' ')[0]}...`}
                          className="flex-1 w-full h-full bg-transparent border-0 p-0 text-black text-xs font-normal font-['Poppins'] focus:outline-none focus:ring-0 resize-none placeholder-gray-400"
                        />
                      </div>
                    </div>
                  );
                })}
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
