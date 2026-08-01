"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { useSession } from "next-auth/react";
import { Loader2, ChevronLeft, Check, X, Pencil } from "lucide-react";
import { checkAccountNameAvailability, updateOnboardingProfile } from "@/services/api/onboarding";
import { getProfile, uploadAvatar } from "@/services/api/profile";
import { useDebounce } from "@/hooks/use-debounce";
import { useOnboardingStore } from "@/store/onboarding.store";
import { useMemo } from "react";
import { EditAvatarModal } from "@/components/profile/EditAvatarModal";
import { Icon } from "@iconify/react";
import styles from "./ProfileStep.module.css";

interface ProfileStepProps {
  onNext: () => void;
  onBack?: () => void;
  currentStep: number;
  totalSteps: number;
}

export default function ProfileStep({ onNext, onBack, currentStep, totalSteps }: ProfileStepProps) {
  const { 
    fullName, setFullName, 
    accountName, setAccountName,
    initialAccountName, setInitialAccountName,
    profileImage, setProfileImage,
    profileImageFile, setProfileImageFile,
    isInitialized
  } = useOnboardingStore();

  const [nameAvailable, setNameAvailable] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loadingInitial, setLoadingInitial] = useState(!isInitialized);
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);

  const debouncedAccountName = useDebounce(accountName, 500);
  const router = useRouter();
  const { toast } = useToast();
  const { update } = useSession();

  const validateAccountName = (name: string) => {
    // 3-20 characters, lowercase letters, numbers, underscore only
    const regex = /^[a-z0-9_]{3,20}$/;
    return regex.test(name);
  };

  // Set initial availability if account name was pre-filled
  useEffect(() => {
    if (isInitialized && accountName && nameAvailable === null) {
      setNameAvailable(true);
      setLoadingInitial(false);
    }
  }, [isInitialized, accountName, nameAvailable]);

  useEffect(() => {
    const checkAvailability = async () => {
      if (!debouncedAccountName) {
        setNameAvailable(null);
        return;
      }
      // If the name matches what we initially loaded (or just saved), it's available by default
      if (initialAccountName && debouncedAccountName.toLowerCase() === initialAccountName.toLowerCase()) {
        setNameAvailable(true);
        return;
      }
      if (!validateAccountName(debouncedAccountName)) {
        setNameAvailable(false);
        return;
      }
      setChecking(true);
      try {
        const available = await checkAccountNameAvailability(debouncedAccountName);
        setNameAvailable(available);
      } catch (error) {
        setNameAvailable(null);
      } finally {
        setChecking(false);
      }
    };

    if (!loadingInitial) {
      checkAvailability();
    }
  }, [debouncedAccountName, loadingInitial, initialAccountName]);

  const handleAvatarUpload = async (file: File) => {
    setProfileImageFile(file);
    const reader = new FileReader();
    reader.onload = (event) => {
      setProfileImage(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleAvatarDelete = async () => {
    setProfileImage(null);
    setProfileImageFile(null);
  };

  const handleAccountNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toLowerCase().trim();
    setAccountName(value);
    if (value !== debouncedAccountName) {
      setNameAvailable(null);
    }
  };

  const handleSubmit = async () => {
    if (!accountName || nameAvailable !== true || !fullName.trim()) return;

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("account_name", accountName);
      formData.append("full_name", fullName);
      
      if (profileImageFile) {
        formData.append("avatar", profileImageFile);
      }

      await updateOnboardingProfile(formData);
      
      // Update the initial name so if they come back, it's still marked as valid
      setInitialAccountName(accountName);

      toast({ title: "Profile Updated", description: "Your basic profile has been saved." });
      
      // Fetch the updated profile to get the new avatar URL and manually sync NextAuth session
      try {
        const freshProfile = await getProfile();
        if (freshProfile && freshProfile.user) {
          await update({
            name: freshProfile.user.name,
            image: freshProfile.user.avatar,
          });
        }
      } catch (err) {
        console.error("Failed to sync session with fresh profile", err);
      }

      onNext();
      router.refresh();
    } catch (error: any) {
      console.error(error);
      const errorMessage = error.response?.data?.message || "Failed to complete onboarding";
      toast({ title: "Error", description: errorMessage, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const displayImage = useMemo(() => {
    if (!profileImage) return null;
    if (profileImage.startsWith('data:') || profileImage.startsWith('http')) {
      return profileImage;
    }
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:5001';
    return `${baseUrl}/${profileImage}`;
  }, [profileImage]);

  const isValid = useMemo(() => {
    return !!accountName.trim() && 
           nameAvailable === true && 
           !checking && 
           validateAccountName(accountName) && 
           !!fullName.trim();
  }, [accountName, nameAvailable, checking, fullName]);

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.headerGroup}>
          <div className={styles.logoContainer}>
            <Image src="/assets/logo.PNG" alt="Cocpit Logo" width={56} height={56} className={styles.logo} />
          </div>
          <div className={styles.stepContainer}>
            <div className={styles.stepHeader}>
              <span className={styles.stepText}>Step {currentStep} Of {totalSteps}</span>
            </div>
            <div className={styles.progressBar}>
              <div className={styles.progressFill} style={{ width: `${(currentStep / totalSteps) * 100}%` }}></div>
            </div>
          </div>
        </div>

        <div className={styles.textGroup}>
          <h1 className={styles.title}>Set up your profile</h1>
          <p className={styles.subtitle}>This helps personalize your experience</p>
        </div>

        <div className={styles.photoUploadContainer}>
          <div className={styles.photoWrapper}>
            <button type="button" onClick={() => setIsAvatarModalOpen(true)} className={styles.photoButton}>
              {displayImage ? (
                <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                  <img src={displayImage} alt="Profile" className={styles.photoImage} />
                </div>
              ) : (
                <div className="w-full h-full flex flex-col justify-center items-center gap-[4px] bg-[#EEF2FF] rounded-full" style={{ width: '100%', height: '100%' }}>
                  <Icon icon="solar:gallery-linear" className="w-[24px] h-[24px] text-[#000000]" />
                  <span className="font-[family-name:var(--font-poppins)] font-normal text-[10px] leading-[15px] text-center text-[#000000]">
                    Add profile
                  </span>
                </div>
              )}
            </button>
          </div>
          {displayImage && (
            <div className={styles.editIconContainer} onClick={() => setIsAvatarModalOpen(true)}>
              <Pencil className={styles.editIcon} strokeWidth={1.5} />
            </div>
          )}
          {!displayImage && (
            <span className={styles.photoText} onClick={() => setIsAvatarModalOpen(true)} style={{ cursor: 'pointer' }}>
              Add your photo
            </span>
          )}
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Full Name</label>
          <input
            type="text"
            className={styles.input}
            placeholder="John Doe"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Username</label>
          <div className={styles.inputWrapper}>
            <input
              type="text"
              className={`${styles.input} ${accountName && nameAvailable === false ? 'border-red-500' : ''
                } ${accountName && nameAvailable === true ? 'border-green-500' : ''
                }`}
              placeholder="johndoe23"
              value={accountName}
              onChange={handleAccountNameChange}
              maxLength={20}
            />
            <div className={styles.statusIcon}>
              {checking ? (
                <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
              ) : nameAvailable === true ? (
                <Check className={`${styles.icon} ${styles.success}`} />
              ) : null}
            </div>
          </div>
          {nameAvailable === false && !checking && (
            <p className={styles.errorText}>
              {validateAccountName(accountName) 
                ? "Username already taken" 
                : accountName.length > 20 
                  ? "Username exceeds the maximum allowed length of 20 characters." 
                  : accountName.length < 2
                    ? "Username must be at least 3 characters long."
                    : "Invalid format. Use only lowercase letters, numbers, and underscores."}
            </p>
          )}
        </div>

        <div className={styles.actionRow}>
          {onBack && (
            <button type="button" className={styles.backButton} onClick={onBack}>
              <ChevronLeft size={20} className="text-[#18181b]" />
            </button>
          )}
          <button
            type="button"
            className={styles.continueButton}
            style={{ flex: 1, width: 'auto' }}
            onClick={handleSubmit}
            disabled={!isValid || submitting}
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : "Continue"}
          </button>
        </div>
      </div>
      <EditAvatarModal
        isOpen={isAvatarModalOpen}
        onClose={() => setIsAvatarModalOpen(false)}
        currentAvatarUrl={displayImage}
        onUpload={handleAvatarUpload}
        onDelete={handleAvatarDelete}
        theme="light"
      />
    </div>
  );
}
