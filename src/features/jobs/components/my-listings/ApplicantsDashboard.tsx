import React, { useState, useEffect, useRef } from 'react';
import { Icon } from '@iconify/react';
import { JobListing } from '../../types/jobs.types';

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
  const [candidates, setCandidates] = useState<Candidate[]>(INITIAL_CANDIDATES);
  const [selectedCandId, setSelectedCandId] = useState<string>('cand-2'); // James keno as default selected
  const [filter, setFilter] = useState<FilterOption>('Top match');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [noteText, setNoteText] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  // Stats Counters
  const [appCount] = useState(48);
  const [shortlistCount, setShortlistCount] = useState(12);

  const selectedCandidate = candidates.find((c) => c.id === selectedCandId) || candidates[0];

  const handleShortlist = (candId: string) => {
    setCandidates((prev) =>
      prev.map((c) => {
        if (c.id === candId && c.status !== 'shortlisted') {
          setShortlistCount((count) => count + 1);
          return { ...c, status: 'shortlisted' };
        }
        return c;
      })
    );
  };

  const handleDecline = (candId: string) => {
    setCandidates((prev) =>
      prev.map((c) => {
        if (c.id === candId) {
          if (c.status === 'shortlisted') {
            setShortlistCount((count) => Math.max(0, count - 1));
          }
          return { ...c, status: 'declined' };
        }
        return c;
      })
    );
  };

  const handleSaveNote = () => {
    setCandidates((prev) =>
      prev.map((c) => {
        if (c.id === selectedCandidate.id) {
          return { ...c, note: noteText ? `"${noteText}"` : '' };
        }
        return c;
      })
    );
    setIsNoteModalOpen(false);
  };

  const openNoteModal = () => {
    setNoteText(selectedCandidate.note ? selectedCandidate.note.replace(/^"|"$/g, '') : '');
    setIsNoteModalOpen(true);
  };

  // Filter candidates list
  const filteredCandidates = candidates.filter((c) => {
    if (filter === 'Shortlisted') return c.status === 'shortlisted';
    if (filter === 'Pending') return c.status === 'pending';
    if (filter === 'Noted') return !!c.note;
    return true;
  });

  return (
    <div 
      className="w-[960px] bg-white flex flex-col items-center pt-0 px-0 pb-[80px] gap-[24px] overflow-y-auto scrollbar-none animate-in fade-in duration-300 mx-auto relative font-['Poppins'] box-border"
      style={{
        height: '1189px',
        scrollbarWidth: 'none',
      }}
    >
      {/* Back button and message frame (Frame 2608623) */}
      <div 
        className="flex flex-row items-center p-0 gap-[16px] w-[960px] h-[48px] flex-none order-0 self-stretch grow-0"
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
        className="box-border flex flex-row items-center p-[16px] gap-[16px] w-[960px] h-[80px] bg-white border border-[#EEF2FF] rounded-[24px] flex-none order-1 self-stretch grow-0"
      >
        {/* Job text frame (Frame 2609064) */}
        <div className="flex flex-col items-start p-0 gap-[8px] w-[710px] h-[48px] flex-none order-0 grow-[1] min-w-0">
          <span 
            className="w-[121px] h-[24px] font-['Poppins'] font-medium text-[16px] leading-[24px] flex items-center text-black capitalize flex-none order-0 grow-0 truncate"
          >
            {listing.title}
          </span>
          <span 
            className="w-[710px] h-[16px] font-['Poppins'] font-normal text-[12px] leading-[16px] flex items-center text-[#6B7280] flex-none order-1 self-stretch grow-0 truncate"
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
          className="box-border flex flex-row justify-center items-center py-[8px] px-[16px] gap-[10px] w-[116px] h-[40px] bg-white border border-[#818CF8] rounded-[24px] flex-none order-2 grow-0 hover:bg-indigo-50/10 active:scale-95 transition-all"
        >
          <span 
            className="w-[84px] h-[20px] font-['Poppins'] font-normal text-[14px] leading-[20px] text-center text-[#818CF8] flex-none order-0 grow-0"
          >
            View details
          </span>
        </button>
      </div>

      {/* Counts Frame (Frame 2609065) */}
      <div 
        className="flex flex-row justify-center items-center p-0 gap-[16px] w-[960px] h-[88px] flex-none order-2 self-stretch grow-0"
      >
        {/* Applications Card */}
        <div 
          className="box-border flex flex-col items-start p-[16px] gap-[8px] w-[472px] h-[88px] bg-white border border-[#EEF2FF] rounded-[24px] flex-none order-0 grow-[1]"
        >
          <span 
            className="w-[82px] h-[16px] font-['Poppins'] font-normal text-[12px] leading-[16px] flex items-center text-[#6B7280] flex-none order-0 grow-0 uppercase tracking-wider"
          >
            APPLICATIONS
          </span>
          <span 
            className="w-[439px] h-[32px] font-['Poppins'] font-semibold text-[24px] leading-[32px] flex items-center text-[#000000] flex-none order-1 self-stretch grow-0"
          >
            {appCount}
          </span>
        </div>

        {/* Shortlisted Card */}
        <div 
          className="box-border flex flex-col items-start p-[16px] gap-[8px] w-[472px] h-[88px] bg-white border border-[#EEF2FF] rounded-[24px] flex-none order-1 grow-[1]"
        >
          <span 
            className="w-[75px] h-[16px] font-['Poppins'] font-normal text-[12px] leading-[16px] flex items-center text-[#6B7280] flex-none order-0 grow-0 uppercase tracking-wider"
          >
            SHORTLISTED
          </span>
          <span 
            className="w-[439px] h-[32px] font-['Poppins'] font-semibold text-[24px] leading-[32px] flex items-center text-[#000000] flex-none order-1 self-stretch grow-0"
          >
            {shortlistCount}
          </span>
        </div>
      </div>

      {/* Main Frame: Applicants list and Candidate details (Frame 2608633) */}
      <div 
        className="flex flex-row items-start p-0 gap-[16px] w-[960px] h-[901px] flex-none order-3 self-stretch grow-0"
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
                            className={`text-center justify-start text-sm font-normal font-['Poppins'] leading-5 ${
                              isOptActive ? 'text-indigo-500' : 'text-black'
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
                const isSelected = cand.id === selectedCandId;
                return (
                  <div
                    key={cand.id}
                    onClick={() => setSelectedCandId(cand.id)}
                    className="box-border flex flex-row items-center p-[12px] gap-[8px] w-[270px] h-[78px] rounded-[12px] flex-none order-0 self-stretch grow-0 cursor-pointer transition-all duration-200"
                    style={{
                      backgroundColor: isSelected ? '#EEF2FF' : '#FFFFFF',
                    }}
                  >
                    {/* Ellipse 2 (User avatar) */}
                    {cand.avatar ? (
                      <img 
                        className="w-[50px] h-[50px] rounded-full object-cover flex-none order-0 grow-0" 
                        src={cand.avatar} 
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
                      
                      {/* Frame 2609066 */}
                      <div className="flex flex-row items-center p-0 gap-[4px] w-[97px] h-[26px] flex-none">
                        {cand.score !== null ? (
                          <>
                            <span className="w-[38px] h-[26px] font-['Poppins'] font-medium text-[18px] leading-[26px] flex items-center text-[#6366F1]">
                              {cand.score}%
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
          className="flex flex-col items-start p-0 gap-[16px] w-[650px] rounded-[24px] flex-none order-1 grow-[1] min-w-0"
        >
          {/* Header metadata row / Frame 2608732 */}
          <div 
            className="flex flex-row justify-between items-center p-0 w-[650px] h-[52px] rounded-[12px] flex-none order-0 self-stretch grow-0"
          >
            {/* User details / Frame 2608774 */}
            <div className="flex flex-row items-center p-0 gap-[8px] w-[238px] h-[44px] flex-none order-0 grow-0">
              {/* Ellipse 3 (Avatar) */}
              {selectedCandidate.avatar ? (
                <img 
                  className="w-[44px] h-[44px] rounded-full object-cover flex-none order-0 self-stretch grow-0" 
                  src={selectedCandidate.avatar} 
                  alt={selectedCandidate.name} 
                />
              ) : (
                <div className="w-[44px] h-[44px] bg-slate-200 rounded-full flex items-center justify-center text-gray-500 font-semibold font-['Poppins'] text-sm flex-none order-0 self-stretch grow-0">
                  {selectedCandidate.name.substring(0, 2).toUpperCase()}
                </div>
              )}

              {/* Frame 2609009 */}
              <div className="flex flex-col items-start p-0 gap-[4px] w-[186px] h-[44px] flex-none order-1 grow-0">
                {/* Name */}
                <span 
                  className="w-[100px] h-[24px] font-['Poppins'] font-medium text-[16px] leading-[24px] text-black flex items-center text-left"
                >
                  {selectedCandidate.name}
                </span>

                {/* Frame 2609097 */}
                <div className="flex flex-row justify-start items-center p-0 gap-[8px] w-[186px] h-[16px] flex-none order-1 grow-0">
                  {/* Role */}
                  <span 
                    className="font-['Poppins'] font-normal text-[12px] leading-[16px] text-[#6B7280] flex items-center truncate"
                    style={{ maxWidth: '88px' }}
                  >
                    {selectedCandidate.title}
                  </span>
                  {/* Badge (Ellipse 15) */}
                  <div className="w-[6px] h-[6px] bg-[#6B7280] rounded-full flex-none grow-0" />
                  {/* Location */}
                  <span 
                    className="font-['Poppins'] font-normal text-[12px] leading-[16px] text-[#6B7280] flex items-center truncate"
                    style={{ maxWidth: '76px' }}
                  >
                    {selectedCandidate.location}
                  </span>
                </div>
              </div>
            </div>

            {/* Match count frame (Frame 2609066) */}
            {selectedCandidate.score !== null && (
              <div className="flex flex-col justify-center items-start p-0 gap-[4px] w-[55px] h-[52px] flex-none order-1 grow-0">
                {/* Score text */}
                <span 
                  className="w-[51px] h-[32px] font-['Poppins'] font-semibold text-[24px] leading-[32px] flex items-center text-[#6366F1] flex-none order-0 grow-0"
                >
                  {selectedCandidate.score}%
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
            className="flex flex-row justify-between items-center p-0 gap-[8px] w-[650px] h-[40px] flex-none order-1 self-stretch grow-0"
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
            <div className="flex flex-row items-center p-0 gap-[16px] w-[216px] h-[40px] flex-none order-1 grow-0">
              {/* Decline Button / Frame 2608618 */}
              <button
                onClick={() => handleDecline(selectedCandidate.id)}
                disabled={selectedCandidate.status === 'declined'}
                type="button"
                className="box-border flex flex-row justify-center items-center py-[8px] px-[16px] gap-[10px] w-[100px] h-[40px] border border-[#818CF8] rounded-[24px] flex-none order-0 grow-0 hover:bg-slate-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span 
                  className="w-[52px] h-[20px] font-['Poppins'] font-normal text-[14px] leading-[20px] text-center text-[#818CF8] flex-none order-0 grow-0"
                >
                  {selectedCandidate.status === 'declined' ? 'Declined' : 'Decline'}
                </span>
              </button>

              {/* Shortlist Button / Frame 2608617 */}
              <button
                onClick={() => handleShortlist(selectedCandidate.id)}
                disabled={selectedCandidate.status === 'shortlisted'}
                type="button"
                className="box-border flex flex-row justify-center items-center py-[8px] px-[16px] gap-[10px] w-[100px] h-[40px] bg-[#6366F1] border border-white rounded-[24px] flex-none order-1 grow-0 hover:bg-[#5558e6] transition-all disabled:opacity-75 disabled:cursor-not-allowed"
              >
                <span 
                  className="w-[56px] h-[20px] font-['Poppins'] font-normal text-[14px] leading-[20px] text-center text-white flex-none order-0 grow-0"
                >
                  {selectedCandidate.status === 'shortlisted' ? 'Shortlisted' : 'Shortlist'}
                </span>
              </button>
            </div>
          </div>

          {/* Self Note Frame / Frame 2609091 */}
          {selectedCandidate.note && (
            <div 
              className="flex flex-col items-start p-0 gap-[8px] w-[650px] flex-none order-2 self-stretch grow-0"
            >
              {/* Title */}
              <span 
                className="w-[80px] h-[26px] font-['Poppins'] font-medium text-[18px] leading-[26px] text-left text-black flex items-center"
              >
                Self Note
              </span>
              
              {/* Note body frame / Frame 2609030 */}
              <div 
                className="box-border flex flex-col items-start py-[12px] px-[16px] gap-[8px] w-[650px] bg-[#F9FAFF] border-l-2 border-[#6366F1] rounded-tr-[16px] rounded-bl-[16px] rounded-br-[16px] flex-none order-1 self-stretch grow-0"
              >
                <span 
                  className="w-[618px] font-['Poppins'] font-normal text-[12px] leading-[16px] text-[#6B7280] flex-none order-0 self-stretch grow-0"
                >
                  {selectedCandidate.note}
                </span>
              </div>
            </div>
          )}

          {/* Resume PDF Frame / Frame 2608977 */}
          <div 
            className="flex flex-row justify-between items-center py-0 pr-[8px] pl-0 gap-[16px] w-[650px] h-[40px] rounded-[12px] flex-none order-3 self-stretch grow-0"
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
                  {selectedCandidate.resume}
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
              onClick={() => window.open(`/resumes/${selectedCandidate.resume}`, '_blank')}
              type="button"
              className="w-[24px] h-[24px] flex items-center justify-center p-0 hover:bg-slate-50 rounded flex-none order-1 grow-0"
            >
              <Icon icon="lucide:eye" className="w-[24px] h-[24px] text-black" />
            </button>
          </div>

          {/* AI Executive Summary Block / Section - AI Executive Summary */}
          {selectedCandidate.summary && (
            <div 
              className="flex flex-col items-start p-[16px] gap-[16px] w-[650px] bg-[#F9FAFF] rounded-[24px] flex-none order-4 self-stretch grow-0 box-border"
            >
              {/* Title frame */}
              <div className="flex flex-row items-center p-0 gap-[8px] w-[618px] h-[20px] flex-none order-0 self-stretch grow-0">
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

              {/* Details container */}
              <div className="flex flex-row items-start p-0 pb-[8px] gap-[16px] w-[618px] h-[104px] flex-none order-1 self-stretch grow-0">
                {/* Left frame (strengths) */}
                <div className="flex flex-col items-start p-0 gap-[12px] w-[301px] h-[96px] flex-none order-0 self-stretch grow-[1]">
                  <span 
                    className="w-[301px] h-[16px] font-['Poppins'] font-normal text-[12px] leading-[16px] flex items-center text-[#22C55E] uppercase tracking-wider"
                  >
                    Strengths
                  </span>
                  
                  {/* Frame 2609109 */}
                  <div className="flex flex-col items-start p-0 gap-[8px] w-[273px] h-[68px] flex-none order-1 grow-[1] overflow-y-auto scrollbar-none">
                    {selectedCandidate.summary.strengths.map((str, idx) => (
                      <span 
                        key={idx}
                        className="w-[273px] font-['Poppins'] font-normal text-[12px] leading-[16px] flex items-center text-black"
                      >
                        • {str}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Right frame (concerns) */}
                <div className="flex flex-col items-start p-0 pb-[36px] gap-[12px] w-[301px] h-[96px] flex-none order-1 self-stretch grow-[1]">
                  <span 
                    className="w-[301px] h-[16px] font-['Poppins'] font-normal text-[12px] leading-[16px] flex items-center text-[#FF6B6B] uppercase tracking-wider"
                  >
                    Concerns
                  </span>
                  
                  <div className="flex flex-col items-start p-0 gap-[8px] w-[273px] h-[68px] flex-none order-1 grow-[1] overflow-y-auto scrollbar-none">
                    {selectedCandidate.summary.concerns.map((con, idx) => (
                      <span 
                        key={idx}
                        className="w-[273px] font-['Poppins'] font-normal text-[12px] leading-[16px] flex items-center text-black"
                      >
                        • {con}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Recommendation frame / HorizontalBorder */}
              <div 
                className="box-border flex flex-col items-start pt-[16px] px-0 pb-0 w-[618px] min-h-[49px] h-auto border-t border-[#E0E7FF] flex-none order-2 self-stretch grow-0"
              >
                <div className="w-[618px] min-h-[32px] h-auto font-['Poppins'] font-normal text-[12px] leading-[16px] text-black text-left">
                  <span className="font-semibold text-[#6366F1] mr-1">Recommendation:</span>
                  <span>{selectedCandidate.summary.recommendation}</span>
                </div>
              </div>
            </div>
          )}

          {/* Skills match / Skills Match */}
          {selectedCandidate.skills && (
            <div 
              className="box-border flex flex-col items-start p-[12px] gap-[16px] w-[650px] bg-white border border-[#EEF2FF] rounded-[24px] flex-none order-4 self-stretch grow-0"
            >
              {/* Title frame / Frame 2609098 */}
              <div className="flex flex-row justify-between items-center p-0 gap-[8px] w-[624px] h-[31px] flex-none self-stretch grow-0">
                <span 
                  className="w-[40px] h-[24px] font-['Poppins'] font-medium text-[16px] leading-[24px] flex items-center text-black"
                >
                  Skills
                </span>

                {/* Match percent frame (Background+Border) */}
                <div 
                  className="flex flex-row justify-center items-center py-[8px] px-[12px] h-[31px] bg-[#EEF2FF] rounded-[9999px] flex-none grow-0"
                >
                  <span 
                    className="font-['Inter'] font-bold text-[10px] leading-[15px] flex items-center justify-center text-[#6366F1] uppercase whitespace-nowrap"
                  >
                    {selectedCandidate.skills.match}% MATCH
                  </span>
                </div>
              </div>

              {/* Skills chip frame / Container */}
              <div className="flex flex-row items-center p-0 gap-[8px] w-[624px] min-h-[32px] h-auto flex-none self-stretch grow-0 flex-wrap">
                {selectedCandidate.skills.tags.map((t, idx) => {
                  const bg = t.matched ? '#EEF2FF' : '#FEE2E2';
                  const text = t.matched ? '#6366F1' : '#FF6B6B';
                  return (
                    <div 
                      key={idx}
                      className="flex flex-col justify-center items-center py-[8px] px-[16px] h-[32px] rounded-[9999px] flex-none"
                      style={{
                        backgroundColor: bg,
                      }}
                    >
                      <span 
                        className="font-['Poppins'] font-normal text-[12px] leading-[16px] flex items-center text-center"
                        style={{ color: text }}
                      >
                        {t.name}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Summary text */}
              <span 
                className="w-[472px] font-['Poppins'] font-normal text-[14px] leading-[20px] flex items-center text-black"
              >
                {selectedCandidate.skills.summary}
              </span>
            </div>
          )}

          {/* Meta section (Experience & Qualification side-by-side) / Frame 2609110 */}
          {selectedCandidate.experience && selectedCandidate.qualification && (
            <div className="flex flex-row items-start p-0 gap-[16px] w-[650px] h-[197px] flex-none order-5 self-stretch grow-0">
              {/* Left Experience frame / Experience Match */}
              <div 
                className="box-border flex flex-col items-start p-[12px] gap-[16px] w-[317px] h-[197px] bg-white border border-[#EEF2FF] rounded-[16px] flex-none order-0 self-stretch grow-[1]"
              >
                {/* Title frame */}
                <div className="flex flex-row justify-between items-center p-0 gap-[8px] w-[291px] h-[31px] flex-none self-stretch grow-0">
                  <span 
                    className="w-[88px] h-[24px] font-['Poppins'] font-medium text-[16px] leading-[24px] flex items-center text-black"
                  >
                    Experience
                  </span>
                  
                  {/* Status */}
                  <span 
                    className="w-[47px] h-[15px] font-['Inter'] font-bold text-[10px] leading-[15px] flex items-center text-[#6366F1] uppercase"
                  >
                    {selectedCandidate.experience.status}
                  </span>
                </div>

                {/* Exp match frame */}
                <div className="flex flex-row justify-between items-center py-[8px] px-0 gap-[5.3px] w-[291px] h-[68px] flex-none self-stretch grow-0">
                  {/* Required box */}
                  <div className="flex flex-col items-start p-0 gap-[4px] w-[76px] h-[52px] flex-none order-0 grow-0">
                    <span 
                      className="w-[56px] h-[16px] font-['Poppins'] font-normal text-[12px] leading-[16px] flex items-center text-[#6B7280]"
                    >
                      REQUIRED
                    </span>
                    <div className="flex flex-col items-center p-0 w-[76px] h-[32px] opacity-50 flex-none order-1 self-stretch grow-0">
                      <span className="w-[76px] h-[32px] font-['Poppins'] font-semibold text-[24px] leading-[32px] flex items-center justify-center text-black">
                        {selectedCandidate.experience.required}
                      </span>
                    </div>
                  </div>

                  {/* Arrow */}
                  <div className="flex flex-col items-start p-0 w-[19px] h-[9px] flex-none order-1 grow-0 text-slate-350 flex justify-center items-center">
                    <Icon icon="lucide:arrow-right" className="w-[19px] h-[9px]" />
                  </div>

                  {/* Actual box */}
                  <div className="flex flex-col items-start p-0 gap-[4px] w-[80px] h-[52px] flex-none order-2 grow-0">
                    <span 
                      className="w-[46px] h-[16px] font-['Poppins'] font-normal text-[12px] leading-[16px] flex items-center text-[#000000]"
                    >
                      ACTUAL
                    </span>
                    <span className="w-[80px] h-[32px] font-['Poppins'] font-semibold text-[24px] leading-[32px] flex items-center justify-center text-black">
                      {selectedCandidate.experience.actual}
                    </span>
                  </div>
                </div>

                {/* Exceeds text */}
                <span 
                  className="w-[291px] h-[40px] font-['Poppins'] font-normal text-[14px] leading-[20px] flex items-center text-black"
                >
                  {selectedCandidate.experience.summary}
                </span>
              </div>

              {/* Right Qualification frame / Education Match */}
              <div 
                className="box-border flex flex-col items-start p-[12px] gap-[16px] w-[317px] h-[197px] bg-white border border-[#EEF2FF] rounded-[16px] flex-none order-1 self-stretch grow-[1]"
              >
                {/* Title frame */}
                <div className="flex flex-row justify-between items-center p-0 gap-[8px] w-[291px] h-[31px] flex-none self-stretch grow-0">
                  <span 
                    className="w-[103px] h-[24px] font-['Poppins'] font-medium text-[16px] leading-[24px] flex items-center text-black"
                  >
                    Qualification
                  </span>
                  
                  {/* Status */}
                  <span 
                    className="w-[45px] h-[15px] font-['Inter'] font-bold text-[10px] leading-[15px] flex items-center text-[#6366F1] uppercase"
                  >
                    {selectedCandidate.qualification.status}
                  </span>
                </div>

                {/* Top education frame / Margin */}
                <div className="flex flex-col items-start p-0 w-[291px] h-[60px] flex-none self-stretch grow-0">
                  <span 
                    className="w-[275px] h-[24px] font-['Poppins'] font-normal text-[16px] leading-[24px] flex items-center text-black truncate"
                  >
                    {selectedCandidate.qualification.degree}
                  </span>
                  <span 
                    className="w-[275px] h-[16px] font-['Poppins'] font-normal text-[12px] leading-[16px] flex items-center text-[#6B7280] uppercase mt-[4px]"
                  >
                    {selectedCandidate.qualification.class}
                  </span>
                </div>

                {/* Aligns text */}
                <span 
                  className="w-[291px] h-[40px] font-['Poppins'] font-normal text-[14px] leading-[20px] flex items-center text-black"
                >
                  {selectedCandidate.qualification.summary}
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
