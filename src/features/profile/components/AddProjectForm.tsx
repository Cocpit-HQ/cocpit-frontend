"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { X, ChevronDown, ChevronUp, Plus, AlertTriangle } from "lucide-react";
import { Icon } from "@iconify/react";
import { cn } from "@/lib/utils";
import { Project, ProjectMedia } from "@/types/entities";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ProjectMediaModal } from "./ProjectMediaModal";
import { getProfileSkills, uploadProjectMedia } from "@/services/api/profile";
import { toast } from "sonner";
import { useDebounce } from "@/hooks/use-debounce";

interface AddProjectFormProps {
  onCancel?: () => void;
  onSave?: (data: Project) => void;
  onDelete?: (id: string) => void;
  initialData?: Project | null;
}

const months = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 50 }, (_, i) => (currentYear - i).toString());



export default function AddProjectForm({
  onCancel,
  onSave,
  onDelete,
  initialData,
}: AddProjectFormProps) {
  const isEditing = !!initialData;

  const [title, setTitle] = useState(initialData?.title || "");
  const [organization, setOrganization] = useState(initialData?.organization || "");
  const [details, setDetails] = useState(initialData?.details || "");
  const [startMonth, setStartMonth] = useState(initialData?.start_month || "");
  const [startYear, setStartYear] = useState(initialData?.start_year || "");
  const [endMonth, setEndMonth] = useState(initialData?.end_month || "");
  const [endYear, setEndYear] = useState(initialData?.end_year || "");
  const [isCurrent, setIsCurrent] = useState(initialData?.is_current ?? false);
  const [isSaving, setIsSaving] = useState(false);

  // Skills state
  const [skills, setSkills] = useState<string[]>(initialData?.skills || []);
  const [skillInput, setSkillInput] = useState("");
  const [showSkillDropdown, setShowSkillDropdown] = useState(false);
  const [suggestedSkills, setSuggestedSkills] = useState<string[]>([]);
  const skillWrapperRef = useRef<HTMLDivElement>(null);
  
  const debouncedSkillInput = useDebounce(skillInput, 300);

  // Media state
  const [mediaList, setMediaList] = useState<ProjectMedia[]>(initialData?.media || []);
  const [activeMediaType, setActiveMediaType] = useState<"link" | "image" | "document">("link");
  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);
  const [editingMediaItem, setEditingMediaItem] = useState<ProjectMedia | null>(null);

  // Accordion details state
  const [showMoreDetails, setShowMoreDetails] = useState(
    !!(initialData?.role || initialData?.team_size || initialData?.role_description)
  );
  const [role, setRole] = useState(initialData?.role || "");
  const [teamSize, setTeamSize] = useState(initialData?.team_size || "");
  const [roleDescription, setRoleDescription] = useState(initialData?.role_description || "");

  // Handle clicking outside skill suggestions dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (skillWrapperRef.current && !skillWrapperRef.current.contains(e.target as Node)) {
        setShowSkillDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch skill suggestions
  useEffect(() => {
    async function fetchSkills() {
      if (!debouncedSkillInput.trim()) {
        setSuggestedSkills([]);
        return;
      }
      try {
        const response = await getProfileSkills({ q: debouncedSkillInput.trim(), limit: 10 });
        setSuggestedSkills(response.data.items.map((item) => item.name));
      } catch (err) {
        console.error("Error fetching skills", err);
      }
    }
    fetchSkills();
  }, [debouncedSkillInput]);

  const filteredSkills = useMemo(() => {
    return suggestedSkills.filter((s) => !skills.includes(s));
  }, [suggestedSkills, skills]);

  const addSkill = (skill: string) => {
    if (!skill.trim()) return;
    if (!skills.includes(skill.trim())) {
      setSkills((prev) => [...prev, skill.trim()]);
    }
    setSkillInput("");
    setShowSkillDropdown(false);
  };

  const removeSkill = (skillToRemove: string) => {
    setSkills((prev) => prev.filter((s) => s !== skillToRemove));
  };

  const handleSkillKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && skillInput.trim()) {
      e.preventDefault();
      addSkill(skillInput.trim());
    }
  };

  // Media handlers
  const handleAddMediaClick = (type: "link" | "image" | "document") => {
    setActiveMediaType(type);
    setEditingMediaItem(null);
    setIsMediaModalOpen(true);
  };

  const handleEditMediaClick = (item: ProjectMedia) => {
    setActiveMediaType(item.type);
    setEditingMediaItem(item);
    setIsMediaModalOpen(true);
  };

  const handleSaveMedia = (mediaItem: ProjectMedia, isEdit: boolean) => {
    if (isEdit) {
      setMediaList((prev) => prev.map((m) => (m.id === mediaItem.id ? mediaItem : m)));
    } else {
      setMediaList((prev) => [...prev, mediaItem]);
    }
  };

  const handleDeleteMedia = (id: string) => {
    setMediaList((prev) => prev.filter((m) => m.id !== id));
  };

  const buildDateVal = (month: string, year: string) => {
    const mIdx = months.indexOf(month);
    if (mIdx === -1 || !year) return null;
    return new Date(parseInt(year, 10), mIdx, 1).getTime();
  };

  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [touchedEndDate, setTouchedEndDate] = useState(false);

  const endDateError = useMemo(() => {
    if (isCurrent) return null;
    if (!endMonth || !endYear) {
      if (submitAttempted || touchedEndDate) {
        return "End date is required when not currently working on this project";
      }
      return null;
    }
    if (startMonth && startYear) {
      const sTime = buildDateVal(startMonth, startYear);
      const eTime = buildDateVal(endMonth, endYear);
      if (sTime !== null && eTime !== null && eTime <= sTime) {
        return "End date must be greater than start date";
      }
    }
    return null;
  }, [isCurrent, startMonth, startYear, endMonth, endYear, submitAttempted, touchedEndDate]);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSubmitAttempted(true);
    
    const missingEndDate = !isCurrent && (!endMonth || !endYear);
    const hasDateLogicError = startMonth && startYear && endMonth && endYear && buildDateVal(startMonth, startYear)! >= buildDateVal(endMonth, endYear)!;
    
    if (!title.trim() || !organization.trim() || missingEndDate || hasDateLogicError) return;

    setIsSaving(true);
    try {
      const updatedMediaList = [...mediaList];
      for (let i = 0; i < updatedMediaList.length; i++) {
        const item = updatedMediaList[i];
        if (item.pendingFile) {
          const res = await uploadProjectMedia(item.pendingFile);
          updatedMediaList[i] = {
            ...item,
            fileUrl: res.fileUrl || res.url,
            fileName: res.fileName || item.pendingFile.name,
            pendingFile: undefined,
          };
          
          if (item.fileUrl && item.fileUrl.startsWith("blob:")) {
            URL.revokeObjectURL(item.fileUrl);
          }
        }
      }

      const savedProject: Project = {
        project_id: initialData?.project_id || `project-${Date.now()}`,
        title: title.trim(),
        organization: organization.trim(),
        details: details.trim(),
        start_month: startMonth,
        start_year: startYear,
        end_month: isCurrent ? undefined : endMonth,
        end_year: isCurrent ? undefined : endYear,
        is_current: isCurrent,
        skills,
        media: updatedMediaList,
        role: role.trim() || undefined,
        team_size: teamSize.trim() || undefined,
        role_description: roleDescription.trim() || undefined,
      };

      onSave?.(savedProject);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to upload media files");
    } finally {
      setIsSaving(false);
    }
  };

  const inputStyles =
    "bg-card border border-border placeholder:text-muted-foreground rounded-[16px] h-[48px] px-[16px] font-[family-name:var(--font-poppins)] text-[16px] leading-[24px] text-foreground focus:border-[#6366F1] focus-visible:outline-none transition-all shadow-none w-full";
  const labelStyles =
    "block font-[family-name:var(--font-poppins)] font-normal text-[14px] leading-[20px] text-foreground mb-2";

  const isFormValid =
    title.trim().length > 0 &&
    organization.trim().length > 0 &&
    startMonth.length > 0 &&
    startYear.length > 0 &&
    skills.length > 0 &&
    endDateError === null;

  const isMediaLimitReached = mediaList.length >= 3;

  const getMediaSublabel = (type: string) => {
    switch (type) {
      case "image":
        return "Image";
      case "document":
        return "Document";
      case "link":
      default:
        return "Link";
    }
  };

  const getMediaIcon = (type: string) => {
    switch (type) {
      case "image":
        return "mage:image";
      case "document":
        return "solar:document-linear";
      case "link":
      default:
        return "ant-design:link-outlined";
    }
  };

  return (
    <div className="flex flex-col h-full max-h-full w-full bg-card sm:rounded-[24px] overflow-hidden relative">
      {/* 1. Fixed Header Area (Never scrolls away) */}
      <div className="shrink-0 pt-6 px-6 sm:px-8 pb-4 bg-card relative z-10 border-b border-border/40">
        {/* Top Right Close Button */}
        <div className="absolute right-6 top-6">
          <button
            onClick={onCancel}
            type="button"
            className="text-[#FF6B6B] hover:bg-[#FF6B6B]/10 p-1 rounded-full transition-colors cursor-pointer"
          >
            <X className="w-6 h-6" strokeWidth={1.5} />
          </button>
        </div>

        {/* Title and Subtitle */}
        <div className="text-center w-full px-8">
          <h2 className="text-[18px] leading-[26px] font-medium font-[family-name:var(--font-poppins)] text-foreground mb-[4px]">
            {isEditing ? "Edit project" : "Add project"}
          </h2>
          <p className="text-[12px] leading-[16px] font-normal font-[family-name:var(--font-poppins)] text-muted-foreground">
            Update your professional information
          </p>
        </div>
      </div>

      {/* 2. Scrollable Middle Form Body */}
      <div className="flex-1 overflow-y-auto px-6 sm:px-8 py-6 space-y-6 min-h-0 custom-scrollbar pb-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Row 1: Title & Organization */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="flex flex-col">
              <Label className={labelStyles}>Project title*</Label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Website Redesign for Acme Corp"
                className={inputStyles}
              />
            </div>
            <div className="flex flex-col">
              <Label className={labelStyles}>Organization*</Label>
              <input
                type="text"
                value={organization}
                onChange={(e) => setOrganization(e.target.value)}
                placeholder='e.g. Acme Corp" or "Self / Academic proje...'
                className={inputStyles}
              />
            </div>
          </div>

          {/* Row 2: Project details (Height aligned to CSS layer specs: 89px) */}
          <div className="flex flex-col">
            <Label className={labelStyles}>Project details</Label>
            <Textarea
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="What was this project about? Share the objectives, your approach, and the outcome."
              className="w-full h-[89px] min-h-[89px] bg-card border border-border text-foreground placeholder:text-muted-foreground rounded-[16px] px-[16px] py-[10px] font-[family-name:var(--font-poppins)] text-[16px] leading-[24px] resize-none focus:border-[#6366F1] focus-visible:outline-none transition-all shadow-none"
            />
          </div>

          {/* Row 3: Start Date */}
          <div className="space-y-2">
            <Label className={labelStyles}>Start date*</Label>
            <div className="grid grid-cols-2 gap-4">
              <Select value={startMonth} onValueChange={setStartMonth}>
                <SelectTrigger className={cn(inputStyles, !startMonth && "text-muted-foreground")}>
                  <SelectValue placeholder="Month" />
                </SelectTrigger>
                <SelectContent className="max-h-[260px] z-[150]">
                  {months.map((m) => (
                    <SelectItem key={m} value={m}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={startYear} onValueChange={setStartYear}>
                <SelectTrigger className={cn(inputStyles, !startYear && "text-muted-foreground")}>
                  <SelectValue placeholder="Year" />
                </SelectTrigger>
                <SelectContent className="max-h-[260px] z-[150]">
                  {years.map((y) => (
                    <SelectItem key={y} value={y}>
                      {y}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Row 4: End Date (hidden when currently working on this project) */}
          {!isCurrent && (
            <div className="space-y-2 animate-in fade-in-90 duration-200">
              <Label className={labelStyles}>End date*</Label>
              <div className="grid grid-cols-2 gap-4">
                <Select value={endMonth} onValueChange={(val) => { setEndMonth(val); setTouchedEndDate(true); }}>
                  <SelectTrigger className={cn(inputStyles, !endMonth && "text-muted-foreground", endDateError && "border-red-400")}>
                    <SelectValue placeholder="Month" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[260px] z-[150]">
                    {months.map((m) => (
                      <SelectItem key={m} value={m}>
                        {m}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={endYear} onValueChange={(val) => { setEndYear(val); setTouchedEndDate(true); }}>
                  <SelectTrigger className={cn(inputStyles, !endYear && "text-muted-foreground", endDateError && "border-red-400")}>
                    <SelectValue placeholder="Year" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[260px] z-[150]">
                    {years.map((y) => (
                      <SelectItem key={y} value={y}>
                        {y}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {endDateError && (
                <p className="text-[11px] text-red-500 mt-1 flex items-center gap-1 font-[family-name:var(--font-poppins)]">
                  <AlertTriangle className="w-3 h-3" />{endDateError}
                </p>
              )}
            </div>
          )}

          {/* Currently working checkbox */}
          <div className="flex items-center space-x-3 pt-1">
            <Checkbox
              id="currently-working"
              checked={isCurrent}
              onCheckedChange={(val) => setIsCurrent(!!val)}
              className="w-[20px] h-[20px] rounded-[4px] border-2 border-foreground/60 data-[state=checked]:bg-[#6366F1] data-[state=checked]:border-[#6366F1]"
            />
            <label
              htmlFor="currently-working"
              className="font-[family-name:var(--font-poppins)] font-normal text-[14px] leading-[20px] text-foreground cursor-pointer select-none"
            >
              I&apos;m currently working on this project
            </label>
          </div>

          {/* Row 5: Skills used* */}
          <div className="flex flex-col relative" ref={skillWrapperRef}>
            <Label className={labelStyles}>Skills used*</Label>
            
            {/* Tag container with input */}
            <div
              className={cn(
                "min-h-[48px] bg-card border border-border rounded-[16px] p-2 px-3 flex flex-wrap items-center gap-2 transition-all cursor-text",
                showSkillDropdown && "border-[#6366F1]"
              )}
              onClick={() => setShowSkillDropdown(true)}
            >
              {skills.map((s, index) => (
                <div
                  key={`${s}-${index}`}
                  className="bg-[#EEF2FF] text-[#6366F1] dark:bg-primary/20 dark:text-primary border border-[#818CF8]/20 rounded-full px-3 py-1 flex items-center gap-1.5 text-[13px] font-medium animate-in zoom-in-95 duration-100"
                >
                  <span>{s}</span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeSkill(s);
                    }}
                    className="hover:text-red-500 rounded-full p-0.5 transition-colors cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              <input
                type="text"
                value={skillInput}
                onChange={(e) => {
                  setSkillInput(e.target.value);
                  setShowSkillDropdown(true);
                }}
                onFocus={() => setShowSkillDropdown(true)}
                onKeyDown={handleSkillKeyDown}
                placeholder={skills.length === 0 ? "Search and add skills (e.g. Figma, Project Management)" : "Add more..."}
                className="flex-1 bg-transparent border-none outline-none font-[family-name:var(--font-poppins)] text-[15px] text-foreground placeholder:text-muted-foreground min-w-[150px] px-2"
              />
            </div>

            {/* Suggestions dropdown */}
            {showSkillDropdown && (
              <ul className="absolute z-30 left-0 right-0 top-full mt-2 bg-card border border-border rounded-[16px] shadow-xl max-h-[220px] overflow-y-auto py-2 animate-in fade-in-90 duration-150">
                {filteredSkills.length > 0 ? (
                  filteredSkills.map((s) => (
                    <li
                      key={s}
                      onMouseDown={() => addSkill(s)}
                      className="px-4 py-2 text-[14px] font-[family-name:var(--font-poppins)] text-foreground hover:bg-[#EEF2FF] dark:hover:bg-secondary hover:text-[#6366F1] cursor-pointer transition-colors"
                    >
                      {s}
                    </li>
                  ))
                ) : skillInput.trim() ? (
                  <li
                    onMouseDown={() => addSkill(skillInput.trim())}
                    className="px-4 py-2 text-[14px] font-[family-name:var(--font-poppins)] text-[#6366F1] hover:bg-secondary cursor-pointer font-medium flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" /> Add &quot;{skillInput.trim()}&quot;
                  </li>
                ) : (
                  <li className="px-4 py-2 text-[13px] text-muted-foreground italic text-center">
                    Type to search or add custom skills
                  </li>
                )}
              </ul>
            )}
          </div>

          {/* Row 6: Media */}
          <div className="flex flex-col space-y-3">
            <Label className={labelStyles}>Media</Label>
            
            {/* Action buttons matching CSS border: 1px solid #818CF8, text: #6366F1 */}
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => handleAddMediaClick("link")}
                disabled={isMediaLimitReached}
                className={cn(
                  "border border-[#818CF8] bg-white dark:bg-card text-[#6366F1] dark:text-primary px-5 py-2 sm:py-1.5 rounded-full text-[13px] sm:text-[14px] font-medium font-[family-name:var(--font-poppins)] transition-colors flex items-center justify-center shadow-none",
                  isMediaLimitReached ? "opacity-50 cursor-not-allowed" : "hover:bg-[#818CF8]/10 cursor-pointer"
                )}
              >
                Add link
              </button>
              <button
                type="button"
                onClick={() => handleAddMediaClick("image")}
                disabled={isMediaLimitReached}
                className={cn(
                  "border border-[#818CF8] bg-white dark:bg-card text-[#6366F1] dark:text-primary px-5 py-2 sm:py-1.5 rounded-full text-[13px] sm:text-[14px] font-medium font-[family-name:var(--font-poppins)] transition-colors flex items-center justify-center shadow-none",
                  isMediaLimitReached ? "opacity-50 cursor-not-allowed" : "hover:bg-[#818CF8]/10 cursor-pointer"
                )}
              >
                Add image
              </button>
              <button
                type="button"
                onClick={() => handleAddMediaClick("document")}
                disabled={isMediaLimitReached}
                className={cn(
                  "border border-[#818CF8] bg-white dark:bg-card text-[#6366F1] dark:text-primary px-5 py-2 sm:py-1.5 rounded-full text-[13px] sm:text-[14px] font-medium font-[family-name:var(--font-poppins)] transition-colors flex items-center justify-center shadow-none",
                  isMediaLimitReached ? "opacity-50 cursor-not-allowed" : "hover:bg-[#818CF8]/10 cursor-pointer"
                )}
              >
                Add document
              </button>
            </div>
            {isMediaLimitReached && (
              <p className="text-[12px] text-muted-foreground mt-1 font-[family-name:var(--font-poppins)]">
                Maximum 3 media items allowed.
              </p>
            )}

            {/* Added media items list */}
            {mediaList.length > 0 && (
              <div className="flex flex-col divide-y divide-border/40 pt-2">
                {mediaList.map((m) => (
                  <div
                    key={m.id}
                    onClick={() => handleEditMediaClick(m)}
                    className="flex items-center justify-between py-3 group hover:bg-secondary/40 rounded-lg px-2 -mx-2 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-[14px] min-w-0">
                      <div className="flex items-center justify-center flex-shrink-0 pl-[2px]">
                        <Icon icon={getMediaIcon(m.type)} className="w-[26px] h-[26px] text-foreground" />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-[14px] font-medium font-[family-name:var(--font-poppins)] text-foreground truncate">
                          {m.title}
                        </span>
                        <span className="text-[12px] text-muted-foreground font-[family-name:var(--font-poppins)]">
                          {getMediaSublabel(m.type)}
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditMediaClick(m);
                      }}
                      className="p-2 text-muted-foreground hover:text-primary transition-colors flex-shrink-0"
                    >
                      <Icon icon="eva:edit-outline" className="w-5 h-5 stroke-[1.5px]" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Row 7: Accordion Trigger - Add more details */}
          <div className="pt-2">
            <button
              type="button"
              onClick={() => setShowMoreDetails(!showMoreDetails)}
              className={cn(
                "inline-flex items-center gap-1.5 text-[14px] font-[family-name:var(--font-poppins)] hover:underline transition-all cursor-pointer select-none font-medium",
                showMoreDetails ? "text-[#6366F1] dark:text-primary" : "text-foreground"
              )}
            >
              <span>Add more details</span>
              {showMoreDetails ? (
                <ChevronUp className="w-4 h-4 transition-transform" />
              ) : (
                <ChevronDown className="w-4 h-4 transition-transform" />
              )}
            </button>
          </div>

          {/* Expanded optional fields */}
          {showMoreDetails && (
            <div className="space-y-6 animate-in fade-in-90 slide-in-from-top-2 duration-200 pt-3 border-t border-border/40">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="flex flex-col">
                  <Label className={labelStyles}>Role in project</Label>
                  <input
                    type="text"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    placeholder="e.g. Redesign of cloud place"
                    className={inputStyles}
                  />
                </div>
                <div className="flex flex-col">
                  <Label className={labelStyles}>Team size</Label>
                  <input
                    type="text"
                    value={teamSize}
                    onChange={(e) => setTeamSize(e.target.value)}
                    placeholder="e.g. Self, client etc"
                    className={inputStyles}
                  />
                </div>
              </div>

              {/* Role description (Height aligned to CSS layer specs: 90px) */}
              <div className="flex flex-col">
                <Label className={labelStyles}>Role description</Label>
                <Textarea
                  value={roleDescription}
                  onChange={(e) => setRoleDescription(e.target.value)}
                  placeholder="Describe your work, impact, or achievements"
                  className="w-full h-[90px] min-h-[90px] bg-card border border-border text-foreground placeholder:text-muted-foreground rounded-[16px] px-[16px] py-[10px] font-[family-name:var(--font-poppins)] text-[16px] leading-[24px] resize-none focus:border-[#6366F1] focus-visible:outline-none transition-all shadow-none"
                />
              </div>
            </div>
          )}
        </form>
      </div>

      {/* 3. Fixed Bottom Action Bar (Always visible regardless of scrolling) */}
      <div className="shrink-0 flex justify-center items-center gap-4 py-5 px-6 border-t border-border bg-card z-10">
        <Button
          type="button"
          variant="outline"
          onClick={isEditing ? () => onDelete?.(initialData?.project_id!) : onCancel}
          className="h-[40px] px-8 rounded-full border border-[#818CF8] text-[#818CF8] hover:bg-[#818CF8]/10 bg-white dark:bg-card font-medium w-[142px] font-[family-name:var(--font-poppins)] cursor-pointer shadow-none transition-all"
        >
          {isEditing ? "Delete" : "Cancel"}
        </Button>
        <Button
          type="button"
          onClick={() => handleSubmit()}
          disabled={!isFormValid || isSaving}
          className={cn(
            "h-[40px] px-8 rounded-full font-medium w-[142px] font-[family-name:var(--font-poppins)] transition-all shadow-none",
            isFormValid && !isSaving
              ? "bg-[#6366F1] text-white hover:bg-[#4F46E5] cursor-pointer"
              : "bg-[#C7D2FE] text-white border border-white dark:border-transparent dark:bg-[#6366F1]/40 opacity-100 cursor-not-allowed hover:bg-[#C7D2FE] dark:hover:bg-[#6366F1]/40"
          )}
        >
          {isSaving ? "Saving..." : "Save"}
        </Button>
      </div>

      {/* Media sub-modal */}
      <ProjectMediaModal
        isOpen={isMediaModalOpen}
        onClose={() => setIsMediaModalOpen(false)}
        onSave={handleSaveMedia}
        onDelete={handleDeleteMedia}
        mediaType={activeMediaType}
        initialData={editingMediaItem}
      />
    </div>
  );
}
