import React, { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import { JobListing } from '../../types/jobs.types';
import { useSession } from 'next-auth/react';
import api from '@/lib/axios';
import { toast } from 'react-hot-toast';
import { useQueryClient } from '@tanstack/react-query';
import { useActiveProfile } from '@/context/ActiveProfileContext';

export interface SelectableCandidate {
  id: string;
  name: string;
  avatar: string;
}

interface SendOfferModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeListings: JobListing[];
  initialJobId?: string;
  onOfferSent?: () => void;
}

export const SendOfferModal: React.FC<SendOfferModalProps> = ({
  isOpen,
  onClose,
  activeListings,
  initialJobId,
  onOfferSent,
}) => {
  const { isCompany, activeProfile } = useActiveProfile();
  const isCompanyMode = isCompany && !!activeProfile?.id;

  const [stage, setStage] = useState<1 | 2 | 3>(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedJobId, setSelectedJobId] = useState('');
  const [selectedCandidates, setSelectedCandidates] = useState<string[]>([]); // Array of candidate IDs
  const [personalNote, setPersonalNote] = useState('');
  const [candidatesList, setCandidatesList] = useState<SelectableCandidate[]>([]);
  const [allFetchedCandidates, setAllFetchedCandidates] = useState<Record<string, SelectableCandidate>>({});
  const [isLoadingCandidates, setIsLoadingCandidates] = useState(false);
  const [alreadyOfferedCandidates, setAlreadyOfferedCandidates] = useState<Record<string, string>>({});
  const [appliedCandidates, setAppliedCandidates] = useState<Set<string>>(new Set());
  const [isFetchingRecipients, setIsFetchingRecipients] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const currentUserId = (session?.user as any)?.user_id || (session?.user as any)?.id;

  useEffect(() => {
    let isMounted = true;
    const init = async () => {
      if (isOpen && initialJobId) {
        setSelectedJobId(initialJobId);
        setIsFetchingRecipients(true);
        try {
          const job = activeListings.find(l => l.id === initialJobId);
          const companyId = job ? (job.org_id || (job as any).company_id) : null;
          const endpoint = companyId 
            ? `/jobs/companies/${companyId}/offers/job/${initialJobId}/recipients`
            : `/jobs/offers/job/${initialJobId}/recipients`;
          
          const [res, applicantsRes] = await Promise.all([
            api.get(endpoint),
            api.get(`/jobs/${initialJobId}/applicants`).catch(() => ({ data: [] }))
          ]);

          const offeredMap: Record<string, string> = {};
          res.data.forEach((r: any) => {
            offeredMap[r.user_id] = r.status;
          });

          const appliedSet = new Set<string>(applicantsRes.data.map((a: any) => a.applicantId));

          if (isMounted) {
            setAlreadyOfferedCandidates(offeredMap);
            setAppliedCandidates(appliedSet);
          }
        } catch (err) {
          console.error("Failed to fetch initial recipients or applicants", err);
        } finally {
          if (isMounted) {
            setIsFetchingRecipients(false);
            setStage(2);
          }
        }
      } else if (isOpen) {
        setSelectedJobId('');
        setStage(1);
      }
    };

    init();

    return () => {
      isMounted = false;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, initialJobId]);

  useEffect(() => {
    if (!isOpen) return;

    const fetchCandidates = async () => {
      setIsLoadingCandidates(true);
      try {
        let endpoint = '/users/suggested';
        if (searchQuery.trim().length > 0) {
          endpoint = `/users/search?q=${encodeURIComponent(searchQuery.trim())}`;
        }
        
        if (selectedJobId) {
          const separator = endpoint.includes('?') ? '&' : '?';
          endpoint += `${separator}excludeJobId=${selectedJobId}`;
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
  }, [isOpen, searchQuery, selectedJobId]);

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

  const handleSendClick = async () => {
    if (!selectedJob) return;
    const selectedList = selectedCandidates.map(id => allFetchedCandidates[id]).filter(Boolean);

    const notesRecord: Record<string, string> = {};
    selectedCandidates.forEach(id => {
      notesRecord[id] = personalNote;
    });

    setIsSending(true);
    try {
      const companyId = selectedJob.org_id || (selectedJob as any).company_id;
      const promises = selectedList.map((c) => {
        const message = (notesRecord[c.id] || '').trim() || undefined;
        if (companyId) {
          return api.post(`/jobs/companies/${companyId}/offers`, {
            jobId: selectedJob.id,
            userId: c.id,
            message
          });
        } else {
          return api.post(`/jobs/offers`, {
            jobId: selectedJob.id,
            userId: c.id,
            message
          });
        }
      });

      await Promise.all(promises);
      toast.success(`Offers sent successfully to: ${selectedList.map(c => c.name).join(', ')}`);
      
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      queryClient.invalidateQueries({ queryKey: ['messages'] });

      if (onOfferSent) {
        onOfferSent();
      }
      
      // Reset state
      setStage(1);
      setSelectedJobId('');
      setSelectedCandidates([]);
      setPersonalNote('');
      onClose();
    } catch (error: any) {
      console.error('Failed to send offers:', error);
      const errMsg = error.response?.data?.message || 'Failed to send offers.';
      toast.error(errMsg);
    } finally {
      setIsSending(false);
    }
  };


  return (
    <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      {/* Mobile bottom sheet / Desktop centered modal */}
      <div className="w-full md:w-[416px] md:p-4 bg-white dark:bg-[#0F1115] md:rounded-3xl flex flex-col justify-start items-center overflow-hidden shadow-xl border border-indigo-50/50 dark:border-[#2A2D35] animate-in slide-in-from-bottom md:zoom-in-95 duration-300 rounded-t-[28px] max-h-[92dvh] md:max-h-none overflow-y-auto">
        
        {/* STAGE 1: Choose Job */}
        {stage === 1 && (
          <>
            {/* Mobile drag handle */}
            <div className="md:hidden w-full flex flex-col items-center pt-3 pb-1 px-4">
              <div className="w-10 h-1 rounded-full bg-gray-300 dark:bg-[#2A2D35] mb-1" />
            </div>

            {/* Desktop close button */}
            <div className="hidden md:flex self-stretch flex-col justify-start items-end gap-2.5">
              <button
                onClick={handleCancelClick}
                type="button"
                className="w-6 h-6 relative overflow-hidden flex items-center justify-center hover:opacity-75 transition-opacity"
              >
                <Icon icon="lucide:x" className="w-5 h-5 text-red-400" />
              </button>
            </div>

            {/* Content Container */}
            <div className="w-full flex flex-col justify-start items-center gap-4 px-4 md:px-0 pb-6 md:pb-0">
              {/* Title Header */}
              <div className="w-full flex flex-col justify-start items-center gap-2">
                <div className="text-center justify-start text-black dark:text-[#F9FAFB] text-lg font-semibold md:font-medium font-['Poppins'] leading-6">Send offer</div>
                <div className="text-center justify-start text-gray-500 dark:text-[#9CA3AF] text-xs font-normal font-['Poppins'] leading-4">Choose or create a job to send an offer.</div>
              </div>

              {/* Search input */}
              <div data-property-1="SEARCH" className={`w-full md:w-96 px-4 py-3 md:py-2 rounded-3xl outline outline-1 outline-offset-[-1px] outline-gray-200 dark:outline-[#2A2D35] bg-white dark:bg-[#0B0F19] inline-flex justify-between items-center transition-colors ${
                isCompanyMode ? 'focus-within:outline-blue-400' : 'focus-within:outline-indigo-400'
              }`}>
                <input
                  type="text"
                  placeholder="Search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 bg-transparent border-0 p-0 text-black dark:text-[#F9FAFB] text-base font-normal font-['Poppins'] leading-6 focus:ring-0 focus:outline-none placeholder-gray-400 text-sm"
                />
                <div className="w-6 h-6 relative overflow-hidden flex items-center justify-center text-gray-450 pointer-events-none">
                  <Icon icon="lucide:search" className="w-4 h-4 text-gray-400" />
                </div>
              </div>

              {/* Job Listings List */}
              <div className="w-full md:w-96 flex flex-col justify-start items-start gap-4">
                <div className="text-left justify-start text-black dark:text-[#F9FAFB] text-xs font-normal font-['Poppins'] leading-4">Recent jobs</div>
                <div className="self-stretch flex flex-col gap-2 md:max-h-[220px] overflow-y-auto pr-1 w-full [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-slate-200 [&::-webkit-scrollbar-thumb]:rounded-full">
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
                          className={`self-stretch px-4 py-3 md:py-2 rounded-xl inline-flex justify-start items-start gap-4 cursor-pointer border transition-all ${
                            isSelected
                              ? (isCompanyMode ? 'bg-blue-50 dark:bg-[#16365F] border-blue-100 dark:border-[#1A73E8]/30 shadow-sm' : 'bg-indigo-50 dark:bg-[#252E54] border-indigo-100 dark:border-indigo-500/30 shadow-sm')
                              : 'bg-white dark:bg-transparent hover:bg-slate-50 dark:hover:bg-[#1C2340]/30 border-transparent'
                          }`}
                        >
                          <div className="flex-1 inline-flex flex-col justify-start items-start gap-1 md:gap-2 min-w-0">
                            <div className="justify-center text-black dark:text-[#F9FAFB] text-base font-semibold md:font-medium font-['Poppins'] capitalize leading-6 truncate w-full text-left">{job.title}</div>
                            <div className="self-stretch justify-center text-gray-500 dark:text-[#9CA3AF] text-xs font-normal font-['Poppins'] leading-4 text-left">{job.posted_at || 'Posted recently'}</div>
                          </div>
                          <div className="w-16 p-2 bg-green-50 dark:bg-[#123B23] rounded-full inline-flex flex-col justify-center items-center flex-shrink-0">
                            <div className="justify-center text-green-500 dark:text-[#4ADE80] text-[10px] font-medium font-['Poppins'] uppercase">ACTIVE</div>
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
                  className={`flex-1 h-11 md:h-10 px-4 py-2 bg-white dark:bg-transparent rounded-3xl outline outline-1 outline-offset-[-1px] flex justify-center items-center gap-2.5 active:scale-95 transition-all text-sm font-normal font-['Poppins'] leading-5 ${
                    isCompanyMode ? 'outline-blue-400 text-[#1A73E8] hover:bg-blue-50/10' : 'outline-indigo-400 text-indigo-400 hover:bg-indigo-50/10'
                  }`}
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
                      
                      const [res, applicantsRes] = await Promise.all([
                        api.get(endpoint),
                        api.get(`/jobs/${selectedJobId}/applicants`).catch(() => ({ data: [] }))
                      ]);

                      const offeredMap: Record<string, string> = {};
                      res.data.forEach((r: any) => {
                        offeredMap[r.user_id] = r.status;
                      });

                      const appliedSet = new Set<string>(applicantsRes.data.map((a: any) => a.applicantId));

                      setAlreadyOfferedCandidates(offeredMap);
                      setAppliedCandidates(appliedSet);
                      setStage(2);
                      setSearchQuery('');
                    } catch (err) {
                      console.error("Failed to fetch recipients or applicants", err);
                      setStage(2);
                      setSearchQuery('');
                    } finally {
                      setIsFetchingRecipients(false);
                    }
                  }}
                  disabled={!selectedJobId || isFetchingRecipients}
                  type="button"
                  className={`flex-1 h-11 md:h-10 px-4 py-2 rounded-3xl outline outline-1 outline-offset-[-1px] outline-white flex justify-center items-center gap-2.5 active:scale-95 transition-all text-white text-sm font-normal font-['Poppins'] leading-5 disabled:opacity-50 disabled:cursor-not-allowed ${
                    isCompanyMode ? 'bg-[#1A73E8] hover:bg-[#1557B0]' : 'bg-indigo-500 hover:bg-indigo-600'
                  }`}
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
            {/* Mobile drag handle */}
            <div className="md:hidden w-full flex flex-col items-center pt-3 pb-1 px-4">
              <div className="w-10 h-1 rounded-full bg-gray-300 dark:bg-[#2A2D35] mb-1" />
            </div>

            {/* Desktop close button */}
            <div className="hidden md:flex self-stretch flex-col justify-start items-end gap-2.5">
              <button
                onClick={handleCancelClick}
                type="button"
                className="w-6 h-6 relative overflow-hidden flex items-center justify-center hover:opacity-75 transition-opacity"
              >
                <Icon icon="lucide:x" className="w-5 h-5 text-red-400" />
              </button>
            </div>

            {/* Content Container */}
            <div className="w-full flex flex-col justify-start items-center gap-4 px-4 md:px-0 pb-6 md:pb-0">
              {/* Title Header */}
              <div className="w-full flex flex-col justify-start items-center gap-2">
                <div className="text-center justify-start text-black dark:text-[#F9FAFB] text-lg font-semibold md:font-medium font-['Poppins'] leading-6">Send offer</div>
                <div className="text-center justify-start text-gray-500 dark:text-[#9CA3AF] text-xs font-normal font-['Poppins'] leading-4">Write a short invitation message</div>
              </div>

              {/* Search input */}
              <div data-property-1="SEARCH" className={`w-full md:w-96 px-4 py-3 md:py-2 rounded-3xl outline outline-1 outline-offset-[-1px] outline-gray-200 dark:outline-[#2A2D35] bg-white dark:bg-[#0B0F19] inline-flex justify-between items-center transition-colors ${
                isCompanyMode ? 'focus-within:outline-blue-400' : 'focus-within:outline-indigo-400'
              }`}>
                <input
                  type="text"
                  placeholder="Search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 bg-transparent border-0 p-0 text-black dark:text-[#F9FAFB] text-base font-normal font-['Poppins'] leading-6 focus:ring-0 focus:outline-none placeholder-gray-400 text-sm"
                />
                <div className="w-6 h-6 relative overflow-hidden flex items-center justify-center text-gray-400 pointer-events-none">
                  <Icon icon="lucide:search" className="w-4 h-4 text-gray-400" />
                </div>
              </div>

              {/* Candidates selection */}
              <div className="self-stretch flex flex-col justify-start items-start gap-2 w-full px-2 box-border">
                <div className="text-left justify-start text-black text-xs font-normal font-['Poppins'] leading-4">Choose candidates</div>
                
                <div className="self-stretch flex flex-col justify-start items-start gap-2 max-h-[220px] overflow-y-auto pr-1 w-full [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-slate-200 [&::-webkit-scrollbar-thumb]:rounded-full">
                  {(() => {
                    const availableCandidates = candidatesList.filter((cand) => {
                      const offerStatus = alreadyOfferedCandidates[cand.id];
                      const isAlreadyOffered = offerStatus && ['pending', 'accepted', 'declined'].includes(offerStatus.toLowerCase());
                      const hasApplied = appliedCandidates.has(cand.id);
                      return !isAlreadyOffered && !hasApplied;
                    });

                    if (availableCandidates.length === 0) {
                      return (
                        <div className="py-8 text-center text-gray-400 text-xs font-['Poppins'] w-full">
                          No candidates available.
                        </div>
                      );
                    }

                    return availableCandidates.map((cand) => {
                      const isChecked = selectedCandidates.includes(cand.id);

                      return (
                        <div
                          key={cand.id}
                          onClick={() => {
                            toggleCandidateSelection(cand.id);
                          }}
                          className={`self-stretch h-12 inline-flex justify-between items-center rounded-xl px-2 transition-colors w-full box-border cursor-pointer ${
                             isCompanyMode ? 'hover:bg-blue-50/20' : 'hover:bg-indigo-50/20'
                           }`}
                        >
                          <div className="flex justify-start items-center gap-2">
                            {cand.avatar ? (
                              <img
                                className="w-8 h-8 rounded-full object-cover border border-slate-100"
                                src={cand.avatar}
                                alt={cand.name}
                              />
                            ) : (
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold font-['Poppins'] text-xs ${
                                 isCompanyMode ? 'bg-blue-100 text-[#1A73E8]' : 'bg-indigo-100 text-indigo-500'
                               }`}>
                                {cand.name.substring(0, 2).toUpperCase()}
                              </div>
                            )}
                            <div className="inline-flex flex-col justify-center items-start">
                              <div className="flex items-center gap-2">
                                <span className="text-left text-black text-base font-normal font-['Poppins'] leading-6">{cand.name}</span>
                              </div>
                            </div>
                          </div>
                          
                          {/* Checkbox */}
                          {isChecked ? (
                            <div className="p-1 inline-flex flex-col justify-center items-center">
                              <div className={`w-5 h-5 rounded flex items-center justify-center border ${
                                 isCompanyMode ? 'bg-[#1A73E8] border-[#1A73E8]' : 'bg-indigo-500 border-indigo-500'
                               }`}>
                                <Icon icon="lucide:check" className="w-3.5 h-3.5 text-white stroke-[3]" />
                              </div>
                            </div>
                          ) : (
                            <div className="p-1 inline-flex flex-col justify-center items-center">
                              <div className="w-5 h-5 rounded border bg-white border-gray-300" />
                            </div>
                          )}
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>

              {/* Footer Buttons */}
              <div className="self-stretch inline-flex justify-start items-start gap-4 w-full">
                <button
                  onClick={() => {
                    if (initialJobId) {
                      handleCancelClick();
                    } else {
                      setStage(1);
                      setSearchQuery('');
                    }
                  }}
                  type="button"
                  className={`flex-1 h-11 md:h-10 px-4 py-2 bg-white dark:bg-transparent rounded-3xl outline outline-1 outline-offset-[-1px] flex justify-center items-center gap-2.5 active:scale-95 transition-all text-sm font-normal font-['Poppins'] leading-5 ${
                    isCompanyMode ? 'outline-blue-400 text-[#1A73E8] hover:bg-blue-50/10' : 'outline-indigo-400 text-indigo-400 hover:bg-indigo-50/10'
                  }`}
                >
                  {initialJobId ? 'Cancel' : 'Back'}
                </button>
                <button
                  onClick={() => {
                    setStage(3);
                    setSearchQuery('');
                  }}
                  disabled={selectedCandidates.length === 0}
                  type="button"
                  className={`flex-1 h-11 md:h-10 px-4 py-2 rounded-3xl outline outline-1 outline-offset-[-1px] outline-white flex justify-center items-center gap-2.5 active:scale-95 transition-all text-white text-sm font-normal font-['Poppins'] leading-5 disabled:opacity-50 disabled:cursor-not-allowed ${
                    isCompanyMode ? 'bg-[#1A73E8] hover:bg-[#1557B0]' : 'bg-indigo-500 hover:bg-indigo-600'
                  }`}
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
            {/* Mobile drag handle */}
            <div className="md:hidden w-full flex flex-col items-center pt-3 pb-1 px-4">
              <div className="w-10 h-1 rounded-full bg-gray-300 dark:bg-[#2A2D35] mb-1" />
            </div>

            {/* Desktop close button */}
            <div className="hidden md:flex self-stretch flex-col justify-start items-end gap-2.5">
              <button
                onClick={handleCancelClick}
                type="button"
                className="w-6 h-6 relative overflow-hidden flex items-center justify-center hover:opacity-75 transition-opacity"
              >
                <Icon icon="lucide:x" className="w-5 h-5 text-red-400" />
              </button>
            </div>

            {/* Content Container */}
            <div className="w-full flex flex-col justify-start items-center gap-4 px-4 md:px-0 pb-6 md:pb-0">
              {/* Title Header */}
              <div className="w-full flex flex-col justify-start items-center gap-2">
                <div className="text-center justify-start text-black dark:text-[#F9FAFB] text-lg font-semibold md:font-medium font-['Poppins'] leading-6">Send offer</div>
                <div className="text-center justify-start text-gray-500 dark:text-[#9CA3AF] text-xs font-normal font-['Poppins'] leading-4">Write a short invitation message</div>
              </div>

              {/* Selected Candidates Avatars */}
              <div className="w-full flex justify-center items-start gap-8 mt-2 mb-4 flex-wrap">
                {selectedCandidates.map((id) => {
                  const c = allFetchedCandidates[id];
                  if (!c) return null;
                  return (
                    <div 
                      key={c.id} 
                      className="flex flex-col items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={() => {
                        toggleCandidateSelection(c.id);
                        if (selectedCandidates.length === 1) {
                          setStage(2);
                        }
                      }}
                    >
                      <div className="relative">
                        {c.avatar ? (
                          <img className="w-14 h-14 rounded-full object-cover border-2 border-white shadow-sm" src={c.avatar} alt={c.name} />
                        ) : (
                          <div className={`w-14 h-14 rounded-full flex items-center justify-center font-semibold font-['Poppins'] text-lg border-2 border-white shadow-sm ${
                            isCompanyMode ? 'bg-blue-100 text-[#1A73E8]' : 'bg-indigo-100 text-indigo-500'
                          }`}>
                            {c.name.substring(0, 2).toUpperCase()}
                          </div>
                        )}
                        <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded border-[1.5px] border-white flex items-center justify-center shadow-sm ${
                          isCompanyMode ? 'bg-[#1A73E8]' : 'bg-[#6366F1]'
                        }`}>
                          <Icon icon="lucide:check" className="w-3.5 h-3.5 text-white stroke-[3]" />
                        </div>
                      </div>
                      <span className="text-gray-500 text-sm font-normal font-['Poppins'] leading-tight capitalize">{c.name.toLowerCase()}</span>
                    </div>
                  );
                })}
              </div>

              {/* Single Textarea */}
              <div className={`self-stretch h-36 px-4 py-3 bg-white dark:bg-[#0B0F19] rounded-2xl outline outline-1 inline-flex justify-start items-start w-full box-border transition-colors ${
                isCompanyMode ? 'outline-gray-200 dark:outline-[#2A2D35] focus-within:outline-blue-300' : 'outline-gray-200 dark:outline-[#2A2D35] focus-within:outline-indigo-300'
              }`}>
                <textarea
                  value={personalNote}
                  onChange={(e) => setPersonalNote(e.target.value)}
                  placeholder="Add a personal note...."
                  className="flex-1 w-full h-full bg-transparent border-0 p-0 text-gray-700 dark:text-[#F9FAFB] text-sm font-normal font-['Poppins'] focus:outline-none focus:ring-0 resize-none placeholder-gray-500 dark:placeholder-[#9CA3AF]"
                />
              </div>

              {/* Footer Buttons */}
              <div className="self-stretch inline-flex justify-start items-start gap-4 w-full">
                <button
                  onClick={() => setStage(2)}
                  type="button"
                  className={`flex-1 h-11 md:h-10 px-4 py-2 bg-white dark:bg-transparent rounded-3xl outline outline-1 outline-offset-[-1px] flex justify-center items-center gap-2.5 active:scale-95 transition-all text-sm font-normal font-['Poppins'] leading-5 ${
                    isCompanyMode ? 'outline-blue-400 text-[#1A73E8] hover:bg-blue-50/10' : 'outline-indigo-400 text-indigo-400 hover:bg-indigo-50/10'
                  }`}
                >
                  Back
                </button>
                <button
                  onClick={handleSendClick}
                  disabled={selectedCandidates.length === 0 || isSending}
                  type="button"
                  className={`flex-1 h-11 md:h-10 px-4 py-2 rounded-3xl outline outline-1 outline-offset-[-1px] outline-white flex justify-center items-center gap-2.5 active:scale-95 transition-all text-white text-sm font-normal font-['Poppins'] leading-5 disabled:opacity-50 disabled:cursor-not-allowed ${
                    isCompanyMode ? 'bg-[#1A73E8] hover:bg-[#1557B0]' : 'bg-indigo-500 hover:bg-indigo-600'
                  }`}
                >
                  {isSending ? <Icon icon="lucide:loader-2" className="w-4 h-4 animate-spin" /> : "Send"}
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
