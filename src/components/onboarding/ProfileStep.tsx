"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { useSession } from "next-auth/react";
import { Loader2, ChevronLeft, Check, X, Pencil } from "lucide-react";
import { checkAccountNameAvailability, updateProfile } from "@/services/api/onboarding";
import { getProfile, uploadAvatar } from "@/services/api/profile";
import { useDebounce } from "@/hooks/use-debounce";
import styles from "./ProfileStep.module.css";

interface ProfileStepProps {
  onNext: () => void;
  onBack?: () => void;
  currentStep: number;
  totalSteps: number;
}

export default function ProfileStep({ onNext, onBack, currentStep, totalSteps }: ProfileStepProps) {
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  const [fullName, setFullName] = useState("");
  const [accountName, setAccountName] = useState("");
  const [nameAvailable, setNameAvailable] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  const debouncedAccountName = useDebounce(accountName, 500);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const { toast } = useToast();
  const { update } = useSession();

  const validateAccountName = (name: string) => {
    // 3-20 characters, lowercase letters, numbers, underscore only
    const regex = /^[a-z0-9_]{3,20}$/;
    return regex.test(name);
  };

  // Fetch initial profile data
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const profile = await getProfile();
        if (profile && profile.user) {
          if (profile.user.name) setFullName(profile.user.name);
          if (profile.user.account_name) {
            setAccountName(profile.user.account_name);
            // If they already have an account name, it's their own, so it's available
            setNameAvailable(true);
          }
          if (profile.user.avatar) {
            // Add base URL for local uploads if it's not a full URL
            const url = profile.user.avatar.startsWith('http')
              ? profile.user.avatar
              : `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:5000'}/${profile.user.avatar}`;
            setProfileImage(url);
          }
        }
      } catch (error) {
        console.error("Failed to fetch profile:", error);
      } finally {
        setLoadingInitial(false);
      }
    };
    fetchInitialData();
  }, []);

  useEffect(() => {
    const checkAvailability = async () => {
      if (!debouncedAccountName) {
        setNameAvailable(null);
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

    // Skip availability check if we're still loading or if the name hasn't changed from what we just fetched
    if (!loadingInitial) {
      checkAvailability();
    }
  }, [debouncedAccountName, loadingInitial]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // 1. Show local preview immediately
      setProfileImageFile(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        setProfileImage(event.target?.result as string);
      };
      reader.readAsDataURL(file);

      // 2. Upload to server immediately
      setIsUploadingPhoto(true);
      try {
        const formData = new FormData();
        formData.append("avatar", file);
        const response = await uploadAvatar(formData);

        // 3. Update state with actual server URL
        const fullUrl = response.avatarUrl.startsWith('http')
          ? response.avatarUrl
          : `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:5000'}/${response.avatarUrl}`;
        setProfileImage(fullUrl);
      } catch (error) {
        toast({ title: "Upload Failed", description: "Failed to save profile picture.", variant: "destructive" });
      } finally {
        setIsUploadingPhoto(false);
      }
    }
  };

  const handleAccountNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toLowerCase().trim();
    setAccountName(value);
    if (value !== debouncedAccountName) {
      setNameAvailable(null);
    }
  };

  const handleSubmit = async () => {
    if ((!profileImage && !profileImageFile) || !accountName || nameAvailable !== true || !fullName.trim()) return;

    setSubmitting(true);
    try {
      const formData = new FormData();
      if (profileImageFile) {
        formData.append("avatar", profileImageFile);
      }
      formData.append("account_name", accountName);
      formData.append("full_name", fullName);

      await updateProfile(formData);

      toast({ title: "Setup Complete", description: "Your profile has been set up successfully." });
      // Move to next step
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

  const isValid = (!!profileImage || !!profileImageFile) && !!accountName && nameAvailable === true && !checking && !isUploadingPhoto && validateAccountName(accountName) && !!fullName.trim();

  return (
    <div className={styles.container}>
      <div className={styles.content}>

        {/* Header Group */}
        <div className={styles.headerGroup}>
          {/* Logo */}
          <div className={styles.logoContainer}>
            <Image src="/assets/logo.png" alt="Cocpit Logo" width={56} height={56} className={styles.logo} />
          </div>

          <div className={styles.stepContainer}>
            {/* Top Header line */}
            <div className={styles.stepHeader}>
              <span className={styles.stepText}>Step {currentStep} Of {totalSteps}</span>
            </div>
            <div className={styles.progressBar}>
              <div className={styles.progressFill} style={{ width: `${(currentStep / totalSteps) * 100}%` }}></div>
            </div>
          </div>
        </div>

        {/* Title & Subtitle Group */}
        <div className={styles.textGroup}>
          <h1 className={styles.title}>Set up your profile</h1>
          <p className={styles.subtitle}>This helps personalize your experience</p>
        </div>

        {/* Profile photo circle */}
        <div className={styles.photoUploadContainer}>
          <div className={styles.photoWrapper}>
            <button type="button" onClick={() => fileInputRef.current?.click()} className={styles.photoButton} disabled={isUploadingPhoto}>
              {profileImage ? (
                <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                  <img src={profileImage} alt="Profile" className={styles.photoImage} />
                  {isUploadingPhoto && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-full">
                      <Loader2 className="w-8 h-8 animate-spin text-white" />
                    </div>
                  )}
                </div>
              ) : (
                <div className={styles.photoPlaceholder} style={{ width: '100%', height: '100%' }}>
                  {isUploadingPhoto ? (
                    <Loader2 className="w-8 h-8 animate-spin text-white" />
                  ) : (
                    <img src="/assets/profilephoto.png" alt="Profile Placeholder" className={styles.photoImage} />
                  )}
                </div>
              )}
            </button>
          </div>
          {profileImage && (
            <div className={styles.editIconContainer} onClick={() => fileInputRef.current?.click()}>
              <Pencil className={styles.editIcon} strokeWidth={1.5} />
            </div>
          )}
          {!profileImage && (
            <span className={styles.photoText} onClick={() => fileInputRef.current?.click()} style={{ cursor: 'pointer' }}>
              Add your photo
            </span>
          )}
          <input type="file" ref={fileInputRef} accept="image/*" onChange={handleImageUpload} style={{ display: "none" }} />
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
          <label className={styles.label}>Account Name</label>
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
              {validateAccountName(accountName) ? "Username already taken" : "Invalid format. Use only lowercase letters, numbers, and underscores."}
            </p>
          )}
        </div>

        {/* Actions */}
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
    </div>
  );
}

