import React, { useState } from 'react';
import { JobListing } from '../../types/jobs.types';
import { Icon } from '@iconify/react';
import { toast } from 'sonner';

interface SendOfferTabProps {
  listings: JobListing[];
}

interface SentOfferGroup {
  id: string;
  title: string;
  company: string;
  sentCount: number;
  acceptedCount: number;
  pendingCount: number;
}

export const SendOfferTab: React.FC<SendOfferTabProps> = ({ listings }) => {
  const [view, setView] = useState<'dashboard' | 'form'>('dashboard');
  
  // Dashboard state
  const [sentOffers, setSentOffers] = useState<SentOfferGroup[]>([
    { id: 'so-1', title: 'UI/UX Designer', company: 'Coreloom Technologies', sentCount: 3, acceptedCount: 2, pendingCount: 1 },
    { id: 'so-2', title: 'Jr. UI designer', company: 'Coreloom Technologies', sentCount: 10, acceptedCount: 5, pendingCount: 5 },
    { id: 'so-3', title: 'Sr. UI/UX Designer', company: 'Coreloom Technologies', sentCount: 1, acceptedCount: 0, pendingCount: 1 }
  ]);

  // Form states
  const [candidateName, setCandidateName] = useState('');
  const [candidateEmail, setCandidateEmail] = useState('');
  const [selectedJobId, setSelectedJobId] = useState('');
  const [message, setMessage] = useState('');
  const [salary, setSalary] = useState('');
  const [expiry, setExpiry] = useState('7 days');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const activeListings = listings.filter(item => item.status.toUpperCase() === 'ACTIVE');

  // Compute stats
  const totalOffersSent = sentOffers.length; // 3 unique job positions have offers sent
  const totalAccepted = sentOffers.reduce((sum, item) => sum + item.acceptedCount, 0); // 2 + 5 + 0 = 7 accepted

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!candidateName.trim() || !candidateEmail.trim() || !selectedJobId) {
      toast.error('Please fill in all required fields.');
      return;
    }

    setIsSubmitting(true);

    // Find the job title from listings prop
    const selectedJob = listings.find(l => l.id === selectedJobId);
    const jobTitle = selectedJob ? selectedJob.title : 'Custom Position';

    // Simulate sending offer via API
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSuccess(true);
      toast.success(`Offer sent to ${candidateName}!`);

      // Update the sent offers tracking list
      setSentOffers(prev => {
        const existingIndex = prev.findIndex(item => item.title.toLowerCase() === jobTitle.toLowerCase());
        if (existingIndex > -1) {
          const updated = [...prev];
          updated[existingIndex] = {
            ...updated[existingIndex],
            sentCount: updated[existingIndex].sentCount + 1,
            pendingCount: updated[existingIndex].pendingCount + 1
          };
          return updated;
        } else {
          return [
            ...prev,
            {
              id: `so-${Date.now()}`,
              title: jobTitle,
              company: 'Coreloom Technologies',
              sentCount: 1,
              acceptedCount: 0,
              pendingCount: 1
            }
          ];
        }
      });
    }, 1200);
  };

  const handleReset = () => {
    setCandidateName('');
    setCandidateEmail('');
    setSelectedJobId('');
    setMessage('');
    setSalary('');
    setExpiry('7 days');
    setIsSuccess(false);
    setView('dashboard');
  };

  if (view === 'form') {
    if (isSuccess) {
      return (
        <div className="w-full py-12 flex flex-col items-center justify-center gap-6 animate-in zoom-in-95 duration-300 text-center">
          <div className="w-20 h-20 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-500 shadow-md">
            <Icon icon="solar:check-circle-bold" className="w-12 h-12" />
          </div>
          <div className="flex flex-col gap-2 max-w-sm">
            <h3 className="text-black text-xl font-bold font-['Poppins']">Offer Sent Successfully!</h3>
            <p className="text-gray-500 text-sm font-['Poppins']">
              An official offer letter for the position has been sent to <strong>{candidateName}</strong> ({candidateEmail}).
            </p>
          </div>
          <button
            onClick={handleReset}
            className="mt-2 px-6 py-2.5 bg-[#6366F1] hover:bg-[#6366F1]/90 text-white rounded-[24px] text-sm font-semibold font-['Poppins'] transition-all shadow-sm active:scale-95"
          >
            Back to Sent Offers
          </button>
        </div>
      );
    }

    return (
      <div className="w-full flex flex-col gap-6 animate-in fade-in duration-300">
        <div className="flex items-center gap-3 pb-2 border-b border-indigo-50/50">
          <button
            type="button"
            onClick={() => setView('dashboard')}
            className="p-1 hover:bg-slate-100 rounded-full transition-colors"
          >
            <Icon icon="lucide:arrow-left" className="w-5 h-5 text-gray-500" />
          </button>
          <div className="flex flex-col">
            <h3 className="text-black text-lg font-bold font-['Poppins']">Send Official Offer</h3>
            <span className="text-gray-400 text-xs font-normal font-['Poppins']">
              Configure and send an official job offer to a candidate's email.
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5 max-w-lg">
          {/* Candidate Name */}
          <div className="flex flex-col gap-1.5">
            <label className="text-gray-700 text-xs font-bold font-['Poppins'] uppercase tracking-wider">
              Candidate Name *
            </label>
            <input
              type="text"
              required
              value={candidateName}
              onChange={(e) => setCandidateName(e.target.value)}
              placeholder="e.g. John Doe"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-black text-sm font-medium font-['Poppins'] focus:outline-none focus:border-indigo-400 transition-colors"
            />
          </div>

          {/* Candidate Email */}
          <div className="flex flex-col gap-1.5">
            <label className="text-gray-700 text-xs font-bold font-['Poppins'] uppercase tracking-wider">
              Candidate Email *
            </label>
            <input
              type="email"
              required
              value={candidateEmail}
              onChange={(e) => setCandidateEmail(e.target.value)}
              placeholder="e.g. john.doe@example.com"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-black text-sm font-medium font-['Poppins'] focus:outline-none focus:border-indigo-400 transition-colors"
            />
          </div>

          {/* Job Position dropdown */}
          <div className="flex flex-col gap-1.5">
            <label className="text-gray-700 text-xs font-bold font-['Poppins'] uppercase tracking-wider">
              Select Job Listing *
            </label>
            <select
              required
              value={selectedJobId}
              onChange={(e) => setSelectedJobId(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-black text-sm font-medium font-['Poppins'] focus:outline-none focus:border-indigo-400 transition-colors appearance-none cursor-pointer"
            >
              <option value="" disabled>-- Select an Active Job Listing --</option>
              {activeListings.map((job) => (
                <option key={job.id} value={job.id}>
                  {job.title}
                </option>
              ))}
              {activeListings.length === 0 && (
                <option value="" disabled>No active listings available. Please create one first.</option>
              )}
            </select>
          </div>

          {/* Salary */}
          <div className="flex flex-col gap-1.5">
            <label className="text-gray-700 text-xs font-bold font-['Poppins'] uppercase tracking-wider">
              Salary Package (Annual)
            </label>
            <input
              type="text"
              value={salary}
              onChange={(e) => setSalary(e.target.value)}
              placeholder="e.g. $120,000"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-black text-sm font-medium font-['Poppins'] focus:outline-none focus:border-indigo-400 transition-colors"
            />
          </div>

          {/* Expiry Duration */}
          <div className="flex flex-col gap-1.5">
            <label className="text-gray-700 text-xs font-bold font-['Poppins'] uppercase tracking-wider">
              Offer Expiry Period
            </label>
            <select
              value={expiry}
              onChange={(e) => setExpiry(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-black text-sm font-medium font-['Poppins'] focus:outline-none focus:border-indigo-400 transition-colors cursor-pointer"
            >
              <option value="3 days">3 Days</option>
              <option value="7 days">7 Days (Recommended)</option>
              <option value="14 days">14 Days</option>
              <option value="30 days">30 Days</option>
            </select>
          </div>

          {/* Personal Message */}
          <div className="flex flex-col gap-1.5">
            <label className="text-gray-700 text-xs font-bold font-['Poppins'] uppercase tracking-wider">
              Personal Message (Optional)
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Introduce the role and express your excitement to work together..."
              rows={4}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-black text-sm font-medium font-['Poppins'] focus:outline-none focus:border-indigo-400 transition-colors resize-none"
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isSubmitting || activeListings.length === 0}
            className="mt-2 w-full py-3 bg-[#6366F1] hover:bg-[#6366F1]/90 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-2xl text-sm font-bold font-['Poppins'] transition-all flex items-center justify-center gap-2 shadow-md active:scale-[0.98]"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Sending Offer...</span>
              </>
            ) : (
              <>
                <Icon icon="solar:letter-send-linear" className="w-5 h-5" />
                <span>Send Offer</span>
              </>
            )}
          </button>
        </form>
      </div>
    );
  }

  // Dashboard layout matching the user's design screenshot
  return (
    <div className="w-full flex flex-col gap-6 animate-in fade-in duration-300">
      {/* Title + Action Button */}
      <div className="flex justify-between items-center pb-2 border-b border-indigo-50/50">
        <h3 className="text-black text-lg font-bold font-['Poppins']">Sent offers</h3>
        <button
          onClick={() => setView('form')}
          className="flex items-center gap-2 text-indigo-500 font-semibold text-sm hover:text-indigo-600 transition-all duration-200 active:scale-95"
        >
          <Icon icon="solar:gift-linear" className="w-5 h-5" />
          <span>Send offer</span>
        </button>
      </div>

      {/* Stats Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Card 1: Offer Sent */}
        <div className="p-6 bg-white rounded-[24px] outline outline-1 outline-indigo-50 flex flex-col justify-center items-start gap-1 shadow-[0px_4px_24px_rgba(99,102,241,0.02)]">
          <div className="text-[#6366F1] text-3xl font-semibold font-['Poppins'] leading-none">
            {totalOffersSent}
          </div>
          <div className="text-gray-500 text-xs font-normal font-['Poppins'] mt-1">Offer sent</div>
        </div>

        {/* Card 2: Accepted */}
        <div className="p-6 bg-white rounded-[24px] outline outline-1 outline-indigo-50 flex flex-col justify-center items-start gap-1 shadow-[0px_4px_24px_rgba(99,102,241,0.02)]">
          <div className="text-[#6366F1] text-3xl font-semibold font-['Poppins'] leading-none">
            {totalAccepted}
          </div>
          <div className="text-gray-500 text-xs font-normal font-['Poppins'] mt-1">Accepted</div>
        </div>
      </div>

      {/* Sent Offers List Table */}
      <div className="flex flex-col mt-4">
        {sentOffers.length === 0 ? (
          <div className="py-12 flex flex-col items-center justify-center gap-3 text-center">
            <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center border border-slate-100">
              <Icon icon="solar:gift-linear" className="w-5 h-5 text-gray-400" />
            </div>
            <h4 className="text-gray-700 text-sm font-semibold font-['Poppins']">No offers sent yet</h4>
            <p className="text-gray-400 text-xs font-['Poppins'] max-w-xs">
              Click the "Send offer" button to extend an official job offer.
            </p>
          </div>
        ) : (
          <div className="flex flex-col">
            {sentOffers.map((item) => (
              <div
                key={item.id}
                className="py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                {/* Logo + Title/Company */}
                <div className="flex flex-row items-center gap-4 flex-1 min-w-[240px]">
                  {/* Glassmorphic 3D-like circular logo representing Coreloom Technologies */}
                  <div className="w-11 h-11 rounded-full bg-gradient-to-br from-slate-200 via-slate-100 to-slate-300 flex items-center justify-center overflow-hidden border border-slate-200 shadow-sm flex-shrink-0">
                    <Icon icon="solar:globus-bold" className="w-6 h-6 text-slate-600/80" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-black text-sm font-bold font-['Poppins']">
                      {item.title}
                    </span>
                    <span className="text-gray-400 text-xs font-normal font-['Poppins']">
                      {item.company}
                    </span>
                  </div>
                </div>

                {/* Sent Count Column */}
                <div className="w-[180px] text-gray-500 text-sm font-normal font-['Poppins'] flex items-center">
                  Sent to {item.sentCount} candidate{item.sentCount !== 1 ? 's' : ''}
                </div>

                {/* Accepted Count Column */}
                <div className="w-[140px] text-slate-800 text-sm font-semibold font-['Poppins'] flex items-center">
                  {item.acceptedCount} Accepted
                </div>

                {/* Pending Count Column */}
                <div className="w-[140px] text-slate-800 text-sm font-semibold font-['Poppins'] flex items-center">
                  {item.pendingCount} Pending
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SendOfferTab;
