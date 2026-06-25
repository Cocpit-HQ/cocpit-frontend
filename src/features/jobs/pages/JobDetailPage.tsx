import React, { useState } from 'react';
import { useJobDetail } from '../hooks/useJobDetail';
import { Icon } from '@iconify/react';
import { useSmartBack } from '@/hooks/use-smart-back';
import { toast } from 'sonner';
import { ApplyJobModal } from '../components/ApplyJobModal';
import { CocpitConfirmBox } from '@/shared/commonComponents/CocpitConfirmBox';
import CocpitShareModel from '@/shared/commonComponents/cocpitsharemodel';

interface JobDetailPageProps {
  jobId: string;
}

const JobDetailMap = () => {
  return (
    <div className="w-full h-full bg-[#E5E9F0] relative overflow-hidden flex items-center justify-center">
      {/* Custom high-fidelity vector map representation matching screenshot */}
      <svg className="w-full h-full absolute inset-0 opacity-80" viewBox="0 0 928 240" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Land Background */}
        <rect width="928" height="240" fill="#F4F3F0" />
        
        {/* Green Parks */}
        <path d="M 0 0 L 180 0 L 150 90 L 0 60 Z" fill="#D9F1D6" />
        <path d="M 780 0 L 928 0 L 928 140 L 810 120 Z" fill="#D9F1D6" />
        <path d="M 380 150 L 490 140 L 510 240 L 350 240 Z" fill="#D9F1D6" />
        
        {/* Water body */}
        <path d="M 850 240 L 928 210 L 928 240 Z" fill="#C4E0E5" />

        {/* Roads/Streets grid */}
        {/* Baner-Aundh Rd */}
        <path d="M -20 200 L 950 -20" stroke="#FFFFFF" strokeWidth="24" strokeLinecap="round" />
        <path d="M -20 200 L 950 -20" stroke="#FCE8B2" strokeWidth="12" strokeLinecap="round" />

        {/* Seasons Rd */}
        <path d="M 350 -20 L 520 260" stroke="#FFFFFF" strokeWidth="18" strokeLinecap="round" />
        <path d="M 350 -20 L 520 260" stroke="#EAEAE6" strokeWidth="8" strokeLinecap="round" />

        {/* Diagonal side street */}
        <path d="M 120 0 L 460 220" stroke="#FFFFFF" strokeWidth="14" strokeLinecap="round" />
        <path d="M 120 0 L 460 220" stroke="#EAEAE6" strokeWidth="6" strokeLinecap="round" />

        {/* Other side street */}
        <path d="M 460 60 L 950 130" stroke="#FFFFFF" strokeWidth="14" strokeLinecap="round" />
        <path d="M 460 60 L 950 130" stroke="#EAEAE6" strokeWidth="6" strokeLinecap="round" />

        {/* Address texts and points */}
        {/* The Tenth Floor */}
        <circle cx="390" cy="60" r="4" fill="#F09A37" />
        <text x="400" y="63" fill="#F09A37" fontSize="10" fontWeight="bold" fontFamily="Poppins">The Tenth Floor</text>
        <text x="400" y="73" fill="#F09A37" fontSize="8" fontFamily="Poppins">द टेंथ फ्लोर</text>

        {/* Seasons Rd label */}
        <text x="580" y="100" fill="#888888" fontSize="9" fontFamily="Poppins" transform="rotate(7, 580, 100)">Seasons Rd</text>

        {/* Baner-Aundh Rd label */}
        <text x="420" y="180" fill="#888888" fontSize="9" fontFamily="Poppins" transform="rotate(-12, 420, 180)">Baner-Aundh Rd</text>

        {/* Artizen Cafe */}
        <circle cx="250" cy="140" r="4" fill="#F09A37" />
        <text x="260" y="143" fill="#F09A37" fontSize="9" fontWeight="bold" fontFamily="Poppins">Artizen-Cafe</text>
        <text x="260" y="153" fill="#F09A37" fontSize="8" fontFamily="Poppins">Art | Studio</text>
      </svg>

      {/* Red Marker Pin */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
        <Icon icon="solar:map-point-wave-bold" className="w-8 h-8 text-rose-500 animate-bounce" />
        <div className="w-2.5 h-1 bg-black/25 rounded-full blur-[1px] -mt-1" />
      </div>

      {/* Watermark logo */}
      <div className="absolute bottom-2 left-2 px-2 py-0.5 bg-white/70 backdrop-blur-[1px] rounded text-[8px] font-bold text-gray-400 font-['Poppins']">
        Google
      </div>
    </div>
  );
};

export const JobDetailPage: React.FC<JobDetailPageProps> = ({ jobId }) => {
  const { 
    job, 
    isLoading, 
    toggleSave, 
    applyToJob, 
    withdrawJob, 
    respondToOffer, 
    toggleFollow 
  } = useJobDetail(jobId);
  const { goBack } = useSmartBack();
  const [showFullDesc, setShowFullDesc] = useState(false);
  const [avatarError, setAvatarError] = useState(false);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [showWithdrawConfirm, setShowWithdrawConfirm] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showDeclineConfirm, setShowDeclineConfirm] = useState(false);

  React.useEffect(() => {
    sessionStorage.setItem('coming_from_job_detail', 'true');
    window.scrollTo(0, 0);
  }, [jobId]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-white">
        <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-500 rounded-full animate-spin" />
        <p className="text-gray-500 text-sm font-['Poppins']">Loading job details...</p>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen flex flex-col gap-4 bg-white ">
        <div className="w-16 h-16 rounded-full bg-rose-50 flex items-center justify-center text-rose-500 shadow-sm">
          <Icon icon="lucide:alert-circle" className="w-8 h-8" />
        </div>
        <h2 className="text-black text-xl font-bold font-['Poppins']">Job Not Found</h2>
        <p className="text-gray-500 text-sm font-['Poppins'] max-w-sm">
          The job listing you are looking for does not exist or may have been filled or expired.
        </p>
        <button
          onClick={() => goBack('/jobs')}
          className="mt-2 px-6 py-2.5 bg-[#6366F1] hover:bg-[#6366F1]/90 text-white rounded-3xl text-sm font-semibold font-['Poppins'] transition-all flex items-center gap-2"
        >
          <Icon icon="lucide:arrow-left" className="w-4 h-4" />
          <span>Back to Jobs</span>
        </button>
      </div>
    );
  }

  const steps = ['Applied', 'In review', 'Shortlisted', 'Declined'];
  const currentStatus = job.application_status || 'Applied';
  const currentStepIndex = steps.indexOf(currentStatus) !== -1 ? steps.indexOf(currentStatus) : 0;

  return (
    <div className="relative w-full bg-white flex justify-center">
      <div className="flex flex-col items-center py-0 gap-6 relative w-[960px] bg-white pb-8">
        
        {/* Header chevron and Title block */}
        <div className="w-[960px] h-[48px] self-stretch flex flex-row items-start p-0 gap-[16px]">
          <button
            onClick={() => goBack('/jobs')}
            className="w-12 h-12 box-border p-2 rounded-[100px] border border-[#DADADA] backdrop-blur-[12px] flex flex-row justify-center items-center gap-2.5 hover:bg-slate-50 transition-colors active:scale-95"
          >
            <Icon icon="lucide:chevron-left" className="w-6 h-6 text-gray-500" />
          </button>
          <div className="flex flex-col items-start p-0 w-[260px] h-[42px] gap-0">
            <div className="text-left text-[#000000] text-[18px] font-medium font-['Poppins'] leading-[26px]">Job details</div>
            <div className="text-left text-[#6B7280] text-[12px] font-normal font-['Poppins'] leading-[16px]">Review the role, requirements, and benefits.</div>
          </div>
        </div>

        {/* Content body wrapper */}
        <div className="self-stretch p-4 flex flex-col justify-start items-start gap-6 w-[960px]">
          
          {/* Active indicator and Job title card */}
          <div className="w-[928px] h-[152px] self-stretch flex flex-col justify-center items-start p-0 gap-4">
            <div className="w-full flex flex-row justify-between items-center">
              {job.is_closed ? (
                <div className="box-border flex flex-row justify-center items-center px-4 py-2 gap-[10px] w-[74px] h-8 bg-[#FEF3C7] border border-[#FBBF24] rounded-[24px] flex-none order-0 flex-grow-0">
                  <span className="w-[42px] h-4 font-['Poppins'] font-normal text-[12px] leading-[16px] text-center text-[#FBBF24] flex-none order-0 flex-grow-0">Closed</span>
                </div>
              ) : (
                <div className="box-border flex flex-row justify-center items-center px-4 py-2 gap-[10px] w-[74px] h-8 bg-[#EEF2FF] border border-[#6366F1] rounded-[24px] flex-none order-0 flex-grow-0">
                  <span className="w-[42px] h-4 font-['Poppins'] font-normal text-[12px] leading-[16px] text-center text-[#6366F1] flex-none order-0 flex-grow-0">Active</span>
                </div>
              )}

              {/* Offer timeline indicator */}
              {job.is_offer && job.offer_days_left !== undefined && (
                <div className="flex flex-row items-center gap-2 h-8">
                  {/* Calendar icon from page details card */}
                  <Icon 
                    icon="solar:calendar-linear" 
                    className="w-6 h-6 flex-shrink-0" 
                    style={{ color: job.offer_days_left <= 5 ? '#FF8D28' : job.offer_days_left <= 15 ? '#FBBF24' : '#6B7280' }} 
                  />
                  <span 
                    className="font-['Poppins'] font-normal text-sm leading-5 text-center py-1.5"
                    style={{ color: job.offer_days_left <= 5 ? '#FF8D28' : job.offer_days_left <= 15 ? '#FBBF24' : '#6B7280' }}
                  >
                    Offer ends in {job.offer_days_left} {job.offer_days_left === 1 ? 'day' : 'days'}
                  </span>
                </div>
              )}
            </div>
            <div className="w-[928px] h-[56px] self-stretch text-[#000000] text-[32px] font-semibold font-['Poppins'] leading-[56px]">{job.title}</div>
            <div className="w-[928px] h-8 self-stretch flex flex-row items-center p-0 gap-2">
              {job.company_logo === 'sphere' ? (
                <div className="w-8 h-8 bg-slate-100 rounded-full flex justify-center items-center overflow-hidden flex-shrink-0">
                  <div className="w-4 h-4 rounded-full bg-gradient-to-br from-indigo-300 to-indigo-500 shadow-sm" />
                </div>
              ) : (job.company_logo || job.recruiter_avatar) && !avatarError ? (
                <img
                  className="w-8 h-8 rounded-full object-cover"
                  src={job.company_logo || job.recruiter_avatar || "/assets/profilephoto.png"}
                  onError={() => setAvatarError(true)}
                  alt="Company Logo"
                />
              ) : (
                <div className="w-8 h-8 bg-indigo-50 rounded-full flex justify-center items-center flex-shrink-0">
                  <Icon icon="hugeicons:job-search" className="w-4 h-4 text-indigo-500" />
                </div>
              )}
              <span className="text-[#6B7280] text-[12px] font-normal font-['Poppins'] leading-[16px] w-[59px] h-[16px] text-center">Posted by</span>
              <div className="text-[#000000] text-[14px] font-semibold font-['Poppins'] leading-[20px] w-[105px] h-[20px] text-center truncate">{job.company}</div>
            </div>
          </div>

          {/* Job Specifications specifications card */}
          <div className="w-[928px] self-stretch p-4 bg-white rounded-3xl outline outline-1 outline-offset-[-1px] outline-indigo-50 flex flex-row gap-4">
            {/* Experience Column */}
            <div className="flex-grow flex flex-col justify-center items-start p-0 gap-2 w-[212px] h-[52px]">
              <div className="flex flex-row items-center p-0 gap-2 h-5">
                <Icon icon="hugeicons:job-search" className="w-5 h-5 text-gray-500" />
                <div className="justify-start text-[#6B7280] text-[12px] font-normal font-['Poppins'] uppercase leading-[16px]">Experience</div>
              </div>
              <div className="justify-start text-[#000000] text-[16px] font-normal font-['Poppins'] leading-[24px]">{job.experience || '0-2 Yrs'}</div>
            </div>

            {/* Work Mode Column */}
            <div className="flex-grow flex flex-col justify-center items-start p-0 gap-2 w-[212px] h-[52px]">
              <div className="flex flex-row items-center p-0 gap-2 h-5">
                <Icon icon="hugeicons:location-05" className="w-5 h-5 text-gray-500" />
                <div className="justify-start text-[#6B7280] text-[12px] font-normal font-['Poppins'] uppercase leading-[16px]">work mode</div>
              </div>
              <div className="justify-start text-[#000000] text-[16px] font-normal font-['Poppins'] leading-[24px]">{job.work_mode || 'Hybrid'}</div>
            </div>

            {/* Work Type Column */}
            <div className="flex-grow flex flex-col justify-center items-start p-0 gap-2 w-[212px] h-[52px]">
              <div className="flex flex-row items-center p-0 gap-2 h-5">
                <Icon icon="solar:calendar-linear" className="w-5 h-5 text-gray-500" />
                <div className="text-center justify-start text-[#6B7280] text-[12px] font-normal font-['Poppins'] uppercase leading-[16px]">Work type</div>
              </div>
              <div className="text-center justify-start text-[#000000] text-[16px] font-normal font-['Poppins'] leading-[24px]">{job.job_type || 'Full Time'}</div>
            </div>

            {/* Salary Column */}
            <div className="flex-grow flex flex-col justify-center items-start p-0 gap-2 w-[212px] h-[52px]">
              <div className="flex flex-row items-center p-0 gap-2 h-5">
                <Icon icon="hugeicons:money-bag-02" className="w-5 h-5 text-gray-500" />
                <div className="text-center justify-start text-[#6B7280] text-[12px] font-normal font-['Poppins'] uppercase leading-[16px]">salary</div>
              </div>
              <div className="text-center justify-start text-[#000000] text-[16px] font-normal font-['Poppins'] leading-[24px]">{job.salary_display || '$160k - $210k'}</div>
            </div>
          </div>

          {/* AI Matching strength bar */}
          <div className="w-[928px] h-[44px] py-[12px] px-[16px] bg-[#F9FAFF] rounded-[12px] self-stretch flex flex-row items-center gap-[10px]">
            <img src="/assets/AI 2.svg" className="w-5 h-5 flex-shrink-0" alt="AI Icon" />
            <div className="w-[866px] h-5 flex-1 flex items-center text-[#6366F1] text-[14px] font-normal font-['Poppins'] leading-5">
              You&apos;re stronger than 90% of applicants for this job based on your profile and skills
            </div>
          </div>

          {/* Recruiter Note for Offers, Application Status, or Company Analytics Box */}
          {job.is_offer ? (
            job.recruiter_message ? (
              <div className="box-border w-[928px] max-w-full min-h-[104px] bg-[#F9FAFF] border-l-2 border-l-[#6366F1] rounded-tr-[16px] rounded-br-[16px] rounded-bl-[16px] rounded-tl-none py-3 px-4 flex flex-col justify-start items-start gap-2 self-stretch">
                {/* Recruiter Info Row */}
                <div className="flex flex-row justify-start items-center p-0 gap-2 h-10 w-full">
                  {job.recruiter_avatar ? (
                    <img
                      src={job.recruiter_avatar}
                      className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                      alt={job.recruiter_name || 'Recruiter'}
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-[#6366F1] flex-shrink-0">
                      <Icon icon="solar:user-bold" className="w-5 h-5" />
                    </div>
                  )}
                  <div className="flex flex-col justify-center items-start gap-1">
                    {job.recruiter_name && (
                      <div className="text-left font-['Poppins'] font-normal text-[12px] leading-[16px] text-[#6366F1] uppercase">
                        {job.recruiter_name}
                      </div>
                    )}
                    {job.recruiter_title && (
                      <div className="text-left font-['Poppins'] font-normal text-[12px] leading-[16px] text-[#6366F1] uppercase">
                        {job.recruiter_title}
                      </div>
                    )}
                  </div>
                </div>

                {/* Message text row */}
                <div className="w-[896px] max-w-full text-left font-['Poppins'] font-normal text-[12px] leading-[16px] text-[#6B7280]">
                  &ldquo;{job.recruiter_message}&rdquo;
                </div>
              </div>
            ) : null
          ) : job.is_applied ? (
            <div className="box-border w-[928px] h-[108px] bg-[#FFFFFF] border border-[#EEF2FF] rounded-[28px] self-stretch p-4 flex flex-col items-start gap-4">
              <div className="text-left text-[#000000] text-[16px] font-medium font-['Poppins'] leading-6 w-[147px] h-6 flex-none order-0 flex-grow-0">
                Application status
              </div>
              <div className="w-[896px] h-[36px] flex flex-row items-center p-0 self-stretch flex-none order-1 flex-grow-0">
                {steps.map((step, idx) => {
                  const isCompleted = idx < currentStepIndex;
                  const isCurrent = idx === currentStepIndex;

                  let circleClass = '';
                  let textClass = '';

                  if (step === 'Declined' && isCurrent) {
                    circleClass = 'bg-transparent border border-[#EF4444]';
                    textClass = 'text-[#EF4444]';
                  } else if (isCompleted) {
                    circleClass = 'bg-[#6366F1] border border-[#6366F1]';
                    textClass = 'text-[#6366F1]';
                  } else if (isCurrent) {
                    circleClass = 'bg-transparent border border-[#6366F1]';
                    textClass = 'text-[#6366F1]';
                  } else {
                    circleClass = 'bg-transparent border border-[#DADADA]';
                    textClass = 'text-[#6B7280]';
                  }

                  return (
                    <React.Fragment key={step}>
                      {/* Step Frame */}
                      <div className="box-border flex flex-row items-center py-2 px-4 gap-[10px] w-[179px] h-9 rounded-[24px] flex-none flex-grow">
                        <div className={`box-border w-4 h-4 rounded-full flex-none ${circleClass}`} />
                        <span className={`w-fit h-5 font-['Poppins'] font-normal text-sm leading-5 text-center ${textClass}`}>
                          {step}
                        </span>
                      </div>

                      {/* Connector Line */}
                      {idx < steps.length - 1 && (
                        <div
                          className={`w-[60px] h-[1px] self-center flex-none ${
                            idx < currentStepIndex ? 'bg-[#6366F1]' : 'bg-[#DADADA]'
                          }`}
                        />
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="box-border w-[928px] bg-[#FFFFFF] border border-[#EEF2FF] rounded-[28px] self-stretch p-4 flex flex-col items-start gap-4">
              <div className="text-left text-[#000000] text-[16px] font-medium font-['Poppins'] leading-6 w-[159px] h-6">Company analytics</div>
              
              {!job.response_rate || !job.avg_reply ? (
                <div className="flex flex-col items-start p-0 gap-4 w-[896px]">
                  <div className="flex flex-row items-center p-0 gap-2 w-fit h-5 flex-none order-0 flex-grow-0">
                    <Icon icon="proicons:info" className="w-5 h-5 text-[#FBBF24] flex-none order-0 flex-grow-0" />
                    <span className="w-[192px] h-5 font-['Poppins'] font-normal text-sm leading-5 flex items-center text-[#FBBF24] flex-none order-1 flex-grow-0">
                      Response data unavailable
                    </span>
                  </div>
                  <div className="w-[896px] h-5 font-['Poppins'] font-normal text-sm leading-5 flex items-center text-[#6B7280] flex-none order-2 self-stretch flex-grow-0">
                    We don&apos;t have enough application data to calculate this company&apos;s response or reply rate yet.
                  </div>
                </div>
              ) : (
                <>
                  {/* Stats/analytics row */}
                  <div className="w-[896px] h-[73px] flex flex-row items-start py-2 gap-[340px]">
                    {/* Response Rate Column */}
                    <div className="box-border flex flex-col items-start pb-3 gap-2 w-[108px] h-[73px] border-b-2 border-[#22C55E]">
                      <div className="text-[#6B7280] text-[10px] font-semibold uppercase tracking-wider font-['Poppins'] leading-[14px]">RESPONSE RATE</div>
                      <div className="text-[#000000] text-[24px] font-bold font-['Poppins'] leading-8">{job.response_rate}</div>
                    </div>

                    {/* Avg Reply Column */}
                    <div className="flex flex-col items-start gap-1 h-[73px]">
                      <div className="text-[#6B7280] text-[10px] font-semibold uppercase tracking-wider font-['Poppins'] leading-[14px]">AVG. REPLY</div>
                      <div className="text-[#000000] text-[24px] font-bold font-['Poppins'] leading-8">{job.avg_reply}</div>
                      <div className="text-[#6366F1] text-[10px] font-medium font-['Poppins'] leading-[14px]">Very fast</div>
                    </div>
                  </div>

                  {/* Footer text */}
                  <div className="w-[336px] h-[48px] text-left text-[#6B7280] text-[14px] font-normal font-['Poppins'] leading-[20px]">
                    {job.company} usually views applications within 24 hours of submission.
                  </div>
                </>
              )}
            </div>
          )}

          {/* Description Section */}
          <div className="w-[928px] self-stretch flex flex-col items-start p-0 gap-4">
            <div className="text-left text-[#000000] text-[18px] font-medium font-['Poppins'] leading-[26px]">Description</div>
            <div className="self-stretch flex-1 justify-start">
              <span className="text-[#000000] text-[16px] font-normal font-['Poppins'] leading-[24px]">
                {job.description}
                <br />
                {job.requirements && job.requirements.length > 0 && (
                  <>
                    <br />
                    Key Responsibilities
                    <br />
                  </>
                )}
              </span>
              <span className="text-[#000000] text-[16px] font-normal font-['Poppins'] leading-[24px]">
                {job.requirements && job.requirements.map((req, i) => (
                  <span key={i} className="block">
                    • {req}
                  </span>
                ))}
              </span>
            </div>
            
            <button
              onClick={() => setShowFullDesc(!showFullDesc)}
              className="text-center justify-start text-indigo-500 text-sm font-normal font-['Poppins'] leading-5 hover:underline"
            >
              {showFullDesc ? 'See less' : 'See more'}
            </button>
          </div>

          {/* Map Location Section */}
          <div className="self-stretch flex flex-col justify-start items-start gap-4 mt-4 w-full">
            <div className="self-stretch h-60 rounded-3xl border-4 border-indigo-50 overflow-hidden relative w-full">
              <JobDetailMap />
            </div>
            
            <div className="self-stretch inline-flex justify-start items-center gap-2">
              <Icon icon="solar:map-point-linear" className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1 justify-start text-gray-500 text-sm font-normal font-['Poppins'] leading-5">
                Office No 301, Tawades Govind Excellency, 6th Ln, behind Bus Stop, above Canon Image Square, Poorvarang, Mahalaxminagar, Rajarampuri, Kolhapur, Maharashtra 416008
              </div>
            </div>
          </div>

        </div>

        {/* Bottom Floating Bar */}
        <div className="sticky bottom-6 z-50 self-stretch p-4 bg-white rounded-3xl shadow-[0px_2px_4px_0px_rgba(99,102,241,0.05)] outline outline-1 outline-offset-[-1px] outline-indigo-50 inline-flex justify-start items-center gap-4">
          <div className="flex-1 inline-flex flex-col justify-center items-start">
            <div className="text-center justify-start text-black text-lg font-medium font-['Poppins'] leading-6">{job.title}</div>
            <div className="self-stretch inline-flex justify-start items-center gap-2">
              <div className="justify-start text-gray-500 text-xs font-normal font-['Poppins'] leading-4 line-clamp-6">{job.company}</div>
              <div className="size-1.5 bg-gray-500 rounded-full" />
              <div className="justify-start text-gray-500 text-xs font-normal font-['Poppins'] leading-4 line-clamp-6">{job.location}</div>
            </div>
          </div>
          {!job.is_offer && (
            <div className="flex justify-start items-center gap-4">
              {/* Share button */}
              <button
                onClick={() => setShowShareModal(true)}
                className="size-6 text-black hover:text-indigo-500 transition-colors flex items-center justify-center"
              >
                <Icon icon="solar:share-linear" className="w-5 h-5" />
              </button>
              {/* Bookmark button */}
              <button
                onClick={toggleSave}
                className="size-6 transition-colors flex items-center justify-center"
              >
                <Icon
                  icon={job.is_saved ? 'solar:bookmark-bold' : 'solar:bookmark-linear'}
                  className={`w-5 h-5 ${job.is_saved ? 'text-[#6366F1]' : 'text-black hover:text-indigo-500'}`}
                />
              </button>
            </div>
          )}
          {/* Action buttons section */}
          <div className="flex justify-start items-center gap-3">
            {job.is_closed ? (
              /* Closed Job -> Follow / Unfollow button */
              <button
                onClick={toggleFollow}
                className="box-border flex flex-row justify-center items-center px-4 py-2 gap-[10px] w-[160px] h-10 bg-[#6366F1] border border-white rounded-[24px] transition-all active:scale-95 cursor-pointer"
              >
                <span className="w-fit h-5 font-['Poppins'] font-normal text-sm leading-[20px] text-center text-white">
                  {job.is_followed ? 'Unfollow' : 'Follow'}
                </span>
              </button>
            ) : job.is_offer ? (
              /* Offer state */
              job.application_status === 'Accepted' ? (
                /* Accepted -> Chat */
                <button
                  onClick={() => toast.success('Starting chat with recruiter...')}
                  className="box-border flex flex-row justify-center items-center px-4 py-2 gap-[10px] w-[140px] h-10 bg-[#6366F1] border border-white rounded-[24px] transition-all active:scale-95 cursor-pointer"
                >
                  <span className="w-[68px] h-5 font-['Poppins'] font-normal text-sm leading-[20px] text-center text-white">Chat now</span>
                </button>
              ) : job.application_status === 'Declined' ? (
                /* Declined -> Offer declined */
                <div className="box-border flex flex-row justify-center items-center px-4 py-2 gap-[10px] w-[140px] h-10 rounded-[24px]">
                  <span className="w-[99px] h-5 font-['Poppins'] font-normal text-sm leading-[20px] text-center text-[#6B7280]">
                    Offer declined
                  </span>
                </div>
              ) : (
                /* Pending -> Accept & Decline buttons */
                <div className="flex flex-row items-center p-0 gap-2 w-[288px] h-10">
                  <button
                    onClick={() => setShowDeclineConfirm(true)}
                    className="box-border flex flex-row justify-center items-center px-4 py-2 gap-[10px] w-[140px] h-10 bg-white border border-[#818CF8] rounded-[24px] transition-all active:scale-95 cursor-pointer"
                  >
                    <span className="w-[52px] h-5 font-['Poppins'] font-normal text-sm leading-[20px] text-center text-[#818CF8]">Decline</span>
                  </button>
                  <button
                    onClick={() => respondToOffer('accept')}
                    className="box-border flex flex-row justify-center items-center px-4 py-2 gap-[10px] w-[140px] h-10 bg-[#6366F1] border border-white rounded-[24px] transition-all active:scale-95 cursor-pointer"
                  >
                    <span className="w-[50px] h-5 font-['Poppins'] font-normal text-sm leading-[20px] text-center text-white">Accept</span>
                  </button>
                </div>
              )
            ) : (
              /* Normal Job State -> Apply / Withdraw */
              <button
                onClick={job.is_applied ? () => setShowWithdrawConfirm(true) : () => setShowApplyModal(true)}
                className={job.is_applied
                  ? "w-40 h-10 px-4 py-2 rounded-[100px] border border-[#6B7280] text-[#6B7280] bg-white hover:bg-slate-50 flex justify-center items-center transition-all active:scale-95 text-sm font-normal font-['Poppins'] leading-5"
                  : "w-40 h-10 px-4 py-2 rounded-[100px] bg-[#6366F1] hover:bg-[#6366F1]/90 text-white flex justify-center items-center transition-all active:scale-95 shadow-md text-sm font-normal font-['Poppins'] leading-5"
                }
              >
                {job.is_applied ? 'Withdraw' : 'Apply'}
              </button>
            )}
          </div>
        </div>

        {/* Apply Job Modal */}
        <ApplyJobModal
          isOpen={showApplyModal}
          onClose={() => setShowApplyModal(false)}
          onApply={(resumeUrl, uploadedFile, resumeId, coverLetter) => {
            applyToJob(resumeUrl, uploadedFile, resumeId, coverLetter);
            setShowApplyModal(false);
          }}
          jobTitle={job.title}
          recentResumes={[
            { id: '1', name: 'xyz.pdf', url: '#', type: 'PDF' },
            { id: '2', name: 'UIV.CV', url: '#', type: 'Document' }
          ]}
        />

        {/* Withdraw Confirmation Modal */}
        <CocpitConfirmBox
          isOpen={showWithdrawConfirm}
          title="Are you sure you want to withdraw your application?"
          message="This cannot be undone"
          confirmText="Withdraw"
          cancelText="Cancel"
          onConfirm={() => {
            withdrawJob();
            setShowWithdrawConfirm(false);
          }}
          onCancel={() => setShowWithdrawConfirm(false)}
        />

        {/* Share Modal */}
        <CocpitShareModel
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
        />

        {/* Decline Offer Confirmation Modal */}
        <CocpitConfirmBox
          isOpen={showDeclineConfirm}
          title="Are you sure you want to decline this offer?"
          message="This cannot be undone"
          confirmText="Decline"
          cancelText="Cancel"
          onConfirm={() => {
            respondToOffer('decline');
            setShowDeclineConfirm(false);
          }}
          onCancel={() => setShowDeclineConfirm(false)}
        />

      </div>
    </div>
  );
};

export default JobDetailPage;
