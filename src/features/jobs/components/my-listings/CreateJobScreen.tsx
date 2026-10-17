import React, { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';

interface CreateJobScreenProps {
  onBack: () => void;
  onSubmit: (title: string, status: string) => Promise<void>;
}

export const CreateJobScreen: React.FC<CreateJobScreenProps> = ({ onBack, onSubmit }) => {
  const [title, setTitle] = useState('');
  const [isDrafting, setIsDrafting] = useState(false);
  const [draftingStep, setDraftingStep] = useState(0);

  const steps = [
    'Analyzing technical requirements for the role...',
    'Generating matching filters and candidate parameters...',
    'Drafting description and technical questions...',
    'Finalizing and publishing active listing...'
  ];

  useEffect(() => {
    if (!isDrafting) return;

    const interval = setInterval(() => {
      setDraftingStep((prev) => {
        if (prev >= steps.length - 1) {
          clearInterval(interval);
          // Trigger form submission
          onSubmit(title, 'ACTIVE');
          return prev;
        }
        return prev + 1;
      });
    }, 850);

    return () => clearInterval(interval);
  }, [isDrafting, title, onSubmit]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setIsDrafting(true);
  };

  if (isDrafting) {
    return (
      <div className="w-full min-h-[500px] flex flex-col items-center justify-center gap-6 animate-in fade-in duration-300">
        {/* Animated AI Loader */}
        <div className="relative w-24 h-24">
          {/* Inner pulsating glow */}
          <div className="absolute inset-0 rounded-full bg-[#6366F1]/10 animate-ping" />
          {/* Orbiting spinner */}
          <div className="absolute inset-0 rounded-full border-4 border-indigo-100 border-t-[#6366F1] animate-spin" />
          {/* Center orb */}
          <div className="absolute inset-3 rounded-full bg-gradient-to-br from-[#6366F1] to-indigo-700 flex items-center justify-center shadow-lg">
            <Icon icon="solar:magic-stick-bold" className="w-8 h-8 text-white animate-pulse" />
          </div>
        </div>

        <div className="flex flex-col items-center gap-2 text-center max-w-sm px-4">
          <h3 className="text-black text-lg font-bold font-['Poppins'] animate-pulse">
            AI is drafting your job
          </h3>
          <p className="text-[#6366F1] text-xs font-semibold font-['Poppins'] transition-all duration-300 h-6">
            {steps[draftingStep]}
          </p>
          <p className="text-gray-400 text-[11px] font-['Poppins']">
            This will take just a few seconds.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col gap-8 animate-in fade-in duration-300">
      {/* Header Row */}
      <div className="flex items-center gap-4">
        <button
          onClick={onBack}
          className="w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center bg-white hover:bg-slate-50 active:scale-95 transition-all text-gray-700 shadow-sm"
        >
          <Icon icon="lucide:arrow-left" className="w-5 h-5" />
        </button>
        <div className="flex flex-col">
          <h2 className="text-black text-xl font-bold font-['Poppins'] leading-tight">Create job</h2>
          <span className="text-gray-400 text-xs font-normal font-['Poppins']">
            Tell us the role, AI will draft the rest
          </span>
        </div>
      </div>

      {/* Questionnaire Form Section */}
      <div className="w-full max-w-md mx-auto py-12 flex flex-col items-center justify-center gap-6">
        <div className="flex flex-col items-center text-center gap-1.5">
          <span className="text-gray-400 text-xs font-semibold font-['Poppins'] tracking-wide">
            Hey, Cocpit
          </span>
          <h3 className="text-black text-xl md:text-2xl font-bold font-['Poppins'] leading-tight">
            What role are you hiring for?
          </h3>
          <p className="text-gray-450 text-xs font-normal font-['Poppins'] max-w-[280px] leading-relaxed text-gray-500">
            Start by defining the position to help us find the perfect match.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">
          {/* Job Role Input field */}
          <div className="flex flex-col gap-1.5 w-full">
            <label className="text-gray-550 text-xs font-semibold font-['Poppins'] text-gray-500">
              Job Role
            </label>
            <div className="relative w-full">
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Senior Product Designer"
                className="w-full pl-4 pr-11 py-3 bg-white border border-slate-200 rounded-2xl text-black text-sm font-semibold font-['Poppins'] focus:outline-none focus:border-indigo-400 transition-colors shadow-sm"
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none">
                <Icon icon="lucide:search" className="w-4 h-4 text-gray-400" />
              </div>
            </div>
          </div>

          {/* AI Banner Tip Box */}
          <div className="w-full px-4 py-3 bg-indigo-50/50 border border-indigo-50/100 rounded-2xl flex items-center justify-center">
            <p className="text-[#6366F1] text-[10px] md:text-[11px] font-semibold font-['Poppins'] text-center leading-relaxed">
              Choosing a specific role helps our AI accurately screen candidates for technical skills.
            </p>
          </div>

          {/* Action Button */}
          <div className="w-full flex justify-center mt-2">
            <button
              type="submit"
              disabled={!title.trim()}
              className="px-12 py-3 bg-[#6366F1] hover:bg-[#6366F1]/90 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-[24px] text-sm font-bold font-['Poppins'] transition-all shadow-md active:scale-95 flex items-center justify-center gap-2"
            >
              <span>Continue</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateJobScreen;
