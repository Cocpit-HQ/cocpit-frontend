"use client";

import { useState, useRef, useEffect } from "react";
import { Upload, Check, X, Loader2 } from "lucide-react";
import styles from "./ProfileStep.module.css";
import { checkAccountNameAvailability, completeOnboarding } from "@/services/api/onboarding";
import { useDebounce } from "@/hooks/use-debounce";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { useSession } from "next-auth/react";
import LocationAutocomplete from "@/components/ui/LocationAutocomplete";
import type { LocationSuggestion } from "@/services/api/location";

export default function ProfileStep() {
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  const [accountName, setAccountName] = useState("");
  const [nameAvailable, setNameAvailable] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<LocationSuggestion | null>(null);

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
        console.error("Failed to check account name availability", error);
        // On error, maybe reset or show error? For now assuming unavailable/error state
        setNameAvailable(null);
      } finally {
        setChecking(false);
      }
    };

    checkAvailability();
  }, [debouncedAccountName]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfileImageFile(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        setProfileImage(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Force lowercase and trim, although user might type whatever.
    // The requirement says "Account Name Rules: lowercase...".
    // I can auto-lowercase or just validate.
    // "Auto-normalize: trim, lowercase" was in the user instructions.
    const value = e.target.value.toLowerCase().trim();

    // Also, if we want to prevent invalid chars from even being typed, we could.
    // But validation is better for UX to show what's wrong if they paste.
    // However, spaces are definitely not allowed.
    // Let's just set the value raw but transformed.
    setAccountName(value);

    // Reset availability while typing/debouncing
    if (value !== debouncedAccountName) {
      setNameAvailable(null);
    }
  };

  const handleSubmit = async () => {
    if (!profileImageFile || !accountName || nameAvailable !== true || !selectedLocation) return;

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("avatar", profileImageFile);
      formData.append("account_name", accountName);
      formData.append("location_id", String(selectedLocation.id));

      const response = await completeOnboarding(formData);

      toast({
        title: "Setup Complete",
        description: "Your profile has been set up successfully.",
      });

      await update({ onboarding_complete: true });

      router.push("/profile");
      router.refresh();

    } catch (error) {
      console.error("Onboarding failed", error);
      toast({
        title: "Error",
        description: "Failed to complete onboarding. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const isValid =
    !!profileImageFile &&
    !!accountName &&
    nameAvailable === true &&
    !checking &&
    validateAccountName(accountName) &&
    !!selectedLocation;

  return (
    <div className={styles.formContent}>
      {/* Removed Header/Steps */}

      <div className={styles.formBody}>
        <h2 className={styles.title}>Welcome! Let's get you set up.</h2>
        <p className={styles.subtitle}>
          Choose a profile picture and a unique account name to get started.
        </p>

        {/* Profile Picture Upload */}
        <div className={styles.uploadSection}>
          <button
            onClick={() => fileInputRef.current?.click()}
            className={styles.uploadButton}
            type="button"
          >
            {profileImage ? (
              <img src={profileImage} alt="Profile" className={styles.uploadImage} />
            ) : (
              <>
                <Upload className={styles.uploadIcon} />
                <span className={styles.uploadText}>Tap to upload</span>
              </>
            )}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            style={{ display: "none" }}
          />
        </div>

        {/* Location */}
        <div className={styles.fieldGroup}>
          <label className={styles.label}>Location <span style={{color: '#ef4444'}}>*</span></label>
          <LocationAutocomplete
            selected={selectedLocation}
            onSelect={setSelectedLocation}
          />
          {!selectedLocation && (
            <p className="text-xs text-muted-foreground mt-1">Select a city from the suggestions.</p>
          )}
        </div>

        {/* Account Name */}
        <div className={styles.fieldGroup}>
          <label className={styles.label}>Account name</label>
          <div className={styles.inputWrapper}>
            <input
              type="text"
              placeholder="username"
              value={accountName}
              onChange={handleNameChange}
              className={`${styles.input} ${
                accountName && nameAvailable === false ? 'border-red-500' : ''
              } ${
                accountName && nameAvailable === true ? 'border-green-500' : ''
              }`}
              maxLength={20}
            />
            <div className={styles.statusIcon}>
              {checking ? (
                <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
              ) : nameAvailable === true ? (
                <Check className={`${styles.icon} ${styles.success}`} />
              ) : nameAvailable === false ? (
                <X className={`${styles.icon} ${styles.error}`} />
              ) : null}
            </div>
          </div>

          {/* Helper Text */}
          <div className="flex justify-between items-start mt-1">
             <p className="text-xs text-muted-foreground">
               3-20 characters, lowercase, numbers, underscores only.
             </p>
          </div>

          {/* Status Messages */}
          {nameAvailable === false && !checking && (
            <p className={styles.errorMsg}>
              {validateAccountName(accountName)
                ? "This username is already taken."
                : "Invalid format. Use only lowercase letters, numbers, and underscores."}
            </p>
          )}
        </div>

        {/* Submit Button */}
        <button
          onClick={handleSubmit}
          disabled={!isValid || submitting}
          className={styles.nextBtn}
        >
          {submitting ? (
             <div className="flex items-center justify-center gap-2">
               <Loader2 className="w-4 h-4 animate-spin" />
               <span>Setting up...</span>
             </div>
          ) : (
            "Complete Setup"
          )}
        </button>
      </div>
    </div>
  );
}
