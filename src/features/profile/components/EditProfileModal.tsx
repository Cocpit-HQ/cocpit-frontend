"use client"

import React, { useState, useEffect } from "react"
import { X, ChevronDown } from "lucide-react"
import { Icon } from '@iconify/react'
import { cn } from "@/lib/utils"
import { updateMemberRoleSettings } from "@/services/api/organization"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { UserData } from "@/types/user"
import LocationAutocomplete from "@/components/ui/LocationAutocomplete"

interface EditProfileModalProps {
  isOpen: boolean
  onClose: () => void
  user: UserData | null
  onSave: (data: any) => void
}

const LOOKING_FOR_OPTIONS = ["Full-time", "Part-time", "Internship", "Freelance", "Connections"]
const AVAILABILITY_OPTIONS = ["Immediately", "Weekdays", "Weekends", "15 to 30 days", "Flexible", "On-demand"]
const WORK_SETUP_OPTIONS = ["Remote", "Hybrid", "On-site"]

const normalizeAvailability = (value?: string | null) => {
  if (value === "Immediate") return "Immediately";
  if (value === "30 Days") return "15 to 30 days";
  return value || "";
}

const ROLES = [
  { id: "student", label: "Student" },
  { id: "fresher", label: "Fresher" },
  { id: "intern", label: "Intern" },
  { id: "self_employed", label: "Self employed" },
  { id: "employed", label: "Employed" },
  { id: "unemployed", label: "Unemployed" },
];

export function EditProfileModal({ isOpen, onClose, user, onSave }: EditProfileModalProps) {
  const getWordCount = (text: string) => text.trim().split(/\s+/).filter(Boolean).length;

  const [formData, setFormData] = useState({
    name: "",
    account_name: "",
    headline: "",
    status: "",
    location: "",
    website: "",
    open_to: "" as string,
    availability: "" as string,
    work_preference: "" as string,
    about: "",
    show_owner_badge: true,
    visible_role_ids: [] as string[],
  })

  const [isSaving, setIsSaving] = useState(false)
  const [initialFormData, setInitialFormData] = useState<any>(null)
  const [lastClickTime, setLastClickTime] = useState(0)

  useEffect(() => {
    if (user) {
      let initialStatus = (user as any).account_type || "student";
      initialStatus = initialStatus.toLowerCase().replace(" ", "_");
      if (!ROLES.find(r => r.id === initialStatus)) {
        initialStatus = "student";
      }

      const data = {
        name: user.name || "",
        account_name: user.account_name || "",
        headline: user.headline || "",
        status: initialStatus,
        location: user.location || "",
        website: user.website || "",
        open_to: user.open_to || "",
        availability: normalizeAvailability(user.availability),
        work_preference: user.work_preference || "",
        about: user.about || "",
        show_owner_badge: true,
        visible_role_ids: user.company_roles
          ? user.company_roles.filter(r => r.is_role_visible).map(r => r.org_id!)
          : [],
      }
      setFormData(data)
      setInitialFormData(data)
    }
  }, [user])

  const toggleOption = (field: "open_to" | "availability" | "work_preference", option: string) => {
    setFormData(prev => {
      const current = prev[field]
      return { ...prev, [field]: current === option ? "" : option }
    })
  }

  const inputStyles = "h-[48px] w-full px-4 py-3 !rounded-[16px] border-border bg-card text-[16px] leading-[24px] text-foreground text-left font-[family-name:var(--font-poppins)] font-normal placeholder:text-muted-foreground focus:border-primary focus:ring-0 transition-all"
  const labelStyles = "text-[14px] font-normal text-foreground mb-[8px] font-[family-name:var(--font-poppins)] leading-[20px]"
  const getSelectTextColor = (value: string) => value ? "text-foreground" : "text-muted-foreground";

  const hasChanges = () => {
    if (!initialFormData) return false;
    return JSON.stringify(formData) !== JSON.stringify(initialFormData);
  };

  const handleSave = async () => {
    const now = Date.now()
    if (now - lastClickTime < 2000 || isSaving || !hasChanges()) return
    if (formData.headline.length > 200) {
      alert("Headline cannot exceed 200 characters");
      return;
    }
    setLastClickTime(now)
    setIsSaving(true)

    try {
      // Handle role visibility changes independently
      for (const role of (user?.company_roles || [])) {
        const orgId = role.org_id || role.company_id;
        const shouldBeVisible = formData.visible_role_ids.includes(orgId!);
        if (role.is_role_visible !== shouldBeVisible) {
          try {
            await updateMemberRoleSettings(orgId!, { is_role_visible: shouldBeVisible });
          } catch (err) {
            console.error("Failed to update role visibility", err);
          }
        }
      }

      await onSave({
        ...formData,
      })
    } catch (err) {
      console.error("Save failed", err)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-none sm:max-w-[800px] h-[100dvh] sm:h-auto w-full rounded-none 
      sm:rounded-[24px] p-0 gap-0 shadow-none bg-card overflow-hidden data-[state=open]:duration-300 
      data-[state=open]:sm:animate-in data-[state=open]:sm:fade-in-90 data-[state=open]:sm:zoom-in-95 
      data-[state=open]:animate-in data-[state=open]:slide-in-from-right 
      sm:data-[state=open]:slide-in-from-bottom-0 [&>button]:hidden">

        {/* Mobile Header */}
        <div className="sm:hidden flex items-center justify-between sticky top-0 bg-card z-50 px-4 py-4 border-b border-border">
          <button onClick={onClose} className="p-2 -ml-2 text-foreground hover:bg-secondary rounded-full transition-colors">
            <Icon icon="hugeicons:arrow-left-01" className="w-6 h-6" />
          </button>
          <span className="text-[16px] font-medium font-[family-name:var(--font-poppins)] text-foreground">
            Edit profile
          </span>
          <button
            onClick={handleSave}
            disabled={isSaving || !hasChanges()}
            className="px-4 py-1.5 rounded-full bg-secondary text-primary font-medium text-[14px] disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isSaving ? "..." : "Save"}
          </button>
        </div>

        <div className="bg-card p-4 rounded-none sm:rounded-[24px] h-[calc(100dvh-73px)] sm:h-auto sm:max-h-[90vh] overflow-y-auto scrollbar-hide">

          {/* Top Close Row */}
          <div className="hidden sm:flex justify-end w-full">
            <button
              onClick={onClose}
              type="button"
              className=" text-[#FF6B6B] rounded-full transition-colors cursor-pointer"
            >
              <X className="w-6 h-6" strokeWidth={1} />
            </button>
          </div>

          <DialogHeader className="hidden sm:flex w-full flex-col items-center justify-center text-center mb-6 h-auto gap-0">
            <DialogTitle className="w-full text-[18px] leading-[26px] font-medium text-foreground font-[family-name:var(--font-poppins)] text-center p-0 m-0">
              Edit profile
            </DialogTitle>
            <DialogDescription className="w-full text-[14px] leading-[20px] text-muted-foreground font-[family-name:var(--font-poppins)] text-center p-0 m-0 mt-[6px]">
              Update your personal and professional information
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4 text-left pt-2 pb-10 sm:pb-0">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col">
                <Label className={labelStyles}>Full name</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className={inputStyles}
                  placeholder="Full name"
                />
              </div>
              <div className="flex flex-col">
                <Label className={labelStyles}>Username</Label>
                <Input
                  value={formData.account_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, account_name: e.target.value }))}
                  className={inputStyles}
                  placeholder="Username"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col">
                <Label className={labelStyles}>Headline</Label>
                <Input
                  value={formData.headline}
                  onChange={(e) => setFormData(prev => ({ ...prev, headline: e.target.value }))}
                  maxLength={200}
                  className={cn(inputStyles, formData.headline.length > 200 && "border-destructive focus:border-destructive")}
                  placeholder="Headline"
                />
                <span className={cn("text-[10px] mt-1 text-right", formData.headline.length > 200 ? "text-destructive" : "text-muted-foreground")}>
                  {formData.headline.length}/200 characters
                </span>
              </div>
              <div className="flex flex-col">
                <Label className={labelStyles}>Status</Label>
                <Select value={formData.status} onValueChange={(v) => setFormData(prev => ({ ...prev, status: v }))}>
                  <SelectTrigger className={cn(inputStyles, getSelectTextColor(formData.status))}>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    {ROLES.map(role => (
                      <SelectItem key={role.id} value={role.id}>{role.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col">
                <Label className={labelStyles}>Location</Label>
                <div className="relative">
                  <LocationAutocomplete
                    value={formData.location}
                    onSelect={(loc) => {
                      if (typeof loc === 'string') {
                        setFormData(prev => ({ ...prev, location: loc }));
                      } else if (loc && 'formattedAddress' in loc) {
                        setFormData(prev => ({ ...prev, location: loc.formattedAddress }));
                      } else if (loc && 'name' in loc) {
                        setFormData(prev => ({ ...prev, location: loc.name }));
                      } else {
                        setFormData(prev => ({ ...prev, location: '' }));
                      }
                    }}
                  />
                </div>
              </div>
              <div className="flex flex-col">
                <Label className={labelStyles}>Link</Label>
                <Input
                  value={formData.website}
                  onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                  className={inputStyles}
                  placeholder="Website link"
                />
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <div className="flex flex-col">
                <Label className={labelStyles}>Looking for</Label>
                <div className="flex flex-wrap gap-2">
                  {LOOKING_FOR_OPTIONS.map(opt => (
                    <button
                      key={opt}
                      onClick={() => toggleOption("open_to", opt)}
                      className={`h-10 min-w-[89px] px-4 rounded-[8px] text-sm font-medium transition-all flex items-center justify-center border ${formData.open_to === opt
                        ? "bg-[#6366F1] border-[#6366F1] text-white shadow-sm"
                        : "bg-[#EEF2FF] border-[#EEF2FF] text-[#6366F1] hover:opacity-80"
                        }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col">
                <Label className={labelStyles}>Availability</Label>
                <div className="flex flex-wrap gap-2">
                  {AVAILABILITY_OPTIONS.map(opt => (
                    <button
                      key={opt}
                      onClick={() => toggleOption("availability", opt)}
                      className={`h-10 min-w-[89px] px-4 rounded-[8px] text-sm font-medium transition-all flex items-center justify-center border ${formData.availability === opt
                        ? "bg-[#6366F1] border-[#6366F1] text-white shadow-sm"
                        : "bg-[#EEF2FF] border-[#EEF2FF] text-[#6366F1] hover:opacity-80"
                        }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col">
                <Label className={labelStyles}>Work setup</Label>
                <div className="flex flex-wrap gap-2">
                  {WORK_SETUP_OPTIONS.map(opt => (
                    <button
                      key={opt}
                      onClick={() => toggleOption("work_preference", opt)}
                      className={`h-10 min-w-[89px] px-4 rounded-[8px] text-sm font-medium transition-all flex items-center justify-center border ${formData.work_preference === opt
                        ? "bg-[#6366F1] border-[#6366F1] text-white shadow-sm"
                        : "bg-[#EEF2FF] border-[#EEF2FF] text-[#6366F1] hover:opacity-80"
                        }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex flex-col">
              <Label className={labelStyles}>About</Label>
              <Textarea
                value={formData.about}
                onChange={(e) => setFormData(prev => ({ ...prev, about: e.target.value }))}
                className="w-full min-h-[100px] bg-card border-border text-foreground placeholder:text-muted-foreground rounded-[16px] px-[16px] py-[10px] font-[family-name:var(--font-poppins)] text-[14px] leading-[20px] resize-none focus-visible:border-primary focus-visible:outline-none transition-all shadow-none"
                placeholder="Tell us about yourself..."
              />
            </div>

            <div className="flex flex-col gap-3 pt-2">
              {user?.company_roles?.map((role) => {
                const orgId = role.org_id || role.company_id;
                return (
                  <div key={orgId} className="flex items-center gap-3">
                    <Checkbox
                      id={`role-${orgId}`}
                      checked={formData.visible_role_ids.includes(orgId!)}
                      onCheckedChange={(checked) => {
                        setFormData(prev => ({
                          ...prev,
                          visible_role_ids: checked ? [orgId!] : []
                        }));
                      }}
                      className="w-[18px] h-[18px] bg-card rounded-[4px] border-2 border-border data-[state=checked]:bg-primary data-[state=checked]:border-primary data-[state=checked]:text-primary-foreground"
                    />
                    <Label htmlFor={`role-${orgId}`} className="text-[14px] leading-[20px] font-normal text-foreground font-[family-name:var(--font-poppins)] cursor-pointer">
                      Show <span className="text-primary font-normal">"{role.role} at {role.name}"</span> on profile
                    </Label>
                  </div>
                );
              })}
            </div>

            <div className="hidden sm:flex justify-center gap-4 pt-6">
              <Button
                variant="outline"
                onClick={onClose}
                className="w-[142px] h-[40px] rounded-[24px] border-[#6366F1] text-[#6366F1] hover:bg-transparent transition-all bg-card font-medium"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={isSaving || !hasChanges()}
                className="w-[142px] h-[40px] rounded-[24px] bg-[#6366F1] hover:bg-[#6366F1] text-white font-medium shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isSaving ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
