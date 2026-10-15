"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { ChevronDown, Search, Check, MapPin, Loader2 } from "lucide-react";
import { Icon } from "@iconify/react";
import { TickIcon } from "@/components/icons";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";
import { useDebounce } from "@/hooks/use-debounce";
import { STATIC_LOCATIONS, StaticLocation } from "@/data/staticLocations";
import { useCompanyOnboardingStore } from "../store/company-onboarding.store";
import {
  searchPlaces,
  getPlaceDetails,
  PlacesSuggestion,
  StructuredLocation,
} from "@/services/api/location";
import { InteractiveLocationMap } from "./InteractiveLocationMap";
import {
  sendEmailOTP,
  confirmEmailOTP,
  sendPhoneOTP,
  confirmPhoneOTP,
} from "../services/company-onboarding.api";

interface StepPresenceProps {
  onNext: () => void;
  onBack?: () => void;
}

const COUNTRY_CODES = [
  {
    code: "+91",
    flag: "🇮🇳",
    icon: "twemoji:flag-india",
    label: "India (+91)",
  },
  {
    code: "+971",
    flag: "🇦🇪",
    icon: "twemoji:flag-united-arab-emirates",
    label: "UAE (+971)",
  },
];

const ORG_SIZES = [
  "1–10 members",
  "11–50 members",
  "51–200 members",
  "201–500 members",
  "501–1,000 members",
  "1,001–5,000 members",
  "5,001–10,000 members",
  "10,000+ members",
];

const POPULAR_LOCATIONS = [
  "New York, NY, USA",
  "Jersey City, NJ, USA",
  "San Francisco, CA, USA",
  "Austin, TX, USA",
  "London, UK",
  "Bengaluru, Karnataka, India",
  "Mumbai, Maharashtra, India",
  "Dubai, United Arab Emirates",
  "Singapore",
];

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const isValidEmail = (email: string): boolean => EMAIL_REGEX.test(email.trim());
const isValidPhone = (phone: string, countryCode?: string): boolean => {
  const digits = phone.trim();
  if (countryCode === "+971") return /^\d{9}$/.test(digits);
  return /^\d{10}$/.test(digits);
};

const URL_REGEX = /^(https?:\/\/)?([a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}(:\d+)?(\/.*)?$/i;
const isValidUrl = (url: string): boolean => {
  if (!url || typeof url !== "string") return false;
  const trimmed = url.trim();
  if (!trimmed) return false;
  return URL_REGEX.test(trimmed);
};

const normalizeUrl = (url: string): string => {
  const trimmed = url.trim();
  if (!trimmed) return "";
  if (!/^https?:\/\//i.test(trimmed)) {
    return `https://${trimmed}`;
  }
  return trimmed;
};

interface ResendOtpButtonProps {
  onResend: () => Promise<void> | void;
  isSending: boolean;
  initialSeconds?: number;
  isExpired?: boolean;
}

const ResendOtpButton: React.FC<ResendOtpButtonProps> = ({
  onResend,
  isSending,
  initialSeconds = 60,
  isExpired = false,
}) => {
  const [secondsLeft, setSecondsLeft] = useState(initialSeconds);

  useEffect(() => {
    if (secondsLeft <= 0 || isExpired) return;
    const interval = setInterval(() => {
      setSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [secondsLeft, isExpired]);

  const handleResend = async () => {
    await onResend();
    setSecondsLeft(initialSeconds);
  };

  if (secondsLeft > 0 && !isExpired) {
    const mins = Math.floor(secondsLeft / 60)
      .toString()
      .padStart(2, "0");
    const secs = (secondsLeft % 60).toString().padStart(2, "0");
    return (
      <span className="font-['DM_Sans'] font-normal text-xs leading-4 whitespace-nowrap flex items-center">
        <span className="text-ds-text-secondary">Resend code in </span>
        <span className="text-ds-accent font-['DM_Sans'] font-normal text-xs leading-4 tabular-nums ml-1 inline-block min-w-[34px] text-right">
          {mins}:{secs}
        </span>
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={handleResend}
      disabled={isSending}
      className="font-['DM_Sans'] font-normal text-xs leading-4 text-ds-accent hover:opacity-80 transition-opacity cursor-pointer disabled:opacity-50 whitespace-nowrap text-right"
    >
      Resend code
    </button>
  );
};

export const StepPresence: React.FC<StepPresenceProps> = ({ onNext }) => {
  const {
    organizationType,
    organizationName,
    officialEmail,
    isEmailVerified,
    phoneCountryCode,
    phoneNumber,
    isPhoneVerified,
    website,
    organizationSize,
    hqCity,
    hqCountry,
    hqLatitude,
    hqLongitude,
    headline,
    description,
    updateField,
  } = useCompanyOnboardingStore();

  const isInstitution = organizationType === "INSTITUTION";

  // Verification & input states
  const [emailOtp, setEmailOtp] = useState("");
  const [phoneOtp, setPhoneOtp] = useState("");
  const [emailCodeSent, setEmailCodeSent] = useState(false);
  const [phoneCodeSent, setPhoneCodeSent] = useState(false);
  const [isSendingEmailOtp, setIsSendingEmailOtp] = useState(false);
  const [isSendingPhoneOtp, setIsSendingPhoneOtp] = useState(false);
  const [isCheckingEmailOtp, setIsCheckingEmailOtp] = useState(false);
  const [isCheckingPhoneOtp, setIsCheckingPhoneOtp] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [phoneError, setPhoneError] = useState("");

  // Dropdown & Location states
  const [isCountryDropdownOpen, setIsCountryDropdownOpen] = useState(false);
  const [isOrgSizeDropdownOpen, setIsOrgSizeDropdownOpen] = useState(false);
  const [isLocationDropdownOpen, setIsLocationDropdownOpen] = useState(false);
  const [locationQuery, setLocationQuery] = useState(hqCity || "");
  const debouncedLocationQuery = useDebounce(locationQuery, 300);
  const [placesSuggestions, setPlacesSuggestions] = useState<
    PlacesSuggestion[]
  >([]);
  const [isSearchingPlaces, setIsSearchingPlaces] = useState(false);
  const sessionTokenRef = useRef<string>(uuidv4());

  // Keep locationQuery in sync with store when hqCity updates
  useEffect(() => {
    if (hqCity && !locationQuery) {
      setLocationQuery(hqCity);
    }
  }, [hqCity]);

  // Ensure organizationSize is initialized if empty
  useEffect(() => {
    if (!organizationSize) {
      updateField("organizationSize", "1–10 members");
    }
  }, [organizationSize, updateField]);

  const countryDropdownRef = useRef<HTMLDivElement>(null);
  const orgSizeDropdownRef = useRef<HTMLDivElement>(null);
  const locationDropdownRef = useRef<HTMLDivElement>(null);
  const descriptionTextareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize description textarea on mount and whenever description changes so it doesn't collapse
  useEffect(() => {
    const resize = () => {
      if (descriptionTextareaRef.current) {
        descriptionTextareaRef.current.style.height = "auto";
        descriptionTextareaRef.current.style.height = `${Math.max(
          20,
          descriptionTextareaRef.current.scrollHeight
        )}px`;
      }
    };
    resize();
    const frameId = requestAnimationFrame(resize);
    return () => cancelAnimationFrame(frameId);
  }, [description]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        countryDropdownRef.current &&
        !countryDropdownRef.current.contains(e.target as Node)
      ) {
        setIsCountryDropdownOpen(false);
      }
      if (
        orgSizeDropdownRef.current &&
        !orgSizeDropdownRef.current.contains(e.target as Node)
      ) {
        setIsOrgSizeDropdownOpen(false);
      }
      if (
        locationDropdownRef.current &&
        !locationDropdownRef.current.contains(e.target as Node)
      ) {
        setIsLocationDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handlers for Email Verification
  const handleSendEmailOtp = async () => {
    if (
      !isValidEmail(officialEmail) ||
      isEmailVerified ||
      isSendingEmailOtp ||
      emailCodeSent
    )
      return;
    setIsSendingEmailOtp(true);
    setEmailError("");
    try {
      await sendEmailOTP(officialEmail.trim());
      setEmailCodeSent(true);
      toast.success("Verification code sent to your email");
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to send verification code";
      toast.error(msg);
    } finally {
      setIsSendingEmailOtp(false);
    }
  };

  const handleResendEmailOtp = async () => {
    if (!isValidEmail(officialEmail) || isEmailVerified || isSendingEmailOtp) return;
    setIsSendingEmailOtp(true);
    setEmailError("");
    setEmailOtp("");
    try {
      await sendEmailOTP(officialEmail.trim());
      setEmailCodeSent(true);
      toast.success("Verification code resent to your email");
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to send verification code";
      toast.error(msg);
    } finally {
      setIsSendingEmailOtp(false);
    }
  };

  const handleEmailOtpChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    if (isEmailVerified || isCheckingEmailOtp) return;
    const val = e.target.value.replace(/\D/g, "").slice(0, 6);
    setEmailOtp(val);
    if (emailError) setEmailError("");

    if (val.length === 6) {
      setIsCheckingEmailOtp(true);
      try {
        const res = await confirmEmailOTP(officialEmail.trim(), val);
        if (res && (res.success === false || (res as any).error)) {
          updateField("isEmailVerified", false);
          const errText =
            res.message || (res as any).error?.message || (res as any).error || "Incorrect code";
          setEmailError(errText);
          toast.error(errText);
          return;
        }

        updateField("isEmailVerified", true);
        setEmailError("");
        toast.success("Email verified successfully");
      } catch (err: any) {
        updateField("isEmailVerified", false);
        const msg =
          err?.response?.data?.message ||
          err?.response?.data?.error ||
          err?.message ||
          "Incorrect verification code";
        setEmailError(msg);
        toast.error(msg);
      } finally {
        setIsCheckingEmailOtp(false);
      }
    }
  };

  // Handlers for Phone Verification
  const handleSendPhoneOtp = async () => {
    if (!isValidPhone(phoneNumber, phoneCountryCode) || isPhoneVerified || isSendingPhoneOtp || phoneCodeSent) return;
    setIsSendingPhoneOtp(true);
    setPhoneError("");
    const fullPhone = `${phoneCountryCode}${phoneNumber.trim()}`;
    try {
      await sendPhoneOTP(fullPhone);
      setPhoneCodeSent(true);
      toast.success("Verification code sent to your phone");
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to send verification code";
      toast.error(msg);
    } finally {
      setIsSendingPhoneOtp(false);
    }
  };

  const handleResendPhoneOtp = async () => {
    if (!isValidPhone(phoneNumber) || isPhoneVerified || isSendingPhoneOtp) return;
    setIsSendingPhoneOtp(true);
    setPhoneError("");
    setPhoneOtp("");
    const fullPhone = `${phoneCountryCode}${phoneNumber.trim()}`;
    try {
      await sendPhoneOTP(fullPhone);
      setPhoneCodeSent(true);
      toast.success("Verification code resent to your phone");
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to send verification code";
      toast.error(msg);
    } finally {
      setIsSendingPhoneOtp(false);
    }
  };

  const handlePhoneOtpChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    if (isPhoneVerified || isCheckingPhoneOtp) return;
    const val = e.target.value.replace(/\D/g, "").slice(0, 6);
    setPhoneOtp(val);
    if (phoneError) setPhoneError("");

    if (val.length === 6) {
      setIsCheckingPhoneOtp(true);
      const fullPhone = `${phoneCountryCode}${phoneNumber.trim()}`;
      try {
        const res = await confirmPhoneOTP(fullPhone, val);
        if (res && (res.success === false || (res as any).error)) {
          updateField("isPhoneVerified", false);
          const errText =
            res.message || (res as any).error?.message || (res as any).error || "Incorrect code";
          setPhoneError(errText);
          toast.error(errText);
          return;
        }

        updateField("isPhoneVerified", true);
        setPhoneError("");
        toast.success("Phone number verified successfully");
      } catch (err: any) {
        updateField("isPhoneVerified", false);
        const msg =
          err?.response?.data?.message ||
          err?.response?.data?.error ||
          err?.message ||
          "Incorrect verification code";
        setPhoneError(msg);
        toast.error(msg);
      } finally {
        setIsCheckingPhoneOtp(false);
      }
    }
  };

  const handlePhoneNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isPhoneVerified) return;
    const maxLen = phoneCountryCode === "+971" ? 9 : 10;
    const digitsOnly = e.target.value.replace(/\D/g, "").slice(0, maxLen);
    updateField("phoneNumber", digitsOnly);
    if (phoneCodeSent) setPhoneCodeSent(false);
    if (phoneOtp) setPhoneOtp("");
    if (phoneError) setPhoneError("");
  };

  // Google Places Autocomplete API search effect (matching User Onboarding & Job flows)
  useEffect(() => {
    const q = debouncedLocationQuery.trim();
    if (!q || q.length < 2) {
      setPlacesSuggestions([]);
      setIsSearchingPlaces(false);
      return;
    }

    let isActive = true;
    setIsSearchingPlaces(true);

    searchPlaces(q, sessionTokenRef.current, undefined, true)
      .then((results) => {
        if (isActive) {
          setPlacesSuggestions(results || []);
        }
      })
      .catch((err) => {
        console.error("Google Places search error:", err);
        if (isActive) setPlacesSuggestions([]);
      })
      .finally(() => {
        if (isActive) setIsSearchingPlaces(false);
      });

    return () => {
      isActive = false;
    };
  }, [debouncedLocationQuery]);

  const handleLocationSelect = async (loc: PlacesSuggestion | StaticLocation | string) => {
    setIsLocationDropdownOpen(false);

    if (typeof loc === "string") {
      setLocationQuery(loc);
      updateField("hqCity", loc);
      return;
    }

    // Static location from curated list
    if ("formattedAddress" in loc) {
      const fullText = loc.formattedAddress || loc.city;
      setLocationQuery(fullText);
      updateField("hqCity", fullText);
      if (loc.country) updateField("hqCountry", loc.country);
      if (loc.latitude != null) updateField("hqLatitude", loc.latitude);
      if (loc.longitude != null) updateField("hqLongitude", loc.longitude);
      return;
    }

    // Google Places suggestion
    const fallbackText = loc.description || loc.displayName || "";
    setLocationQuery(fallbackText);
    updateField("hqCity", fallbackText);

    if (loc.placeId) {
      try {
        const details = await getPlaceDetails(
          loc.placeId,
          sessionTokenRef.current,
          true,
        );
        // Reset session token for subsequent searches per Google Places API spec
        sessionTokenRef.current = uuidv4();
        if (details) {
          const finalAddress = details.formattedAddress || details.city || fallbackText;
          setLocationQuery(finalAddress);
          updateField("hqCity", finalAddress);
          if (details.country) {
            updateField("hqCountry", details.country);
          }
          if (details.latitude != null) {
            updateField("hqLatitude", details.latitude);
          }
          if (details.longitude != null) {
            updateField("hqLongitude", details.longitude);
          }
        }
      } catch (err) {
        console.error("Failed to get place details:", err);
      }
    }
  };

  const handleMapLocationChange = useCallback(
    (loc: StructuredLocation) => {
      const finalAddress =
        loc.formattedAddress ||
        [loc.street, loc.sublocality || loc.village, loc.city, loc.state, loc.country]
          .filter(Boolean)
          .join(", ");
      if (finalAddress) {
        setLocationQuery(finalAddress);
        updateField("hqCity", finalAddress);
      }
      if (loc.country) updateField("hqCountry", loc.country);
      if (loc.latitude != null) updateField("hqLatitude", loc.latitude);
      if (loc.longitude != null) updateField("hqLongitude", loc.longitude);
    },
    [updateField],
  );

  // Validation: except description and website all fields are mandatory; email and phone must be verified
  const isWebsiteValid = !website.trim() || isValidUrl(website);
  const hasWebsiteError = Boolean(website.trim() && !isValidUrl(website));

  const isFormValid = Boolean(
    isValidEmail(officialEmail) &&
    isEmailVerified &&
    isValidPhone(phoneNumber, phoneCountryCode) &&
    isPhoneVerified &&
    headline.trim().length > 0 &&
    headline.trim().length <= 255 &&
    (description ? description.length <= 500 : true) &&
    (locationQuery.trim().length > 0 || (hqCity && hqCity.trim().length > 0)) &&
    (organizationSize || "1–10 members").trim().length > 0 &&
    isWebsiteValid,
  );

  const handleSubmit = useCallback(
    (e?: React.FormEvent) => {
      if (e) e.preventDefault();
      if (!isWebsiteValid) return;
      if (!organizationSize) {
        updateField("organizationSize", "1–10 members");
      }
      if (website.trim() && isValidUrl(website)) {
        updateField("website", normalizeUrl(website));
      }
      if (isFormValid) {
        onNext();
      }
    },
    [isFormValid, isWebsiteValid, onNext, organizationSize, updateField, website],
  );

  const currentCountry =
    COUNTRY_CODES.find((c) => c.code === phoneCountryCode) || COUNTRY_CODES[0];

  const filteredPopularLocations = STATIC_LOCATIONS.filter((loc) =>
    loc.formattedAddress.toLowerCase().includes(locationQuery.toLowerCase().trim()) ||
    loc.city.toLowerCase().includes(locationQuery.toLowerCase().trim())
  ).slice(0, 8);
  return (
    <div
      className="w-full max-w-[800px] mx-auto p-4 pt-2 pb-12 flex flex-col items-center gap-10 rounded-3xl select-none animate-in fade-in duration-300"
    >
      {/* Title (800x48) */}
      <h1 className="w-full max-w-[800px] h-[48px] self-stretch flex items-center justify-center text-center font-['DM_Sans'] font-bold text-[32px] sm:text-[40px] leading-[48px] m-0">
        <span className="text-ds-text-primary">Stage 2: </span>
        <span className="text-ds-accent ml-2">Presence</span>
      </h1>

      {/* Steper Box (618x48) */}
      <div
        data-amount="3"
        className="w-full max-w-[618px] h-[48px] flex flex-row justify-center items-start p-0"
      >
        {/* Step 1: Identity (Done) */}
        <div
          data-position="Start"
          data-state="Done"
          className="w-52 flex-1 max-w-[206px] flex flex-col justify-center items-center gap-2 p-0 min-w-0"
        >
          <div className="w-full h-4 flex flex-row items-center p-0">
            <div className="flex-1 h-0.5" />
            <div className="size-4 flex justify-center items-center shrink-0">
              <div className="size-4 rounded-full bg-ds-accent flex items-center justify-center">
                <Check
                  className="size-4 text-ds-text-primary stroke-[2.5]"
                  strokeWidth={2.5}
                />
              </div>
            </div>
            <div className="flex-1 h-[2px] bg-ds-accent" />
          </div>
          <div className="w-full h-6 flex justify-center items-center px-1">
            <span className="w-full max-w-[148px] text-center text-ds-text-secondary text-base font-normal font-['DM_Sans'] leading-6 truncate">
              Stage 1: Identity
            </span>
          </div>
        </div>

        {/* Step 2: Presence (Active) */}
        <div
          data-position="Middle"
          data-state="Active"
          className="w-52 flex-1 max-w-[206px] flex flex-col justify-center items-center gap-2 p-0 min-w-0"
        >
          <div className="w-full h-4 flex flex-row items-center p-0">
            <div className="flex-1 h-[2px] bg-ds-accent" />
            <div className="size-4 flex justify-center items-center shrink-0">
              <div className="size-4 rounded-full bg-ds-accent flex items-center justify-center">
                <div className="size-2 rounded-full bg-ds-bg" />
              </div>
            </div>
            <div className="flex-1 h-[2px] bg-ds-border" />
          </div>
          <div className="w-full h-6 flex justify-center items-center px-1">
            <span className="w-full max-w-[148px] text-center text-ds-accent text-base font-normal font-['DM_Sans'] leading-6 truncate">
              Stage 2: Presence
            </span>
          </div>
        </div>

        {/* Step 3: Verification (Default) */}
        <div
          data-position="End"
          data-state="Default"
          className="w-52 flex-1 max-w-[206px] flex flex-col justify-center items-center gap-2 p-0 min-w-0"
        >
          <div className="w-full h-4 flex flex-row items-center p-0">
            <div className="flex-1 h-[2px] bg-ds-border" />
            <div className="size-4 rounded-full bg-ds-text-secondary relative flex justify-center items-center shrink-0">
              <div className="size-2 rounded-full bg-ds-border" />
            </div>
            <div className="flex-1 h-0.5" />
          </div>
          <div className="w-full h-6 flex justify-center items-center px-1">
            <span className="w-full max-w-[148px] text-center text-ds-text-secondary text-base font-normal font-['DM_Sans'] leading-6 truncate">
              Stage 3: Verification
            </span>
          </div>
        </div>
      </div>

      {/* Form Fields: 800px Container */}
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-[800px] flex flex-col justify-start items-start gap-6 sm:gap-8"
      >
        {/* Row 1: Email & Email Code */}
        <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-10 items-start">
          {/* Official Email */}
          <div className="flex items-center gap-3 w-full">
            <div className="flex-1 py-2 border-b border-ds-border focus-within:border-ds-accent flex flex-col justify-center items-start gap-2.5 transition-colors">
              <label
                htmlFor="official-email"
                className="text-left text-ds-text-secondary text-xs font-medium font-['DM_Sans'] leading-4 cursor-pointer"
              >
                Official Email <span className="text-ds-text-secondary">*</span>
              </label>
              <input
                id="official-email"
                type="email"
                disabled={isEmailVerified}
                value={officialEmail}
                onChange={(e) => {
                  updateField("officialEmail", e.target.value);
                  if (emailCodeSent) setEmailCodeSent(false);
                  if (emailOtp) setEmailOtp("");
                  if (emailError) setEmailError("");
                }}
                placeholder={organizationName ? `${organizationName.replace(/\s+/g, "").toLowerCase()}@gmail.com` : "companyname@gmail.com"}
                autoComplete="email"
                className="w-full bg-transparent text-ds-text-primary text-sm font-normal font-['DM_Sans'] leading-5 focus:outline-none placeholder:text-ds-text-muted disabled:opacity-60 disabled:cursor-default"
              />
            </div>
            {isEmailVerified ? (
              <div
                className="flex flex-row justify-center items-center px-3 py-1.5 gap-2.5 h-9 border border-ds-success rounded-[100px] select-none cursor-default shrink-0 pointer-events-none"
                aria-disabled="true"
              >
                <span className="flex justify-center items-center text-ds-success font-['DM_Sans'] font-medium text-sm leading-6">
                  Verified
                </span>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleSendEmailOtp}
                disabled={!isValidEmail(officialEmail) || isSendingEmailOtp || emailCodeSent}
                className={`h-9 px-3 py-1.5 rounded-[100px] flex justify-center items-center gap-2.5 transition-colors shrink-0 text-sm font-medium font-['DM_Sans'] leading-6 ${isValidEmail(officialEmail) && !emailCodeSent && !isSendingEmailOtp
                  ? "bg-ds-surface-2 hover:bg-ds-surface-1 text-ds-text-primary border border-ds-border cursor-pointer active:scale-95"
                  : "bg-ds-surface-1 text-ds-text-muted cursor-default select-none pointer-events-none"
                  }`}
              >
                {isSendingEmailOtp ? (
                  <Loader2 className="w-4 h-4 animate-spin text-ds-text-primary" />
                ) : (
                  "Verify"
                )}
              </button>
            )}
          </div>

          {/* Verification Code for Email */}
          <div className="relative flex flex-col justify-start items-start w-full">
            <div
              className={`w-full py-2 border-b flex flex-col justify-center items-start gap-2.5 transition-colors ${isEmailVerified
                ? "!border-ds-success"
                : emailError
                  ? "!border-ds-error"
                  : !emailCodeSent
                  ? "border-ds-border opacity-50"
                  : "border-ds-border focus-within:border-ds-accent"
                }`}
            >
              <label
                htmlFor="email-verification-code"
                className={`text-left text-ds-text-secondary text-xs font-medium font-['DM_Sans'] leading-4 ${
                  !emailCodeSent || isEmailVerified ? "cursor-default" : "cursor-pointer"
                }`}
              >
                Verification Code
              </label>
              <div className="w-full inline-flex justify-between items-center">
                <input
                  id="email-verification-code"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  disabled={!emailCodeSent || isEmailVerified || isCheckingEmailOtp}
                  value={emailOtp}
                  onChange={handleEmailOtpChange}
                  onFocus={() => {
                    if (emailError) setEmailError("");
                  }}
                  placeholder="000000"
                  className="w-full bg-transparent text-ds-text-primary text-sm font-normal font-['DM_Sans'] leading-5 focus:outline-none placeholder:text-ds-text-muted focus:placeholder:text-ds-text-muted tracking-widest disabled:opacity-60 disabled:cursor-default"
                />
                {isCheckingEmailOtp ? (
                  <Loader2 className="w-4 h-4 animate-spin text-ds-text-secondary flex-none" />
                ) : isEmailVerified ? (
                  <TickIcon className="w-5 h-5 flex-none" />
                ) : null}
              </div>
            </div>
            {/* Supporting Note Row below input positioned absolutely to prevent layout shifts */}
            <div className="absolute top-full left-0 right-0 h-4 flex items-center justify-between pt-1 pointer-events-auto">
              <div className="flex-1">
                {emailError ? (
                  <span className="font-['DM_Sans'] font-normal text-xs leading-4 text-ds-error text-left">
                    {emailError}
                  </span>
                ) : isEmailVerified ? (
                  <span className="font-['DM_Sans'] font-normal text-xs leading-4 text-ds-success text-left">
                    Account verified
                  </span>
                ) : (
                  <span />
                )}
              </div>
              {!isEmailVerified && emailCodeSent && (
                <div className="flex-none ml-2">
                  <ResendOtpButton
                    onResend={handleResendEmailOtp}
                    isSending={isSendingEmailOtp}
                    initialSeconds={60}
                    isExpired={emailError?.toLowerCase().includes("expired")}
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Row 2: Phone Number & Phone Code */}
        <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-10 items-start">
          {/* Phone Number */}
          <div className="flex items-center gap-3 w-full">
            <div className="flex-1 py-2 border-b border-ds-border focus-within:border-ds-accent flex flex-col justify-center items-start gap-2.5 transition-colors">
              <label
                htmlFor="phone-number"
                className="text-left text-ds-text-secondary text-xs font-medium font-['DM_Sans'] leading-4 cursor-pointer"
              >
                Phone Number <span className="text-ds-text-secondary">*</span>
              </label>
              <div className="w-full inline-flex justify-start items-center gap-2">
                {/* Country Flag Selector */}
                <div ref={countryDropdownRef} className="relative">
                  <button
                    type="button"
                    disabled={isPhoneVerified}
                    onClick={() => setIsCountryDropdownOpen((prev) => !prev)}
                    className="flex flex-row items-center p-0 gap-1 w-[36px] h-4 flex-none cursor-pointer hover:opacity-80 transition-opacity focus:outline-none disabled:opacity-60 disabled:cursor-default"
                    aria-label="Select Country Code"
                  >
                    <Icon
                      icon={currentCountry.icon}
                      width={16}
                      height={16}
                      className="w-4 h-4 flex-none shrink-0"
                      fallback={<span className="text-base leading-none select-none">{currentCountry.flag}</span>}
                    />
                    <ChevronDown
                      className={`w-4 h-4 flex-none shrink-0 text-ds-text-secondary transition-transform duration-200 ${isCountryDropdownOpen ? "rotate-180" : ""
                        }`}
                    />
                  </button>

                  {/* Country Dropdown */}
                  {isCountryDropdownOpen && !isPhoneVerified && (
                    <div className="absolute top-full left-0 mt-2 z-50 w-56 p-1.5 bg-ds-bg rounded-xl border border-ds-border flex flex-col justify-start items-start gap-1 shadow-2xl animate-in fade-in duration-150">
                      {COUNTRY_CODES.map((item) => {
                        const isSelected = item.code === phoneCountryCode;
                        return (
                          <div
                            key={item.code}
                            onClick={() => {
                              updateField("phoneCountryCode", item.code);
                              setIsCountryDropdownOpen(false);
                              if (phoneCodeSent) setPhoneCodeSent(false);
                              if (phoneOtp) setPhoneOtp("");
                              if (phoneError) setPhoneError("");
                            }}
                            className="self-stretch h-9 px-3 rounded-lg inline-flex items-center justify-start gap-2.5 cursor-pointer transition-colors group"
                          >
                            <Icon
                              icon={item.icon}
                              width={16}
                              height={16}
                              className="w-4 h-4 flex-none shrink-0"
                              fallback={<span className="text-base leading-none select-none">{item.flag}</span>}
                            />
                            <span
                              className={`text-sm font-['DM_Sans'] leading-5 truncate transition-colors ${isSelected
                                ? "text-ds-accent font-medium"
                                : "text-ds-text-secondary group-hover:text-ds-text-primary font-normal"
                                }`}
                            >
                              {item.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <input
                  id="phone-number"
                  type="tel"
                  maxLength={phoneCountryCode === "+971" ? 9 : 10}
                  disabled={isPhoneVerified}
                  value={phoneNumber}
                  onChange={handlePhoneNumberChange}
                  placeholder="9876543210"
                  className="w-full bg-transparent text-ds-text-primary text-sm font-normal font-['DM_Sans'] leading-5 focus:outline-none placeholder:text-ds-text-muted disabled:opacity-60 disabled:cursor-default"
                />
              </div>
            </div>
            {isPhoneVerified ? (
              <div
                className="flex flex-row justify-center items-center px-3 py-1.5 gap-2.5 h-9 border border-ds-success rounded-[100px] select-none cursor-default shrink-0 pointer-events-none"
                aria-disabled="true"
              >
                <span className="flex justify-center items-center text-ds-success font-['DM_Sans'] font-medium text-sm leading-6">
                  Verified
                </span>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleSendPhoneOtp}
                disabled={!isValidPhone(phoneNumber) || isSendingPhoneOtp || phoneCodeSent}
                className={`h-9 px-3 py-1.5 rounded-[100px] flex justify-center items-center gap-2.5 transition-colors shrink-0 text-sm font-medium font-['DM_Sans'] leading-6 ${isValidPhone(phoneNumber) && !phoneCodeSent && !isSendingPhoneOtp
                  ? "bg-ds-surface-2 hover:bg-ds-surface-1 text-ds-text-primary border border-ds-border cursor-pointer active:scale-95"
                  : "bg-ds-surface-1 text-ds-text-muted cursor-default select-none pointer-events-none"
                  }`}
              >
                {isSendingPhoneOtp ? (
                  <Loader2 className="w-4 h-4 animate-spin text-ds-text-primary" />
                ) : (
                  "Verify"
                )}
              </button>
            )}
          </div>

          {/* Verification Code for Phone */}
          <div className="relative flex flex-col justify-start items-start w-full">
            <div
              className={`w-full py-2 border-b flex flex-col justify-center items-start gap-2.5 transition-colors ${isPhoneVerified
                ? "!border-ds-success"
                : phoneError
                  ? "!border-ds-error"
                  : !phoneCodeSent
                  ? "border-ds-border opacity-50"
                  : "border-ds-border focus-within:border-ds-accent"
                }`}
            >
              <label
                htmlFor="phone-verification-code"
                className={`text-left text-ds-text-secondary text-xs font-medium font-['DM_Sans'] leading-4 ${
                  !phoneCodeSent || isPhoneVerified ? "cursor-default" : "cursor-pointer"
                }`}
              >
                Verification Code
              </label>
              <div className="w-full inline-flex justify-between items-center">
                <input
                  id="phone-verification-code"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  disabled={!phoneCodeSent || isPhoneVerified || isCheckingPhoneOtp}
                  value={phoneOtp}
                  onChange={handlePhoneOtpChange}
                  onFocus={() => {
                    if (phoneError) setPhoneError("");
                  }}
                  placeholder="000000"
                  className="w-full bg-transparent text-ds-text-primary text-sm font-normal font-['DM_Sans'] leading-5 focus:outline-none placeholder:text-ds-text-muted focus:placeholder:text-ds-text-muted tracking-widest disabled:opacity-60 disabled:cursor-default"
                />
                {isCheckingPhoneOtp ? (
                  <Loader2 className="w-4 h-4 animate-spin text-ds-text-secondary flex-none" />
                ) : isPhoneVerified ? (
                  <TickIcon className="w-5 h-5 flex-none" />
                ) : null}
              </div>
            </div>
            {/* Supporting Note Row below input positioned absolutely to prevent layout shifts */}
            <div className="absolute top-full left-0 right-0 h-4 flex items-center justify-between pt-1 pointer-events-auto">
              <div className="flex-1">
                {phoneError ? (
                  <span className="font-['DM_Sans'] font-normal text-xs leading-4 text-ds-error text-left">
                    {phoneError}
                  </span>
                ) : isPhoneVerified ? (
                  <span className="font-['DM_Sans'] font-normal text-xs leading-4 text-ds-success text-left">
                    Account verified
                  </span>
                ) : (
                  <span />
                )}
              </div>
              {!isPhoneVerified && phoneCodeSent && (
                <div className="flex-none ml-2">
                  <ResendOtpButton
                    onResend={handleResendPhoneOtp}
                    isSending={isSendingPhoneOtp}
                    initialSeconds={60}
                    isExpired={phoneError?.toLowerCase().includes("expired")}
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Row 3: Website & Organization Size */}
        <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-10 items-start">
          {/* Website */}
          <div className="flex flex-col justify-start items-start gap-1 w-full">
            <div
              className={`w-full py-2 border-b flex flex-col justify-center items-start gap-2.5 transition-colors ${hasWebsiteError
                ? "!border-ds-error"
                : "border-ds-border focus-within:border-ds-accent"
                }`}
            >
              <label
                htmlFor="website-input"
                className="text-left text-ds-text-secondary text-xs font-medium font-['DM_Sans'] leading-4 cursor-pointer"
              >
                Website
              </label>
              <input
                id="website-input"
                type="url"
                value={website}
                onChange={(e) => updateField("website", e.target.value)}
                onBlur={() => {
                  if (website.trim() && isValidUrl(website)) {
                    updateField("website", normalizeUrl(website));
                  }
                }}
                placeholder="https://www.cocpit.com"
                className="w-full bg-transparent text-ds-text-primary text-sm font-normal font-['DM_Sans'] leading-5 focus:outline-none placeholder:text-ds-text-muted"
              />
            </div>
            <div className="ds-supporting-area">
              {hasWebsiteError && (
                <span className="text-left text-xs font-normal font-['DM_Sans'] leading-4 transition-colors text-ds-error">
                  Enter a valid website URL
                </span>
              )}
            </div>
          </div>

          {/* Organization Size */}
          <div ref={orgSizeDropdownRef} className="relative w-full">
            <div
              onClick={() => setIsOrgSizeDropdownOpen((prev) => !prev)}
              className="w-full py-2 border-b border-ds-border focus-within:border-ds-accent flex flex-col justify-center items-start gap-2.5 cursor-pointer transition-colors"
            >
              <span className="text-left text-ds-text-secondary text-xs font-medium font-['DM_Sans'] leading-4">
                Organization Size
              </span>
              <div className="w-full inline-flex justify-between items-center">
                <span className="text-ds-text-primary text-sm font-normal font-['DM_Sans'] leading-5">
                  {organizationSize || "1–10 members"}
                </span>
                <ChevronDown
                  className={`w-4 h-4 text-ds-text-primary transition-transform duration-200 ${isOrgSizeDropdownOpen ? "rotate-180" : ""
                    }`}
                />
              </div>
            </div>

            {/* Dropdown Options */}
            {isOrgSizeDropdownOpen && (
              <div className="absolute top-full left-0 mt-2 z-50 w-full sm:w-96 max-w-full p-1.5 bg-ds-bg rounded-xl border border-ds-border inline-flex flex-col justify-start items-center gap-1 overflow-hidden shadow-2xl animate-in fade-in duration-150">
                <div className="self-stretch flex flex-col justify-start items-start gap-1 max-h-72 overflow-y-auto scrollbar-none [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  {ORG_SIZES.map((size) => {
                    const isSelected = (organizationSize || "1–10 members") === size;
                    return (
                      <div
                        key={size}
                        onClick={() => {
                          updateField("organizationSize", size);
                          setIsOrgSizeDropdownOpen(false);
                        }}
                        className="self-stretch h-9 px-3 rounded-lg inline-flex justify-between items-center cursor-pointer transition-colors group"
                      >
                        <span
                          className={`text-sm font-['DM_Sans'] leading-5 truncate transition-colors ${isSelected
                            ? "text-ds-accent font-medium"
                            : "text-ds-text-secondary group-hover:text-ds-text-primary font-normal"
                            }`}
                        >
                          {size}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Row 4: HEADQUARTERS LOCATION */}
        <div className="w-full flex flex-col justify-start items-start gap-3 mt-1">
          <label className="text-left text-ds-text-primary text-base font-semibold font-['DM_Sans'] leading-6 uppercase tracking-wide">
            HEADQUARTERS LOCATION <span className="text-ds-text-secondary">*</span>
          </label>

          {/* Search Exact Location Input */}
          <div ref={locationDropdownRef} className="relative w-full">
            <div className="w-full h-10 py-1.5 border-b border-ds-border focus-within:border-ds-accent flex justify-between items-center transition-colors">
              <input
                type="text"
                value={locationQuery}
                onChange={(e) => {
                  setLocationQuery(e.target.value);
                  updateField("hqCity", e.target.value);
                  if (!isLocationDropdownOpen) setIsLocationDropdownOpen(true);
                }}
                onFocus={() => setIsLocationDropdownOpen(true)}
                placeholder="Exact Location"
                className="w-full bg-transparent text-ds-text-primary text-base font-normal font-['DM_Sans'] leading-6 focus:outline-none placeholder:text-ds-text-muted cursor-text"
              />
              {isSearchingPlaces ? (
                <Loader2 className="size-4 animate-spin text-ds-accent shrink-0" />
              ) : (
                <Search className="size-5 text-ds-text-secondary shrink-0" />
              )}
            </div>

            {/* Suggestions list */}
            {isLocationDropdownOpen && (
              <div className="absolute top-full left-0 mt-2 w-full p-2 bg-ds-bg rounded-xl border border-ds-border shadow-2xl flex flex-col gap-1 z-50 animate-in fade-in duration-150 max-h-56 overflow-y-auto scrollbar-none [scrollbar-width:none]">
                {isSearchingPlaces ? (
                  <div className="w-full py-3 flex items-center justify-center gap-2 text-xs text-ds-text-muted">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-ds-accent" />
                    <span>Searching Google Places...</span>
                  </div>
                ) : placesSuggestions.length > 0 ? (
                  placesSuggestions.map((place) => (
                    <div
                      key={place.placeId}
                      onClick={() => handleLocationSelect(place)}
                      className="w-full px-3 py-2 rounded-lg flex items-center gap-2 text-sm text-ds-text-secondary hover:text-ds-text-primary hover:bg-ds-surface-1/50 cursor-pointer transition-colors"
                    >
                      <MapPin className="size-4 text-ds-accent shrink-0" />
                      <span className="truncate">
                        {place.description || place.displayName}
                      </span>
                    </div>
                  ))
                ) : debouncedLocationQuery.trim().length >= 2 ? (
                  <div className="w-full py-3 text-center text-xs text-ds-text-muted">
                    No locations found
                  </div>
                ) : filteredPopularLocations.length > 0 ? (
                  <>
                    <div className="px-3 py-1 text-[11px] font-medium text-ds-text-muted uppercase tracking-wider">
                      Popular Locations
                    </div>
                    {filteredPopularLocations.map((loc) => {
                      const label = typeof loc === "string" ? loc : loc.formattedAddress || loc.city;
                      return (
                        <div
                          key={typeof loc === "string" ? loc : loc.id}
                          onClick={() => handleLocationSelect(loc)}
                          className="w-full px-3 py-2 rounded-lg flex items-center gap-2 text-sm text-ds-text-secondary hover:text-ds-text-primary hover:bg-ds-surface-1/50 cursor-pointer transition-colors"
                        >
                          <MapPin className="size-4 text-ds-text-muted shrink-0" />
                          <span className="truncate">{label}</span>
                        </div>
                      );
                    })}
                  </>
                ) : (
                  <div className="w-full py-3 text-center text-xs text-ds-text-muted">
                    No locations found
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Interactive Draggable Map (Zomato / Swiggy Style) */}
          <InteractiveLocationMap
            locationAddress={locationQuery.trim() || hqCity || "Kolhapur, Maharashtra, India"}
            latitude={hqLatitude}
            longitude={hqLongitude}
            onLocationChange={handleMapLocationChange}
            className="w-full"
          />
        </div>

        {/* Row 5: Headline (255 chars limit) */}
        <div className="w-full flex flex-col justify-start items-start gap-1">
          <div className="w-full py-2 border-b border-ds-border focus-within:border-ds-accent flex flex-col justify-center items-start gap-2.5 transition-colors">
            <label
              htmlFor="headline-input"
              className="text-left text-ds-text-secondary text-xs font-medium font-['DM_Sans'] leading-4 cursor-pointer"
            >
              Headline <span className="text-ds-text-secondary">*</span>
            </label>
            <input
              id="headline-input"
              type="text"
              maxLength={255}
              value={headline}
              onChange={(e) => updateField("headline", e.target.value)}
              placeholder="e.g., Accelerating global collaboration through kinetic tech"
              className="w-full bg-transparent text-ds-text-primary text-sm font-normal font-['DM_Sans'] leading-5 focus:outline-none placeholder:text-ds-text-muted"
            />
          </div>
          <div className="w-full flex justify-between items-start">
            <div className="flex-1" />
            <div className="flex-none ml-2">
              <span className="font-['DM_Sans'] font-normal text-xs leading-4 text-ds-text-muted">
                {headline.length}/255
              </span>
            </div>
          </div>
        </div>

        {/* Row 6: Description (500 chars limit, no artificial gap) */}
        <div className="w-full flex flex-col justify-start items-start gap-1">
          <div className="w-full py-2 border-b border-ds-border focus-within:border-ds-accent flex flex-col justify-center items-start gap-2.5 transition-colors">
            <label
              htmlFor="description-input"
              className="text-left text-ds-text-secondary text-xs font-medium font-['DM_Sans'] leading-4 cursor-pointer"
            >
              Description
            </label>
            <textarea
              ref={descriptionTextareaRef}
              id="description-input"
              rows={1}
              maxLength={500}
              value={description}
              onChange={(e) => {
                updateField("description", e.target.value);
                e.target.style.height = "auto";
                e.target.style.height = `${Math.max(20, e.target.scrollHeight)}px`;
              }}
              placeholder={
                isInstitution
                  ? "Describe your institute and what makes it unique."
                  : "Describe your company and what makes it unique."
              }
              className="w-full bg-transparent text-ds-text-primary text-sm font-normal font-['DM_Sans'] leading-5 focus:outline-none placeholder:text-ds-text-muted resize-none overflow-hidden"
              style={{ minHeight: "20px" }}
            />
          </div>
          <div className="w-full flex justify-between items-start">
            <div className="flex-1" />
            <div className="flex-none ml-2">
              <span className="font-['DM_Sans'] font-normal text-xs leading-4 text-ds-text-muted">
                {(description || "").length}/500
              </span>
            </div>
          </div>
        </div>
      </form>

      {/* Frame: Button Box (672x36 / 800x36) */}
      <div className="w-full max-w-[800px] h-[36px] flex justify-center items-center p-0 mt-2">
        {isFormValid ? (
          <button
            type="button"
            onClick={handleSubmit}
            className="w-[260px] h-[36px] py-1.5 px-3 bg-ds-accent hover:opacity-90 text-white rounded-[100px] flex justify-center items-center gap-2.5 transition-all cursor-pointer ds-focus-ring"
          >
            <span className="font-['DM_Sans'] font-medium text-base leading-6 text-white whitespace-nowrap">
              Next Step
            </span>
          </button>
        ) : (
          <div
            data-property-1="Disabled"
            className="w-[260px] h-[36px] py-1.5 px-3 bg-ds-surface-1 text-ds-text-muted rounded-[100px] flex justify-center items-center gap-2.5 cursor-default select-none"
          >
            <span className="font-['DM_Sans'] font-medium text-base leading-6 text-ds-text-muted whitespace-nowrap">
              Next Step
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export { StepPresence as Stage2Presence };
export default StepPresence;
