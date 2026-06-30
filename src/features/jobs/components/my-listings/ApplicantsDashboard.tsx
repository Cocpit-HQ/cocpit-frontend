import React, { useState, useEffect, useRef } from 'react';
import { Icon } from '@iconify/react';
import { JobListing } from '../../types/jobs.types';
import {
  getJobApplicants,
  getApplicationDetail,
  getApplicationAnalysis,
  updateApplicationStatus,
  upsertApplicationNote,
  getJobDetail,
  triggerApplicationAnalysis
} from '../../services/jobs.service';

interface ApplicantsDashboardProps {
  listing: JobListing;
  onBack: () => void;
  onViewDetails: () => void;
}

interface Candidate {
  id: string;
  name: string;
  title: string;
  location: string;
  avatar: string;
  score: number | null;
  status: 'pending' | 'shortlisted' | 'declined';
  note: string;
  resume: string;
  summary: {
    strengths: string[];
    concerns: string[];
    recommendation: string;
  } | null;
  skills: {
    match: number;
    tags: { name: string; matched: boolean }[];
    summary: string;
  } | null;
  experience: {
    status: string;
    required: string;
    actual: string;
    summary: string;
  } | null;
  qualification: {
    status: string;
    degree: string;
    class: string;
    summary: string;
  } | null;
}

const INITIAL_CANDIDATES: Candidate[] = [
  {
    id: 'cand-1',
    name: 'Mina sina',
    title: 'UI/UX Designer',
    location: 'Mumbai, India',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=120',
    score: 94,
    status: 'pending',
    note: '"Hi cocpit, we were impressed by your portfolio and the way you handled the whiteboarding session. Your approach to scalable design systems is exactly what we need for our next growth phase. We\'d love to have you join our team."',
    resume: 'Mina.uiux.cv.pdf',
    summary: {
      strengths: [
        'Strong Design Systems background from IIT Bombay.',
        'Exceptional React knowledge for a designer.',
      ],
      concerns: ['Limited experience with consumer-scale apps.'],
      recommendation: 'High priority interview. Technical alignment is nearly perfect for the Design Engineering hybrid role.',
    },
    skills: {
      match: 94,
      tags: [
        { name: 'Figma', matched: true },
        { name: 'Design Systems', matched: true },
        { name: 'UI', matched: true },
        { name: 'UX', matched: true },
        { name: 'React', matched: true },
      ],
      summary: '"Has all required skills with strong proficiency in React and Design Systems."',
    },
    experience: {
      status: 'EXCEEDS',
      required: '5+ Yrs',
      actual: '6.2 Yrs',
      summary: '"Exceeds minimum requirement for this seniority level."',
    },
    qualification: {
      status: 'ALIGNED',
      degree: 'B.Des from IIT Bombay',
      class: 'CLASS OF 2018',
      summary: '"Qualification directly aligns with the role requirements."',
    },
  },
  {
    id: 'cand-2',
    name: 'James keno',
    title: 'UI/UX designer',
    location: 'New York, NY',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=120',
    score: 92,
    status: 'pending',
    note: '"Hi cocpit, we were impressed by your portfolio and the way you handled the whiteboarding session. Your approach to scalable design systems is exactly what we need for our next growth phase. We\'d love to have you join our team."',
    resume: 'James.uiux.cv.pdf',
    summary: {
      strengths: [
        'Strong Design Systems background from IIT Bombay.',
        'Exceptional React knowledge for a designer.',
      ],
      concerns: ['Limited experience with consumer-scale apps.'],
      recommendation: 'High priority interview. Technical alignment is nearly perfect for the Design Engineering hybrid role.',
    },
    skills: {
      match: 80,
      tags: [
        { name: 'Figma', matched: true },
        { name: 'Design Systems', matched: true },
        { name: 'UI', matched: true },
        { name: 'UX', matched: true },
        { name: 'React', matched: false },
      ],
      summary: '"Has 4 of 5 required skills with strong proficiency in Design Systems."',
    },
    experience: {
      status: 'EXCEEDS',
      required: '5+ Yrs',
      actual: '6.2 Yrs',
      summary: '"Exceeds minimum requirement for this seniority level."',
    },
    qualification: {
      status: 'ALIGNED',
      degree: 'B.Des from IIT Bombay',
      class: 'CLASS OF 2018',
      summary: '"Qualification directly aligns with the role requirements."',
    },
  },
  {
    id: 'cand-3',
    name: 'Anthony Edmund Bridgerton',
    title: 'Product Designer',
    location: 'London, UK',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=120',
    score: 88,
    status: 'pending',
    note: '"Hi cocpit, Anthony has a solid design pedigree. Detail-oriented layouts but needs to work more on user-research practices."',
    resume: 'Anthony.uiux.cv.pdf',
    summary: {
      strengths: [
        'Strong aesthetic sense with detail-oriented design delivery.',
        'Excellent visual branding experience.',
      ],
      concerns: ['Lacks deep design research methodologies.'],
      recommendation: 'Consider for future visual-heavy projects or secondary interview.',
    },
    skills: {
      match: 75,
      tags: [
        { name: 'Figma', matched: true },
        { name: 'UI', matched: true },
        { name: 'UX', matched: true },
        { name: 'Design Systems', matched: false },
        { name: 'React', matched: false },
      ],
      summary: '"Has 3 of 5 skills, lacks systems thinking and frontend coding experience."',
    },
    experience: {
      status: 'ALIGNED',
      required: '3+ Yrs',
      actual: '4.5 Yrs',
      summary: '"Meets requirement for this design role seniority level."',
    },
    qualification: {
      status: 'ALIGNED',
      degree: 'B.Des from NID Ahmedabad',
      class: 'CLASS OF 2020',
      summary: '"Qualification directly aligns with the role requirements."',
    },
  },
  {
    id: 'cand-4',
    name: 'G.O.A.T',
    title: 'Design Engineer',
    location: 'San Francisco, CA',
    avatar: '',
    score: null,
    status: 'pending',
    note: '"Pending profile assessment and resume verification."',
    resume: 'goat_resume_2026.pdf',
    summary: null,
    skills: null,
    experience: null,
    qualification: null,
  },
];

type FilterOption = 'Top match' | 'Recent' | 'Shortlisted' | 'Noted' | 'Pending';

export const ApplicantsDashboard: React.FC<ApplicantsDashboardProps> = ({
  listing,
  onBack,
  onViewDetails,
}) => {
  const [candidates, setCandidates] = useState<any[]>([]);
  const [selectedCandId, setSelectedCandId] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterOption>('Top match');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [isNoteExpanded, setIsNoteExpanded] = useState(false);

  // Real data state
  const [candidateDetail, setCandidateDetail] = useState<any>(null);
  const [candidateAnalysis, setCandidateAnalysis] = useState<any>(null);
  const [jobDetail, setJobDetail] = useState<any>(null);
  const [isLoadingList, setIsLoadingList] = useState(true);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleTriggerAI = async () => {
    if (!selectedCandId) return;
    setIsAnalyzing(true);
    try {
      const updatedAnalysis = await triggerApplicationAnalysis(selectedCandId);
      setCandidateAnalysis(updatedAnalysis);
      // Update candidate's score in left sidebar list
      setCandidates(prev => prev.map(c => 
        c.applicationId === selectedCandId 
          ? { ...c, matchScore: updatedAnalysis.matchScore } 
          : c
      ));
    } catch (error) {
      console.error('Failed to trigger AI analysis:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch job details on mount
  useEffect(() => {
    let active = true;
    const fetchJob = async () => {
      const job = await getJobDetail(listing.id);
      if (active && job) {
        setJobDetail(job);
      }
    };
    fetchJob();
    return () => { active = false; };
  }, [listing.id]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  // Fetch list
  useEffect(() => {
    let active = true;
    const fetchList = async () => {
      setIsLoadingList(true);
      let apiStatus;
      if (filter === 'Shortlisted') apiStatus = 'Shortlisted';
      else if (filter === 'Pending') apiStatus = 'Applied';

      const list = await getJobApplicants(listing.id, apiStatus);
      if (active) {
        setCandidates(list || []);
        if (list?.length > 0 && !selectedCandId) {
          setSelectedCandId(list[0].applicationId);
        }
        setIsLoadingList(false);
      }
    };
    fetchList();
    return () => { active = false; };
  }, [listing.id, filter]);

  // Fetch detail
  useEffect(() => {
    if (!selectedCandId) return;
    let active = true;
    const fetchDetail = async () => {
      setIsLoadingDetail(true);
      const [detail, analysis] = await Promise.all([
        getApplicationDetail(selectedCandId),
        getApplicationAnalysis(selectedCandId)
      ]);
      if (active) {
        setCandidateDetail(detail);
        // Safeguard: Prefer the pre-loaded detail.aiAnalysis object to avoid race conditions
        setCandidateAnalysis(detail.aiAnalysis || analysis);
        setIsLoadingDetail(false);
      }
    };
    fetchDetail();
    return () => { active = false; };
  }, [selectedCandId]);

  // Stats Counters
  const appCount = candidates.length;
  const shortlistCount = candidates.filter(c => c.status === 'Shortlisted').length;

  const selectedCandidate = candidates.find((c) => c.applicationId === selectedCandId) || candidates[0];

  const handleShortlist = async (candId: string) => {
    try {
      await updateApplicationStatus(candId, 'Shortlisted');
      setCandidates(prev => prev.map(c => c.applicationId === candId ? { ...c, status: 'Shortlisted' } : c));
      if (selectedCandId === candId && candidateDetail) {
        setCandidateDetail({ ...candidateDetail, status: 'Shortlisted' });
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleDecline = async (candId: string) => {
    try {
      await updateApplicationStatus(candId, 'Rejected');
      setCandidates(prev => prev.map(c => c.applicationId === candId ? { ...c, status: 'Rejected' } : c));
      if (selectedCandId === candId && candidateDetail) {
        setCandidateDetail({ ...candidateDetail, status: 'Rejected' });
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleSaveNote = async () => {
    if (!selectedCandId) return;
    try {
      await upsertApplicationNote(selectedCandId, noteText);
      if (candidateDetail) {
        setCandidateDetail({ ...candidateDetail, selfNote: noteText });
      }
    } catch (error) {
      console.error(error);
    }
    setIsNoteModalOpen(false);
  };

  const openNoteModal = () => {
    setNoteText(candidateDetail?.selfNote || '');
    setIsNoteModalOpen(true);
  };

  const filteredCandidates = candidates;

  return (
    <div 
      className="w-[998px] bg-white flex flex-col items-center pt-0 px-0 pb-[80px] gap-[24px] overflow-y-auto scrollbar-none animate-in fade-in duration-300 mx-auto relative font-['Poppins'] box-border"
      style={{
        height: '1189px',
        scrollbarWidth: 'none',
      }}
    >
      {/* Back button and message frame (Frame 2608623) */}
      <div 
        className="flex flex-row items-center p-0 gap-[16px] w-[998px] h-[48px] flex-none order-0 self-stretch grow-0"
      >
        {/* Same back button that we build everywhere in jobs */}
        <button
          onClick={onBack}
          type="button"
          className="w-12 h-12 box-border p-2 rounded-[100px] border border-[#DADADA] backdrop-blur-[12px] flex flex-row justify-center items-center gap-2.5 hover:bg-slate-50 transition-colors active:scale-95 text-gray-500 shadow-sm flex-shrink-0"
        >
          <Icon icon="lucide:chevron-left" className="w-6 h-6 text-gray-500" />
        </button>

        {/* Message frame (Frame 2608578) */}
        <div className="flex flex-col items-start p-0 w-[343px] h-[42px] flex-none order-1 grow-0">
          <span
            className="w-[100px] h-[26px] font-['Poppins'] font-medium text-[18px] leading-[26px] text-black flex items-center justify-start text-left flex-none order-0 grow-0"
          >
            Applicants
          </span>
          <span
            className="w-[343px] h-[16px] font-['Poppins'] font-normal text-[12px] leading-[16px] text-[#6B7280] flex items-center justify-start text-left flex-none order-1 grow-0"
          >
            Review and shortlist candidates with AI-powered insights
          </span>
        </div>
      </div>

      {/* Job Details Frame / Job Item Active */}
      <div 
        className="box-border flex flex-row items-center p-[16px] gap-[16px] w-[998px] h-[80px] bg-white border border-[#EEF2FF] rounded-[24px] flex-none order-1 self-stretch grow-0"
      >
        {/* Job text frame (Frame 2609064) */}
        <div className="flex flex-col items-start p-0 gap-[8px] flex-1 min-w-0">
          <span
            className="w-full font-['Poppins'] font-medium text-[16px] leading-[24px] flex items-center text-black capitalize flex-none order-0 grow-0 truncate"
          >
            {listing.title}
          </span>
          <span
            className="w-full font-['Poppins'] font-normal text-[12px] leading-[16px] flex items-center text-[#6B7280] flex-none order-1 self-stretch grow-0 truncate"
          >
            Posted {listing.posted_at || '2 hours ago'}
          </span>
        </div>

        {/* Status Chip (Background+Border) */}
        <div
          className="flex flex-col justify-center items-center p-[8px] w-[70px] h-[31px] bg-[#F0FDF4] rounded-[9999px] flex-none order-1 grow-0"
        >
          <span className="text-[#22C55E] text-[10px] font-medium font-['Poppins'] uppercase leading-[15px] flex items-center text-center">
            ACTIVE
          </span>
        </div>

        {/* View Details Button (Frame 2608534) */}
        <button
          onClick={onViewDetails}
          type="button"
          style={{ width: '116px', height: '40px' }}
          className="box-border flex flex-row justify-center items-center py-[8px] px-[16px] gap-[10px] bg-white border border-[#818CF8] rounded-[24px] flex-none order-2 grow-0 hover:bg-indigo-50/10 active:scale-95 transition-all"
        >
          <span
            style={{ width: '84px', height: '20px' }}
            className="font-['Poppins'] font-normal text-[14px] leading-[20px] text-center text-[#818CF8] flex-none order-0 grow-0"
          >
            View details
          </span>
        </button>
      </div>

      {/* Counts Frame (Frame 2609065) */}
      <div 
        className="flex flex-row justify-center items-center p-0 gap-[16px] w-[998px] h-[88px] flex-none order-2 self-stretch grow-0"
      >
        {/* Applications Card */}
        <div 
          className="box-border flex flex-col items-start p-[16px] gap-[8px] w-[491px] h-[88px] bg-white border border-[#EEF2FF] rounded-[24px] flex-none order-0 grow-[1]"
        >
          <span
            className="w-[82px] h-[16px] font-['Poppins'] font-normal text-[12px] leading-[16px] flex items-center text-[#6B7280] flex-none order-0 grow-0 uppercase tracking-wider"
          >
            APPLICATIONS
          </span>
          <span 
            className="w-[458px] h-[32px] font-['Poppins'] font-semibold text-[24px] leading-[32px] flex items-center text-[#000000] flex-none order-1 self-stretch grow-0"
          >
            {appCount}
          </span>
        </div>

        {/* Shortlisted Card */}
        <div 
          className="box-border flex flex-col items-start p-[16px] gap-[8px] w-[491px] h-[88px] bg-white border border-[#EEF2FF] rounded-[24px] flex-none order-1 grow-[1]"
        >
          <span
            className="w-[75px] h-[16px] font-['Poppins'] font-normal text-[12px] leading-[16px] flex items-center text-[#6B7280] flex-none order-0 grow-0 uppercase tracking-wider"
          >
            SHORTLISTED
          </span>
          <span 
            className="w-[458px] h-[32px] font-['Poppins'] font-semibold text-[24px] leading-[32px] flex items-center text-[#000000] flex-none order-1 self-stretch grow-0"
          >
            {shortlistCount}
          </span>
        </div>
      </div>

      {/* Main Frame: Applicants list and Candidate details (Frame 2608633) */}
      <div 
        className="flex flex-row items-start p-0 gap-[16px] w-[998px] h-[901px] flex-none order-3 self-stretch grow-0"
      >
        {/* Left Column: Candidates list (Frame 2609067) */}
        <div
          className="box-border flex flex-col items-start p-[12px] gap-[16px] w-[294px] h-[574px] border border-[#EEF2FF] rounded-[24px] flex-none order-0 grow-0"
        >
          {/* Header Container */}
          <div
            className="flex flex-row justify-between items-center p-0 w-[270px] h-[40px] flex-none order-0 self-stretch grow-0"
          >
            {/* Title and pagination frame (Frame 2609111) */}
            <div
              className="flex flex-row justify-between items-center p-0 gap-[8px] w-[214px] h-[20px] flex-none order-0 grow-[1]"
            >
              <span
                className="w-[86px] h-[20px] font-['Poppins'] font-normal text-[14px] leading-[20px] flex items-center text-[#000000] flex-none order-0 grow-0"
              >
                CANDIDATES
              </span>

              {/* Pagination Next */}
              <div
                className="flex flex-row justify-end items-center p-0 gap-[8px] w-[66px] h-[16px] rounded-[8px] flex-none order-1 grow-0"
              >
                {/* Arrow Left */}
                <button
                  type="button"
                  className="w-[16px] h-[16px] flex items-center justify-center p-0 hover:bg-slate-50 rounded flex-none order-0 grow-0 text-slate-300"
                >
                  <Icon icon="lucide:chevron-left" className="w-[16px] h-[16px]" />
                </button>
                {/* Page Count */}
                <span
                  className="w-[18px] h-[16px] font-['Inter'] font-normal text-[16px] leading-[16px] text-[#1E1E1E] flex items-center justify-center flex-none order-1 grow-0"
                >
                  01
                </span>
                {/* Arrow Right */}
                <button
                  type="button"
                  className="w-[16px] h-[16px] flex items-center justify-center p-0 hover:bg-slate-50 rounded flex-none order-2 grow-0 text-[#6366F1]"
                >
                  <Icon icon="lucide:chevron-right" className="w-[16px] h-[16px]" />
                </button>
              </div>
            </div>

            {/* Filter Toggle Icon (Frame 2608536) */}
            <div ref={dropdownRef} className="relative flex-none order-1 grow-0">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                type="button"
                className="relative w-[56px] h-[40px] flex items-center justify-center hover:bg-slate-50 rounded-[24px] transition-all active:scale-95"
              >
                <Icon icon="iconoir:filter-list" className="w-[24px] h-[24px] text-black" />
              </button>

              {/* Candidates List Filter Dropdown */}
              {isDropdownOpen && (
                <div className="absolute right-0 top-[45px] z-50 w-32 p-2 bg-white rounded-3xl outline outline-1 outline-offset-[-1px] outline-indigo-50 flex flex-col justify-start items-center overflow-hidden shadow-[0_12px_32px_rgba(99,102,241,0.1)] animate-in fade-in slide-in-from-top-2 duration-200">
                  {(['Top match', 'Recent', 'Shortlisted', 'Noted', 'Pending'] as FilterOption[]).map(
                    (opt) => {
                      const isOptActive = filter === opt;
                      return (
                        <div
                          key={opt}
                          onClick={() => {
                            setFilter(opt);
                            setIsDropdownOpen(false);
                          }}
                          className="self-stretch px-4 py-2 bg-white rounded-3xl inline-flex justify-start items-center gap-2.5 cursor-pointer hover:bg-indigo-50/25 transition-colors"
                        >
                          <span
                            className={`text-center justify-start text-sm font-normal font-['Poppins'] leading-5 ${isOptActive ? 'text-indigo-500' : 'text-black'
                              }`}
                          >
                            {opt}
                          </span>
                        </div>
                      );
                    }
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Candidate Card List (Frame 2609108) */}
          <div
            className="flex flex-col items-start p-0 gap-[16px] w-[270px] h-[356px] flex-none order-1 grow-0 overflow-y-auto scrollbar-none"
            style={{ scrollbarWidth: 'none' }}
          >
            {filteredCandidates.length === 0 ? (
              <div className="py-12 flex flex-col items-center justify-center gap-2 text-center w-full">
                <span className="text-gray-400 text-xs font-semibold font-['Poppins']">No candidates</span>
                <span className="text-gray-400 text-[10px] font-['Poppins']">No applications match filter</span>
              </div>
            ) : (
              filteredCandidates.map((cand) => {
                const isSelected = cand.applicationId === selectedCandId;
                return (
                  <div
                    key={cand.applicationId}
                    onClick={() => setSelectedCandId(cand.applicationId)}
                    className="box-border flex flex-row items-center p-[12px] gap-[8px] w-[270px] h-[78px] rounded-[12px] flex-none order-0 self-stretch grow-0 cursor-pointer transition-all duration-200"
                    style={{
                      backgroundColor: isSelected ? '#EEF2FF' : '#FFFFFF',
                    }}
                  >
                    {/* Ellipse 2 (User avatar) */}
                    {cand.avatarUrl ? (
                      <img
                        className="w-[50px] h-[50px] rounded-full object-cover flex-none order-0 grow-0"
                        src={cand.avatarUrl}
                        alt={cand.name}
                      />
                    ) : (
                      <div className="w-[50px] h-[50px] bg-slate-200 rounded-full flex items-center justify-center text-gray-500 font-semibold font-['Poppins'] text-sm flex-none order-0 grow-0">
                        {cand.name.substring(0, 2).toUpperCase()}
                      </div>
                    )}

                    {/* Text block */}
                    <div className="flex flex-col justify-center items-start p-0 gap-[4px] flex-1 min-w-0 h-[50px]">
                      <span
                        className="w-full text-black text-[16px] font-medium font-['Poppins'] leading-[24px] truncate flex items-center capitalize"
                      >
                        {cand.name}
                      </span>

                      <div className="flex flex-row items-center p-0 gap-[4px] w-[97px] h-[26px] flex-none">
                        {cand.matchScore != null ? (
                          <>
                            <span className="w-[38px] h-[26px] font-['Poppins'] font-medium text-[18px] leading-[26px] flex items-center text-[#6366F1]">
                              {cand.matchScore}%
                            </span>
                            <span className="w-[55px] h-[16px] font-['Poppins'] font-normal text-[12px] leading-[16px] flex items-center text-[#6B7280]">
                              AI match
                            </span>
                          </>
                        ) : (
                          <span className="text-[#6B7280] text-[11px] font-normal font-['Poppins'] leading-[16px] flex items-center">
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

        {/* Right Column: Candidate detail panel (Frame 2609089) */}
        <div 
          className="flex flex-col items-start p-0 gap-[16px] w-[688px] rounded-[24px] flex-none order-1 grow-[1] min-w-0"
        >
          {/* Header metadata row / Frame 2608732 */}
          <div 
            className="flex flex-row justify-between items-center p-0 w-[688px] h-[52px] rounded-[12px] flex-none order-0 self-stretch grow-0"
          >
            {/* User details / Frame 2608774 */}
            <div className="flex flex-row items-center p-0 gap-[8px] w-auto h-[44px] flex-none order-0 grow-0">
              {/* Ellipse 3 (Avatar) */}
              {candidateDetail?.avatarUrl ? (
                <img
                  className="w-[44px] h-[44px] rounded-full object-cover flex-none order-0 self-stretch grow-0"
                  src={candidateDetail?.avatarUrl}
                  alt={candidateDetail?.name}
                />
              ) : (
                <div className="w-[44px] h-[44px] bg-slate-200 rounded-full flex items-center justify-center text-gray-500 font-semibold font-['Poppins'] text-sm flex-none order-0 self-stretch grow-0">
                  {candidateDetail?.name.substring(0, 2).toUpperCase()}
                </div>
              )}

              {/* Frame 2609009 */}
              <div className="flex flex-col items-start p-0 gap-[4px] w-auto h-[44px] flex-none order-1 grow-0">
                {/* Name */}
                <span
                  className="w-auto h-[24px] font-['Poppins'] font-medium text-[16px] leading-[24px] text-black flex items-center text-left whitespace-nowrap"
                >
                  {candidateDetail?.name}
                </span>

                {/* Frame 2609097 */}
                <div className="flex flex-row justify-start items-center p-0 gap-[8px] w-auto h-[16px] flex-none order-1 grow-0">
                  {/* Role */}
                  <span
                    className="font-['Poppins'] font-normal text-[12px] leading-[16px] text-[#6B7280] flex items-center truncate"
                    style={{ maxWidth: '88px' }}
                  >
                    {candidateDetail?.headline}
                  </span>
                  {/* Badge (Ellipse 15) */}
                  <div className="w-[6px] h-[6px] bg-[#6B7280] rounded-full flex-none grow-0" />
                  {/* Location */}
                  <span
                    className="font-['Poppins'] font-normal text-[12px] leading-[16px] text-[#6B7280] flex items-center truncate"
                    style={{ maxWidth: '76px' }}
                  >
                    {candidateDetail?.location}
                  </span>
                </div>
              </div>
            </div>

            {/* Match count frame (Frame 2609066) */}
            {candidateAnalysis?.matchScore != null && (
              <div className="flex flex-col justify-center items-start p-0 gap-[4px] w-[55px] h-[52px] flex-none order-1 grow-0">
                {/* Score text */}
                <span
                  className="w-[51px] h-[32px] font-['Poppins'] font-semibold text-[24px] leading-[32px] flex items-center text-[#6366F1] flex-none order-0 grow-0"
                >
                  {candidateAnalysis?.matchScore}%
                </span>
                {/* AI match text */}
                <span
                  className="w-[55px] h-[16px] font-['Poppins'] font-normal text-[12px] leading-[16px] flex items-center text-[#6B7280] flex-none order-1 grow-0"
                >
                  AI match
                </span>
              </div>
            )}
          </div>

          {/* Action frame (Frame 2609102) */}
          <div 
            className="flex flex-row justify-between items-center p-0 gap-[8px] w-[688px] h-[40px] flex-none order-1 self-stretch grow-0"
          >
            {/* Add a note button / Frame 2608618 */}
            <button
              onClick={openNoteModal}
              type="button"
              className="flex flex-row justify-center items-center p-0 gap-[10px] w-[77px] h-[20px] rounded-[24px] flex-none order-0 grow-0 cursor-pointer"
            >
              <span
                className="w-[77px] h-[20px] font-['Poppins'] font-normal text-[14px] leading-[20px] text-center text-[#000000] flex-none order-0 grow-0"
              >
                Add a note
              </span>
            </button>

            {/* Decline / Shortlist Buttons / Frame 2608841 */}
            <div className="flex flex-row items-center p-0 gap-[16px] w-auto h-[40px] flex-none order-1 grow-0">
              {/* Decline Button / Frame 2608618 */}
              <button
                onClick={() => handleDecline(selectedCandidate?.applicationId)}
                disabled={candidateDetail?.status === 'Rejected'}
                type="button"
                className="box-border flex flex-row justify-center items-center py-[8px] px-[16px] gap-[10px] w-auto min-w-[100px] h-[40px] border border-[#818CF8] rounded-[24px] flex-none order-0 grow-0 hover:bg-slate-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span
                  className="font-['Poppins'] font-normal text-[14px] leading-[20px] text-center text-[#818CF8] flex-none order-0 grow-0 whitespace-nowrap"
                >
                  {candidateDetail?.status === 'Rejected' ? 'Declined' : 'Decline'}
                </span>
              </button>

              {/* Shortlist Button / Frame 2608617 */}
              <button
                onClick={() => handleShortlist(selectedCandidate?.applicationId)}
                disabled={candidateDetail?.status === 'Shortlisted'}
                type="button"
                className="box-border flex flex-row justify-center items-center py-[8px] px-[16px] gap-[10px] w-auto min-w-[100px] h-[40px] bg-[#6366F1] border border-white rounded-[24px] flex-none order-1 grow-0 hover:bg-[#5558e6] transition-all disabled:opacity-75 disabled:cursor-not-allowed"
              >
                <span
                  className="font-['Poppins'] font-normal text-[14px] leading-[20px] text-center text-white flex-none order-0 grow-0 whitespace-nowrap"
                >
                  {candidateDetail?.status === 'Shortlisted' ? 'Shortlisted' : 'Shortlist'}
                </span>
              </button>
            </div>
          </div>

          {/* Self Note Frame / Frame 2609091 */}
          {candidateDetail?.selfNote && (
            <div 
              className="flex flex-col items-start p-0 gap-[8px] w-[688px] flex-none order-2 self-stretch grow-0"
            >
              {/* Title */}
              <span
                className="w-[80px] h-[26px] font-['Poppins'] font-medium text-[18px] leading-[26px] text-left text-black flex items-center"
              >
                Self Note
              </span>

              {/* Note body frame / Frame 2609030 */}
              <div 
                className="box-border flex flex-col items-start py-[12px] px-[16px] gap-[8px] w-[688px] bg-[#F9FAFF] border-l-2 border-[#6366F1] rounded-tr-[16px] rounded-bl-[16px] rounded-br-[16px] flex-none order-1 self-stretch grow-0"
              >
                <span 
                  className={`w-[656px] font-['Poppins'] font-normal text-[12px] leading-[16px] text-[#6B7280] flex-none order-0 self-stretch grow-0 whitespace-pre-wrap break-words ${isNoteExpanded ? '' : 'line-clamp-2'}`}
                >
                  {candidateDetail?.selfNote}
                </span>
                {candidateDetail?.selfNote && candidateDetail.selfNote.length > 150 && (
                  <button 
                    onClick={() => setIsNoteExpanded(!isNoteExpanded)}
                    className="text-[#6366F1] text-[12px] font-medium font-['Poppins'] hover:underline"
                  >
                    {isNoteExpanded ? 'Read less' : 'Read more'}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Resume PDF Frame / Frame 2608977 */}
          <div 
            className="flex flex-row justify-between items-center py-0 pr-[8px] pl-0 gap-[16px] w-[688px] h-[40px] rounded-[12px] flex-none order-3 self-stretch grow-0"
          >
            {/* Doc Frame / Frame 2608990 */}
            <div className="flex flex-row items-center p-0 gap-[8px] w-[178px] h-[40px] flex-none order-0 grow-0">
              {/* Icon Frame / Frame 2608983 */}
              <div
                className="flex flex-row justify-center items-center p-0 gap-[10px] w-[40px] h-[40px] rounded-[12px] bg-[#FFF5F5] flex-none order-0 grow-0 text-[#FF6B6B]"
              >
                <Icon icon="lucide:file-text" className="w-[20px] h-[26px]" />
              </div>

              {/* Name frame / Frame 2608938 */}
              <div className="flex flex-col justify-center items-start p-0 gap-[4px] w-[130px] h-[40px] flex-none order-1 grow-0">
                <span
                  className="w-[130px] h-[20px] font-['Poppins'] font-semibold text-[14px] text-left leading-[20px] text-black flex items-center truncate"
                >
                  {candidateDetail?.resumeName}
                </span>

                {/* Frame 2608988 */}
                <div className="flex flex-row justify-start items-center p-0 gap-[8px] w-[63px] h-[16px] flex-none order-1 grow-0">
                  <span className="text-[#6B7280] text-[10px] font-medium font-['Poppins'] uppercase">
                    Document
                  </span>
                </div>
              </div>
            </div>

            {/* Eye Icon Button / Open eye */}
            <button
              onClick={() => {
                if (candidateDetail?.resumeUrl) {
                  window.open(candidateDetail.resumeUrl, '_blank');
                } else if (candidateDetail?.resumeName) {
                  window.open(`/resumes/${candidateDetail.resumeName}`, '_blank');
                }
              }}
              type="button"
              className="w-[24px] h-[24px] flex items-center justify-center p-0 hover:bg-slate-50 rounded flex-none order-1 grow-0"
            >
              <Icon icon="lucide:eye" className="w-[24px] h-[24px] text-black" />
            </button>
          </div>

          {/* AI Executive Summary Block / Section - AI Executive Summary */}
          {candidateAnalysis && (
            <div 
              className="flex flex-col items-start p-[16px] gap-[16px] w-[688px] bg-[#F9FAFF] rounded-[24px] flex-none order-4 self-stretch grow-0 box-border"
            >
              {/* Title frame */}
              <div className="flex flex-row items-center p-0 gap-[8px] w-[656px] h-[20px] flex-none order-0 self-stretch grow-0">
                {/* AI Icon */}
                <img src="/assets/AI 2.svg" alt="AI Icon" className="w-[20px] h-[20px] flex-none" />

                {/* Heading */}
                <div className="flex flex-col items-start p-0 h-[16px] flex-none order-1 grow-0">
                  <span
                    className="h-[16px] font-['Poppins'] font-normal text-[12px] leading-[16px] flex items-center text-[#6366F1] uppercase tracking-wider whitespace-nowrap"
                  >
                    AI Executive Summary
                  </span>
                </div>
              </div>

              {candidateAnalysis.analysisType === 'GEMINI' && candidateAnalysis.summary ? (
                <>
                  {/* Details container */}
                  <div className="flex flex-row items-start p-0 pb-[8px] gap-[16px] w-[656px] h-auto flex-none order-1 self-stretch grow-0 flex-wrap md:flex-nowrap">
                    {/* Left frame (strengths) */}
                    <div className="flex flex-col items-start p-0 gap-[12px] w-[320px] h-auto flex-none order-0 self-stretch grow-[1]">
                      <span 
                        className="w-[320px] h-[16px] font-['Poppins'] font-normal text-[12px] leading-[16px] flex items-center text-[#22C55E] uppercase tracking-wider"
                      >
                        Strengths
                      </span>

                      {/* Frame 2609109 */}
                      <div className="flex flex-col items-start p-0 gap-[8px] w-auto h-auto flex-none order-1 grow-[1]">
                        {candidateAnalysis.summary.strengths.map((str: string, idx: number) => (
                          <span
                            key={idx}
                            className="w-auto font-['Poppins'] font-normal text-[12px] leading-[16px] flex items-center text-black"
                          >
                            • {str}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Right frame (concerns) */}
                    <div className="flex flex-col items-start p-0 pb-[12px] gap-[12px] w-[320px] h-auto flex-none order-1 self-stretch grow-[1]">
                      <span 
                        className="w-[320px] h-[16px] font-['Poppins'] font-normal text-[12px] leading-[16px] flex items-center text-[#FF6B6B] uppercase tracking-wider"
                      >
                        Concerns
                      </span>

                      <div className="flex flex-col items-start p-0 gap-[8px] w-auto h-auto flex-none order-1 grow-[1]">
                        {candidateAnalysis.summary.concerns.map((con: string, idx: number) => (
                          <span
                            key={idx}
                            className="w-auto font-['Poppins'] font-normal text-[12px] leading-[16px] flex items-center text-black"
                          >
                            • {con}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Recommendation frame / HorizontalBorder */}
                  <div 
                    className="box-border flex flex-col items-start pt-[16px] px-0 pb-0 w-[656px] min-h-[49px] h-auto border-t border-[#E0E7FF] flex-none order-2 self-stretch grow-0"
                  >
                    <div className="w-[656px] min-h-[32px] h-auto font-['Poppins'] font-normal text-[12px] leading-[16px] text-black text-left">
                      <span className="font-semibold text-[#6366F1] mr-1">Recommendation:</span>
                      <span>{candidateAnalysis.summary.recommendation}</span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-[24px] gap-[16px] w-[656px] border border-dashed border-[#C7D2FE] rounded-[16px] bg-white">
                  <div className="flex flex-row items-center gap-[8px] text-[#6366F1]">
                    <Icon icon="lucide:sparkles" className="w-[20px] h-[20px] animate-pulse" />
                    <span className="font-semibold text-xs uppercase tracking-wider font-['Poppins']">AI Insight Pending</span>
                  </div>
                  <p className="text-[12px] text-gray-500 text-center max-w-[420px] font-['Poppins'] leading-[18px] px-[16px]">
                    AI analysis was deferred for this application due to the minimum application pool gate. Generate it manually to see strengths, concerns, and matching recommendations.
                  </p>
                  <button
                    onClick={handleTriggerAI}
                    disabled={isAnalyzing}
                    type="button"
                    className="flex flex-row justify-center items-center py-[8px] px-[20px] bg-[#6366F1] text-white text-[12px] font-semibold rounded-[24px] hover:bg-[#5558e6] transition-all disabled:opacity-50 font-['Poppins'] cursor-pointer border-0 outline-0"
                  >
                    {isAnalyzing ? (
                      <div className="flex flex-row items-center gap-[8px]">
                        <Icon icon="lucide:loader-2" className="w-[14px] h-[14px] animate-spin" />
                        <span>Analyzing...</span>
                      </div>
                    ) : (
                      <span>Generate AI Summary ✨</span>
                    )}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Skills match / Skills Match */}
          {(candidateAnalysis?.skills || (candidateDetail?.skills && candidateDetail.skills.length > 0)) && (
            <div 
              className="box-border flex flex-col items-start p-[12px] gap-[16px] w-[688px] bg-white border border-[#EEF2FF] rounded-[24px] flex-none order-4 self-stretch grow-0"
            >
              {/* Title frame / Frame 2609098 */}
              <div className="flex flex-row justify-between items-center p-0 gap-[8px] w-[662px] h-[31px] flex-none self-stretch grow-0">
                <span 
                  className="w-[40px] h-[24px] font-['Poppins'] font-medium text-[16px] leading-[24px] flex items-center text-black"
                >
                  Skills
                </span>
                {candidateAnalysis?.skills?.match != null && (
                  <span className="font-['Poppins'] font-bold text-[11px] leading-[15px] flex items-center text-[#6366F1] uppercase tracking-wider">
                    {candidateAnalysis.skills.match}% Match
                  </span>
                )}
              </div>

              {/* Skills chip frame / Container */}
              <div className="flex flex-row items-center p-0 gap-[8px] w-[662px] min-h-[32px] h-auto flex-none self-stretch grow-0 flex-wrap">
                {candidateAnalysis?.skills?.tags
                  ? candidateAnalysis.skills.tags.map((tag: { name: string; matched: boolean }, idx: number) => (
                      <div 
                        key={idx}
                        className="flex flex-col justify-center items-center py-[8px] px-[16px] h-[32px] rounded-[9999px] flex-none"
                        style={{ backgroundColor: tag.matched ? '#EEF2FF' : '#FFF1F1' }}
                      >
                        <span 
                          className="font-['Poppins'] font-normal text-[12px] leading-[16px] flex items-center text-center"
                          style={{ color: tag.matched ? '#6366F1' : '#FF6B6B' }}
                        >
                          {tag.name}
                        </span>
                      </div>
                    ))
                  : candidateDetail?.skills?.map((t: string | any, idx: number) => {
                      const skillName = typeof t === 'string' ? t : t.name;
                      return (
                        <div 
                          key={idx}
                          className="flex flex-col justify-center items-center py-[8px] px-[16px] h-[32px] rounded-[9999px] flex-none"
                          style={{ backgroundColor: '#EEF2FF' }}
                        >
                          <span 
                            className="font-['Poppins'] font-normal text-[12px] leading-[16px] flex items-center text-center"
                            style={{ color: '#6366F1' }}
                          >
                            {skillName}
                          </span>
                        </div>
                      );
                    })
                }
              </div>

              {/* Summary text */}
              <span 
                className="w-auto font-['Poppins'] font-normal text-[14px] leading-[20px] flex items-center text-black"
              >
                {candidateAnalysis?.skills?.summary ?? "Candidate's listed skills."}
              </span>
            </div>
          )}


          {/* Meta section (Experience & Qualification side-by-side) / Frame 2609110 */}
          {candidateAnalysis?.experience && candidateAnalysis?.qualification && (
            <div className="flex flex-row items-start p-0 gap-[16px] w-[688px] h-[197px] flex-none order-5 self-stretch grow-0">
              {/* Left Experience frame / Experience Match */}
              <div 
                className="box-border flex flex-col items-start p-[12px] gap-[16px] w-[336px] h-[197px] bg-white border border-[#EEF2FF] rounded-[16px] flex-none order-0 self-stretch grow-[1]"
              >
                {/* Title frame */}
                <div className="flex flex-row justify-between items-center p-0 gap-[8px] w-[310px] h-[31px] flex-none self-stretch grow-0">
                  <span 
                    className="w-[88px] h-[24px] font-['Poppins'] font-medium text-[16px] leading-[24px] flex items-center text-black"
                  >
                    Experience
                  </span>
                  
                  {/* Status */}
                  <span 
                    className="w-[47px] h-[15px] font-['Inter'] font-bold text-[10px] leading-[15px] flex items-center text-[#6366F1] uppercase"
                  >
                    {candidateAnalysis.experience.status}
                  </span>
                </div>

                {/* Exp match frame */}
                <div className="flex flex-row justify-between items-center py-[8px] px-0 gap-[5.3px] w-[310px] h-[68px] flex-none self-stretch grow-0">
                  {/* Required box */}
                  <div className="flex flex-col items-start p-0 gap-[4px] w-auto h-[52px] flex-none order-0 grow-0">
                    <span 
                      className="font-['Poppins'] font-normal text-[12px] leading-[16px] flex items-center text-[#6B7280]"
                    >
                      REQUIRED
                    </span>
                    <div className="flex flex-col items-start p-0 opacity-50 flex-none order-1 grow-0">
                      <span className="h-[32px] font-['Poppins'] font-semibold text-[24px] leading-[32px] flex items-center text-black whitespace-nowrap">
                        {candidateAnalysis.experience.required}
                      </span>
                    </div>
                  </div>

                  {/* Arrow */}
                  <div className="flex flex-col justify-end items-center p-0 pb-[6px] h-[52px] flex-none order-1 grow-0 text-[#C7D2FE]">
                    <Icon icon="lucide:arrow-right" className="w-5 h-5" />
                  </div>

                  {/* Actual box */}
                  <div className="flex flex-col items-start p-0 gap-[4px] w-auto h-[52px] flex-none order-2 grow-0">
                    <span 
                      className="font-['Poppins'] font-normal text-[12px] leading-[16px] flex items-center text-[#000000]"
                    >
                      ACTUAL
                    </span>
                    <span className="h-[32px] font-['Poppins'] font-semibold text-[24px] leading-[32px] flex items-center text-black whitespace-nowrap">
                      {candidateAnalysis.experience.actual}
                    </span>
                  </div>
                </div>

                {/* Exceeds text */}
                <span 
                  className="w-[310px] h-[40px] font-['Poppins'] font-normal text-[14px] leading-[20px] flex items-center text-black"
                >
                  {candidateAnalysis.experience.summary}
                </span>
              </div>

              {/* Right Qualification frame / Education Match */}
              <div 
                className="box-border flex flex-col items-start p-[12px] gap-[16px] w-[336px] h-[197px] bg-white border border-[#EEF2FF] rounded-[16px] flex-none order-1 self-stretch grow-[1]"
              >
                {/* Title frame */}
                <div className="flex flex-row justify-between items-center p-0 gap-[8px] w-[310px] h-[31px] flex-none self-stretch grow-0">
                  <span 
                    className="w-[103px] h-[24px] font-['Poppins'] font-medium text-[16px] leading-[24px] flex items-center text-black"
                  >
                    Qualification
                  </span>
                  
                  {/* Status */}
                  <span 
                    className="w-[45px] h-[15px] font-['Inter'] font-bold text-[10px] leading-[15px] flex items-center text-[#6366F1] uppercase"
                  >
                    PROVIDED
                  </span>
                </div>

                {/* Top education frame / Margin */}
                <div className="flex flex-col items-start p-0 w-[310px] h-[60px] flex-none self-stretch grow-0">
                  <span 
                    className="w-[294px] h-[24px] font-['Poppins'] font-normal text-[16px] leading-[24px] flex items-center text-black truncate"
                  >
                    {candidateAnalysis.qualification.degree}
                  </span>
                  <span 
                    className="w-[294px] h-[16px] font-['Poppins'] font-normal text-[12px] leading-[16px] flex items-center text-[#6B7280] uppercase mt-[4px]"
                  >
                    {candidateAnalysis.qualification.class}
                  </span>
                </div>

                {/* Aligns text */}
                <span 
                  className="w-[310px] h-[40px] font-['Poppins'] font-normal text-[14px] leading-[20px] flex items-center text-black"
                >
                  {candidateAnalysis.qualification.summary}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add a note modal */}
      {isNoteModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-96 p-4 bg-white rounded-3xl inline-flex flex-col justify-start items-center overflow-hidden border border-zinc-100 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="self-stretch flex flex-col justify-start items-end gap-2.5">
              <button
                onClick={() => setIsNoteModalOpen(false)}
                type="button"
                className="w-6 h-6 flex items-center justify-center hover:bg-slate-50 rounded-full transition-colors"
              >
                <Icon icon="lucide:x" className="w-[18px] h-[18px] text-[#FF6B6B]" />
              </button>
            </div>
            <div className="w-72 flex flex-col justify-start items-center gap-4">
              <div className="flex flex-col justify-start items-center gap-2">
                <div className="text-center justify-start text-black text-lg font-medium font-['Poppins'] leading-6">Add a note</div>
                <div className="text-center justify-start text-gray-500 text-xs font-normal font-['Poppins'] leading-4">Include a note for reference.</div>
              </div>
              <textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Add a personal note...."
                className="self-stretch h-32 px-4 py-2 bg-white rounded-2xl outline outline-1 outline-offset-[-1px] outline-zinc-200 text-black text-sm font-normal font-['Poppins'] leading-5 resize-none focus:outline-none focus:outline-indigo-400"
              />
              <div className="self-stretch inline-flex justify-start items-start gap-4">
                <button
                  onClick={() => setIsNoteModalOpen(false)}
                  type="button"
                  className="flex-1 h-10 px-4 py-2 bg-white rounded-3xl outline outline-1 outline-offset-[-1px] outline-indigo-400 flex justify-center items-center gap-2.5 hover:bg-indigo-50/10 transition-colors active:scale-95"
                >
                  <span className="text-center justify-start text-indigo-400 text-sm font-normal font-['Poppins'] leading-5">Cancel</span>
                </button>
                <button
                  onClick={handleSaveNote}
                  type="button"
                  className="flex-1 h-10 px-4 py-2 bg-indigo-500 rounded-3xl outline outline-1 outline-offset-[-1px] outline-white flex justify-center items-center gap-2.5 hover:bg-indigo-600 transition-colors active:scale-95 shadow-sm"
                >
                  <span className="text-center justify-start text-white text-sm font-normal font-['Poppins'] leading-5">Save</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApplicantsDashboard;
