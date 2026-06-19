import React, { useState } from 'react';
import { useJobDetail } from '../hooks/useJobDetail';
import { Icon } from '@iconify/react';
import { useSmartBack } from '@/hooks/use-smart-back';

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
  const { job, isLoading, toggleSave, applyToJob } = useJobDetail(jobId);
  const { goBack } = useSmartBack();
  const [showFullDesc, setShowFullDesc] = useState(false);
  const [avatarError, setAvatarError] = useState(false);

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

  return (
    <div className="relative w-full min-h-[1800px] bg-white">
      <div className="flex flex-col items-center py-0 gap-6 absolute w-[960px] left-[20px] bg-white">
        
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
            <div className="box-border flex flex-row justify-center items-center px-4 py-2 gap-2.5 w-fit h-8 bg-[#EEF2FF] border border-[#6366F1] rounded-[24px]">
              <div className="text-center justify-start text-indigo-500 text-xs font-normal font-['Poppins'] leading-4">Active</div>
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
                  <Icon icon="lucide:briefcase" className="w-4 h-4 text-indigo-500" />
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
                <div className="w-5 h-5 relative overflow-hidden">
                  <div className="w-4 h-3 left-[1.67px] top-[4.58px] absolute outline outline-[1.50px] outline-offset-[-0.75px] outline-[#6B7280]" />
                  <div className="size-1.5 left-[11.67px] top-[11.62px] absolute outline outline-[1.50px] outline-offset-[-0.75px] outline-[#6B7280]" />
                  <div className="w-2 h-[2.92px] left-[5.83px] top-[1.67px] absolute outline outline-[1.50px] outline-offset-[-0.75px] outline-[#6B7280]" />
                </div>
                <div className="justify-start text-[#6B7280] text-[12px] font-normal font-['Poppins'] uppercase leading-[16px]">Experience</div>
              </div>
              <div className="justify-start text-[#000000] text-[16px] font-normal font-['Poppins'] leading-[24px]">{job.experience || '0-2 Yrs'}</div>
            </div>

            {/* Work Mode Column */}
            <div className="flex-grow flex flex-col justify-center items-start p-0 gap-2 w-[212px] h-[52px]">
              <div className="flex flex-row items-center p-0 gap-2 h-5">
                <div className="w-5 h-5 relative overflow-hidden">
                  <div className="size-1 left-[7.92px] top-[5.42px] absolute outline outline-[1.50px] outline-offset-[-0.75px] outline-[#6B7280]" />
                  <div className="w-3 h-3.5 left-[4.17px] top-[1.67px] absolute outline outline-[1.50px] outline-offset-[-0.75px] outline-[#6B7280]" />
                  <div className="w-2.5 h-[1.67px] left-[5px] top-[16.67px] absolute outline outline-[1.50px] outline-offset-[-0.75px] outline-[#6B7280]" />
                </div>
                <div className="justify-start text-[#6B7280] text-[12px] font-normal font-['Poppins'] uppercase leading-[16px]">work mode</div>
              </div>
              <div className="justify-start text-[#000000] text-[16px] font-normal font-['Poppins'] leading-[24px]">{job.work_mode || 'Hybrid'}</div>
            </div>

            {/* Work Type Column */}
            <div className="flex-grow flex flex-col justify-center items-start p-0 gap-2 w-[212px] h-[52px]">
              <div className="flex flex-row items-center p-0 gap-2 h-5">
                <div className="w-5 h-5 relative overflow-hidden">
                  <div className="w-4 h-3.5 left-[1.67px] top-[3.33px] absolute outline outline-[1.50px] outline-offset-[-0.75px] outline-[#6B7280]" />
                  <div className="w-4 h-1.5 left-[2.08px] top-[2.08px] absolute outline outline-[1.50px] outline-offset-[-0.75px] outline-[#6B7280]" />
                  <div className="w-2.5 h-[5px] left-[5px] top-[10px] absolute bg-[#6B7280]" />
                </div>
                <div className="text-center justify-start text-[#6B7280] text-[12px] font-normal font-['Poppins'] uppercase leading-[16px]">Work type</div>
              </div>
              <div className="text-center justify-start text-[#000000] text-[16px] font-normal font-['Poppins'] leading-[24px]">{job.job_type || 'Full Time'}</div>
            </div>

            {/* Salary Column */}
            <div className="flex-grow flex flex-col justify-center items-start p-0 gap-2 w-[212px] h-[52px]">
              <div className="flex flex-row items-center p-0 gap-2 h-5">
                <div className="w-5 h-5 relative overflow-hidden">
                  <div className="w-3.5 h-3 left-[2.50px] top-[5.83px] absolute outline outline-[1.50px] outline-offset-[-0.75px] outline-[#6B7280]" />
                  <div className="w-2 h-1 left-[5.83px] top-[1.67px] absolute outline outline-[1.50px] outline-offset-[-0.75px] outline-[#6B7280]" />
                  <div className="w-[3.33px] h-1.5 left-[8.21px] top-[9.16px] absolute outline outline-[1.50px] outline-offset-[-0.75px] outline-[#6B7280]" />
                </div>
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

          {/* Company Analytics Box */}
          <div className="box-border w-[928px] bg-[#FFFFFF] border border-[#EEF2FF] rounded-[28px] self-stretch p-4 flex flex-col items-start gap-4">
            <div className="text-left text-[#000000] text-[16px] font-medium font-['Poppins'] leading-6 w-[159px] h-6">Company analytics</div>
            
            {/* Stats/analytics row */}
            <div className="w-[896px] h-[73px] flex flex-row items-center py-2 gap-8">
              {/* Response Rate Column */}
              <div className="flex flex-col justify-center items-start gap-1">
                <div className="text-[#6B7280] text-[10px] font-semibold uppercase tracking-wider font-['Poppins']">Response Rate</div>
                <div className="text-[#000000] text-[24px] font-bold font-['Poppins'] leading-8">{job.response_rate || '98%'}</div>
              </div>

              {/* Divider */}
              <div className="w-[1px] h-10 bg-indigo-50" />

              {/* Avg Reply Column */}
              <div className="flex flex-col justify-center items-start gap-0.5">
                <div className="text-[#6B7280] text-[10px] font-semibold uppercase tracking-wider font-['Poppins']">Avg. Reply</div>
                <div className="text-[#000000] text-[24px] font-bold font-['Poppins'] leading-8">{job.avg_reply || '1 day'}</div>
                <div className="text-[#6366F1] text-[10px] font-medium font-['Poppins']">Very fast</div>
              </div>
            </div>

            {/* Footer text */}
            <div className="w-[336px] h-[48px] text-left text-[#6B7280] text-[14px] font-normal font-['Poppins'] leading-[20px]">
              {job.company} usually views applications within 24 hours of submission.
            </div>
          </div>

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
        <div className="self-stretch p-4 bg-white rounded-3xl shadow-[0px_2px_4px_0px_rgba(99,102,241,0.05)] outline outline-1 outline-offset-[-1px] outline-indigo-50 inline-flex justify-start items-center gap-4">
          <div className="flex-1 inline-flex flex-col justify-center items-start">
            <div className="text-center justify-start text-black text-lg font-medium font-['Poppins'] leading-6">{job.title}</div>
            <div className="self-stretch inline-flex justify-start items-center gap-2">
              <div className="justify-start text-gray-500 text-xs font-normal font-['Poppins'] leading-4 line-clamp-6">{job.company}</div>
              <div className="size-1.5 bg-gray-500 rounded-full" />
              <div className="justify-start text-gray-500 text-xs font-normal font-['Poppins'] leading-4 line-clamp-6">{job.location}</div>
            </div>
          </div>
          <div className="flex justify-start items-center gap-4">
            {/* Share button */}
            <button className="size-6 text-black hover:text-indigo-500 transition-colors flex items-center justify-center">
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
          {/* Apply Now button */}
          <button
            onClick={applyToJob}
            disabled={job.is_applied}
            className={`w-40 h-10 px-4 py-2 rounded-3xl outline outline-1 outline-offset-[-1px] outline-white flex justify-center items-center gap-2.5 transition-all active:scale-95 ${
              job.is_applied
                ? 'bg-emerald-500 text-white cursor-default'
                : 'bg-indigo-500 hover:bg-indigo-600 text-white shadow-md'
            }`}
          >
            <div className="text-center justify-start text-white text-sm font-normal font-['Poppins'] leading-5">
              {job.is_applied ? 'Applied' : 'Apply'}
            </div>
          </button>
        </div>

      </div>
    </div>
  );
};

export default JobDetailPage;
