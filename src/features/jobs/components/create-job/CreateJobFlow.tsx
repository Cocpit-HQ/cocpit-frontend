import React from 'react';
import { Icon } from '@iconify/react';
import { toast } from 'sonner';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import StepIdentityVerification from './StepIdentityVerification';
import StepRoleInput from './StepRoleInput';
import StepJobDetails from './StepJobDetails';

import { JobListing } from '../../types/jobs.types';
import * as jobsService from '../../services/jobs.service';
import { useJobStore } from '@/store/job.store';
import { useRouter } from 'next/navigation';
import { useActiveProfile } from '@/context/ActiveProfileContext';
import { useMyProfile } from '@/hooks/use-my-profile';
import { useCreateJobInit } from '../../hooks/useCreateJobInit';
import { useCreateJobUrlSync } from '../../hooks/useCreateJobUrlSync';
import { useCreateJobHydration } from '../../hooks/useCreateJobHydration';

interface CreateJobFlowProps {
  onBack: () => void;
  onSubmit: (title: string, status: string, details?: Partial<JobListing>) => Promise<void>;
  initialListing?: JobListing | null;
}

export const CreateJobFlow: React.FC<CreateJobFlowProps> = ({ onBack, onSubmit, initialListing }) => {
  const router = useRouter();
  const { activeProfile, userCompanies } = useActiveProfile();
  const { data: myProfile } = useMyProfile();

  const isUserVerified = activeProfile?.type === 'USER' && myProfile?.user?.is_identity_verified;
  
  // Bugfix ID-572: Companies can post jobs without verification
  // const isCompanyVerified = activeProfile?.type === 'COMPANY' && activeProfile?.verification_status === 'VERIFIED';
  const isCompanyVerified = activeProfile?.type === 'COMPANY';
  
  const isVerified = Boolean(isUserVerified || isCompanyVerified);

  const {
    createJobStep: step,
    setCreateJobStep: setStep,
    createJobTitle: title,
    setCreateJobTitle: setTitle,
    createJobId: jobId,
    setCreateJobId: setJobId,
    isDrafting,
    setIsDrafting,
    createJobDetails: accumulatedDetails,
    setCreateJobDetails: setAccumulatedDetails,
    resetCreateJobFlow,
  } = useJobStore();

  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);

  // Hook 1: Initialize step/title/jobId from URL params on mount
  useCreateJobInit({ initialListing, isVerified });

  // Hook 2: Hydrate store from API on refresh (details/preview steps with jobId)
  const { isHydrating } = useCreateJobHydration({ initialListing });

  // Hook 3: Sync step + title + jobId changes back to URL atomically
  useCreateJobUrlSync(step, title, jobId);

  const handleBack = () => {
    resetCreateJobFlow();
    onBack();
  };

  const handleRoleContinue = async () => {
    setIsDrafting(true);
    
    // Fire the API immediately so the draft exists in the DB while they are drafting!
    // Pass actor type/id so company drafts get org_id set correctly.
    try {
      const actorType = activeProfile?.type === 'COMPANY' ? 'ORGANIZATION' : 'USER';
      const actorId = activeProfile?.type === 'COMPANY' ? activeProfile.id : undefined;
      const newJobId = await jobsService.initializeJobDraft(title, actorType, actorId);
      if (newJobId) {
        setJobId(newJobId);
      }
    } catch (error) {
      console.error('Failed to create initial draft', error);
    } finally {
      setIsDrafting(false);
      setStep('details');
    }
  };

  const handleSaveDraft = async (details: Partial<JobListing>) => {
    await onSubmit(details.title || title, 'DRAFT', { ...details, id: jobId || undefined });
    resetCreateJobFlow();
  };

  const handlePublish = async (details: Partial<JobListing>) => {
    await onSubmit(details.title || title, 'ACTIVE', { ...details, id: jobId || undefined });
    resetCreateJobFlow();
  };

  const handleDeleteDraft = async () => {
    setShowDeleteConfirm(false);
    if (jobId) {
      const orgId = activeProfile?.type === 'COMPANY' ? activeProfile.id : undefined;
      const success = await jobsService.deleteJobListing(jobId, orgId);
      if (success) {
        toast.success("Draft deleted successfully");
      } else {
        toast.error("Failed to delete draft");
        return;
      }
    }
    resetCreateJobFlow();
    onBack();
  };

  if (step === 'verification') {
    return (
      <StepIdentityVerification
        onBack={handleBack}
        onVerifySuccess={() => setStep('role-input')}
        title={title}
      />
    );
  }

  if (step === 'details') {
    if (isHydrating) {
      return (
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-indigo-500 border-t-transparent" />
          <p className="text-sm text-gray-500 font-['Poppins']">Restoring your draft...</p>
        </div>
      );
    }
    return (
      <>
        <StepJobDetails
          jobId={jobId}
          initialRole={title}
          initialDetails={accumulatedDetails}
          onBack={initialListing ? handleBack : () => setStep('role-input')}
          onSaveDraft={handleSaveDraft}
          onPublish={handlePublish}
          onDeleteDraft={jobId ? () => setShowDeleteConfirm(true) : undefined}
        />
        <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
          <AlertDialogContent className="bg-card border-border text-foreground rounded-[24px]">
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Draft?</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this job draft? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="cursor-pointer">Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteDraft} className="bg-destructive text-destructive-foreground hover:bg-destructive/90 cursor-pointer">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </>
    );
  }



  return (
    <StepRoleInput
      onBack={isVerified ? handleBack : () => setStep('verification')}
      title={title}
      setTitle={setTitle}
      onContinue={handleRoleContinue}
      isDrafting={isDrafting}
    />
  );
};

export default CreateJobFlow;
