"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import { ChevronDown, X } from "lucide-react";
import { UploadIcon } from "@/components/icons";
import { useCompanyOnboardingStore } from "../store/company-onboarding.store";
import { getOnboardingOptions } from "@/services/api/onboarding";
import { CocpitUserProfileImageEditor } from "@/shared/commonComponents/CocpitUserProfileImageEditor";

interface StepIdentityProps {
  onNext: () => void;
  onBack?: () => void;
}

const INSTITUTION_OPTIONS = [
  { id: "school", label: "School" },
  { id: "college", label: "College" },
  { id: "university", label: "University" },
  { id: "coaching", label: "Coaching" },
  { id: "tuition", label: "Tuition" },
];

export const StepIdentity: React.FC<StepIdentityProps> = ({ onNext }) => {
  const {
    organizationType,
    organizationName,
    foundedYear,
    industry,
    logoFile,
    logoPreview,
    updateField,
    setLogo,
  } = useCompanyOnboardingStore();

  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const listboxRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [pendingPreview, setPendingPreview] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [companyOptions, setCompanyOptions] = useState<{ id: string; label: string }[]>([]);
  const [loadingIndustries, setLoadingIndustries] = useState(false);

  const isInstitution = organizationType === "INSTITUTION";

  // Fetch industries from onboarding API for companies
  useEffect(() => {
    if (isInstitution) return;
    let isCancelled = false;

    const fetchIndustries = async () => {
      setLoadingIndustries(true);
      try {
        const data = await getOnboardingOptions("industries");
        if (!isCancelled && Array.isArray(data) && data.length > 0) {
          setCompanyOptions(data.map((item) => ({ id: item.id || item.label, label: item.label })));
        }
      } catch (err) {
        // Handle API error
      } finally {
        if (!isCancelled) setLoadingIndustries(false);
      }
    };

    fetchIndustries();
    return () => {
      isCancelled = true;
    };
  }, [isInstitution]);

  const activeOptions = isInstitution ? INSTITUTION_OPTIONS : companyOptions;

  // Sync searchQuery when industry or activeOptions change externally
  useEffect(() => {
    if (industry) {
      const match = activeOptions.find((opt) => opt.id === industry || opt.label === industry);
      setSearchQuery(match ? match.label : industry);
    } else {
      setSearchQuery("");
    }
  }, [industry, activeOptions]);

  // Real-time client-side filter
  const filteredOptions = React.useMemo(() => {
    if (!searchQuery.trim()) return activeOptions;
    const q = searchQuery.toLowerCase().trim();
    return activeOptions.filter((opt) =>
      opt.label.toLowerCase().includes(q)
    );
  }, [activeOptions, searchQuery]);

  // Reset highlighted index on query change
  useEffect(() => {
    setHighlightedIndex(-1);
  }, [searchQuery, isDropdownOpen]);

  // Scroll highlighted item into view
  useEffect(() => {
    if (highlightedIndex >= 0 && listboxRef.current) {
      const activeItem = listboxRef.current.children[highlightedIndex] as HTMLElement;
      if (activeItem) {
        activeItem.scrollIntoView({ block: "nearest" });
      }
    }
  }, [highlightedIndex]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
        if (!searchQuery.trim()) {
          updateField("industry", "");
        } else if (industry) {
          const match = activeOptions.find((opt) => opt.id === industry || opt.label === industry);
          setSearchQuery(match ? match.label : industry);
        } else {
          setSearchQuery("");
        }
      }
    };
    if (isDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isDropdownOpen, industry, activeOptions, searchQuery, updateField]);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateField("organizationName", e.target.value);
  };

  const handleYearChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow up to 4 digits for year
    const val = e.target.value.replace(/\D/g, "").slice(0, 4);
    updateField("foundedYear", val);
  };

  const handleSelectIndustry = (val: string) => {
    updateField("industry", val);
    setSearchQuery(val);
    setIsDropdownOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isDropdownOpen && (e.key === "ArrowDown" || e.key === "Enter")) {
      e.preventDefault();
      setIsDropdownOpen(true);
      return;
    }

    if (isDropdownOpen) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev < filteredOptions.length - 1 ? prev + 1 : 0
        );
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev > 0 ? prev - 1 : filteredOptions.length - 1
        );
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < filteredOptions.length) {
          handleSelectIndustry(filteredOptions[highlightedIndex].label);
        } else if (filteredOptions.length > 0) {
          handleSelectIndustry(filteredOptions[0].label);
        }
      } else if (e.key === "Escape") {
        e.preventDefault();
        setIsDropdownOpen(false);
        if (industry) {
          const match = activeOptions.find((opt) => opt.id === industry || opt.label === industry);
          setSearchQuery(match ? match.label : industry);
        } else {
          setSearchQuery("");
        }
      }
    }
  };

  const handleBoxClick = () => {
    if (logoPreview) {
      // If image is already present, open directly in editor
      setIsEditorOpen(true);
    } else {
      // If no image, open native file picker directly
      fileInputRef.current?.click();
    }
  };

  const handleNativeFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        const previewUrl = reader.result as string;
        setPendingFile(file);
        setPendingPreview(previewUrl);
        setIsEditorOpen(true);
      };
      reader.readAsDataURL(file);
    }
    // reset input so the same file can be re-selected
    e.target.value = "";
  };

  const handleEditorClose = () => {
    setPendingFile(null);
    setPendingPreview(null);
    setIsEditorOpen(false);
  };

  const handleEditorSave = (dataUrl: string | null, file: File | null) => {
    if (!dataUrl) {
      setLogo(null);
      setPendingFile(null);
      setPendingPreview(null);
      setIsEditorOpen(false);
      return;
    }
    const finalFile = file || pendingFile;
    if (finalFile) {
      setLogo(finalFile);
    } else {
      try {
        const arr = dataUrl.split(",");
        const mime = arr[0].match(/:(.*?);/)?.[1] || "image/png";
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) {
          u8arr[n] = bstr.charCodeAt(n);
        }
        const generatedFile = new File([u8arr], "organization-logo.png", { type: mime });
        setLogo(generatedFile);
      } catch {
        updateField("logoPreview", dataUrl);
      }
    }
    setPendingFile(null);
    setPendingPreview(null);
    setIsEditorOpen(false);
  };

  const handleEditorRemove = () => {
    setLogo(null);
    setPendingFile(null);
    setPendingPreview(null);
  };

  const handleRemoveLogo = (e: React.MouseEvent) => {
    e.stopPropagation();
    setLogo(null);
    setPendingFile(null);
    setPendingPreview(null);
  };

  const isYearError = React.useMemo(() => {
    const trimmed = foundedYear.trim();
    if (!trimmed) return false;
    const year = parseInt(trimmed, 10);
    const currentYear = new Date().getFullYear();
    if (trimmed.length === 4) {
      return year < 1000 || year > currentYear;
    }
    return false;
  }, [foundedYear]);

  const isFormValid = 
    organizationName.trim().length > 0 &&
    foundedYear.trim().length === 4 &&
    !isYearError &&
    industry.trim().length > 0 &&
    Boolean(logoPreview);

  const handleSubmit = useCallback((e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isFormValid) {
      onNext();
    }
  }, [isFormValid, onNext]);

  return (
    /* Frame 1: Main Container */
    <div className={`w-full max-w-[704px] mx-auto p-4 flex flex-col items-center gap-8 md:gap-[60px] rounded-3xl select-none animate-in fade-in duration-300 transition-all ${
      isDropdownOpen ? "pb-[144px]" : "pb-4"
    }`}>
      {/* Stage 1: Identity Title (672x48) */}
      <h1 className="w-full max-w-[672px] h-[48px] flex items-center justify-center text-center font-['DM_Sans'] font-bold text-[32px] sm:text-[40px] leading-[48px] m-0">
        <span className="text-ds-text-primary">Stage 1: </span>
        <span className="text-ds-accent ml-2">Identity</span>
      </h1>

      {/* Steper Box (618x48) */}
      <div 
        data-amount="3" 
        className="w-full max-w-[618px] h-[48px] flex justify-center items-start p-0"
      >
        {/* Step 1: Active (206x48) */}
        <div data-position="Start" data-state="Active" className="w-[206px] h-[48px] flex-1 max-w-[206px] flex flex-col justify-center items-center gap-2 p-0 min-w-0">
          <div className="w-full h-4 flex flex-row items-center p-0">
            <div className="flex-1 h-0.5" />
            <div className="size-4 flex justify-center items-center shrink-0">
              <div className="size-4 rounded-full bg-ds-accent flex items-center justify-center">
                <div className="size-2 rounded-full bg-ds-bg" />
              </div>
            </div>
            <div className="flex-1 h-[2px] bg-ds-border" />
          </div>
          <div className="w-full h-6 flex justify-center items-center px-1">
            <span className="w-full max-w-[148px] text-center text-ds-accent text-base font-normal font-['DM_Sans'] leading-6 truncate">
              Stage 1: Identity
            </span>
          </div>
        </div>

        {/* Step 2: Default (206x48) */}
        <div data-position="Middle" data-state="Default" className="w-[206px] h-[48px] flex-1 max-w-[206px] flex flex-col justify-center items-center gap-2 p-0 min-w-0">
          <div className="w-full h-4 flex flex-row items-center p-0">
            <div className="flex-1 h-[2px] bg-ds-border" />
            <div className="size-4 rounded-full bg-ds-text-secondary relative flex justify-center items-center shrink-0">
              <div className="size-2 rounded-full bg-ds-border" />
            </div>
            <div className="flex-1 h-[2px] bg-ds-border" />
          </div>
          <div className="w-full h-6 flex justify-center items-center px-1">
            <span className="w-full max-w-[148px] text-center text-ds-text-secondary text-base font-normal font-['DM_Sans'] leading-6 truncate">
              Stage 2: Presence
            </span>
          </div>
        </div>

        {/* Step 3: Default (206x48) */}
        <div data-position="End" data-state="Default" className="w-[206px] h-[48px] flex-1 max-w-[206px] flex flex-col justify-center items-center gap-2 p-0 min-w-0">
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

      {/* Frame 2609887: Main Input Area (672x300) */}
      <form 
        onSubmit={handleSubmit}
        className="w-full max-w-[672px] md:h-[300px] flex flex-col md:flex-row items-center justify-between gap-6 md:gap-[60px] p-0"
      >
        {/* Frame 2608512: Left Column (297x300) */}
        <div className="w-full md:w-[297px] md:h-[300px] flex flex-col justify-between items-center py-4 px-2 gap-5">
          {/* Input with label: Organization / Institution name (281x62) */}
          <div className="w-full md:w-[281px] h-[62px] py-2 border-b border-ds-border focus-within:border-ds-accent flex flex-col justify-center items-start gap-2.5 transition-colors">
            <label 
              htmlFor="organization-name"
              className="text-left text-ds-text-secondary font-['DM_Sans'] text-xs font-medium leading-4 cursor-pointer"
            >
              {isInstitution ? "Institution name" : "Organization name"}
            </label>
            <input
              id="organization-name"
              type="text"
              value={organizationName}
              onChange={handleNameChange}
              placeholder={isInstitution ? "e.g. Stanford University" : "e.g. Nexus Global Systems"}
              autoComplete="organization"
              className="w-full bg-transparent text-ds-text-primary font-['DM_Sans'] text-sm leading-5 focus:outline-none placeholder:text-ds-text-muted"
            />
          </div>

          {/* Input with label: Founded year (281x62) */}
          <div className={`w-full md:w-[281px] h-[62px] py-2 border-b focus-within:border-ds-accent flex flex-col justify-center items-start gap-2.5 transition-colors ${
            isYearError ? "border-ds-error" : "border-ds-border"
          }`}>
            <label 
              htmlFor="founded-year"
              className={`text-left font-['DM_Sans'] text-xs font-medium leading-4 cursor-pointer ${
                isYearError ? "text-ds-error" : "text-ds-text-secondary"
              }`}
            >
              Founded year
            </label>
            <input
              id="founded-year"
              type="text"
              inputMode="numeric"
              value={foundedYear}
              onChange={handleYearChange}
              placeholder="2024"
              maxLength={4}
              className="w-full bg-transparent text-ds-text-primary font-['DM_Sans'] text-sm leading-5 focus:outline-none placeholder:text-ds-text-muted"
            />
          </div>

          {/* Input with label and icon: Industry Selection (281x62) */}
          <div 
            ref={dropdownRef}
            className="w-full md:w-[281px] relative"
          >
            <div 
              onClick={() => {
                searchInputRef.current?.focus();
                setIsDropdownOpen(true);
              }}
              className={`w-full h-[62px] py-2 border-b flex flex-col justify-center items-start gap-2.5 transition-colors cursor-text ${
                isDropdownOpen ? "border-ds-accent" : "border-ds-border hover:border-ds-text-muted"
              }`}
            >
              <label 
                htmlFor="industry-search-input"
                className="text-left text-ds-text-secondary font-['DM_Sans'] text-xs font-medium leading-4 cursor-pointer"
              >
                {isInstitution ? "Institution type" : "Industry Selection"}
              </label>
              <div className="self-stretch inline-flex justify-between items-center">
                <input
                  id="industry-search-input"
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    if (!isDropdownOpen) setIsDropdownOpen(true);
                  }}
                  onFocus={(e) => {
                    setIsDropdownOpen(true);
                    e.target.select();
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder={isInstitution ? "Select institution type" : "Select industry"}
                  autoComplete="off"
                  className="w-full bg-transparent font-['DM_Sans'] text-sm leading-5 focus:outline-none placeholder:text-ds-text-muted text-ds-text-primary cursor-text"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  aria-label="Toggle industry options"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsDropdownOpen((prev) => {
                      const next = !prev;
                      if (next) {
                        setTimeout(() => searchInputRef.current?.focus(), 0);
                      }
                      return next;
                    });
                  }}
                  className="p-1 -mr-1 flex items-center justify-center cursor-pointer text-ds-text-primary focus:outline-none"
                >
                  <ChevronDown 
                    className={`w-4 h-4 transition-transform duration-200 ${
                      isDropdownOpen ? "rotate-180" : ""
                    }`} 
                  />
                </button>
              </div>
            </div>

            {/* Dropdown Menu - opens at bottom with hidden scroll */}
            {isDropdownOpen && (
              <div 
                className="absolute top-full left-0 mt-2 w-full p-3 bg-ds-bg rounded-2xl border border-ds-border shadow-2xl inline-flex flex-col justify-start items-center gap-3 overflow-hidden z-40 animate-in fade-in zoom-in-95 duration-150"
              >
                <div 
                  ref={listboxRef}
                  role="listbox"
                  className="self-stretch flex flex-col justify-start items-start gap-2 max-h-48 overflow-y-auto scrollbar-none [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden [&::-webkit-scrollbar]:w-0 [&::-webkit-scrollbar]:h-0"
                  style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
                >
                  {loadingIndustries ? (
                    <div className="w-full py-3 text-center text-ds-text-muted text-sm font-['DM_Sans']">
                      Loading industries...
                    </div>
                  ) : filteredOptions.length > 0 ? (
                    filteredOptions.map((opt, index) => {
                      const isSelected = industry === opt.label || industry === opt.id;
                      const isHighlighted = index === highlightedIndex;
                      return (
                        <div
                          key={opt.id}
                          role="option"
                          aria-selected={isSelected}
                          onClick={() => handleSelectIndustry(opt.label)}
                          className={`self-stretch h-9 inline-flex justify-between items-center px-2 rounded-lg cursor-pointer transition-colors group select-none ${
                            isHighlighted ? "bg-ds-surface-1" : "hover:bg-ds-surface-1/40"
                          }`}
                        >
                          <span 
                            title={opt.label}
                            className={`justify-start text-sm font-normal font-['DM_Sans'] leading-5 transition-colors cursor-pointer truncate ${
                              isSelected
                                ? "text-ds-accent font-medium"
                                : isHighlighted
                                ? "text-ds-text-primary"
                                : "text-ds-text-secondary group-hover:text-ds-text-primary"
                            }`}
                          >
                            {opt.label}
                          </span>
                        </div>
                      );
                    })
                  ) : (
                    <div className="w-full py-3 text-center text-ds-text-muted text-sm font-['DM_Sans']">
                      No options found
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: Asset Uploads (319x300, 14px vertically and 20px horizontally padding) */}
        <div className="w-full md:w-[319px] md:h-[300px] px-5 py-[14px] rounded-2xl border border-ds-border bg-transparent shadow-[0px_1px_2px_rgba(0,0,0,0.05)] flex flex-col justify-between items-center shrink-0">
          {/* Frame 2609888 (279x272) */}
          <div className="w-full md:w-[279px] h-[272px] flex flex-col justify-between items-center gap-3 p-0">
            {/* Background+Border+Shadow Upload Box (120x120) */}
            <div 
              onClick={handleBoxClick}
              className="w-[120px] h-[120px] rounded-lg border-2 border-ds-border hover:border-ds-accent bg-transparent flex flex-col justify-center items-center gap-2 overflow-hidden cursor-pointer transition-colors relative group select-none shrink-0"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/webp"
                onChange={handleNativeFileChange}
                className="hidden"
              />
              {logoPreview ? (
                <>
                  <img 
                    src={logoPreview} 
                    alt="Organization Logo" 
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={handleRemoveLogo}
                    aria-label="Remove logo"
                    className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/70 hover:bg-black text-white flex items-center justify-center transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </>
              ) : (
                <>
                  <div className="w-6 h-6 flex items-center justify-center text-ds-text-primary group-hover:text-ds-accent transition-colors">
                    <UploadIcon size={20} className="w-5 h-5" />
                  </div>
                  <span className="text-center text-ds-text-secondary font-['DM_Sans'] text-xs font-normal leading-4">
                    Profile Image
                  </span>
                </>
              )}
            </div>

            {/* Frame 2608500: Description Texts (307x64) */}
            <div className="w-full max-w-[307px] min-h-[64px] flex flex-col justify-center items-center p-0">
              <h3 className="w-full text-center text-ds-text-primary font-['DM_Sans'] font-semibold text-base leading-6 m-0">
                {isInstitution ? "Institution Identity Assets" : "Organization Identity Assets"}
              </h3>
              <p className="w-full text-center text-ds-text-secondary font-['DM_Sans'] font-normal text-sm leading-5 m-0">
                {isInstitution
                  ? "Upload your official logo to represent your institution."
                  : "Upload your official logo to represent your business."}
              </p>
            </div>

            {/* Frame 2609062: Ratio Note (No bg, no border, 2 lines) */}
            <div className="w-full max-w-[307px] flex justify-center items-center py-1">
              <p className="w-full max-w-[280px] text-center text-ds-accent font-['DM_Sans'] font-normal text-xs leading-4 m-0">
                Ensure your logo is at least 1:1 ratio for the best<br className="hidden sm:inline" /> viewing experience on executive desktops.
              </p>
            </div>
          </div>
        </div>
      </form>

      {/* Frame 2609474: Button Box (672x36) */}
      <div className="w-full max-w-[672px] h-[36px] flex justify-center items-center p-0">
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
            className="w-[260px] h-[36px] py-1.5 px-3 bg-ds-surface-1 text-ds-text-muted rounded-[100px] flex justify-center items-center gap-2.5 cursor-not-allowed select-none"
          >
            <span className="font-['DM_Sans'] font-medium text-base leading-6 text-ds-text-muted whitespace-nowrap">
              Next Step
            </span>
          </div>
        )}
      </div>

      {/* Image Editor Modal */}
      <CocpitUserProfileImageEditor
        isOpen={isEditorOpen}
        onClose={handleEditorClose}
        initialImage={pendingPreview || logoPreview}
        initialFile={pendingFile || logoFile}
        shape="square"
        title="Add profile photo"
        onSave={handleEditorSave}
        onRemove={handleEditorRemove}
      />
    </div>
  );
};

export { StepIdentity as Stage1Identity };
export default StepIdentity;
