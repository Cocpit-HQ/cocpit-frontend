import React, { useState } from 'react';
import { Icon } from '@iconify/react';
import { CareerTrajectorySnapshot } from '../../types/trajectory.types';
import { useAnalyticsStore } from '@/store/analytics.store';
import { useCareerTrajectory } from '../../hooks/useCareerTrajectory';
import { useAnalyticsOverview } from '../../hooks/useAnalyticsOverview';

// Mock components to be built out later
const TrajectorySummary = ({ data }: { data: any }) => (
  <div className="flex flex-row items-center p-6 border border-gray-100 rounded-[16px] mb-8 w-full gap-4 shadow-sm mt-4">
    <div className="flex items-center justify-center w-[48px] h-[48px] bg-[#EEF2FF] rounded-[12px] shrink-0">
      <Icon icon="lucide:sparkles" className="w-6 h-6 text-[#6366F1]" />
    </div>
    <div className="flex flex-col">
      <h4 className="text-[16px] font-medium text-[#6366F1] font-['Poppins'] mb-1">The trajectory summary</h4>
      <p className="text-[14px] text-gray-500 font-['Poppins'] leading-relaxed">
        {data.currentDirection}
      </p>
    </div>
  </div>
);

const JourneyTimeline = ({ data, isStudent }: { data: any[], isStudent: boolean }) => (
  <div className="flex flex-col w-full h-full">
    <h5 className="text-[12px] font-medium text-gray-500 font-['Poppins'] tracking-wider mb-6 uppercase">The Journey</h5>
    <div className="flex flex-col relative pl-4 border-l border-[#EEF2FF] ml-2 gap-8">
      {data.map((item, idx) => (
        <div key={item.id} className="flex flex-col relative">
          <div className={`absolute -left-[21px] w-3 h-3 rounded-full border-2 flex items-center justify-center ${item.isCurrent ? 'border-[#6366F1] bg-[#6366F1]' : idx === data.length - 1 ? 'border-[#818CF8] bg-white' : 'border-gray-400 bg-white'}`}>
            {item.isCurrent && (
              isStudent ? (
                <Icon icon="lucide:trending-up" className="w-2 h-2 text-white" strokeWidth={3} />
              ) : (
                <div className="w-1.5 h-1.5 bg-white rounded-full" />
              )
            )}
          </div>
          <div className="flex flex-col -mt-1">
            <span className={`text-[12px] font-['Poppins'] ${item.isCurrent ? 'text-[#818CF8]' : 'text-gray-500'}`}>{item.dateRange}</span>
            <h6 className={`text-[16px] font-medium font-['Poppins'] mt-1 ${item.isCurrent ? 'text-[#6366F1]' : 'text-gray-700'}`}>{item.role}</h6>
            <p className="text-[14px] text-gray-500 font-['Poppins'] mt-1 max-w-[280px]">{item.description}</p>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const SkillAlignmentCard = ({ data, targetRoleName }: { data: any, targetRoleName?: string }) => (
  <div className="flex flex-col w-full items-center h-full">
    <div className="w-full text-left">
      <h5 className="text-[12px] font-medium text-gray-500 font-['Poppins'] tracking-wider mb-6 uppercase">Skill Alignment</h5>
    </div>
    <div className="relative w-full max-w-[300px] aspect-square flex items-center justify-center mt-4">
      <svg viewBox="0 0 200 200" className="w-full h-full overflow-visible">
        {[0.2, 0.4, 0.6, 0.8, 1].map(scale => (
          <polygon key={scale} points="100,20 169.28,60 169.28,140 100,180 30.72,140 30.72,60" fill="none" stroke="#EEF2FF" strokeWidth="1" style={{ transform: `scale(${scale})`, transformOrigin: '100px 100px' }} />
        ))}
        <line x1="100" y1="100" x2="100" y2="20" stroke="#EEF2FF" />
        <line x1="100" y1="100" x2="169.28" y2="60" stroke="#EEF2FF" />
        <line x1="100" y1="100" x2="169.28" y2="140" stroke="#EEF2FF" />
        <line x1="100" y1="100" x2="100" y2="180" stroke="#EEF2FF" />
        <line x1="100" y1="100" x2="30.72" y2="140" stroke="#EEF2FF" />
        <line x1="100" y1="100" x2="30.72" y2="60" stroke="#EEF2FF" />

        {/* Target Red dashed shape */}
        <polygon points="100,28 160,65 160,135 100,172 40,135 40,65" fill="#fef2f2" fillOpacity="0.5" stroke="#fca5a5" strokeWidth="1" strokeDasharray="4 2" />
        {/* Current Blue solid shape */}
        <polygon points="100,50 145,80 135,130 100,150 55,130 60,75" fill="#EEF2FF" fillOpacity="0.8" stroke="#6366F1" strokeWidth="1.5" />

        {/* Labels */}
        <text x="100" y="10" fontSize="8" fill="#818CF8" textAnchor="middle">{data[0]?.skillName || 'Skill 1'}</text>
        <text x="175" y="60" fontSize="8" fill="#6B7280" textAnchor="start">{data[1]?.skillName || 'Skill 2'}</text>
        <text x="175" y="140" fontSize="8" fill="#6B7280" textAnchor="start">{data[2]?.skillName || 'Skill 3'}</text>
        <text x="100" y="195" fontSize="8" fill="#6B7280" textAnchor="middle">{data[3]?.skillName || 'Skill 4'}</text>
        <text x="25" y="140" fontSize="8" fill="#6B7280" textAnchor="end">{data[4]?.skillName || 'Skill 5'}</text>
        <text x="25" y="60" fontSize="8" fill="#6B7280" textAnchor="end">{data[5]?.skillName || 'Skill 6'}</text>
      </svg>
    </div>
    <div className="flex flex-row items-center justify-center gap-6 mt-6">
      <div className="flex items-center gap-2">
        <div className="w-[12px] h-[12px] rounded-full bg-[#6366F1]" />
        <span className="text-[12px] text-gray-500 font-['Poppins']">Current Level</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-[12px] h-[12px] rounded-full bg-[#fef2f2] border border-dashed border-[#fca5a5]" />
        <span className="text-[12px] text-gray-500 font-['Poppins']">Target {targetRoleName ? `(${targetRoleName})` : ''}</span>
      </div>
    </div>
  </div>
);

const CurrentProgress = ({ data, targetRoleName }: { data: number, targetRoleName: string }) => (
  <div className="flex flex-col w-full pr-8">
    <h5 className="text-[12px] font-medium text-gray-500 font-['Poppins'] tracking-wider mb-4 uppercase">Current Progress</h5>
    <div className="flex flex-row items-end justify-between w-full mb-2">
      <h3 className="text-[24px] font-semibold text-[#6366F1] font-['Poppins'] leading-none">{targetRoleName}</h3>
      <span className="text-[14px] font-semibold text-[#6366F1] font-['Poppins']">{data}%</span>
    </div>
    <div className="w-full h-[6px] bg-[#EEF2FF] rounded-full mb-4 mt-2">
      <div className="h-full bg-[#6366F1] rounded-full" style={{ width: `${data}%` }} />
    </div>
    <p className="text-[10px] text-gray-500 font-['Poppins'] leading-[16px] max-w-[80%]">Focused growth remaining for the target role.</p>
  </div>
);

const NextBestAction = ({ data }: { data: any }) => {
  const getButtonText = (type: string) => {
    switch (type) {
      case 'Job': return 'Apply';
      case 'Connection': return 'Connect';
      case 'Channel': return 'Subscribe';
      case 'Course': return 'Enroll';
      case 'Project': return 'Start';
      default: return 'Action';
    }
  };

  const renderTitle = (title: string) => {
    // Splitting by quotes to find the quoted text
    const parts = title.split(/('[\s\S]*?')/);
    return parts.map((part, index) => {
      if (part.startsWith("'") && part.endsWith("'")) {
        return <span key={index} className="underline underline-offset-4 decoration-2">{part}</span>;
      }
      return <span key={index}>{part}</span>;
    });
  };

  return (
    <div className="flex flex-row items-center w-full relative h-full">
      <Icon icon="lucide:arrow-right" className="w-5 h-5 text-gray-300 absolute -left-10 top-1/2 transform -translate-y-1/2" />
      <div className="flex flex-col justify-center bg-[#EEF2FF] p-6 rounded-[16px] w-full h-full">
        <h5 className="text-[12px] font-medium text-[#6366F1] font-['Poppins'] tracking-wider mb-2 uppercase">Next Best Action</h5>
        <h3 className="text-[20px] font-semibold text-[#6366F1] font-['Poppins'] leading-[28px] mb-2">
          {renderTitle(data.title)}
        </h3>
        <p className="text-[12px] text-[#6366F1] opacity-80 font-['Poppins'] leading-[18px]">{data.subtitle}</p>
        <button className="mt-6 bg-[#6366F1] hover:bg-[#4F46E5] text-white px-6 py-2 rounded-full text-[14px] font-['Poppins'] w-fit transition-colors">
          {getButtonText(data.type)}
        </button>
      </div>
    </div>
  );
};

export function CareerTrajectoryHome() {
  const { selectedRole, setSelectedRole } = useAnalyticsStore();

  const { data: results, isFetching: analyzing, refetch } = useCareerTrajectory(selectedRole);
  const { data: overviewData } = useAnalyticsOverview('Last 30 days');

  const roleLabels: Record<string, string> = {
    'vp-marketing': 'VP of Marketing',
    'junior-designer': 'Junior UI Designer',
    'senior-engineer': 'Senior Software Engineer'
  };

  const profileStrength = overviewData?.profileStrength?.score ?? 0;

  const isStudent = selectedRole === 'junior-designer';
  const threshold = isStudent ? 80 : 90;
  const isReady = !!selectedRole && profileStrength >= threshold;

  const handleRunAnalysis = () => {
    if (!isReady) return;
    refetch();
  };

  if (results) {
    return (
      <div className="flex flex-col w-full max-w-[960px] bg-white rounded-[24px] pb-12">
        {/* Results Header */}
        <div className="flex flex-row justify-between items-center w-full mb-6 mt-4">
          <div className="flex flex-col">
            <h3 className="text-[20px] font-semibold text-black font-['Poppins']">Get personalized guidance for your target role</h3>
            <p className="text-[12px] text-[#6B7280] font-['Poppins'] mt-1">Last analyzed Aug 8 • Next analysis available Aug 23</p>
          </div>
          <div className="flex flex-row gap-3 items-center">
            <div className="relative">
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="border border-gray-400 rounded-[20px] pl-4 pr-8 py-1.5 text-[14px] font-['Poppins'] text-black bg-white appearance-none focus:outline-none h-[32px] flex items-center"
              >
                <option value="vp-marketing">VP of Marketing</option>
                <option value="junior-designer">Junior UI Designer</option>
                <option value="senior-engineer">Senior Software Engineer</option>
              </select>
              <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                <Icon icon="lucide:chevron-down" className="w-4 h-4 text-black" />
              </div>
            </div>
            <button
              onClick={handleRunAnalysis}
              disabled={analyzing || !isReady}
              className={`transition-colors text-white px-6 h-[32px] rounded-[24px] text-[14px] font-['Poppins'] flex items-center justify-center gap-2 ${!isReady || analyzing
                  ? 'bg-[#C7D2FE] cursor-default'
                  : 'bg-[#6366F1] hover:bg-[#4F46E5] cursor-pointer'
                }`}
            >
              {analyzing ? (
                <>
                  <Icon icon="svg-spinners:180-ring" className="w-4 h-4 text-white" />
                  Analyzing...
                </>
              ) : (
                'Analyze'
              )}
            </button>
          </div>
        </div>

        <TrajectorySummary data={results.trajectorySummary} />

        <div className="grid grid-cols-2 gap-12 w-full mt-4">
          <div className="flex flex-col">
            <JourneyTimeline data={results.journey} isStudent={isStudent} />
          </div>
          <div className="flex flex-col items-center justify-center">
            <SkillAlignmentCard data={results.skillAlignments} targetRoleName={roleLabels[selectedRole] || results.targetRole.name} />
          </div>
        </div>

        <div className="flex flex-row w-full mt-16 items-stretch gap-16 relative">
          <div className="flex-1">
            <CurrentProgress data={results.currentProgressScore} targetRoleName={roleLabels[selectedRole] || results.targetRole.name} />
          </div>
          <div className="flex-1">
            <NextBestAction data={results.nextBestAction} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center w-full max-w-[960px] mx-auto gap-4 mt-8">
      {/* Centralized Setup Card */}
      <div className="flex flex-col items-start p-6 gap-4 w-full max-w-[512px] bg-white rounded-[16px]">

        {/* Header */}
        <div className="flex flex-col items-start w-full">
          <h2 className="text-[24px] font-semibold text-black font-['Poppins'] leading-[32px]">
            Setup analysis
          </h2>
          <p className="text-[12px] font-normal text-[#6B7280] font-['Poppins'] leading-[16px]">
            Define your career target to begin pathfinding
          </p>
        </div>

        {/* Dropdown Section */}
        <div className="flex flex-col items-start gap-2 w-full mt-2">
          <label className="text-[16px] font-medium text-black font-['Poppins'] leading-[24px]">
            Choose target role
          </label>
          <div className="relative w-full">
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className={`w-full h-[48px] bg-white border border-[#DADADA] rounded-[24px] px-4 py-[8px] text-[14px] font-normal font-['Poppins'] leading-[20px] appearance-none focus:outline-none focus:ring-1 focus:ring-[#6366F1] ${selectedRole ? 'text-black' : 'text-[#6B7280]'
                }`}
            >
              <option value="" disabled hidden>Select target role...</option>
              <option value="vp-marketing">VP of Marketing</option>
              <option value="junior-designer">Junior UI Designer</option>
              <option value="senior-engineer">Senior Software Engineer</option>
            </select>
            <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M6 9L12 15L18 9" stroke={selectedRole ? "black" : "#6B7280"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex flex-col items-center w-full mt-2 gap-2">
          <button
            onClick={handleRunAnalysis}
            disabled={analyzing || !isReady}
            className={`flex flex-row justify-center items-center gap-2 w-full h-[40px] rounded-[24px] text-[14px] font-normal text-white font-['Poppins'] leading-[20px] transition-colors ${!isReady
                ? 'bg-[#C7D2FE] border border-white cursor-default'
                : 'bg-[#6366F1] border border-[#6366F1] hover:bg-[#4F46E5]'
              }`}
          >
            {analyzing ? (
              <>
                <Icon icon="svg-spinners:180-ring" className="w-5 h-5 text-white" />
                Analyzing...
              </>
            ) : (
              'Run analysis'
            )}
          </button>
          <p className="text-[12px] font-normal text-[#6B7280] font-['Poppins'] leading-[16px] text-center">
            You can run a new analysis every 15 days
          </p>
        </div>
      </div>

      {/* Preparation Section */}
      <div className="flex flex-col items-center gap-6 w-full max-w-[512px] mt-4">
        <div className="w-[300px] h-[1px] bg-[#EEF2FF]" />

        <div className="flex flex-col items-center gap-2 w-full">
          <div className="flex flex-row items-center gap-2">
            <span className="text-[16px] font-normal text-black font-['Poppins'] leading-[24px]">
              Profile strength:
            </span>
            <span className="text-[16px] font-medium text-black font-['Poppins'] leading-[24px]">
              {profileStrength}%
            </span>
          </div>
          <p className="text-[14px] font-normal text-[#6B7280] font-['Poppins'] leading-[20px] text-center w-full">
            {!selectedRole ? (
              'Select a role to check analysis requirements'
            ) : isReady ? (
              'Your profile is ready for analysis'
            ) : (
              `Complete your profile to at least ${threshold}% to run your career analysis`
            )}
          </p>
        </div>

        <button className="flex flex-row items-center gap-2 text-[#6366F1] hover:opacity-80 transition-opacity">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 4V8M12 4L8 8M12 4L16 8M4 12C4 16.4183 7.58172 20 12 20C16.4183 20 20 16.4183 20 12C20 7.58172 16.4183 4 12 4" stroke="#6366F1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="text-[16px] font-normal font-['Poppins'] leading-[24px]">
            Update Profile
          </span>
        </button>
      </div>
    </div>
  );
}
