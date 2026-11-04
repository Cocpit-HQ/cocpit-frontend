import React from 'react';
import { Icon } from '@iconify/react';
import { toast } from 'sonner';
import { ActionConfirmModal } from '@/shared/commonComponents/ActionConfirmModal';
import StepIdentityVerification from './StepIdentityVerification';
import StepRoleInput from './StepRoleInput';
import StepJobDetails from './StepJobDetails';
import CreateJobMobileWizard from './CreateJobMobileWizard';

import { JobListing } from '../../types/jobs.types';
import * as jobsService from '../../services/jobs.service';
import { useJobStore } from '@/store/job.store';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useActiveProfile } from '@/context/ActiveProfileContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { useMyProfile } from '@/hooks/use-my-profile';
import { useCreateJobInit } from '../../hooks/useCreateJobInit';
import { useCreateJobUrlSync } from '../../hooks/useCreateJobUrlSync';
import { useCreateJobHydration } from '../../hooks/useCreateJobHydration';

type VerificationState = 'loading' | 'verified' | 'unverified' | 'error';

interface CreateJobFlowProps {
  onBack: () => void;
  onSubmit: (title: string, status: string, details?: Partial<JobListing>) => Promise<void>;
  initialListing?: JobListing | null;
  onDelete?: (jobId: string) => void;
}

export const CreateJobFlow: React.FC<CreateJobFlowProps> = ({ onBack, onSubmit, initialListing, onDelete }) => {
  const queryClient = useQueryClient();
  const router = useRouter();
  const isMobile = useIsMobile();
  const { activeProfile, isLoading: isActiveProfileLoading, updateActiveProfile } = useActiveProfile();
  const {
    data: myProfile,
    isLoading: isMyProfileLoading,
    isError: isMyProfileError,
    refetch: refetchProfile,
  } = useMyProfile();

  // Verification state machine: 'loading' | 'verified' | 'unverified' | 'error'
  const verificationState = React.useMemo<VerificationState>(() => {
    // 1. While ActiveProfileContext is initializing, state is loading
    if (isActiveProfileLoading || !activeProfile) {
      return 'loading';
    }

    // 2. Company profile: Bugfix ID-572 — Companies can post jobs without user verification
    if (activeProfile.type === 'COMPANY') {
      return 'verified';
    }

    // 3. Cached activeProfile identity verification
    if (activeProfile.is_identity_verified) {
      return 'verified';
    }

    // 4. USER profile checking myProfile query
    if (isMyProfileLoading) {
      return 'loading';
    }

    if (isMyProfileError) {
      return 'error';
    }

    if (myProfile?.user?.is_identity_verified) {
      return 'verified';
    }

    if (myProfile?.user && !myProfile.user.is_identity_verified) {
      return 'unverified';
    }

    return 'unverified';
  }, [isActiveProfileLoading, activeProfile, isMyProfileLoading, isMyProfileError, myProfile]);

  // Sync verified status back to activeProfile context so subsequent visits in session are instant
  React.useEffect(() => {
    if (activeProfile?.type === 'USER' && myProfile?.user?.is_identity_verified && !activeProfile.is_identity_verified) {
      updateActiveProfile?.({ is_identity_verified: true });
    }
  }, [activeProfile?.type, activeProfile?.is_identity_verified, myProfile?.user?.is_identity_verified, updateActiveProfile]);

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

  // Hook 1: Initialize step/title/jobId from URL params on mount (waits until verification check finishes)
  useCreateJobInit({ initialListing, verificationState });

  // Hook 2: Hydrate store from API on refresh (details/preview steps with jobId)
  const { isHydrating } = useCreateJobHydration({ initialListing });

  // Hook 3: Sync step + title + jobId changes back to URL atomically (pauses during loading to prevent wiping params)
  useCreateJobUrlSync(step, title, jobId, verificationState === 'loading');

  const handleBack = () => {
    resetCreateJobFlow();
    onBack();
  };

  const handleRoleContinue = async () => {
    if (isMobile) {
      // On mobile, collect details step-by-step first; do NOT initialize draft yet!
      setStep('details');
      return;
    }

    setIsDrafting(true);
    
    // Desktop: Fire the API immediately so the draft exists in the DB while drafting
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
    setAccumulatedDetails(details);
  };

  const handlePublish = async (details: Partial<JobListing>) => {
    await onSubmit(details.title || title, 'ACTIVE', { ...details, id: jobId || undefined });
    resetCreateJobFlow();
  };

  const handleDeleteDraft = async () => {
    setShowDeleteConfirm(false);
    const targetJobId = jobId || initialListing?.id;
    if (targetJobId) {
      const orgId = activeProfile?.type === 'COMPANY' ? activeProfile.id : undefined;
      const success = await jobsService.deleteJobListing(targetJobId, orgId);
      if (success) {
        queryClient.setQueriesData({ queryKey: ['myListings'] }, (oldData: any) => {
          if (!oldData?.pages) return oldData;
          return {
            ...oldData,
            pages: oldData.pages.map((page: any) => ({
              ...page,
              data: page.data?.filter((item: any) => item.id !== targetJobId),
              counts: page.counts ? {
                ...page.counts,
                all: Math.max(0, (page.counts.all || 1) - 1),
                draft: Math.max(0, (page.counts.draft || 1) - 1),
              } : page.counts
            }))
          };
        });
        queryClient.invalidateQueries({ queryKey: ['myListings'] });
        onDelete?.(targetJobId);
        toast.success("Draft deleted successfully");
      } else {
        toast.error("Failed to delete draft");
        return;
      }
    }
    resetCreateJobFlow();
    onBack();
  };

  // Strict gate: If the user/organization is not verified, they must never reach StepRoleInput or StepJobDetails
  if (verificationState === 'unverified' || step === 'verification') {
    return (
      <StepIdentityVerification
        onBack={handleBack}
        onClose={handleBack}
        onVerifySuccess={() => setStep('role-input')}
        title={title}
      />
    );
  }

  // State 4: Verified — render details or role input
  if (step === 'details') {
    if (isMobile) {
      return (
        <>
          <CreateJobMobileWizard
            jobId={jobId}
            initialRole={title}
            initialDetails={accumulatedDetails}
            onBack={initialListing ? handleBack : () => setStep('role-input')}
            onClose={handleBack}
            onSaveDraft={handleSaveDraft}
            onPublish={handlePublish}
            onDeleteDraft={jobId || initialListing?.id ? () => setShowDeleteConfirm(true) : undefined}
          />
          <ActionConfirmModal
            isOpen={showDeleteConfirm}
            onClose={() => setShowDeleteConfirm(false)}
            onConfirm={handleDeleteDraft}
            type="delete_post"
            title="Delete draft?"
            description="This action cannot be undone and will permanently remove this draft"
            confirmText="Delete"
            confirmColor="accent"
            cancelText="Cancel"
          />
        </>
      );
    }

    if (isHydrating) {
      return (
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-ds-accent border-t-transparent" />
          <p className="text-sm text-ds-text-secondary font-dm-sans">Restoring your draft...</p>
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
          onClose={handleBack}
          onSaveDraft={handleSaveDraft}
          onPublish={handlePublish}
          onDeleteDraft={jobId || initialListing?.id ? () => setShowDeleteConfirm(true) : undefined}
        />
        <ActionConfirmModal
          isOpen={showDeleteConfirm}
          onClose={() => setShowDeleteConfirm(false)}
          onConfirm={handleDeleteDraft}
          type="delete_post"
          title="Delete draft?"
          description="This action cannot be undone and will permanently remove this draft"
          confirmText="Delete"
          confirmColor="accent"
          cancelText="Cancel"
        />
      </>
    );
  }

  return (
    <StepRoleInput
      onBack={handleBack}
      onClose={handleBack}
      title={title}
      setTitle={setTitle}
      onContinue={handleRoleContinue}
      isDrafting={isDrafting}
    />
  );
};

export default CreateJobFlow;
