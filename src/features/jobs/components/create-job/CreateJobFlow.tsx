import React, { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import StepIdentityVerification from './StepIdentityVerification';
import StepRoleInput from './StepRoleInput';
import StepJobDetails from './StepJobDetails';
import StepJobPreview from './StepJobPreview';
import { JobListing } from '../../types/jobs.types';
import * as jobsService from '../../services/jobs.service';

interface CreateJobFlowProps {
  onBack: () => void;
  onSubmit: (title: string, status: string, details?: Partial<JobListing>) => Promise<void>;
  initialListing?: JobListing | null;
}

type Step = 'verification' | 'role-input' | 'ai-drafting' | 'details' | 'preview';

export const CreateJobFlow: React.FC<CreateJobFlowProps> = ({ onBack, onSubmit, initialListing }) => {
  const [step, setStep] = useState<Step>(initialListing ? 'details' : 'verification');
  const [title, setTitle] = useState(initialListing?.title || '');
  const [jobId, setJobId] = useState<string | null>(initialListing?.id || null);
  const [draftingStep, setDraftingStep] = useState(0);
  const [accumulatedDetails, setAccumulatedDetails] = useState<Partial<JobListing>>(initialListing || {});

  const draftingMessages = [
    'Analyzing technical requirements for the role...',
    'Generating matching filters and candidate parameters...',
    'Drafting description and technical questions...',
    'Finalizing job details...'
  ];

  useEffect(() => {
    if (step !== 'ai-drafting') return;

    const interval = setInterval(() => {
      setDraftingStep((prev) => {
        if (prev >= draftingMessages.length - 1) {
          clearInterval(interval);
          setStep('details');
          return prev;
        }
        return prev + 1;
      });
    }, 700);

    return () => clearInterval(interval);
  }, [step]);

  const handleRoleContinue = async () => {
    setDraftingStep(0);
    setStep('ai-drafting');
    
    // Fire the API immediately so the draft exists in the DB while they are drafting!
    try {
      const newJobId = await jobsService.initializeJobDraft(title);
      if (newJobId) {
        setJobId(newJobId);
      }
    } catch (error) {
      console.error('Failed to create initial draft', error);
    }
  };

  const handleDetailsContinue = async (details: Partial<JobListing>) => {
    setAccumulatedDetails(details);
    if (details.title) {
      setTitle(details.title);
    }
    setStep('preview');
  };

  const handleSaveDraft = async (details: Partial<JobListing>) => {
    await onSubmit(details.title || title, 'DRAFT', { ...details, id: jobId || undefined });
  };

  if (step === 'verification') {
    return (
      <StepIdentityVerification
        onBack={onBack}
        onVerifySuccess={() => setStep('role-input')}
      />
    );
  }

  if (step === 'ai-drafting') {
    return (
      <div className="w-full min-h-[500px] flex flex-col items-center justify-center gap-6 animate-in fade-in duration-300">
        {/* Animated AI Loader */}
        <div className="relative w-24 h-24">
          <div className="absolute inset-0 rounded-full bg-[#6366F1]/10 animate-ping" />
          <div className="absolute inset-0 rounded-full border-4 border-indigo-100 border-t-[#6366F1] animate-spin" />
          <div className="absolute inset-3 rounded-full bg-gradient-to-br from-[#6366F1] to-indigo-700 flex items-center justify-center shadow-lg">
            <Icon icon="solar:magic-stick-bold" className="w-8 h-8 text-white animate-pulse" />
          </div>
        </div>

        <div className="flex flex-col items-center gap-2 text-center max-w-sm px-4">
          <h3 className="text-black text-lg font-bold font-['Poppins'] animate-pulse">
            AI is drafting your job
          </h3>
          <p className="text-[#6366F1] text-xs font-semibold font-['Poppins'] transition-all duration-300 h-6">
            {draftingMessages[draftingStep]}
          </p>
          <p className="text-gray-400 text-[11px] font-['Poppins']">
            This will take just a few seconds.
          </p>
        </div>
      </div>
    );
  }

  if (step === 'details') {
    return (
      <StepJobDetails
        initialRole={title}
        initialDetails={accumulatedDetails}
        onBack={initialListing ? onBack : () => setStep('role-input')}
        onSaveDraft={handleSaveDraft}
        onContinue={handleDetailsContinue}
      />
    );
  }

  if (step === 'preview') {
    return (
      <StepJobPreview
        details={{ ...accumulatedDetails, title }}
        onBack={() => setStep('details')}
        onSaveDraft={async () => {
          await onSubmit(title, 'DRAFT', { ...accumulatedDetails, id: jobId || undefined });
        }}
        onPublish={async () => {
          await onSubmit(title, 'ACTIVE', { ...accumulatedDetails, id: jobId || undefined });
        }}
      />
    );
  }

  return (
    <StepRoleInput
      onBack={() => setStep('verification')}
      title={title}
      setTitle={setTitle}
      onContinue={handleRoleContinue}
    />
  );
};

export default CreateJobFlow;
