import React, { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import { toast } from 'sonner';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
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

type Step = 'verification' | 'role-input' | 'details' | 'preview';

export const CreateJobFlow: React.FC<CreateJobFlowProps> = ({ onBack, onSubmit, initialListing }) => {
  const [step, setStep] = useState<Step>(initialListing ? 'details' : 'verification');
  const [title, setTitle] = useState(initialListing?.title || '');
  const [jobId, setJobId] = useState<string | null>(initialListing?.id || null);
  const [isDrafting, setIsDrafting] = useState(false);
  const [accumulatedDetails, setAccumulatedDetails] = useState<Partial<JobListing>>(initialListing || {});
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleRoleContinue = async () => {
    setIsDrafting(true);
    
    // Fire the API immediately so the draft exists in the DB while they are drafting!
    try {
      const newJobId = await jobsService.initializeJobDraft(title);
      if (newJobId) {
        setJobId(newJobId);
        // NOTE: No separate generate call needed here.
        // createJob on the backend already runs AI generation and saves the description.
        // The background polling in StepJobDetails will pick it up automatically.
      }
    } catch (error) {
      console.error('Failed to create initial draft', error);
    } finally {
      setIsDrafting(false);
      setStep('details');
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

  const handleDeleteDraft = async () => {
    setShowDeleteConfirm(false);
    if (jobId) {
      const success = await jobsService.deleteJobListing(jobId);
      if (success) {
        toast.success("Draft deleted successfully");
      } else {
        toast.error("Failed to delete draft");
        return;
      }
    }
    onBack();
  };

  const renderStep = () => {
    if (step === 'verification') {
      return (
        <StepIdentityVerification
          onBack={onBack}
          onVerifySuccess={() => setStep('role-input')}
        />
      );
    }

    if (step === 'details') {
      return (
        <StepJobDetails
          jobId={jobId}
          initialRole={title}
          initialDetails={accumulatedDetails}
          onBack={initialListing ? onBack : () => setStep('role-input')}
          onSaveDraft={handleSaveDraft}
          onContinue={handleDetailsContinue}
          onDeleteDraft={jobId ? () => setShowDeleteConfirm(true) : undefined}
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
          onDeleteDraft={jobId ? () => setShowDeleteConfirm(true) : undefined}
        />
      );
    }

    return (
      <StepRoleInput
        onBack={() => setStep('verification')}
        title={title}
        setTitle={setTitle}
        onContinue={handleRoleContinue}
        isDrafting={isDrafting}
      />
    );
  };

  return (
    <>
      {renderStep()}
      
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
};

export default CreateJobFlow;
