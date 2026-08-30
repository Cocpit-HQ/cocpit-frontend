"use client";

import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { useOnboardingStore } from "@/store/onboarding.store";
import {
  getOnboardingOptions,
  saveOnboardingSituation,
} from "@/services/api/onboarding";
import { StructuredLocation } from "@/services/api/location";
import OnboardingProgressBar from "./OnboardingProgressBar";
import OnboardingDropdown, { DropdownOption } from "./OnboardingDropdown";
import OnboardingLocationInput from "./OnboardingLocationInput";
import PillButton from "./PillButton";

interface StepLocationStatusProps {
  onNext: () => void;
  onBack?: () => void;
  currentStep?: number;
  totalSteps?: number;
}

const FALLBACK_STATUS_OPTIONS: DropdownOption[] = [
  { id: "employed", label: "Employed" },
  { id: "self_employed", label: "Self-employed" },
  { id: "student", label: "Student" },
  { id: "fresher", label: "Fresher" },
  { id: "intern", label: "Intern" },
  { id: "unemployed", label: "Currently not working" },
];

const MASTER_INDUSTRIES_LIST = [
  "Accounting", "Airlines/Aviation", "Alternative Medicine", "Animation",
  "Apparel & Fashion", "Architecture & Planning", "Arts & Crafts", "Automotive",
  "Aviation & Aerospace", "Banking", "Biotechnology", "Broadcast Media",
  "Building Materials", "Business Supplies & Equipment", "Capital Markets",
  "Chemicals", "Civic & Social Organization", "Civil Engineering",
  "Commercial Real Estate", "Computer & Network Security", "Computer Games",
  "Computer Hardware", "Computer Networking", "Computer Software", "Construction",
  "Consumer Electronics", "Consumer Goods", "Consumer Services", "Cosmetics",
  "Dairy", "Defense & Space", "Design", "E-Learning", "Education Management",
  "Electrical/Electronic Manufacturing", "Entertainment", "Environmental Services",
  "Events Services", "Executive Office", "Facilities Services", "Farming",
  "Financial Services", "Fine Art", "Fishery", "Food & Beverages",
  "Food Production", "Fund-Raising", "Furniture", "Gambling & Casinos",
  "Glass, Ceramics & Concrete", "Government Administration", "Government Relations",
  "Graphic Design", "Health, Wellness & Fitness", "Higher Education",
  "Hospital & Health Care", "Hospitality", "Human Resources", "Import & Export",
  "Individual & Family Services", "Industrial Automation", "Information Services",
  "Information Technology & Services", "Insurance", "International Affairs",
  "International Trade & Development", "Internet", "Investment Banking",
  "Investment Management", "Judiciary", "Law Enforcement", "Law Practice",
  "Legal Services", "Legislative Offices", "Leisure, Travel & Tourism",
  "Libraries", "Logistics & Supply Chain", "Luxury Goods & Jewelry",
  "Machinery", "Management Consulting", "Maritime", "Market Research",
  "Marketing & Advertising", "Mechanical or Industrial Engineering", "Media Production",
  "Medical Devices", "Medical Practice", "Mental Health Care", "Military",
  "Mining & Metals", "Motion Pictures & Film", "Museums & Institutions",
  "Music", "Nanotechnology", "Newspapers", "Non-Profit Organization Management",
  "Oil & Energy", "Online Media", "Outsourcing/Offshoring", "Package/Freight Delivery",
  "Packaging & Containers", "Paper & Forest Products", "Performing Arts",
  "Pharmaceuticals", "Philanthropy", "Photography", "Plastics",
  "Political Organization", "Primary/Secondary Education", "Printing",
  "Professional Training & Coaching", "Program Development", "Public Policy",
  "Public Relations & Communications", "Public Safety", "Publishing",
  "Railroad Manufacture", "Ranching", "Real Estate", "Recreational Facilities & Services",
  "Religious Institutions", "Renewables & Environment", "Research",
  "Restaurants", "Retail", "Security & Investigations", "Semiconductors",
  "Shipbuilding", "Sporting Goods", "Sports", "Staffing & Recruiting",
  "Supermarkets", "Telecommunications", "Textiles", "Think Tanks",
  "Tobacco", "Translation & Localization", "Transportation/Trucking/Railroad",
  "Utilities", "Venture Capital & Private Equity", "Veterinary",
  "Warehousing", "Wholesale", "Wine & Spirits", "Wireless", "Writing & Editing"
];

const INITIAL_INDUSTRY_OPTIONS: DropdownOption[] = MASTER_INDUSTRIES_LIST.map((ind) => ({
  id: ind,
  label: ind,
}));

export const StepLocationStatus: React.FC<StepLocationStatusProps> = ({
  onNext,
  currentStep = 2,
  totalSteps = 5,
}) => {
  const {
    userRole,
    setUserRole,
    industry,
    setIndustry,
    locationFormatted,
    locationPlaceId,
    locationCountry,
    locationState,
    locationCity,
    locationLat,
    locationLng,
    setLocation,
    isInitialized,
  } = useOnboardingStore();

  const { toast } = useToast();

  // Local Selection State
  const [selectedStatus, setSelectedStatus] = useState<string | null>(userRole || null);
  const [selectedIndustry, setSelectedIndustry] = useState<string | null>(industry || null);
  const [selectedLocationObj, setSelectedLocationObj] = useState<StructuredLocation | null>(null);

  // Single-shot initial hydration from store on page load / refresh
  const isHydratedRef = useRef(false);
  useEffect(() => {
    if (isInitialized && !isHydratedRef.current) {
      isHydratedRef.current = true;
      if (userRole) setSelectedStatus(userRole);
      if (industry) setSelectedIndustry(industry);
      if (locationFormatted) {
        setSelectedLocationObj({
          placeId: locationPlaceId || "loc-default",
          formattedAddress: locationFormatted,
          country: locationCountry || "",
          state: locationState,
          city: locationCity || "",
          latitude: locationLat,
          longitude: locationLng,
        });
      }
    }
  }, [isInitialized, userRole, industry, locationFormatted, locationPlaceId, locationCountry, locationState, locationCity, locationLat, locationLng]);

  // Master Data Options & Loaders
  const [statusOptions, setStatusOptions] = useState<DropdownOption[]>(FALLBACK_STATUS_OPTIONS);
  const [industryOptions, setIndustryOptions] = useState<DropdownOption[]>(INITIAL_INDUSTRY_OPTIONS);

  const [loadingStatus, setLoadingStatus] = useState(false);
  const [loadingIndustries, setLoadingIndustries] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const industrySearchTimer = useRef<NodeJS.Timeout | null>(null);

  // 1. Fetch Status Master Data on mount
  useEffect(() => {
    let isCancelled = false;
    const fetchStatusOptions = async () => {
      setLoadingStatus(true);
      try {
        const data = await getOnboardingOptions("status");
        if (!isCancelled && Array.isArray(data) && data.length > 0) {
          setStatusOptions(data.map((item) => ({ id: item.id, label: item.label })));
        }
      } catch (err) {
        // Fallback to standard status list
      } finally {
        if (!isCancelled) setLoadingStatus(false);
      }
    };

    fetchStatusOptions();
    return () => {
      isCancelled = true;
    };
  }, []);

  // 2. Fetch Initial Industries Master Data on mount
  useEffect(() => {
    let isCancelled = false;
    const fetchInitialIndustries = async () => {
      setLoadingIndustries(true);
      try {
        const data = await getOnboardingOptions("industries");
        if (!isCancelled && Array.isArray(data) && data.length > 0) {
          setIndustryOptions(data.map((item) => ({ id: item.id, label: item.label })));
        }
      } catch (err) {
        // Silently handle
      } finally {
        if (!isCancelled) setLoadingIndustries(false);
      }
    };

    fetchInitialIndustries();
    return () => {
      isCancelled = true;
    };
  }, []);

  // Form Validation: Status and Location are required, Industry is optional
  const isFormValid = useMemo(() => {
    return !!selectedStatus && !!selectedLocationObj?.formattedAddress;
  }, [selectedStatus, selectedLocationObj]);

  // Submit Handler
  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!isFormValid || !selectedStatus || !selectedLocationObj || submitting) return;

    setSubmitting(true);
    try {
      await saveOnboardingSituation({
        status: selectedStatus,
        industry: selectedIndustry || null,
        placeId: selectedLocationObj.placeId || null,
        formattedAddress: selectedLocationObj.formattedAddress,
        country: selectedLocationObj.country || null,
        state: selectedLocationObj.state || null,
        city: selectedLocationObj.city || null,
        latitude: selectedLocationObj.latitude || null,
        longitude: selectedLocationObj.longitude || null,
      });

      // Update store
      setUserRole(selectedStatus);
      setIndustry(selectedIndustry || null);
      setLocation(selectedLocationObj);

      onNext();
    } catch (error: any) {
      console.error("Failed to save situation:", error);
      const msg = error.response?.data?.message || "Failed to save details. Please try again.";
      toast({
        title: "Error",
        description: msg,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full min-h-screen flex flex-col items-center justify-center font-['DM_Sans',sans-serif] text-[#FFECE6] select-none relative">
      {/* Centered Vertical Stack: Progress Bar + 20px gap + Main Content Container */}
      <div className="flex flex-col items-center gap-5 z-10">
        {/* Progress Bar (Step 2 of 5) */}
        <OnboardingProgressBar currentStep={currentStep} totalSteps={totalSteps} />

        {/* Main Content Container */}
        <div className="w-[531px] p-4 flex flex-col items-center gap-5 rounded-[24px] box-border">
          {/* Header Section */}
          <div className="w-full flex flex-col items-center p-0 gap-2 text-center">
            <h1 className="w-full font-['DM_Sans'] font-bold text-[40px] leading-[48px] text-center text-[#FFECE6] tracking-normal m-0 p-0">
              Where are you <span className="text-[#EC6229]">right now?</span>
            </h1>
            <p className="w-full font-['DM_Sans'] font-semibold text-[16px] leading-[24px] text-center text-[#FFECE6] m-0 p-0">
              Tell us about your current situation and interests
            </p>
          </div>

          {/* Figma Inputs Container: w-64 inline-flex flex-col justify-start items-center gap-3 */}
          <form
            onSubmit={handleSubmit}
            className="w-64 inline-flex flex-col justify-start items-center gap-3 mt-1"
          >
            {/* Input 1: Status */}
            <div className="h-14 flex flex-col justify-start items-start gap-2.5">
              <OnboardingDropdown
                id="status-dropdown"
                placeholder="Status"
                value={selectedStatus}
                options={statusOptions}
                onSelect={(opt) => {
                  const val = opt ? opt.id : null;
                  setSelectedStatus(val);
                  setUserRole(val);
                }}
                isLoading={loadingStatus}
                disabled={submitting}
              />
            </div>

            {/* Input 2: Industry (optional) */}
            <div className="h-14 flex flex-col justify-start items-start gap-2">
              <OnboardingDropdown
                id="industry-dropdown"
                placeholder="Industry (optional)"
                value={selectedIndustry}
                options={industryOptions}
                onSelect={(opt) => {
                  const val = opt ? opt.id : null;
                  setSelectedIndustry(val);
                  setIndustry(val);
                }}
                searchable
                isLoading={loadingIndustries}
                disabled={submitting}
                clearable
              />
            </div>

            {/* Input 3: Location */}
            <div className="h-14 flex flex-col justify-start items-start gap-2.5">
              <OnboardingLocationInput
                id="location-dropdown"
                value={selectedLocationObj?.formattedAddress || null}
                onSelect={(loc) => {
                  setSelectedLocationObj(loc);
                  setLocation(loc);
                }}
                disabled={submitting}
              />
            </div>

            {/* Continue Button */}
            <div className="w-64 flex justify-center mt-2">
              <PillButton
                type="submit"
                disabled={!isFormValid || submitting}
                isLoading={submitting}
                label="Continue"
                className="!w-64 !h-[36px]"
              />
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default StepLocationStatus;
