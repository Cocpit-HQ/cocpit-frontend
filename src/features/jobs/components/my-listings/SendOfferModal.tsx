import React, { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import { CandidateCheckboxIcon, SearchIcon } from '@/components/icons';
import Avatar from '@/components/shared/Avatar';
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

  const [stage, setStage] = useState<1 | 2 | 3>(initialJobId ? 2 : 1);
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

  // Lock body scroll when modal is open to prevent background scrolling
  useEffect(() => {
    if (!isOpen) return;
    const originalOverflow = document.body.style.overflow;
    const originalTouchAction = document.body.style.touchAction;

    document.body.style.overflow = 'hidden';
    document.body.style.touchAction = 'none';

    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.touchAction = originalTouchAction;
    };
  }, [isOpen]);

  useEffect(() => {
    let isMounted = true;
    const init = async () => {
      if (isOpen && initialJobId) {
        setSelectedJobId(initialJobId);
        setStage(2);
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
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 p-4 overscroll-contain"
      onWheel={(e) => e.stopPropagation()}
    >
      {/* Centered modal matching Figma exactly per stage */}
      <div
        className="w-full max-w-[400px] h-auto max-h-[calc(100dvh-32px)] p-3 bg-ds-bg rounded-2xl border border-ds-border shadow-2xl flex flex-col justify-start items-center gap-3 font-dm-sans animate-in zoom-in-95 duration-200 select-none overscroll-contain"
        onWheel={(e) => e.stopPropagation()}
      >

        {/* STAGE 1: Choose Job (Exact Figma Parity) */}
        {stage === 1 && (
          <div className="w-full flex flex-col justify-between items-center gap-2">
            {/* Header: Top Close Icon (Frame 2609536) */}
            <div className="w-full max-w-[376px] h-5 flex justify-end items-center">
              <button
                onClick={handleCancelClick}
                type="button"
                aria-label="Close"
                className="size-5 flex items-center justify-center text-ds-text-primary hover:text-ds-accent transition-colors cursor-pointer bg-transparent border-none p-0 outline-none"
              >
                <Icon icon="lucide:x" className="size-5" />
              </button>
            </div>

            {/* Title: Send offer */}
            <h3 className="w-full max-w-[376px] h-6 text-ds-text-primary text-base font-medium font-dm-sans leading-6 text-center">
              Send offer
            </h3>

            {/* Content Container (Frame 2609544: 376px x 300px) */}
            <div className="w-full max-w-[376px] flex flex-col justify-between items-center gap-2">
              {/* Underline Search bar (Mobile nav bar & search: 344px x 36px) */}
              <div className="w-full px-4 py-1 flex justify-center items-center">
                <div className="w-full max-w-[344px] h-9 px-3 py-1.5 border-b border-ds-text-primary flex justify-between items-center gap-2.5 transition-colors">
                  <input
                    type="text"
                    placeholder="Search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1 bg-transparent border-none p-0 text-ds-text-primary text-base font-normal font-dm-sans leading-6 placeholder:text-ds-text-muted placeholder:font-normal focus:outline-none focus:ring-0"
                  />
                  <SearchIcon size={20} className="size-5 text-ds-text-primary shrink-0 pointer-events-none" />
                </div>
              </div>

              {/* Job Listings List (Frame 2608872 rows: height 60px each) */}
              <div
                className="w-full max-w-[376px] max-h-[190px] overflow-y-auto no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden overscroll-contain flex flex-col gap-1 py-1"
                onWheel={(e) => e.stopPropagation()}
              >
                {filteredListings.length === 0 ? (
                  <div className="py-8 text-center text-ds-text-muted text-xs font-dm-sans w-full">
                    No active job listings found.
                  </div>
                ) : (
                  filteredListings.map((job) => {
                    const isSelected = job.id === selectedJobId;
                    return (
                      <div
                        key={job.id}
                        onClick={() => setSelectedJobId(job.id)}
                        className={`w-full h-[60px] py-2 px-2 inline-flex justify-between items-center gap-3 cursor-pointer rounded-xl transition-all select-none ${isSelected
                            ? 'bg-ds-surface-2 border border-ds-accent/50 shadow-sm'
                            : 'hover:bg-ds-surface-2/60 border border-transparent'
                          }`}
                      >
                        <div className="flex-1 flex flex-col justify-center items-start gap-1 min-w-0 pointer-events-none">
                          <span className="text-ds-text-primary text-sm font-medium font-dm-sans leading-5 truncate w-full text-left">
                            {job.title}
                          </span>
                          <span className="text-ds-text-secondary text-xs font-normal font-dm-sans leading-4 text-left">
                            {job.posted_at || 'Posted recently'}
                          </span>
                        </div>
                        {/* Active Badge (Frame 2608515: 69px x 32px, radius 24px) */}
                        <div className="w-[69px] h-8 px-4 py-2 bg-ds-surface-2 rounded-full border border-ds-success flex justify-center items-center shrink-0 pointer-events-none">
                          <span className="text-ds-success text-xs font-normal font-dm-sans leading-4 text-center">
                            Active
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Action Buttons (Frame 2609476: 376px x 36px, gap 8px) */}
              <div className="w-full max-w-[376px] h-9 flex justify-center items-center gap-2 shrink-0">
                <button
                  type="button"
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
                      setSelectedCandidates([]);
                      setPersonalNote('');
                      setSearchQuery('');
                      setStage(2);
                    } catch (err) {
                      console.error("Failed to fetch recipients or applicants", err);
                      setSelectedCandidates([]);
                      setPersonalNote('');
                      setSearchQuery('');
                      setStage(2);
                    } finally {
                      setIsFetchingRecipients(false);
                    }
                  }}
                  disabled={!selectedJobId || isFetchingRecipients}
                  className={`min-w-[94px] h-9 px-3 py-1.5 rounded-full box-border text-sm font-medium font-dm-sans leading-6 flex items-center justify-center whitespace-nowrap transition-all select-none whitespace-nowrap ${!selectedJobId || isFetchingRecipients
                      ? 'bg-ds-surface-2 text-ds-text-muted cursor-not-allowed'
                      : 'bg-ds-accent text-ds-text-primary hover:opacity-90 active:scale-95 cursor-pointer shadow-sm'
                    }`}
                >
                  {isFetchingRecipients ? (
                    <Icon icon="lucide:loader-2" className="size-4 animate-spin" />
                  ) : (
                    "Continue"
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleCancelClick}
                  className="min-w-[94px] h-9 px-3 py-1.5 rounded-full box-border border border-ds-border bg-transparent text-ds-text-primary hover:bg-ds-surface-1 hover:border-ds-text-muted active:scale-95 text-sm font-medium font-dm-sans leading-6 flex items-center justify-center whitespace-nowrap transition-all cursor-pointer select-none whitespace-nowrap"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STAGE 2: Choose Candidates (Exact Figma Parity) */}
        {stage === 2 && (
          <div className="w-full flex flex-col justify-between items-center gap-2">
            {/* Header: Frame 2609688 (56px) */}
            <div className="w-full max-w-[376px] flex flex-col items-center gap-2 shrink-0">
              {/* Top Close Icon: Frame 2609536 */}
              <div className="w-full h-5 flex justify-end items-center">
                <button
                  onClick={handleCancelClick}
                  type="button"
                  aria-label="Close"
                  className="size-5 flex items-center justify-center text-ds-text-primary hover:text-ds-accent transition-colors cursor-pointer bg-transparent border-none p-0 outline-none"
                >
                  <Icon icon="lucide:x" className="size-5" />
                </button>
              </div>

              {/* Title: Send offer */}
              <h3 className="w-full h-6 text-ds-text-primary text-base font-medium font-dm-sans leading-6 text-center">
                Send offer
              </h3>
            </div>

            {/* Content Container (Frame 2609544: 376px x 212px) */}
            <div className="w-full max-w-[376px] flex flex-col justify-start items-center gap-2">
              {/* Component 10: Underline Search bar (376px x 36px) */}
              <div className="w-full h-9 px-1 py-1.5 border-b border-ds-text-primary flex justify-between items-center gap-2 transition-colors shrink-0">
                <input
                  type="text"
                  placeholder="Search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 bg-transparent border-none p-0 text-ds-text-primary text-sm font-normal font-dm-sans leading-5 placeholder:text-ds-text-muted focus:outline-none focus:ring-0"
                />
                <SearchIcon size={20} className="size-5 text-ds-text-primary shrink-0 pointer-events-none" />
              </div>

              {/* Candidates selection list (36px rows each: Frame 2609539, 2609540, 2609541, 2609542) */}
              <div
                className="w-full max-h-[190px] overflow-y-auto select-none no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden overscroll-contain flex flex-col gap-1 py-1"
                onWheel={(e) => e.stopPropagation()}
              >
                {(() => {
                  if (isFetchingRecipients) {
                    return (
                      <div className="py-8 flex flex-col items-center justify-center gap-2 text-ds-text-muted text-xs font-dm-sans w-full">
                        <Icon icon="lucide:loader-2" className="size-5 animate-spin text-ds-accent" />
                        <span>Loading candidates...</span>
                      </div>
                    );
                  }

                  const availableCandidates = candidatesList.filter((cand) => {
                    const offerStatus = alreadyOfferedCandidates[cand.id];
                    const isAlreadyOffered = offerStatus && ['pending', 'accepted', 'declined'].includes(offerStatus.toLowerCase());
                    const hasApplied = appliedCandidates.has(cand.id);
                    return !isAlreadyOffered && !hasApplied;
                  });

                  if (availableCandidates.length === 0) {
                    return (
                      <div className="py-8 text-center text-ds-text-muted text-xs font-dm-sans w-full">
                        No candidates available.
                      </div>
                    );
                  }

                  return availableCandidates.map((cand) => {
                    const isChecked = selectedCandidates.includes(cand.id);

                    return (
                      <div
                        key={cand.id}
                        onClick={() => toggleCandidateSelection(cand.id)}
                        className="w-full h-9 px-2 inline-flex justify-between items-center rounded-lg transition-colors cursor-pointer select-none shrink-0 hover:bg-ds-surface-2/60"
                      >
                        {/* Left: 20px avatar + candidate name */}
                        <div className="flex items-center gap-2 min-w-0 pointer-events-none">
                          <Avatar
                            src={cand.avatar}
                            name={cand.name}
                            isCompany={false}
                            className="size-5 rounded-full shrink-0"
                          />
                          <span className="text-ds-text-primary text-sm font-normal font-dm-sans leading-5 truncate">
                            {cand.name}
                          </span>
                        </div>

                        {/* Right: Checkbox (20px x 20px, radius 4px) */}
                        <div className={`size-5 rounded-[4px] flex items-center justify-center border transition-all pointer-events-none shrink-0 ${isChecked
                            ? 'bg-ds-accent border-ds-accent text-ds-text-primary'
                            : 'border-ds-border bg-ds-surface-2'
                          }`}>
                          {isChecked && <Icon icon="lucide:check" className="size-3.5 stroke-[3]" />}
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>

            {/* Action Buttons: Frame 2609476 (376px x 36px, gap 8px) */}
            <div className="w-full max-w-[376px] h-9 flex justify-center items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setPersonalNote('');
                  setSearchQuery('');
                  setStage(3);
                }}
                disabled={selectedCandidates.length === 0}
                className={`min-w-[94px] h-9 px-3 py-1.5 rounded-full box-border text-sm font-medium font-dm-sans leading-6 flex items-center justify-center whitespace-nowrap transition-all select-none whitespace-nowrap ${selectedCandidates.length === 0
                    ? 'bg-ds-surface-2 text-ds-text-muted cursor-not-allowed'
                    : 'bg-ds-accent text-ds-text-primary hover:opacity-90 active:scale-95 cursor-pointer shadow-sm'
                  }`}
              >
                Continue
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedCandidates([]);
                  setPersonalNote('');
                  setSearchQuery('');
                  if (initialJobId) {
                    handleCancelClick();
                  } else {
                    setStage(1);
                  }
                }}
                className="min-w-[94px] h-9 px-3 py-1.5 rounded-full box-border border border-ds-border bg-transparent text-ds-text-primary hover:bg-ds-surface-1 hover:border-ds-text-muted active:scale-95 text-sm font-medium font-dm-sans leading-6 flex items-center justify-center whitespace-nowrap transition-all cursor-pointer select-none whitespace-nowrap"
              >
                {initialJobId ? 'Cancel' : 'Back'}
              </button>
            </div>
          </div>
        )}

        {/* STAGE 3: Personal Note & Send (Exact Figma Parity - 278px height) */}
        {stage === 3 && (
          <div className="w-full flex flex-col justify-between items-center gap-3">
            {/* Header: Frame 2609688 (376px x 56px, gap: 12px) */}
            <div className="w-full max-w-[376px] h-14 flex flex-col items-center gap-3 shrink-0">
              {/* Top Close Icon: Frame 2609536 (376px x 20px) */}
              <div className="w-full h-5 flex justify-end items-center">
                <button
                  onClick={handleCancelClick}
                  type="button"
                  aria-label="Close"
                  className="size-5 flex items-center justify-center text-ds-text-primary hover:text-ds-accent transition-colors cursor-pointer bg-transparent border-none p-0 outline-none"
                >
                  <Icon icon="lucide:x" className="size-5" />
                </button>
              </div>

              {/* Title: Send offer (79px x 24px, 16px DM Sans font-medium leading-6) */}
              <h3 className="w-full h-6 text-ds-text-primary text-base font-medium font-dm-sans leading-6 text-center">
                Send offer
              </h3>
            </div>

            {/* Frame 2609544 / Frame 2609983: Selected Candidates Row (376px x 64px, gap: 8px) */}
            <div className="w-full max-w-[376px] h-16 flex items-center justify-center gap-2 overflow-x-auto no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden shrink-0">
              {selectedCandidates.map((id) => {
                const c = allFetchedCandidates[id];
                if (!c) return null;
                return (
                  <div
                    key={c.id}
                    className="relative w-[100px] h-16 shrink-0 cursor-pointer hover:opacity-85 transition-opacity select-none"
                    onClick={() => {
                      toggleCandidateSelection(c.id);
                      if (selectedCandidates.length === 1) {
                        setStage(2);
                      }
                    }}
                    title="Click to remove"
                  >
                    {/* Ellipse 24: Avatar 40x40 at left: 30px, top: 0px */}
                    <div className="absolute left-[30px] top-0 size-10">
                      <Avatar
                        src={c.avatar}
                        name={c.name}
                        isCompany={false}
                        className="size-10 rounded-full"
                      />
                    </div>

                    {/* CandidateCheckboxIcon: Exact Figma SVG (46px x 46px at left: 49px, top: 15px) */}
                    <CandidateCheckboxIcon className="absolute left-[49px] top-[15px] size-[46px] pointer-events-none z-10" />

                    {/* Candidate Name: 14px DM Sans leading-5 centered at top: 48px */}
                    <span className="absolute top-12 inset-x-0 h-5 text-ds-text-primary text-sm font-normal font-dm-sans text-center truncate px-0.5 leading-5 block">
                      {c.name}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Frame 2609640: Note input with label and character counter matching business profile */}
            <div className="w-full max-w-[376px] flex flex-col justify-start items-end gap-1 shrink-0">
              <div className="w-full py-2 border-b border-ds-border focus-within:border-ds-accent flex flex-col justify-center items-start gap-1 transition-colors">
                <label className="text-xs font-medium font-dm-sans text-ds-text-secondary leading-4">
                  Note
                </label>
                <input
                  type="text"
                  value={personalNote}
                  onChange={(e) => setPersonalNote(e.target.value.slice(0, 255))}
                  maxLength={255}
                  placeholder="Add a personal note...."
                  className="w-full bg-transparent border-none p-0 text-sm font-normal font-dm-sans text-ds-text-primary placeholder:text-ds-text-muted focus:outline-none focus:ring-0 leading-5"
                />
              </div>
              <div className="text-ds-text-muted text-xs font-normal font-dm-sans leading-4">
                {personalNote?.length || 0}/255
              </div>
            </div>

            {/* Frame 2609476: Action Buttons (376px x 36px, gap: 8px) */}
            <div className="w-full max-w-[376px] h-9 flex justify-center items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleSendClick}
                disabled={selectedCandidates.length === 0 || isSending}
                className={`min-w-[94px] h-9 px-3 py-1.5 rounded-full box-border text-sm font-medium font-dm-sans leading-6 flex items-center justify-center whitespace-nowrap transition-all select-none whitespace-nowrap ${selectedCandidates.length === 0 || isSending
                    ? 'bg-ds-surface-1 text-ds-text-muted cursor-not-allowed'
                    : 'bg-ds-accent text-ds-text-primary hover:opacity-90 active:scale-95 cursor-pointer shadow-sm'
                  }`}
              >
                {isSending ? (
                  <Icon icon="lucide:loader-2" className="size-4 animate-spin" />
                ) : (
                  "Continue"
                )}
              </button>
              <button
                type="button"
                onClick={() => {
                  setPersonalNote('');
                  setStage(2);
                }}
                className="min-w-[94px] h-9 px-3 py-1.5 rounded-full box-border border border-ds-border bg-transparent text-ds-text-primary hover:bg-ds-surface-1 hover:border-ds-text-muted active:scale-95 text-sm font-medium font-dm-sans leading-6 flex items-center justify-center whitespace-nowrap transition-all cursor-pointer select-none whitespace-nowrap"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default SendOfferModal;
