"use client";

import { useState } from "react";
import { Loader2, ChevronLeft } from "lucide-react";
import LocationAutocomplete from "@/components/ui/LocationAutocomplete";
import { LocationSuggestion } from "@/services/api/location";
import { updateLocation } from "@/services/api/onboarding";
import { useToast } from "@/hooks/use-toast";
import styles from "./TellUsAboutYouStep.module.css";

interface TellUsAboutYouStepProps {
  onNext: () => void;
  onBack: () => void;
  currentStep: number;
  totalSteps: number;
}

export default function TellUsAboutYouStep({ onNext, onBack, currentStep, totalSteps }: TellUsAboutYouStepProps) {
  const [selectedLocation, setSelectedLocation] = useState<LocationSuggestion | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  const handleContinue = async () => {
    if (!selectedLocation) return;

    setSubmitting(true);
    try {
      await updateLocation({
        location_id: selectedLocation.id.toString(),
        location: selectedLocation.name
      });

      onNext();
    } catch (error) {
      console.error("Failed to save location:", error);
      toast({
        title: "Error",
        description: "Failed to save your location. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast({ title: "Not Supported", description: "Geolocation is not supported by your browser.", variant: "destructive" });
      return;
    }

    toast({ title: "Detecting Location", description: "Getting your current position..." });

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        // In a real app, we'd reverse geocode here. 
        // For now, we'll show a message or try to find a matching city if we had an API.
        toast({
          title: "Location Detected",
          description: `Lat: ${position.coords.latitude.toFixed(2)}, Lon: ${position.coords.longitude.toFixed(2)}. Please select your city manually from the list below.`,
        });
      },
      (error) => {
        toast({ title: "Detection Failed", description: "Could not get your location. Please type it manually.", variant: "destructive" });
      }
    );
  };

  const isValid = !!selectedLocation;

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        {/* Header Section */}
        <div className={styles.headerGroup}>
          <div className={styles.logoContainer}>
            <img src="/assets/logo.PNG" alt="Cocpit Logo" height={56} className={styles.logo} />
          </div>
          <div className={styles.stepContainer}>
            <div className={styles.stepHeader}>
              <span className={styles.stepText}>Step {currentStep} of {totalSteps}</span>
            </div>
            <div className={styles.progressBar}>
              <div className={styles.progressFill} style={{ width: `${(currentStep / totalSteps) * 100}%` }}></div>
            </div>
          </div>
        </div>

        {/* Title & Subtitle Group */}
        <div className={styles.textGroup}>
          <h1 className={styles.title}>Tell us about you</h1>
          <p className={styles.subtitle}>This helps personalize your experience</p>
        </div>

        {/* Location Form */}
        <div className={styles.formGroup}>
          <label className={styles.label}>Location</label>
          <LocationAutocomplete
            selected={selectedLocation}
            onSelect={setSelectedLocation}
          />
          <button
            type="button"
            className={styles.useLocationBtn}
            onClick={handleUseCurrentLocation}
          >
            Use current location
          </button>
        </div>

        {/* Actions */}
        <div className={styles.actionRow}>
          <button
            type="button"
            className={styles.backButton}
            onClick={onBack}
            disabled={submitting}
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            type="button"
            className={styles.continueButton}
            onClick={handleContinue}
            disabled={!isValid || submitting}
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : "Continue"}
          </button>
        </div>
      </div>
    </div>
  );
}
