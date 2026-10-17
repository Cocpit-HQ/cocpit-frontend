"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { useSession } from "next-auth/react";
import {
  LoadingIcon,
  ImageIcon,
  DeleteIcon,
} from "@/components/icons";
import {
  checkAccountNameAvailability,
  updateOnboardingProfile,
} from "@/services/api/onboarding";
import { getProfile } from "@/services/api/profile";
import { useDebounce } from "@/hooks/use-debounce";
import { useOnboardingStore } from "@/store/onboarding.store";
import UnderlineInput from "./UnderlineInput";
import PillButton from "./PillButton";
import OnboardingDatePicker from "./OnboardingDatePicker";
import { CocpitUserProfileImageEditor } from "@/shared/commonComponents/CocpitUserProfileImageEditor";

interface StepProfileProps {
  onNext: () => void;
  onBack?: () => void;
  currentStep?: number;
  totalSteps?: number;
}

export const StepProfile: React.FC<StepProfileProps> = ({
  onNext,
  currentStep = 1,
  totalSteps = 5,
}) => {
  const {
    fullName,
    setFullName,
    accountName,
    setAccountName,
    initialAccountName,
    setInitialAccountName,
    profileImage,
    setProfileImage,
    profileImageFile,
    setProfileImageFile,
    dob,
    setDob,
    isInitialized,
  } = useOnboardingStore();

  const [nameAvailable, setNameAvailable] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [isImageEditorOpen, setIsImageEditorOpen] = useState(false);
  const [editorInitialImage, setEditorInitialImage] = useState<string | null>(null);
  const [loadingInitial, setLoadingInitial] = useState(!isInitialized);

  // Date of Birth state (Mandatory field)
  const [dobDisplay, setDobDisplay] = useState<string>("");
  const [dobRaw, setDobRaw] = useState<string>("");

  // Refs to track already saved data to avoid duplicate API calls if unchanged
  const lastSavedNameRef = useRef<string | null>(null);
  const lastSavedAccountNameRef = useRef<string | null>(null);
  const lastSavedDobRef = useRef<string | null>(null);
  const isInitialSetRef = useRef(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const debouncedAccountName = useDebounce(accountName, 400);
  const isDebouncing = accountName !== debouncedAccountName;
  const isCheckingAvailability = checking || (isDebouncing && !!accountName);

  const { toast } = useToast();
  const { update } = useSession();

  const validateAccountName = (name: string) => {
    const regex = /^[a-z][a-z0-9_.]{2,19}$/;
    return regex.test(name);
  };

  // Set initial availability and pre-fill data on mount / hydration if populated
  useEffect(() => {
    if (isInitialized) {
      if (accountName && !lastSavedAccountNameRef.current) {
        setNameAvailable(true);
        lastSavedNameRef.current = fullName;
        lastSavedAccountNameRef.current = accountName;
      }
      if (dob && !dobDisplay) {
        const cleanDob = dob.includes("T") ? dob.split("T")[0] : dob;
        setDobRaw(cleanDob);
        const parts = cleanDob.split("-");
        if (parts.length === 3) {
          setDobDisplay(`${parts[2]}/${parts[1]}/${parts[0]}`);
        } else {
          setDobDisplay(dob);
        }
        lastSavedDobRef.current = cleanDob;
      }
      if (!isInitialSetRef.current) {
        isInitialSetRef.current = true;
        setLoadingInitial(false);
      }
    }
  }, [isInitialized, accountName, fullName, dob, dobDisplay]);

  // Real-time username check via existing backend API with race-condition cancellation
  useEffect(() => {
    let isCancelled = false;

    const checkAvailability = async () => {
      if (!debouncedAccountName) {
        setNameAvailable(null);
        return;
      }
      if (
        initialAccountName &&
        debouncedAccountName.toLowerCase() === initialAccountName.toLowerCase()
      ) {
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
        if (!isCancelled) {
          setNameAvailable(available);
        }
      } catch (error) {
        if (!isCancelled) {
          setNameAvailable(null);
        }
      } finally {
        if (!isCancelled) {
          setChecking(false);
        }
      }
    };

    if (!loadingInitial) {
      checkAvailability();
    }

    return () => {
      isCancelled = true;
    };
  }, [debouncedAccountName, loadingInitial, initialAccountName]);

  // Handle avatar selection from file picker: opens CocpitImageEditor with selected image
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        setEditorInitialImage(dataUrl);
        setIsImageEditorOpen(true);
      };
      reader.readAsDataURL(file);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleAvatarDelete = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setProfileImage(null);
    setProfileImageFile(null);
    setEditorInitialImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleAccountNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.toLowerCase();
    value = value.replace(/ /g, '_');
    value = value.replace(/[^a-z0-9_.]/g, '');
    setAccountName(value);
    setNameAvailable(null);
  };

  // Date of birth change handler
  const handleDobChange = (isoDate: string, formattedDisplay: string) => {
    setDobRaw(isoDate);
    setDobDisplay(formattedDisplay);
  };

  // Age validation rule: strictly mandatory and 16 years or older
  const isAgeValid = useMemo(() => {
    if (!dobRaw || !dobRaw.trim()) return false;
    const parts = dobRaw.split("-");
    if (parts.length !== 3) return false;
    const birthDate = new Date(
      parseInt(parts[0], 10),
      parseInt(parts[1], 10) - 1,
      parseInt(parts[2], 10)
    );
    const today = new Date();
    const minAllowedDate = new Date(
      today.getFullYear() - 16,
      today.getMonth(),
      today.getDate()
    );
    return birthDate.getTime() <= minAllowedDate.getTime();
  }, [dobRaw]);

  const dobError = useMemo(() => {
    if (dobRaw && !isAgeValid) {
      return "Must be at least 16 years old";
    }
    return null;
  }, [dobRaw, isAgeValid]);

  // Username status, errors, and helper messages
  const usernameErrorMessage = useMemo(() => {
    if (!accountName) return null;
    if (!validateAccountName(accountName)) {
      if (accountName.length < 3) return "Min 3 characters required";
      if (accountName.length > 20) return "Max 20 characters allowed";
      return "Letters, numbers, dots, and underscores only";
    }
    if (!isCheckingAvailability && nameAvailable === false) {
      return "Username unavailable";
    }
    return null;
  }, [accountName, isCheckingAvailability, nameAvailable]);

  const usernameHelperText = useMemo(() => {
    if (!accountName || usernameErrorMessage || isCheckingAvailability) return null;
    if (nameAvailable === true) {
      return "Username available";
    }
    return null;
  }, [accountName, usernameErrorMessage, isCheckingAvailability, nameAvailable]);

  const usernameHelperColor = useMemo(() => {
    if (nameAvailable === true) {
      return "var(--ds-success)";
    }
    return "var(--ds-text-muted)";
  }, [nameAvailable]);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (
      !accountName ||
      nameAvailable !== true ||
      isCheckingAvailability ||
      !fullName.trim() ||
      !dobRaw.trim() ||
      !isAgeValid ||
      submitting
    ) {
      return;
    }

    // If data has not changed since last successful save, skip redundant API call
    const isDataChanged =
      fullName !== lastSavedNameRef.current ||
      accountName !== lastSavedAccountNameRef.current ||
      dobRaw !== (lastSavedDobRef.current || "") ||
      !!profileImageFile;

    if (!isDataChanged) {
      onNext();
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("account_name", accountName);
      formData.append("full_name", fullName);
      formData.append("dob", dobRaw);

      if (profileImageFile) {
        formData.append("avatar", profileImageFile);
      }

      await updateOnboardingProfile(formData);
      setInitialAccountName(accountName);
      setDob(dobRaw);
      lastSavedNameRef.current = fullName;
      lastSavedAccountNameRef.current = accountName;
      lastSavedDobRef.current = dobRaw;

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
    } catch (error: any) {
      console.error(error);
      const errorMessage = error.response?.data?.message || "Failed to update profile";
      toast({ title: "Error", description: errorMessage, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const displayImage = useMemo(() => {
    if (!profileImage) return null;
    if (profileImage.startsWith("data:") || profileImage.startsWith("http")) {
      return profileImage;
    }
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:5001";
    return `${baseUrl}/${profileImage}`;
  }, [profileImage]);

  // Full Name, Username, and DOB are mandatory fields
  const isFormValid = useMemo(() => {
    return (
      !!fullName.trim() &&
      !!accountName.trim() &&
      nameAvailable === true &&
      !isCheckingAvailability &&
      validateAccountName(accountName) &&
      !!dobRaw.trim() &&
      isAgeValid
    );
  }, [fullName, accountName, nameAvailable, isCheckingAvailability, dobRaw, isAgeValid]);

  return (
    <div className="w-full flex flex-col items-center justify-center font-['DM_Sans',sans-serif] text-ds-text-primary select-none relative">
      {/* Hidden File Input for Avatar */}
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/png,image/jpeg,image/jpg,image/webp"
        onChange={handleFileChange}
      />

      {/* Centered Vertical Stack: Main Content Container */}
      <div className="flex flex-col items-center gap-[20px] z-10">
        {/* Frame 1: Main Content Container */}
        <div className="w-full max-w-[447px] sm:w-[447px] h-full sm:h-auto min-h-[488px] sm:min-h-0 p-[16px] flex flex-col items-center gap-[20px] sm:rounded-[24px] box-border">
          {/* Frame 2608520: Title & Subtitle Frame */}
          <div className="w-full max-w-[415px] sm:w-[415px] h-auto min-h-[80px] flex flex-col items-center p-0 gap-[8px] text-center">
            <h1 className="w-full h-auto font-['DM_Sans'] font-bold text-[32px] sm:text-[40px] leading-[40px] sm:leading-[48px] text-center text-ds-text-primary tracking-normal m-0 p-0">
              Tell us about <span className="text-ds-accent">yourself</span>
            </h1>
            <p className="w-full max-w-[338px] h-auto font-['DM_Sans'] font-semibold text-[14px] sm:text-[16px] leading-[20px] sm:leading-[24px] text-center text-ds-text-primary m-0 p-0">
              Add your basic details to create your profile
            </p>
          </div>

          {/* Frame 2608512: Form / Input Area (260px x 300px, gap 12px) */}
          <form
            onSubmit={handleSubmit}
            className="w-[260px] h-[300px] flex flex-col items-center p-0 gap-[12px]"
          >
            {/* Profile Photo Area (Optional) */}
            {!displayImage ? (
              /* Empty State (Frame 2609482: 113px x 84px) */
              <div className="w-[113px] h-[84px] flex flex-col items-center p-0 gap-[8px]">
                {/* Frame 2609481: 60px x 60px Upload Circle */}
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="w-[60px] h-[60px] box-border flex flex-col justify-center items-center p-0 gap-[2px] bg-ds-surface-1 hover:bg-ds-surface-2 border border-ds-border rounded-[100px] cursor-pointer transition-colors"
                  role="button"
                  tabIndex={0}
                  aria-label="Add photo"
                >
                  <ImageIcon size={20} className="w-[20px] h-[20px] text-ds-text-primary" />
                </div>
                {/* Text: Add photo(optional) */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-[113px] h-[16px] font-['DM_Sans'] font-normal text-[12px] leading-[16px] text-center text-ds-text-secondary hover:text-ds-text-primary transition-colors cursor-pointer"
                >
                  Add photo(optional)
                </button>
              </div>
            ) : (
              /* Uploaded State (Frame 2609482: 80px x 84px) */
              <div className="w-[80px] h-[84px] flex flex-col items-center p-0 gap-[8px]">
                {/* Frame 2609481: 60px x 60px Image Preview Circle */}
                <div
                  onClick={() => {
                    setEditorInitialImage(displayImage);
                    setIsImageEditorOpen(true);
                  }}
                  onDoubleClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                  className="group relative w-[60px] h-[60px] box-border flex flex-col justify-center items-center p-0 gap-[2px] border border-ds-border rounded-[100px] overflow-hidden cursor-pointer transition-colors"
                  title="Click to edit, double-click to change"
                >
                  <img
                    src={displayImage}
                    alt="Profile Preview"
                    className="w-full h-full object-cover rounded-[100px]"
                  />

                </div>
                {/* Text: Change photo */}
                <button
                  type="button"
                  onClick={() => {
                    setEditorInitialImage(displayImage);
                    setIsImageEditorOpen(true);
                  }}
                  className="w-[80px] h-[16px] font-['DM_Sans'] font-medium text-[12px] leading-[16px] text-center text-ds-text-primary hover:opacity-80 transition-opacity cursor-pointer"
                >
                  Change photo
                </button>
              </div>
            )}

            {/* First Input: Full Name (260px x 60px) - Mandatory */}
            <UnderlineInput
              id="fullname-input"
              placeholder="Enter your full name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              disabled={submitting}
              required
            />

            {/* Second Input: Username (260px x 60px) - Mandatory */}
            <UnderlineInput
              id="username-input"
              placeholder="Enter username"
              value={accountName}
              onChange={handleAccountNameChange}
              disabled={submitting}
              maxLength={20}
              errorMessage={usernameErrorMessage}
              helperText={usernameHelperText}
              helperColor={usernameHelperColor}
              suffix={
                isCheckingAvailability ? (
                  <LoadingIcon className="w-4 h-4 animate-spin-smooth text-ds-text-secondary" />
                ) : null
              }
              required
            />

            {/* Third Input: Custom Dark Theme Date of Birth Picker (260px x 60px) - Mandatory */}
            <OnboardingDatePicker
              value={dobRaw}
              displayValue={dobDisplay}
              onChange={handleDobChange}
              errorMessage={dobError}
              disabled={submitting}
            />

            {/* Frame 2609485: Continue Button */}
            <div className="w-full max-w-[260px] h-[36px] mt-[8px] flex items-center justify-center">
              <PillButton
                type="submit"
                disabled={!isFormValid || submitting}
                isLoading={submitting}
                label="Continue"
              />
            </div>
          </form>
        </div>
      </div>

      {/* Cocpit User Profile Image Editor Modal */}
      <CocpitUserProfileImageEditor
        isOpen={isImageEditorOpen}
        onClose={() => setIsImageEditorOpen(false)}
        initialImage={editorInitialImage}
        onSave={(dataUrl, file) => {
          setProfileImage(dataUrl);
          setProfileImageFile(file);
          setIsImageEditorOpen(false);
        }}
        onRemove={() => {
          setProfileImage(null);
          setProfileImageFile(null);
          setEditorInitialImage(null);
          if (fileInputRef.current) {
            fileInputRef.current.value = "";
          }
        }}
      />
    </div>
  );
};

export default StepProfile;
