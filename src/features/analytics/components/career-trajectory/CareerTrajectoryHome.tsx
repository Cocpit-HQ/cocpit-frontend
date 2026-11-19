import React, { useState } from 'react';
import { Icon } from '@/components/icons';
import { CareerTrajectorySnapshot } from '../../types/trajectory.types';
import { useAnalyticsStore } from '../../store/analytics.store';
import { useCareerTrajectory } from '../../hooks/useCareerTrajectory';
import { useAnalyticsOverview } from '../../hooks/useAnalyticsOverview';
import { ANALYTICS_FILTER_LABELS } from '../../constants/analytics.constants';

// Mock components to be built out later
const TrajectorySummary = ({ data }: { data: any }) => (
  <div className="flex flex-row items-center p-6 border border-ds-border bg-ds-surface-1 rounded-[16px] mb-8 w-full gap-4 shadow-sm mt-0">
    <div className="flex items-center justify-center w-[48px] h-[48px] bg-ds-surface-2 border border-ds-border-subtle rounded-[12px] shrink-0">
      <Icon name="sparkles" className="w-6 h-6 text-ds-accent" />
    </div>
    <div className="flex flex-col">
      <h4 className="text-[16px] font-medium text-ds-accent font-['DM_Sans'] mb-1">The trajectory summary</h4>
      <p className="text-[14px] text-ds-text-secondary font-['DM_Sans'] leading-relaxed">
        {data.currentDirection}
      </p>
    </div>
  </div>
);

const JourneyTimeline = ({ data, isStudent }: { data: any[], isStudent: boolean }) => (
  <div className="flex flex-col w-full h-full">
    <h5 className="text-[12px] font-medium text-ds-text-muted font-['DM_Sans'] tracking-wider mb-6 uppercase">The Journey</h5>
    <div className="flex flex-col relative pl-4 border-l border-ds-border ml-2 gap-8">
      {data.map((item, idx) => (
        <div key={item.id} className="flex flex-col relative">
          <div className={`absolute -left-[21px] w-3 h-3 rounded-full border-2 flex items-center justify-center ${item.isCurrent ? 'border-ds-accent bg-ds-accent' : idx === data.length - 1 ? 'border-ds-accent/60 bg-ds-surface-1' : 'border-ds-border bg-ds-surface-1'}`}>
            {item.isCurrent && (
              isStudent ? (
                <Icon name="trending-up" className="w-2 h-2 text-ds-accent-contrast" strokeWidth={3} />
              ) : (
                <div className="w-1.5 h-1.5 bg-ds-accent-contrast rounded-full" />
              )
            )}
          </div>
          <div className="flex flex-col -mt-1">
            <span className={`text-[12px] font-['DM_Sans'] ${item.isCurrent ? 'text-ds-accent' : 'text-ds-text-muted'}`}>{item.dateRange}</span>
            <h6 className={`text-[16px] font-medium font-['DM_Sans'] mt-1 ${item.isCurrent ? 'text-ds-accent' : 'text-ds-text-primary'}`}>{item.role}</h6>
            <p className="text-[14px] text-ds-text-secondary font-['DM_Sans'] mt-1 max-w-[280px]">{item.description}</p>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const SkillAlignmentCard = ({ data, targetRoleName }: { data: any, targetRoleName?: string }) => (
  <div className="flex flex-col w-full items-center h-full">
    <div className="w-full text-left">
      <h5 className="text-[12px] font-medium text-ds-text-muted font-['DM_Sans'] tracking-wider mb-6 uppercase">Skill Alignment</h5>
    </div>
    <div className="relative w-full max-w-[300px] aspect-square flex items-center justify-center mt-4">
      <svg viewBox="0 0 200 200" className="w-full h-full overflow-visible">
        {[0.2, 0.4, 0.6, 0.8, 1].map(scale => (
          <polygon key={scale} points="100,20 169.28,60 169.28,140 100,180 30.72,140 30.72,60" fill="none" stroke="var(--ds-border)" strokeWidth="1" style={{ transform: `scale(${scale})`, transformOrigin: '100px 100px' }} />
        ))}
        <line x1="100" y1="100" x2="100" y2="20" stroke="var(--ds-border)" />
        <line x1="100" y1="100" x2="169.28" y2="60" stroke="var(--ds-border)" />
        <line x1="100" y1="100" x2="169.28" y2="140" stroke="var(--ds-border)" />
        <line x1="100" y1="100" x2="100" y2="180" stroke="var(--ds-border)" />
        <line x1="100" y1="100" x2="30.72" y2="140" stroke="var(--ds-border)" />
        <line x1="100" y1="100" x2="30.72" y2="60" stroke="var(--ds-border)" />

        {/* Target Red dashed shape */}
        <polygon points="100,28 160,65 160,135 100,172 40,135 40,65" fill="var(--ds-error)" fillOpacity="0.1" stroke="var(--ds-error)" strokeWidth="1" strokeDasharray="4 2" />
        {/* Current Accent solid shape */}
        <polygon points="100,50 145,80 135,130 100,150 55,130 60,75" fill="var(--ds-accent)" fillOpacity="0.25" stroke="var(--ds-accent)" strokeWidth="1.5" />

        {/* Labels */}
        <text x="100" y="10" fontSize="8" fill="var(--ds-text-secondary)" textAnchor="middle">{data[0]?.skillName || 'Skill 1'}</text>
        <text x="175" y="60" fontSize="8" fill="var(--ds-text-secondary)" textAnchor="start">{data[1]?.skillName || 'Skill 2'}</text>
        <text x="175" y="140" fontSize="8" fill="var(--ds-text-secondary)" textAnchor="start">{data[2]?.skillName || 'Skill 3'}</text>
        <text x="100" y="195" fontSize="8" fill="var(--ds-text-secondary)" textAnchor="middle">{data[3]?.skillName || 'Skill 4'}</text>
        <text x="25" y="140" fontSize="8" fill="var(--ds-text-secondary)" textAnchor="end">{data[4]?.skillName || 'Skill 5'}</text>
        <text x="25" y="60" fontSize="8" fill="var(--ds-text-secondary)" textAnchor="end">{data[5]?.skillName || 'Skill 6'}</text>
      </svg>
    </div>
    <div className="flex flex-row items-center justify-center gap-6 mt-6">
      <div className="flex items-center gap-2">
        <div className="w-[12px] h-[12px] rounded-full bg-ds-accent" />
        <span className="text-[12px] text-ds-text-secondary font-['DM_Sans']">Current Level</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-[12px] h-[12px] rounded-full bg-ds-error/20 border border-dashed border-ds-error" />
        <span className="text-[12px] text-ds-text-secondary font-['DM_Sans']">Target {targetRoleName ? `(${targetRoleName})` : ''}</span>
      </div>
    </div>
  </div>
);

const CurrentProgress = ({ data, targetRoleName }: { data: number, targetRoleName: string }) => (
  <div className="flex flex-col w-full pr-8">
    <h5 className="text-[12px] font-medium text-ds-text-muted font-['DM_Sans'] tracking-wider mb-4 uppercase">Current Progress</h5>
    <div className="flex flex-row items-end justify-between w-full mb-2">
      <h3 className="text-[24px] font-semibold text-ds-accent font-['DM_Sans'] leading-none">{targetRoleName}</h3>
      <span className="text-[14px] font-semibold text-ds-accent font-['DM_Sans']">{data}%</span>
    </div>
    <div className="w-full h-[6px] bg-ds-surface-2 rounded-full mb-4 mt-2">
      <div className="h-full bg-ds-accent rounded-full" style={{ width: `${data}%` }} />
    </div>
    <p className="text-[10px] text-ds-text-secondary font-['DM_Sans'] leading-[16px] max-w-[80%]">Focused growth remaining for the target role.</p>
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
      <Icon name="arrow-right" className="w-5 h-5 text-ds-text-muted absolute -left-10 top-1/2 transform -translate-y-1/2" />
      <div className="flex flex-col justify-center bg-ds-surface-1 border border-ds-border shadow-sm p-6 rounded-[16px] w-full h-full">
        <h5 className="text-[12px] font-medium text-ds-accent font-['DM_Sans'] tracking-wider mb-2 uppercase">Next Best Action</h5>
        <h3 className="text-[20px] font-semibold text-ds-text-primary font-['DM_Sans'] leading-[28px] mb-2">
          {renderTitle(data.title)}
        </h3>
        <p className="text-[12px] text-ds-text-secondary font-['DM_Sans'] leading-[18px]">{data.subtitle}</p>
        <button className="mt-6 bg-ds-accent hover:bg-ds-accent-hover text-ds-accent-contrast px-6 py-2 rounded-full text-[14px] font-['DM_Sans'] w-fit transition-colors">
          {getButtonText(data.type)}
        </button>
      </div>
    </div>
  );
};

export function CareerTrajectoryHome() {
  const { selectedRole, setSelectedRole } = useAnalyticsStore();

  const { data: results, isFetching: analyzing, refetch } = useCareerTrajectory(selectedRole);
  const { data: overviewData } = useAnalyticsOverview(ANALYTICS_FILTER_LABELS.LAST_30_DAYS);

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
      <div className="flex flex-col w-full max-w-[846.67px] bg-ds-surface-1 border border-ds-border shadow-sm rounded-[24px] p-6 pb-12">
        {/* Results Header */}
        <div className="flex flex-row justify-between items-center w-full mb-6 mt-0">
          <div className="flex flex-col">
            <h3 className="text-[20px] font-semibold text-ds-text-primary font-['DM_Sans']">Get personalized guidance for your target role</h3>
            <p className="text-[12px] text-ds-text-secondary font-['DM_Sans'] mt-1">Last analyzed Aug 8 • Next analysis available Aug 23</p>
          </div>
          <div className="flex flex-row gap-3 items-center">
            <div className="relative">
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="border border-ds-border rounded-[20px] pl-4 pr-8 py-1.5 text-[14px] font-['DM_Sans'] text-ds-text-primary bg-ds-surface-1 appearance-none focus:outline-none focus:ring-1 focus:ring-ds-accent h-[32px] flex items-center"
              >
                <option value="vp-marketing">VP of Marketing</option>
                <option value="junior-designer">Junior UI Designer</option>
                <option value="senior-engineer">Senior Software Engineer</option>
              </select>
              <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                <Icon name="chevron-down" className="w-4 h-4 text-ds-text-secondary" />
              </div>
            </div>
            <button
              onClick={handleRunAnalysis}
              disabled={analyzing || !isReady}
              className={`transition-colors text-ds-accent-contrast px-6 h-[32px] rounded-[24px] text-[14px] font-['DM_Sans'] flex items-center justify-center gap-2 ${!isReady || analyzing
                  ? 'bg-ds-surface-2 text-ds-text-muted border border-ds-border cursor-not-allowed'
                  : 'bg-ds-accent hover:bg-ds-accent-hover cursor-pointer'
                }`}
            >
              {analyzing ? (
                <>
                  <Icon name="spinner" className="w-4 h-4 text-ds-accent-contrast animate-spin" />
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
    <div className="flex flex-col items-center w-full max-w-[846.67px] mx-auto gap-4 mt-0">
      {/* Centralized Setup Card */}
      <div className="flex flex-col items-start p-6 gap-4 w-full max-w-[512px] bg-ds-surface-1 border border-ds-border shadow-sm rounded-[16px]">

        {/* Header */}
        <div className="flex flex-col items-start w-full">
          <h2 className="text-[24px] font-semibold text-ds-text-primary font-['DM_Sans'] leading-[32px]">
            Setup analysis
          </h2>
          <p className="text-[12px] font-normal text-ds-text-secondary font-['DM_Sans'] leading-[16px]">
            Define your career target to begin pathfinding
          </p>
        </div>

        {/* Dropdown Section */}
        <div className="flex flex-col items-start gap-2 w-full mt-2">
          <label className="text-[16px] font-medium text-ds-text-primary font-['DM_Sans'] leading-[24px]">
            Choose target role
          </label>
          <div className="relative w-full">
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className={`w-full h-[48px] bg-ds-surface-1 border border-ds-border rounded-[24px] px-4 py-[8px] text-[14px] font-normal font-['DM_Sans'] leading-[20px] appearance-none focus:outline-none focus:ring-1 focus:ring-ds-accent ${selectedRole ? 'text-ds-text-primary' : 'text-ds-text-muted'
                }`}
            >
              <option value="" disabled hidden>Select target role...</option>
              <option value="vp-marketing">VP of Marketing</option>
              <option value="junior-designer">Junior UI Designer</option>
              <option value="senior-engineer">Senior Software Engineer</option>
            </select>
            <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
              <Icon name="chevron-down" className="w-5 h-5 text-ds-text-secondary" />
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex flex-col items-center w-full mt-2 gap-2">
          <button
            onClick={handleRunAnalysis}
            disabled={analyzing || !isReady}
            className={`flex flex-row justify-center items-center gap-2 w-full h-[40px] rounded-[24px] text-[14px] font-normal text-ds-accent-contrast font-['DM_Sans'] leading-[20px] transition-colors ${!isReady || analyzing
                ? 'bg-ds-surface-2 text-ds-text-muted border border-ds-border cursor-not-allowed'
                : 'bg-ds-accent hover:bg-ds-accent-hover border border-ds-accent cursor-pointer'
              }`}
          >
            {analyzing ? (
              <>
                <Icon name="spinner" className="w-5 h-5 text-ds-accent-contrast animate-spin" />
                Analyzing...
              </>
            ) : (
              'Run analysis'
            )}
          </button>
          <p className="text-[12px] font-normal text-ds-text-muted font-['DM_Sans'] leading-[16px] text-center">
            You can run a new analysis every 15 days
          </p>
        </div>
      </div>

      {/* Preparation Section */}
      <div className="flex flex-col items-center gap-6 w-full max-w-[512px] mt-4">
        <div className="w-[300px] h-[1px] bg-ds-border" />

        <div className="flex flex-col items-center gap-2 w-full">
          <div className="flex flex-row items-center gap-2">
            <span className="text-[16px] font-normal text-ds-text-primary font-['DM_Sans'] leading-[24px]">
              Profile strength:
            </span>
            <span className="text-[16px] font-medium text-ds-text-primary font-['DM_Sans'] leading-[24px]">
              {profileStrength}%
            </span>
          </div>
          <p className="text-[14px] font-normal text-ds-text-secondary font-['DM_Sans'] leading-[20px] text-center w-full">
            {!selectedRole ? (
              'Select a role to check analysis requirements'
            ) : isReady ? (
              'Your profile is ready for analysis'
            ) : (
              `Complete your profile to at least ${threshold}% to run your career analysis`
            )}
          </p>
        </div>

        <button className="flex flex-row items-center gap-2 text-ds-accent hover:opacity-80 transition-opacity">
          <Icon name="refresh-cw" className="w-5 h-5 text-ds-accent" />
          <span className="text-[16px] font-normal font-['DM_Sans'] leading-[24px]">
            Update Profile
          </span>
        </button>
      </div>
    </div>
  );
}
