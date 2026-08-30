"use client";

import React, { useState, useMemo } from "react";
import { LeftArrowIcon, LoadingIcon } from "@/components/icons";
import LocationAutocomplete from "@/components/ui/LocationAutocomplete";
import { LocationSuggestion, StructuredLocation, reverseGeocode } from "@/services/api/location";
import { updateOnboardingLocation } from "@/services/api/onboarding";
import { useToast } from "@/hooks/use-toast";
import { useOnboardingStore } from "@/store/onboarding.store";
import PillButton from "./PillButton";

interface StepLocationProps {
  onNext: () => void;
  onBack: () => void;
  currentStep?: number;
  totalSteps?: number;
}

export const StepLocation: React.FC<StepLocationProps> = ({
  onNext,
  onBack,
  currentStep = 2,
  totalSteps = 5,
}) => {
  const {
    locationPlaceId,
    locationFormatted,
    locationCountry,
    locationState,
    locationCity,
    locationLat,
    locationLng,
    setLocation,
  } = useOnboardingStore();

  const [submitting, setSubmitting] = useState(false);
  const [detecting, setDetecting] = useState(false);
  const { toast } = useToast();

  const selectedLocation = useMemo((): StructuredLocation | null => {
    if (!locationPlaceId || !locationFormatted) return null;
    return {
      placeId: locationPlaceId,
      formattedAddress: locationFormatted,
      country: locationCountry || "",
      state: locationState,
      city: locationCity || "",
      latitude: locationLat,
      longitude: locationLng,
    };
  }, [locationPlaceId, locationFormatted, locationCountry, locationState, locationCity, locationLat, locationLng]);

  const setSelectedLocation = (loc: LocationSuggestion | StructuredLocation | string | null) => {
    if (typeof loc === "string") return;
    setLocation(loc);
  };

  const handleContinue = async () => {
    if (!selectedLocation || submitting) return;

    setSubmitting(true);
    try {
      await updateOnboardingLocation({
        country: selectedLocation.country,
        state: selectedLocation.state,
        city: selectedLocation.city,
        formattedAddress: selectedLocation.formattedAddress,
        latitude: selectedLocation.latitude,
        longitude: selectedLocation.longitude,
        placeId: selectedLocation.placeId,
      });

      onNext();
    } catch (error) {
      console.error("Failed to save location:", error);
      toast({
        title: "Error",
        description: "Failed to save your location. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast({
        title: "Not Supported",
        description: "Geolocation is not supported by your browser.",
        variant: "destructive",
      });
      return;
    }

    setDetecting(true);
    toast({ title: "Detecting Location", description: "Getting your current position..." });

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const result = await reverseGeocode(position.coords.latitude, position.coords.longitude);
          if (result) {
            setSelectedLocation(result);
            toast({
              title: "Location Detected",
              description: `Successfully found your location: ${result.formattedAddress}`,
            });
          } else {
            toast({
              title: "Detection Failed",
              description: "Could not find a city for your coordinates. Please type it manually.",
              variant: "destructive",
            });
          }
        } catch (err: any) {
          if (err.message === "UNSUPPORTED_COUNTRY") {
            toast({
              title: "Unsupported Location",
              description: "We currently only support India, UAE, and Japan.",
              variant: "destructive",
            });
          } else {
            toast({
              title: "Error",
              description: "Something went wrong while detecting location.",
              variant: "destructive",
            });
          }
        } finally {
          setDetecting(false);
        }
      },
      (error) => {
        setDetecting(false);
        toast({
          title: "Detection Failed",
          description: "Could not get your location. Please ensure location permissions are granted.",
          variant: "destructive",
        });
      }
    );
  };

  const isValid = !!selectedLocation;

  return (
    <div className="w-[391px] min-h-[456px] p-4 flex flex-col items-center gap-5 font-['DM_Sans',sans-serif] text-[#FFECE6] select-none">
      {/* Title Section */}
      <div className="w-[359px] flex flex-col items-center justify-center p-0 gap-2 text-center">
        <span className="text-[12px] font-medium tracking-wide text-[#EC6229] uppercase">
          Step {currentStep} of {totalSteps}
        </span>
        <h1 className="text-[32px] font-bold font-['DM_Sans'] leading-[40px] tracking-tight">
          <span className="text-[#FFECE6]">Where are you </span>
          <span className="text-[#EC6229]">located?</span>
        </h1>
        <p className="text-[14px] font-normal font-['DM_Sans'] leading-[20px] text-[#B8ADA8] max-w-[320px]">
          We use your location to connect you with nearby opportunities and peers
        </p>
      </div>

      {/* Location Input Section */}
      <div className="w-[260px] flex flex-col items-center gap-3 mt-2">
        <div className="w-full">
          <LocationAutocomplete
            value={selectedLocation?.formattedAddress || null}
            onSelect={setSelectedLocation}
            allowedCountryCodes={["in", "ae", "jp"]}
          />
        </div>

        <button
          type="button"
          onClick={handleUseCurrentLocation}
          disabled={detecting}
          className="text-xs text-[#EC6229] hover:underline flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
        >
          {detecting ? (
            <>
              <LoadingIcon className="w-3.5 h-3.5 animate-spin-smooth" />
              <span>Detecting...</span>
            </>
          ) : (
            <span>Use current location</span>
          )}
        </button>
      </div>

      {/* Action Row */}
      <div className="w-[260px] flex items-center gap-3 mt-6">
        <button
          type="button"
          onClick={onBack}
          disabled={submitting}
          className="w-9 h-9 rounded-full bg-[#1A1A20] hover:bg-[#2C2C33] flex items-center justify-center text-[#FFECE6] transition-colors cursor-pointer shrink-0 disabled:opacity-50"
          aria-label="Back"
        >
          <LeftArrowIcon size={16} className="w-4 h-4" />
        </button>

        <PillButton
          type="button"
          disabled={!isValid || submitting}
          isLoading={submitting}
          onClick={handleContinue}
          label="Continue"
          className="!w-[212px]"
        />
      </div>
    </div>
  );
};

export default StepLocation;
