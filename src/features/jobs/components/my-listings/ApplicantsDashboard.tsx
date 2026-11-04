import { formatPostedTime } from '../../utils/jobs.utils';
import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Icon } from '@iconify/react';
import { useActiveProfile } from '@/context/ActiveProfileContext';
import { useCompanyPermissions } from '@/features/businessProfile';
import { useToast } from '@/hooks/use-toast';
import { CyphexAIIcon, PdfFileIcon, EyeIcon, UserIcon, LeftArrowIcon, BriefcaseIcon, Icon as CustomIcon } from '@/components/icons';
import { ApplicantsMobileDrawer } from '../drawers/ApplicantsMobileDrawer';
import Avatar from '@/components/shared/Avatar';
import { JobListing } from '../../types/jobs.types';
import {
  getJobApplicants,
  getApplicationDetail,
  getApplicationAnalysis,
  updateApplicationStatus,
  upsertApplicationNote,
  triggerApplicationAnalysis,
} from '../../services/jobs.service';

interface ApplicantsDashboardProps {
  listing: JobListing;
  onBack: () => void;
  onViewDetails: () => void;
}

interface Candidate {
  id: string;
  applicationId?: string;
  applicantId?: string;
  accountName?: string;
  username?: string;
  name: string;
  headline?: string;
  title?: string;
  location?: string;
  avatarUrl?: string;
  avatar?: string;
  matchScore?: number | null;
  score?: number | null;
  status: 'pending' | 'Shortlisted' | 'Rejected' | 'Applied' | string;
  selfNote?: string;
  note?: string;
  resumeName?: string;
  resumeFileName?: string;
  resume_file_name?: string;
  resumeUrl?: string;
  resume?: string;
  summary?: {
    strengths: string[];
    concerns: string[];
    recommendation: string;
  } | null;
  skills?: {
    match: number;
    tags: { name: string; matched: boolean }[];
    summary: string;
  } | null;
  experience?: {
    status: string;
    required: string;
    actual: string;
    summary: string;
  } | null;
  qualification?: {
    status: string;
    degree: string;
    class: string;
    summary: string;
  } | null;
}

type FilterOption = 'Top match' | 'Recent' | 'Shortlisted' | 'Noted' | 'Pending';

const EMPTY_STATE_CONFIG: Record<
  FilterOption,
  { title: string; subtitle: React.ReactNode }
> = {
  'Top match': {
    title: 'No matching candidates yet',
    subtitle: (
      <>
        Candidates that best match this job&apos;s
        <br />
        requirements will appear here when available
      </>
    ),
  },
  'Recent': {
    title: 'No recent candidates',
    subtitle: (
      <>
        New candidates will appear here when they{' '}
        <br />
        apply for this job.
      </>
    ),
  },
  'Shortlisted': {
    title: 'No candidates shortlisted yet',
    subtitle: (
      <>
        Shortlist candidates who are a good fit for{' '}
        <br />
        this role to find them here
      </>
    ),
  },
  'Noted': {
    title: 'No candidates notes yet',
    subtitle: (
      <>
        Add notes to candidates to keep important{' '}
        <br />
        observations and hiring feedback in one place
      </>
    ),
  },
  'Pending': {
    title: 'No candidates pending review',
    subtitle: (
      <>
        you&apos;re all caught up. Candidates awaiting{' '}
        <br />
        review will appear here
      </>
    ),
  },
};

const applicantsCache = new Map<string, Candidate[]>();

export const ApplicantsDashboard: React.FC<ApplicantsDashboardProps> = ({
  listing,
  onBack,
  onViewDetails,
}) => {
  const { isCompany, activeProfile } = useActiveProfile();
  const isCompanyMode = isCompany && !!activeProfile?.id;
  const companyPermissions = useCompanyPermissions({ viewer_role_data: activeProfile?.viewer_role_data });
  const canJobsChat = !isCompanyMode || companyPermissions.canJobsChat;
  const router = useRouter();
  const { toast } = useToast();

  const [filter, setFilter] = useState<FilterOption>('Top match');
  const [isMobileFilterDrawerOpen, setIsMobileFilterDrawerOpen] = useState(false);
  const [isMobileDetailOpen, setIsMobileDetailOpen] = useState(false);
  const cacheKey = `${listing.id}_${filter}`;
  const cached = applicantsCache.get(cacheKey);
  const isKnownZero = listing.applicants_count === 0;

  const [candidates, setCandidates] = useState<Candidate[]>(cached || []);
  const [selectedCandId, setSelectedCandId] = useState<string | null>(() => {
    if (cached && cached.length > 0) return cached[0].applicationId || cached[0].id;
    return null;
  });
  const [isLoadingApplicants, setIsLoadingApplicants] = useState<boolean>(!isKnownZero && !cached);
  const totalCandidates = candidates.length;
  const selectedIndex = candidates.findIndex(
    (c) => (c.applicationId || c.id) === selectedCandId
  );
  const currentCandidateIndex = selectedIndex >= 0 ? selectedIndex : (totalCandidates > 0 ? 0 : -1);

  const handleSelectPreviousCandidate = () => {
    if (currentCandidateIndex > 0) {
      const prev = candidates[currentCandidateIndex - 1];
      if (prev) {
        setSelectedCandId(prev.applicationId || prev.id);
      }
    }
  };

  const handleSelectNextCandidate = () => {
    if (currentCandidateIndex >= 0 && currentCandidateIndex < totalCandidates - 1) {
      const next = candidates[currentCandidateIndex + 1];
      if (next) {
        setSelectedCandId(next.applicationId || next.id);
      }
    }
  };
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);
  const [showAllSkills, setShowAllSkills] = useState(false);
  const [hasSecondLine, setHasSecondLine] = useState(false);
  const skillsContainerRef = useRef<HTMLDivElement>(null);

  // Real data state
  const [candidateDetail, setCandidateDetail] = useState<any>(null);
  const [candidateAnalysis, setCandidateAnalysis] = useState<any>(null);

  // Reset skills expansion when switching candidate
  useEffect(() => {
    setShowAllSkills(false);
  }, [selectedCandId]);

  // Fetch applicants from API with caching and instant resolution for zero applicants
  useEffect(() => {
    let active = true;
    const currentKey = `${listing.id}_${filter}`;

    if (listing.applicants_count === 0) {
      applicantsCache.set(currentKey, []);
      setCandidates([]);
      setSelectedCandId(null);
      setIsLoadingApplicants(false);
      return;
    }

    const fetchList = async () => {
      if (!applicantsCache.has(currentKey)) {
        setIsLoadingApplicants(true);
      }
      try {
        let apiStatus: string | undefined;
        if (filter === 'Shortlisted') apiStatus = 'Shortlisted';
        else if (filter === 'Pending') apiStatus = 'Applied';

        const list = await getJobApplicants(listing.id, apiStatus);
        const resolvedList = Array.isArray(list) ? list : [];
        applicantsCache.set(currentKey, resolvedList);

        if (active) {
          if (resolvedList.length > 0) {
            setCandidates(resolvedList);
            const firstId = resolvedList[0].applicationId || resolvedList[0].id;
            setSelectedCandId((prev) => {
              const exists = resolvedList.some((c: Candidate) => (c.applicationId || c.id) === prev);
              return exists ? prev : firstId;
            });
          } else {
            setCandidates([]);
            setSelectedCandId(null);
          }
        }
      } catch (err) {
        console.error('Failed to load job applicants:', err);
        if (active) {
          setCandidates([]);
          setSelectedCandId(null);
        }
      } finally {
        if (active) {
          setIsLoadingApplicants(false);
        }
      }
    };
    fetchList();
    return () => { active = false; };
  }, [listing.id, listing.applicants_count, filter]);

  // Fetch candidate details and AI analysis when selected candidate changes
  useEffect(() => {
    if (!selectedCandId) {
      setCandidateDetail(null);
      setCandidateAnalysis(null);
      return;
    }

    let active = true;
    const fetchDetail = async () => {
      try {
        const [detail, analysis] = await Promise.all([
          getApplicationDetail(selectedCandId),
          getApplicationAnalysis(selectedCandId),
        ]);
        if (active) {
          setCandidateDetail(detail);
          setCandidateAnalysis(detail?.aiAnalysis || analysis);
        }
      } catch (err) {
        console.error('Failed to load application detail:', err);
      }
    };
    fetchDetail();
    return () => { active = false; };
  }, [selectedCandId]);

  const activeCandidate = candidates.find(
    (c) => (c.applicationId || c.id) === selectedCandId
  ) || null;

  const handleTriggerAI = async () => {
    if (!selectedCandId) return;
    setIsAnalyzing(true);
    setAnalyzeError(null);
    try {
      await triggerApplicationAnalysis(selectedCandId);
      const freshAnalysis = await getApplicationAnalysis(selectedCandId);
      setCandidateAnalysis(freshAnalysis);
      setCandidates((prev) =>
        prev.map((c) =>
          (c.applicationId || c.id) === selectedCandId
            ? { ...c, matchScore: freshAnalysis.matchScore }
            : c
        )
      );
    } catch (error: any) {
      console.error('Failed to trigger AI analysis:', error);
      setAnalyzeError(error?.response?.data?.message || 'Analysis failed. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleShortlist = async (candId: string) => {
    if (!candId) return;
    try {
      await updateApplicationStatus(candId, 'Shortlisted');
      setCandidates((prev) =>
        prev.map((c) =>
          (c.applicationId || c.id) === candId ? { ...c, status: 'Shortlisted' } : c
        )
      );
      if (candidateDetail) {
        setCandidateDetail({ ...candidateDetail, status: 'Shortlisted' });
      }
      toast({ title: 'Candidate Shortlisted', description: 'The candidate has been notified.' });
    } catch (error) {
      console.error('Shortlist error:', error);
      toast({ title: 'Error', description: 'Failed to shortlist candidate.' });
    }
  };

  const handleDecline = async (candId: string) => {
    if (!candId) return;
    try {
      await updateApplicationStatus(candId, 'Rejected');
      setCandidates((prev) =>
        prev.map((c) =>
          (c.applicationId || c.id) === candId ? { ...c, status: 'Rejected' } : c
        )
      );
      if (candidateDetail) {
        setCandidateDetail({ ...candidateDetail, status: 'Rejected' });
      }
      toast({ title: 'Candidate Declined', description: 'The candidate status has been updated.' });
    } catch (error) {
      console.error('Decline error:', error);
      toast({ title: 'Error', description: 'Failed to decline candidate.' });
    }
  };

  const handleSaveNote = async () => {
    if (!selectedCandId) return;
    try {
      await upsertApplicationNote(selectedCandId, noteText);
      setCandidates((prev) =>
        prev.map((c) =>
          (c.applicationId || c.id) === selectedCandId
            ? { ...c, selfNote: noteText, note: noteText }
            : c
        )
      );
      if (candidateDetail) {
        setCandidateDetail({ ...candidateDetail, selfNote: noteText });
      }
      toast({ title: 'Note Saved', description: 'Your self note has been saved.' });
    } catch (error) {
      console.error('Save note error:', error);
      toast({ title: 'Error', description: 'Failed to save note.' });
    }
    setIsNoteModalOpen(false);
  };

  const openNoteModal = () => {
    setNoteText(candidateDetail?.selfNote || activeCandidate?.selfNote || activeCandidate?.note || '');
    setIsNoteModalOpen(true);
  };

  // Status mapping for job listing card
  const statusUpper = (listing.status || 'ACTIVE').toUpperCase();

  // Counts
  const appCount = listing.applicants_count || candidates.length;
  const shortlistCount = listing.shortlisted_count || candidates.filter(c => c.status === 'Shortlisted').length;
  const offerCount = listing.offers_count || 0;

  // Resolved candidate fields
  const displayName = candidateDetail?.name || activeCandidate?.name || '';
  const displayHeadline = candidateDetail?.headline || activeCandidate?.headline || activeCandidate?.title || '';
  const displayScore = candidateAnalysis?.matchScore ?? activeCandidate?.matchScore ?? activeCandidate?.score;
  const displaySelfNote = candidateDetail?.selfNote || activeCandidate?.selfNote || activeCandidate?.note;
  const rawResume =
    candidateDetail?.resumeName ||
    activeCandidate?.resumeName ||
    activeCandidate?.resume_file_name ||
    activeCandidate?.resumeFileName ||
    activeCandidate?.resume;

  const displayResumeName =
    rawResume ||
    (candidateDetail?.resumeUrl || activeCandidate?.resumeUrl)?.split('/').pop() ||
    'Resume.pdf';
  const displayAvatar = candidateDetail?.avatarUrl || activeCandidate?.avatarUrl || activeCandidate?.avatar;
  const displaySummary = candidateAnalysis?.summary || activeCandidate?.summary;
  const displaySkills = candidateAnalysis?.skills || activeCandidate?.skills;
  const displayExperience = candidateAnalysis?.experience || activeCandidate?.experience;
  const displayQualification = candidateAnalysis?.qualification || activeCandidate?.qualification;

  // Check if skills wrap to a second line
  useEffect(() => {
    const el = skillsContainerRef.current;
    if (!el) return;

    const checkSecondLine = () => {
      if (!el || el.children.length === 0) {
        setHasSecondLine(false);
        return;
      }
      const firstTop = (el.children[0] as HTMLElement).offsetTop;
      const isMultiLine = Array.from(el.children).some(
        (c) => (c as HTMLElement).offsetTop > firstTop
      );
      if (isMultiLine || el.scrollHeight > 36) {
        setHasSecondLine(true);
      } else {
        setHasSecondLine(false);
      }
    };

    checkSecondLine();
    const timer = setTimeout(checkSecondLine, 50);
    window.addEventListener('resize', checkSecondLine);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', checkSecondLine);
    };
  }, [displaySkills, activeCandidate, selectedCandId]);

  return (
    <>
      {/* Top-Left Back Button matching Public Profile and MyListingsDashboard */}
      {onBack && (
        <>
          {/* Desktop back button: fixed top-left */}
          <button
            type="button"
            onClick={onBack}
            aria-label="Back"
            className="hidden md:inline-flex fixed top-[40px] left-[40px] z-[60] items-center gap-2 p-0 text-ds-text-primary cursor-pointer bg-transparent border-none outline-none focus-visible:ring-2 focus-visible:ring-ds-accent"
          >
            <LeftArrowIcon size={20} className="size-5 text-ds-text-primary shrink-0" />
            <span className="font-dm-sans font-medium text-base leading-6">Back</span>
          </button>
          {/* Mobile back button: in-flow at top */}
          <button
            type="button"
            onClick={() => {
              if (isMobileDetailOpen) {
                setIsMobileDetailOpen(false);
              } else if (onBack) {
                onBack();
              }
            }}
            aria-label="Back"
            className="flex md:hidden items-center gap-2 p-0 text-ds-text-primary cursor-pointer bg-transparent border-none outline-none focus-visible:ring-2 focus-visible:ring-ds-accent self-start mb-2"
          >
            <LeftArrowIcon size={20} className="size-5 text-ds-text-primary shrink-0" />
            <span className="font-dm-sans font-medium text-base leading-6">Back</span>
          </button>
        </>
      )}

      {/* Main 960px Centered Column matching Figma Frame 2609508 */}
      <div className="w-full max-w-[800px] md:max-w-[960px] mx-auto pt-4 md:pt-[60px] pb-16 px-4 md:px-0 flex flex-col gap-4 md:gap-5 font-dm-sans">

        {/* Header (Title + Subtitle) — desktop only, hidden on mobile per Figma */}
        <div className="hidden md:flex w-full flex-col items-start gap-1">
          <h2 className="text-ds-text-primary text-base font-normal font-dm-sans leading-6">
            Applicants
          </h2>
          <p className="text-ds-text-secondary text-xs font-normal font-dm-sans leading-4">
            Review and shortlist candidates with AI-powered insights
          </p>
        </div>

        {/* Job Listing Summary Card / Row: Job Item Close */}
        <div className={`${isMobileDetailOpen ? "hidden md:flex" : "flex"} w-full max-w-[960px] min-h-0 md:min-h-[121px] pr-0 md:pr-3 border-b-0 md:border-b border-ds-border flex-col justify-center items-start self-stretch`}>
          {/* Frame 2609981: Top Row */}
          <div className="w-full h-[60px] py-2 flex flex-row items-center justify-between gap-4 self-stretch">
            {/* Frame 2609064: Role + Time */}
            <div className="flex-1 h-[44px] px-3 flex flex-col justify-center items-start gap-1 self-stretch min-w-0">
              <h3 className="w-full h-6 text-ds-text-primary text-base font-medium font-dm-sans leading-6 line-clamp-1 truncate flex items-center">
                {listing.title}
              </h3>
              <span className="h-5 text-ds-text-secondary text-sm font-normal font-dm-sans leading-5 truncate flex items-center">
                {formatPostedTime(listing.posted_at || listing.last_edited)}
              </span>
            </div>

            {/* Frame 2609239: Status badge on right */}
            <div className="hidden md:flex h-3 flex-row items-center justify-end shrink-0 gap-2">
              <span className={`text-[10px] font-normal font-dm-sans leading-3 uppercase flex items-center ${statusUpper === 'ACTIVE'
                  ? 'text-ds-success'
                  : statusUpper === 'IN REVIEW' || statusUpper === 'IN_REVIEW'
                    ? 'text-ds-accent'
                    : statusUpper === 'CLOSED' || statusUpper === 'CLOSE'
                      ? 'text-ds-warning'
                      : 'text-ds-text-muted'
                }`}>
                {statusUpper === 'CLOSED' ? 'CLOSE' : statusUpper}
              </span>
            </div>
          </div>

          {/* Frame 2609980: Bottom Row */}
          <div className="w-full flex flex-col md:flex-row md:justify-center md:items-center md:gap-3 self-stretch gap-3 mt-1 md:mt-0">
            {/* 3 metric columns */}
            <div className="w-full md:flex-1 h-[61px] flex flex-row items-center gap-3 min-w-0 border-b border-ds-border md:border-b-0 pb-2 md:pb-0">
              {/* Frame 2608617: Applications */}
              <div className="flex-1 h-[60px] py-2 flex flex-col justify-center items-start gap-2 rounded-3xl min-w-0">
                <span className="text-ds-text-primary text-sm font-semibold font-dm-sans leading-5">
                  {appCount}
                </span>
                <span className="text-ds-text-secondary text-xs font-normal font-dm-sans leading-4">
                  Applications
                </span>
              </div>

              {/* Frame 2609065: Shortlisted */}
              <div className="flex-1 h-[60px] py-2 flex flex-col justify-center items-start gap-2 rounded-3xl min-w-0">
                <span className="text-ds-text-primary text-sm font-semibold font-dm-sans leading-5">
                  {shortlistCount}
                </span>
                <span className="text-ds-text-secondary text-xs font-normal font-dm-sans leading-4">
                  Shortlisted
                </span>
              </div>

              {/* Frame 2609240: Offer sent */}
              <div className="flex-1 h-[60px] py-2 flex flex-col justify-center items-start gap-2 rounded-3xl min-w-0">
                <span className="text-ds-text-primary text-sm font-semibold font-dm-sans leading-5">
                  {offerCount}
                </span>
                <span className="text-ds-text-secondary text-xs font-normal font-dm-sans leading-4">
                  Offer sent
                </span>
              </div>
            </div>

            {/* secondary button: View job details CTA */}
            <button
              type="button"
              onClick={onViewDetails}
              className="w-[143px] min-w-[143px] h-9 px-3 py-1.5 rounded-full border border-ds-border hover:bg-ds-surface-1 text-ds-text-primary text-base font-medium font-dm-sans leading-6 flex items-center justify-center whitespace-nowrap focus:outline-none transition-all active:scale-95 cursor-pointer shrink-0"
            >
              View job details
            </button>
          </div>
        </div>

        {/* Frame 2609962: Subtabs and Candidates Content */}
        <div className="w-full max-w-[960px] flex flex-col gap-5">
          {/* Frame 2609735: Subtabs Bar */}
          <div className="hidden md:flex w-full max-w-[960px] h-9 items-center justify-between">
            {/* Frame 2609925: Subtabs Container */}
            <div className="flex flex-row items-center gap-3 h-9">
              {([
                { name: 'Top match', width: 'w-[104px]' },
                { name: 'Recent', width: 'w-[77px]' },
                { name: 'Shortlisted', width: 'w-[107px]' },
                { name: 'Noted', width: 'w-[71px]' },
                { name: 'Pending', width: 'w-[85px]' },
              ] as const).map(({ name, width }) => {
                const isTabActive = filter === name;
                return (
                  <button
                    key={name}
                    type="button"
                    onClick={() => setFilter(name as FilterOption)}
                    className={`${width} h-9 px-3 py-1.5 flex items-center justify-center cursor-pointer focus:outline-none transition-colors shrink-0 drop-shadow-[0px_2px_4px_rgba(255,236,230,0.08)] ${isTabActive
                        ? 'border-b-[1.5px] border-ds-accent text-ds-text-primary'
                        : 'border-b-[1.5px] border-transparent text-ds-text-secondary hover:text-ds-text-primary'
                      }`}
                  >
                    <span className="text-base font-medium font-dm-sans leading-6 whitespace-nowrap">
                      {name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Frame 2608633: Candidates Empty State (w: 960px, h: 324px) */}
          {candidates.length === 0 && !isLoadingApplicants ? (
            <div className="w-full max-w-[960px] h-[324px] pt-[60px] pb-[120px] flex flex-col items-center justify-start gap-2 select-none">
              {/* IconFrame: 64x64px, padding 12px, bg #1A1A20 (--ds-surface-1), rounded-full */}
              <div className="w-16 h-16 p-3 bg-ds-surface-1 rounded-full flex items-center justify-center shrink-0">
                <BriefcaseIcon size={40} className="w-10 h-10 text-ds-text-muted shrink-0" fill="currentColor" />
              </div>

              {/* Text Container */}
              <div className="flex flex-col items-center gap-2 text-center">
                <h3 className="text-ds-text-primary text-base font-semibold font-dm-sans leading-6">
                  {listing.applicants_count === 0 || totalCandidates === 0 ? 'No applicants yet' : (EMPTY_STATE_CONFIG[filter]?.title ?? 'No applicants found')}
                </h3>
                <p className="max-w-[480px] text-ds-text-secondary text-sm font-normal font-dm-sans leading-5 text-center">
                  {listing.applicants_count === 0 || totalCandidates === 0 ? 'Candidates will appear here when they apply for this job' : (EMPTY_STATE_CONFIG[filter]?.subtitle ?? 'Candidates in this category will appear here when available.')}
                </p>
              </div>
            </div>
          ) : (
            <div className="w-full max-w-[960px] flex flex-col md:flex-row items-start justify-center gap-5 self-stretch">

              {/* Frame 2609067: Left Column - Candidates Sidebar */}
              <div className={`${isMobileDetailOpen ? "hidden md:flex" : "flex"} w-full md:w-[270px] py-3 rounded-3xl flex flex-col gap-4 shrink-0`}>
                {/* Header: Container + Frame 2609111 */}
                <div className="w-full flex flex-row justify-between items-center h-6 px-1">
                  <span className="w-[86px] h-5 font-dm-sans font-normal text-sm leading-5 text-ds-text-primary uppercase tracking-wider flex items-center">
                    CANDIDATES
                  </span>
                  {/* Mobile Filter Button */}
                  <button
                    type="button"
                    onClick={() => setIsMobileFilterDrawerOpen(true)}
                    className="flex md:hidden size-6 items-center justify-center text-ds-text-primary hover:text-ds-accent transition-colors cursor-pointer bg-transparent border-none outline-none"
                    aria-label="Filter candidates"
                  >
                    <CustomIcon name="filter" size={20} className="size-5 text-ds-text-primary" />
                  </button>
                  {/* Candidate Stepper: only show on desktop if candidates are present */}
                  {totalCandidates > 0 && (
                    <div className="hidden md:flex w-16 h-6 flex-row justify-end items-center gap-2 rounded-lg">
                      <button
                        type="button"
                        onClick={handleSelectPreviousCandidate}
                        disabled={currentCandidateIndex <= 0}
                        className="size-4 flex items-center justify-center text-ds-text-secondary hover:text-ds-text-primary disabled:text-ds-text-muted disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer focus:outline-none transition-colors"
                        aria-label="Previous candidate"
                      >
                        <Icon icon="solar:arrow-left-linear" className="size-4" />
                      </button>
                      <span className="w-5 h-6 font-dm-sans font-normal text-base leading-6 text-ds-text-primary text-center select-none">
                        {String(currentCandidateIndex + 1).padStart(2, '0')}
                      </span>
                      <button
                        type="button"
                        onClick={handleSelectNextCandidate}
                        disabled={currentCandidateIndex >= totalCandidates - 1}
                        className="size-4 flex items-center justify-center text-ds-text-secondary hover:text-ds-text-primary disabled:text-ds-text-muted disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer focus:outline-none transition-colors"
                        aria-label="Next candidate"
                      >
                        <Icon icon="solar:arrow-right-linear" className="size-4" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Frame 2609108: Candidates Card List */}
                <div className="w-full flex flex-col gap-2">
                  {isLoadingApplicants ? (
                    [1, 2, 3].map((n) => (
                      <div
                        key={n}
                        className="w-full md:w-[270px] h-[52px] px-3 py-2 rounded-xl bg-ds-surface-1/40 animate-pulse flex items-center gap-2 border border-ds-border/40"
                      >
                        <div className="size-8 rounded-full bg-ds-surface-2 shrink-0" />
                        <div className="flex-1 flex flex-col gap-1.5">
                          <div className="h-3 w-24 bg-ds-surface-2 rounded" />
                          <div className="h-2.5 w-16 bg-ds-surface-2 rounded" />
                        </div>
                      </div>
                    ))
                  ) : candidates.length === 0 ? (
                    <div className="w-full py-8 px-3 text-center text-xs text-ds-text-secondary bg-ds-surface-1/30 rounded-xl border border-ds-border/40 font-dm-sans">
                      No applicants found
                    </div>
                  ) : (
                    candidates.map((cand, idx) => {
                      const candId = cand.applicationId || cand.id || `cand-${idx}`;
                      const isSelected = selectedCandId === candId;
                      const score = cand.matchScore ?? cand.score;

                      return (
                        <div
                          key={candId}
                          onClick={() => { setSelectedCandId(candId); setIsMobileDetailOpen(true); }}
                          className={`w-full md:w-[270px] px-3 py-2 rounded-xl flex flex-row items-center gap-2 cursor-pointer transition-all select-none ${isSelected
                              ? 'bg-ds-surface-2'
                              : 'hover:bg-ds-surface-1/40'
                            }`}
                        >
                          {/* Avatar */}
                          <Avatar
                            src={cand.avatarUrl || cand.avatar}
                            name={cand.name}
                            isCompany={false}
                            className="size-8"
                          />
                          {/* Frame 2609105: Candidate Info */}
                          <div className="flex-1 flex flex-col justify-start items-start gap-1 min-w-0">
                            <span className={`w-full text-base font-medium font-dm-sans leading-6 truncate flex items-center ${score != null ? 'text-ds-text-primary' : 'text-ds-text-secondary'
                              }`}>
                              {cand.name || 'Unknown User'}
                            </span>
                            {/* Frame 2609066 */}
                            <div className="flex flex-row items-center gap-1 h-6">
                              {score != null ? (
                                <>
                                  <span className={`${score < 20 ? 'text-ds-error font-medium' : 'text-ds-accent'} text-base font-normal font-dm-sans leading-6 flex items-center`}>
                                    {score}%
                                  </span>
                                  <span className="text-ds-text-secondary text-xs font-normal font-dm-sans leading-4 flex items-center">
                                    AI match
                                  </span>
                                </>
                              ) : (
                                <span className="text-ds-text-secondary text-xs font-normal font-dm-sans leading-4 flex items-center">
                                  Pending analysis
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Frame 2609089: Right Column - Candidate Detail Pane */}
              {isLoadingApplicants ? (
                <div className={`${isMobileDetailOpen ? 'flex' : 'hidden md:flex'} flex-1 w-full md:w-[670px] max-w-[670px] p-8 rounded-3xl border border-ds-border bg-ds-surface-1/20 flex-col items-center justify-center gap-3 min-h-[360px]`}>
                  <div className="size-6 border-2 border-ds-accent border-t-transparent rounded-full animate-spin" />
                  <span className="text-xs text-ds-text-secondary font-dm-sans">Loading applicant details...</span>
                </div>
              ) : !activeCandidate || candidates.length === 0 ? (
                <div className={`${isMobileDetailOpen ? 'flex' : 'hidden md:flex'} flex-1 w-full md:w-[670px] max-w-[670px] p-8 rounded-3xl border border-ds-border bg-ds-surface-1/20 flex-col items-center justify-center text-center gap-3 min-h-[360px]`}>
                  <div className="size-12 rounded-full bg-ds-surface-2 flex items-center justify-center text-ds-text-muted">
                    <Icon icon="solar:users-group-two-rounded-linear" className="size-6" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <h3 className="font-dm-sans font-medium text-base text-ds-text-primary">No Applicant Selected</h3>
                    <p className="font-dm-sans text-xs text-ds-text-secondary max-w-[280px]">
                      {filter === 'Shortlisted'
                        ? 'No candidates have been shortlisted yet.'
                        : 'There are currently no applicants for this position.'}
                    </p>
                  </div>
                </div>
              ) : (
                <div className={`${isMobileDetailOpen ? 'flex' : 'hidden md:flex'} flex-1 w-full md:w-[670px] max-w-[670px] rounded-3xl flex flex-col gap-5 min-w-0`}>
                  {/* Frame 2609088: Candidate Header & Actions */}
                  <div className="w-full flex flex-col gap-2">
                    {/* Frame 2608732: Top row */}
                    <div className="w-full h-[52px] rounded-xl flex flex-row justify-between items-center">
                      {/* Frame 2608774 / 2608571: User details */}
                      <div
                        onClick={() => {
                          const targetId =
                            candidateDetail?.accountName ||
                            activeCandidate?.accountName ||
                            candidateDetail?.username ||
                            activeCandidate?.username ||
                            candidateDetail?.applicantId ||
                            activeCandidate?.applicantId ||
                            (activeCandidate as any)?.userId ||
                            (activeCandidate as any)?.user_id;
                          if (targetId) {
                            if (typeof window !== "undefined") {
                              sessionStorage.setItem("coming_from_job_detail", "true");
                              const returnUrl = (window.location.pathname + window.location.search);
                              sessionStorage.setItem("nav_memory_jobs", returnUrl);
                              sessionStorage.setItem("nav_memory_jobs_return", returnUrl);
                            }
                            const returnUrl = typeof window !== "undefined" ? (window.location.pathname + window.location.search) : "/jobs";
                            router.push(`/profile/${targetId}?source=job_application_dashboard&returnTo=${encodeURIComponent(returnUrl)}`);
                          }
                        }}
                        className="flex flex-row items-center gap-2 h-9 cursor-pointer group"
                      >
                        <Avatar
                          src={displayAvatar}
                          name={displayName}
                          isCompany={false}
                          className="size-8"
                        />
                        {/* Frame 2608568 */}
                        <div className="flex flex-col items-start h-9 justify-center">
                          <span className="text-ds-text-primary group-hover:text-ds-accent text-base font-semibold font-dm-sans leading-6 transition-colors">
                            {displayName || 'Unknown User'}
                          </span>
                          <span className="text-ds-text-primary text-[10px] font-normal font-dm-sans leading-3">
                            {displayHeadline}
                          </span>
                        </div>
                      </div>

                      {/* Frame 2609066: AI Match Score */}
                      <div className="flex flex-col justify-center items-end h-[52px] gap-1">
                        <span className={`${(displayScore ?? 0) < 20 ? 'text-ds-error' : 'text-ds-accent'} font-dm-sans font-semibold text-2xl leading-8 flex items-center`}>
                          {displayScore != null ? `${displayScore}%` : '--'}
                        </span>
                        <span className="text-ds-text-secondary font-dm-sans font-normal text-xs leading-4 flex items-center">
                          AI match
                        </span>
                      </div>
                    </div>

                    {/* Frame 2609102: Actions Row */}
                    <div className="w-full h-9 flex flex-row justify-between items-center gap-2 pt-1">
                      {/* Frame 2608618: Add a note */}
                      <button
                        type="button"
                        onClick={openNoteModal}
                        className="text-ds-text-primary hover:text-ds-accent text-sm font-normal font-dm-sans leading-5 transition-colors cursor-pointer focus:outline-none"
                      >
                        Add a note
                      </button>

                      {/* Frame 2609476: Action buttons */}
                      <div className="flex flex-row items-center gap-2 h-9">
                        {activeCandidate?.status === 'Shortlisted' ? (
                          <>
                            <button
                              disabled
                              type="button"
                              className="min-w-[112px] h-9 px-4 py-1.5 bg-ds-accent text-ds-text-primary rounded-full text-base font-medium font-dm-sans leading-6 opacity-85 cursor-default text-center whitespace-nowrap"
                            >
                              Shortlisted
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (!canJobsChat) return;
                                router.push(`/messaging?jobContext=${listing.id}`);
                              }}
                              disabled={!canJobsChat}
                              className="w-[89px] h-9 px-3 py-1.5 rounded-full border border-ds-border hover:bg-ds-surface-1 text-ds-text-primary text-base font-medium font-dm-sans leading-6 transition-colors text-center cursor-pointer whitespace-nowrap"
                            >
                              Chat
                            </button>
                          </>
                        ) : activeCandidate?.status === 'Rejected' ? (
                          <button
                            disabled
                            type="button"
                            className="min-w-[96px] h-9 px-3.5 py-1.5 rounded-full border border-ds-border text-ds-text-secondary text-base font-medium font-dm-sans leading-6 opacity-60 cursor-default text-center whitespace-nowrap"
                          >
                            Declined
                          </button>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => handleShortlist(activeCandidate?.applicationId || activeCandidate?.id)}
                              className="w-[89px] h-9 px-3 py-1.5 bg-ds-accent hover:opacity-90 text-ds-text-primary rounded-full text-base font-medium font-dm-sans leading-6 transition-all active:scale-95 text-center cursor-pointer focus:outline-none whitespace-nowrap"
                            >
                              Shortlist
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDecline(activeCandidate?.applicationId || activeCandidate?.id)}
                              className="w-[89px] h-9 px-3 py-1.5 rounded-full border border-ds-border hover:bg-ds-surface-1 text-ds-text-primary text-base font-medium font-dm-sans leading-6 transition-all active:scale-95 text-center cursor-pointer focus:outline-none whitespace-nowrap"
                            >
                              Decline
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Frame 2609091: Self Note Card */}
                  {displaySelfNote && (
                    <div className="w-full flex flex-col gap-2">
                      <span className="text-ds-text-primary text-base font-medium font-dm-sans leading-6">
                        Self Note
                      </span>
                      {/* Frame 2609031 */}
                      <div className="w-full p-3 bg-ds-surface-1 border-l-2 border-ds-accent rounded-tr-2xl rounded-bl-2xl rounded-br-2xl flex flex-col gap-2">
                        <p className="text-ds-text-secondary text-xs font-normal font-dm-sans leading-4 break-words">
                          {displaySelfNote}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Frame 2608977: Resume PDF Row */}
                  <div className="w-full h-5 pr-2 flex flex-row justify-between items-center gap-4">
                    {/* Frame 2608990 */}
                    <div className="flex flex-row items-center gap-2 min-w-0 h-5">
                      <PdfFileIcon className="w-5 h-5 text-ds-text-primary shrink-0" />
                      <span className="text-ds-text-primary text-sm font-medium font-dm-sans leading-5 truncate">
                        {displayResumeName}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if (candidateDetail?.resumeUrl) {
                          window.open(candidateDetail.resumeUrl, '_blank');
                        } else {
                          toast({ title: 'Resume Preview', description: `Viewing document: ${displayResumeName}` });
                        }
                      }}
                      className="size-5 flex items-center justify-center text-ds-text-primary hover:text-ds-accent cursor-pointer focus:outline-none transition-colors shrink-0"
                      aria-label="View resume"
                    >
                      <EyeIcon className="w-5 h-5 text-ds-text-primary hover:text-ds-accent transition-colors" />
                    </button>
                  </div>

                  {/* Section - AI Executive Summary */}
                  <div className="w-full min-h-[211px] p-3 rounded-2xl border border-ds-border flex flex-col gap-3">
                    <div className="w-full flex items-center justify-between">
                      {/* Container */}
                      <div className="flex items-center gap-2">
                        <CyphexAIIcon className="w-5 h-5 text-ds-accent shrink-0 flex-none" />
                        <span className="text-ds-accent font-dm-sans font-normal text-xs leading-4 uppercase tracking-wider">
                          AI EXECUTIVE SUMMARY
                        </span>
                      </div>
                      {displayScore == null && (
                        <button
                          type="button"
                          onClick={handleTriggerAI}
                          disabled={isAnalyzing}
                          className="px-2.5 py-1 text-xs font-medium text-ds-text-primary bg-ds-accent rounded-full hover:opacity-90 disabled:opacity-50 transition-all cursor-pointer"
                        >
                          {isAnalyzing ? 'Analyzing...' : 'Generate AI Summary ✨'}
                        </button>
                      )}
                    </div>

                    {analyzeError && (
                      <p className="text-xs text-ds-error font-dm-sans">{analyzeError}</p>
                    )}

                    {displaySummary ? (
                      <>
                        <div className="w-full pb-2 flex flex-col sm:flex-row items-start gap-6">
                          {/* Strengths */}
                          <div className="flex-1 flex flex-col items-start gap-3 w-full">
                            <span className="text-ds-success font-dm-sans text-xs font-normal leading-4 uppercase tracking-wider">
                              STRENGTHS
                            </span>
                            <div className="w-full flex flex-col gap-2">
                              {displaySummary.strengths?.map((str: string, sIdx: number) => (
                                <p key={sIdx} className="text-ds-text-primary text-xs font-normal font-dm-sans leading-4">
                                  {str}
                                </p>
                              ))}
                            </div>
                          </div>

                          {/* Concerns */}
                          <div className="flex-1 flex flex-col items-start gap-3 w-full">
                            <span className="text-ds-error font-dm-sans text-xs font-normal leading-4 uppercase tracking-wider">
                              CONCERNS
                            </span>
                            <div className="w-full flex flex-col gap-2">
                              {displaySummary.concerns?.map((con: string, cIdx: number) => (
                                <p key={cIdx} className="text-ds-text-primary text-xs font-normal font-dm-sans leading-4">
                                  {con}
                                </p>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Recommendation Banner: HorizontalBorder */}
                        <div className="w-full pt-4 border-t border-ds-border flex flex-col">
                          <p className="text-xs leading-4 font-dm-sans">
                            <span className="text-ds-accent font-medium">Recommendation: </span>
                            <span className="text-ds-text-primary font-normal">{displaySummary.recommendation}</span>
                          </p>
                        </div>
                      </>
                    ) : (
                      <p className="text-xs text-ds-text-secondary font-dm-sans">
                        AI analysis is pending for this candidate. Click &apos;Generate AI Summary&apos; to view strengths, concerns, and recommendations.
                      </p>
                    )}
                  </div>

                  {/* Skills Match Card */}
                  {displaySkills && (
                    <div className="w-full py-3 flex flex-col gap-3">
                      {/* Frame 2609098 */}
                      <div className="w-full h-6 flex justify-between items-center gap-2">
                        <span className="text-ds-text-primary text-base font-medium font-dm-sans leading-6">
                          Skills
                        </span>
                        <div className="h-6 flex items-center justify-center">
                          <span className={`${displaySkills.match < 20 ? 'text-ds-error' : 'text-ds-success'} text-[10px] font-medium font-dm-sans leading-3 uppercase tracking-wider`}>
                            {displaySkills.match}% MATCH
                          </span>
                        </div>
                      </div>

                      {/* Skills Pill Tags - strictly 1 line when collapsed */}
                      <div
                        ref={skillsContainerRef}
                        className={`w-full flex flex-wrap items-center gap-2 transition-all ${!showAllSkills ? 'h-7 overflow-hidden' : ''
                          }`}
                      >
                        {displaySkills.tags?.map((tag: any, tIdx: number) => (
                          <div
                            key={tIdx}
                            className="h-7 px-2 py-1.5 bg-ds-surface-1 rounded-full flex items-center justify-center shrink-0"
                          >
                            <span
                              className={`text-xs font-normal font-dm-sans leading-4 ${tag.matched ? 'text-ds-text-primary' : 'text-ds-error'
                                }`}
                            >
                              {tag.name}
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* See all / See less button: only shown when skills reach a second line */}
                      {hasSecondLine && (
                        <button
                          type="button"
                          onClick={() => setShowAllSkills(!showAllSkills)}
                          className="text-ds-accent text-xs font-medium font-dm-sans leading-4 hover:opacity-85 cursor-pointer focus:outline-none self-center"
                        >
                          {showAllSkills ? 'View less' : 'View more'}
                        </button>
                      )}

                      {displaySkills.summary && (
                        <p className="text-ds-text-primary text-sm font-normal font-dm-sans leading-5">
                          {displaySkills.summary}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Frame 2610072: Experience & Qualification Stacked (670px each) */}
                  <div className="w-full flex flex-col items-start gap-4">
                    {/* Experience Match Card */}
                    {displayExperience && (
                      <div className="w-full min-h-[157px] p-3 border border-ds-border rounded-2xl flex flex-col justify-between gap-4 box-border">
                        <div className="w-full h-7 flex justify-between items-center gap-2">
                          <span className="text-ds-text-primary text-base font-medium font-dm-sans leading-6">
                            Experience
                          </span>
                          <div className="h-7 px-2 py-1 rounded-full flex items-center justify-center">
                            <span className="text-ds-accent text-[10px] font-medium font-dm-sans leading-3 uppercase tracking-wider">
                              {displayExperience.status || 'EXCEEDS'}
                            </span>
                          </div>
                        </div>

                        <div className="w-full flex flex-row justify-between items-center gap-1">
                          <div className="flex flex-col items-start gap-1">
                            <span className="text-ds-text-secondary text-xs font-normal font-dm-sans leading-4 uppercase tracking-wider">
                              REQUIRED
                            </span>
                            <span className="text-ds-text-primary opacity-50 font-dm-sans font-bold text-2xl leading-8">
                              {displayExperience.required || '5+ Yrs'}
                            </span>
                          </div>
                          <svg
                            width="30"
                            height="14"
                            viewBox="0 0 30 14"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                            className="w-[30px] h-[14px] text-ds-text-secondary shrink-0"
                            aria-hidden="true"
                          >
                            <line x1="1" y1="7" x2="20" y2="7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                            <path d="M19 2L29 7L19 12V2Z" fill="currentColor" />
                          </svg>
                          <div className="flex flex-col items-start gap-1">
                            <span className="text-ds-text-primary text-xs font-normal font-dm-sans leading-4 uppercase tracking-wider">
                              ACTUAL
                            </span>
                            <span className="text-ds-text-primary font-dm-sans font-bold text-2xl leading-8">
                              {displayExperience.actual || '6.2 Yrs'}
                            </span>
                          </div>
                        </div>

                        <p className="text-ds-text-primary text-sm font-normal font-dm-sans leading-5 break-words">
                          &ldquo;{(displayExperience.summary || 'Exceeds minimum requirement for this seniority level.').replace(/^[“"']+|[”"']+$/g, '')}&rdquo;
                        </p>
                      </div>
                    )}

                    {/* Education Match Card */}
                    {displayQualification && (
                      <div className="w-full min-h-[166px] p-3 border border-ds-border rounded-2xl flex flex-col justify-between gap-4 box-border">
                        <div className="w-full h-7 flex justify-between items-center gap-2">
                          <span className="text-ds-text-primary text-base font-medium font-dm-sans leading-6">
                            Qualification
                          </span>
                          <div className="h-7 px-2 py-1 rounded-full flex items-center justify-center">
                            <span className="text-ds-accent text-[10px] font-medium font-dm-sans leading-3 uppercase tracking-wider">
                              {displayQualification.status || 'ALIGNED'}
                            </span>
                          </div>
                        </div>

                        <div className="w-full p-2 flex flex-col justify-center gap-1 rounded-lg">
                          <span className="text-ds-text-primary text-base font-normal font-dm-sans leading-6 break-words">
                            {displayQualification.degree || 'B.Des from IIT Bombay'}
                          </span>
                          {displayQualification.class && displayQualification.degree !== 'Not specified' && (
                            <span className="text-ds-text-secondary text-xs font-normal font-dm-sans leading-4 uppercase tracking-wider">
                              {displayQualification.class}
                            </span>
                          )}
                        </div>

                        <p className="text-ds-text-primary text-sm font-normal font-dm-sans leading-5 break-words">
                          &ldquo;{(displayQualification.summary || 'Qualification directly aligns with the role requirements.').replace(/^[“"']+|[”"']+$/g, '')}&rdquo;
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modal: Add a note (Figma Design) */}
      {isNoteModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 px-4">
          <div className="w-[300px] p-3 bg-ds-bg border border-ds-border rounded-2xl flex flex-col items-center gap-3 relative shadow-2xl animate-in zoom-in-95 duration-200">
            {/* Frame 2609536: Cancel / Close Button */}
            <div className="w-full h-5 flex flex-row justify-end items-center">
              <button
                type="button"
                onClick={() => setIsNoteModalOpen(false)}
                aria-label="Close"
                className="size-5 flex items-center justify-center text-ds-text-primary hover:opacity-80 transition-opacity cursor-pointer focus:outline-none"
              >
                <Icon icon="lucide:x" className="size-5" />
              </button>
            </div>

            {/* Title: Add note */}
            <h3 className="text-ds-text-primary text-base font-medium font-dm-sans leading-6 text-center">
              Add note
            </h3>

            {/* input field */}
            <div className="w-full h-9 py-2 flex items-center border-b border-ds-border focus-within:border-ds-accent transition-colors">
              <input
                type="text"
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSaveNote();
                  }
                }}
                placeholder="Add a note"
                autoFocus
                className="w-full bg-transparent text-sm font-normal font-dm-sans text-ds-text-primary placeholder:text-ds-text-muted focus:outline-none"
              />
            </div>

            {/* Frame 2609476: Action Buttons */}
            <div className="w-[162px] h-9 flex flex-row justify-center items-center gap-2">
              {/* Primary emphasis button: Save */}
              <button
                type="button"
                onClick={handleSaveNote}
                className="w-[77px] h-9 px-3 py-1.5 flex items-center justify-center rounded-full bg-ds-surface-1 hover:bg-ds-surface-2 transition-all active:scale-95 cursor-pointer focus:outline-none"
              >
                <span className={`text-base font-medium font-dm-sans leading-6 transition-colors ${noteText.trim() ? 'text-ds-text-primary' : 'text-ds-text-muted'}`}>
                  Save
                </span>
              </button>

              {/* Secondary button: Cancel */}
              <button
                type="button"
                onClick={() => setIsNoteModalOpen(false)}
                className="w-[77px] h-9 px-3 py-1.5 flex items-center justify-center rounded-full border border-ds-border hover:bg-ds-surface-1 transition-all active:scale-95 cursor-pointer focus:outline-none"
              >
                <span className="text-ds-text-primary text-base font-medium font-dm-sans leading-6">
                  Cancel
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Filters Drawer */}
      <ApplicantsMobileDrawer
        isOpen={isMobileFilterDrawerOpen}
        onClose={() => setIsMobileFilterDrawerOpen(false)}
        selectedFilter={filter}
        setSelectedFilter={(f: FilterOption) => setFilter(f)}
      />
    </>
  );
};

export default ApplicantsDashboard;
