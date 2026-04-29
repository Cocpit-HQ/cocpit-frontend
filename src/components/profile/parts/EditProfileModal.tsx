"use client"

import React, { useState, useEffect } from "react"
import { X, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
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

interface EditProfileModalProps {
  isOpen: boolean
  onClose: () => void
  user: UserData | null
  onSave: (data: any) => void
}

const LOOKING_FOR_OPTIONS = ["Full-time", "Part-time", "Internship", "Freelance", "Connections"]
const AVAILABILITY_OPTIONS = ["Immediately", "Weekdays", "Weekends", "15 to 30 days", "Flexible", "On-demand"]
const WORK_SETUP_OPTIONS = ["Remote", "Hybrid", "On-site"]

export function EditProfileModal({ isOpen, onClose, user, onSave }: EditProfileModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    account_name: "",
    headline: "",
    status: "Student",
    location: "",
    website: "",
    open_to: [] as string[],
    availability: [] as string[],
    work_preference: [] as string[],
    about: "",
    show_owner_badge: true,
    visible_role_ids: [] as string[],
  })

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        account_name: user.account_name || "",
        headline: user.headline || "",
        status: "Student", // Defaulting for now
        location: user.location || "",
        website: user.website || "",
        open_to: user.open_to ? user.open_to.split(",") : [],
        availability: user.availability ? user.availability.split(",") : [],
        work_preference: user.work_preference ? user.work_preference.split(",") : [],
        about: user.about || "",
        show_owner_badge: true,
        visible_role_ids: user.company_roles
          ? user.company_roles.filter(r => r.is_role_visible).map(r => r.org_id!)
          : [],
      })
    }
  }, [user])

  const toggleOption = (field: "open_to" | "availability" | "work_preference", option: string) => {
    setFormData(prev => {
      const current = prev[field]
      if (current.includes(option)) {
        return { ...prev, [field]: current.filter(o => o !== option) }
      } else {
        return { ...prev, [field]: [...current, option] }
      }
    })
  }

  const inputStyles = "h-[48px] w-full px-4 py-3 !rounded-[16px] border-[#DDE3EA] bg-white text-[16px] leading-[24px] text-black text-left font-[family-name:var(--font-poppins)] font-normal placeholder:text-[#6B7280] focus:border-[#C7D2FE] focus:ring-0 transition-all"
  const labelStyles = "text-[14px] font-normal text-[#111827] mb-[8px] font-[family-name:var(--font-poppins)] leading-[20px]"
  const getSelectTextColor = (value: string) => value ? "text-[#111827]" : "text-[#6B7280]";

  const handleSave = () => {
    onSave({
      ...formData,
      open_to: formData.open_to.join(","),
      availability: formData.availability.join(","),
      work_preference: formData.work_preference.join(","),
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[800px] w-full !rounded-[24px] p-0 gap-0 !border-none shadow-2xl bg-white overflow-hidden">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 w-[24px] h-[24px] flex items-center justify-center text-[#FF6B6B] hover:text-red-600 transition-all focus:outline-none focus-visible:ring-0 z-50"
        >
          <X className="w-4 h-4" />
        </button>
        <div className="bg-white p-4 !rounded-[24px] max-h-[90vh] overflow-y-auto scrollbar-hide">

          <DialogHeader className="w-full flex flex-col items-center justify-center text-center mb-4 h-auto gap-0">
            <DialogTitle className="w-full text-[18px] leading-[26px] font-medium text-[#111827] font-[family-name:var(--font-poppins)] text-center p-0 m-0">
              Edit profile
            </DialogTitle>
            <DialogDescription className="w-full text-[14px] leading-[20px] text-[#6B7280] font-[family-name:var(--font-poppins)] text-center p-0 m-0 mt-[6px]">
              Update your personal and professional information
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4 text-left pt-2">
            <div className="grid grid-cols-2 gap-4">
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

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col">
                <Label className={labelStyles}>Headline</Label>
                <Input
                  value={formData.headline}
                  onChange={(e) => setFormData(prev => ({ ...prev, headline: e.target.value }))}
                  className={inputStyles}
                  placeholder="Headline"
                />
              </div>
              <div className="flex flex-col">
                <Label className={labelStyles}>Status</Label>
                <Select value={formData.status} onValueChange={(v) => setFormData(prev => ({ ...prev, status: v }))}>
                  <SelectTrigger className={cn(inputStyles, getSelectTextColor(formData.status))}>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-border">
                    <SelectItem value="Student">Student</SelectItem>
                    <SelectItem value="Professional">Professional</SelectItem>
                    <SelectItem value="Freelancer">Freelancer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col">
                <Label className={labelStyles}>Location</Label>
                <div className="relative">
                  <Input
                    value={formData.location}
                    onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                    className={cn(inputStyles, "pr-10")}
                    placeholder="Location"
                  />
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-6 h-6 text-[#6B7280]" />
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
                      className={`h-10 min-w-[89px] px-4 rounded-[8px] text-sm font-medium transition-all flex items-center justify-center border ${formData.open_to.includes(opt)
                          ? "bg-[#6366F1] border-[#6366F1] text-white shadow-sm"
                          : "bg-[#EEF2FF] border-[#EEF2FF] text-[#6366F1] hover:bg-[#E0E7FF]"
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
                      className={`h-10 min-w-[89px] px-4 rounded-[8px] text-sm font-medium transition-all flex items-center justify-center border ${formData.availability.includes(opt)
                          ? "bg-[#6366F1] border-[#6366F1] text-white shadow-sm"
                          : "bg-[#EEF2FF] border-[#EEF2FF] text-[#6366F1] hover:bg-[#E0E7FF]"
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
                      className={`h-10 min-w-[89px] px-4 rounded-[8px] text-sm font-medium transition-all flex items-center justify-center border ${formData.work_preference.includes(opt)
                          ? "bg-[#6366F1] border-[#6366F1] text-white shadow-sm"
                          : "bg-[#EEF2FF] border-[#EEF2FF] text-[#6366F1] hover:bg-[#E0E7FF]"
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
                className="w-full min-h-[100px] bg-white border-[#DDE3EA] text-black placeholder-[#6B7280] rounded-[16px] px-[16px] py-[10px] font-[family-name:var(--font-poppins)] text-[14px] leading-[20px] resize-none focus-visible:border-[#C7D2FE] focus-visible:outline-none transition-all shadow-none"
                placeholder="Tell us about yourself..."
              />
            </div>

            <div className="flex flex-col">
              <Label className={labelStyles}>Display Roles</Label>
              <div className="space-y-3">
                {user?.company_roles?.map((role) => (
                  <div key={role.org_id} className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors">
                    <Checkbox
                      id={`role-${role.org_id}`}
                      checked={formData.visible_role_ids.includes(role.org_id!)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setFormData(prev => ({ ...prev, visible_role_ids: [role.org_id!] }));
                        } else {
                          setFormData(prev => ({ ...prev, visible_role_ids: [] }));
                        }
                      }}
                      className="w-[24px] h-[24px] bg-white rounded-[6px] border-[1.5px] border-[#000000] data-[state=checked]:bg-[#6366F1] data-[state=checked]:border-[#6366F1]"
                    />
                    <Label htmlFor={`role-${role.org_id}`} className="flex flex-col cursor-pointer">
                      <span className="text-[14px] leading-[20px] font-medium text-[#111827] font-[family-name:var(--font-poppins)]">{role.role}</span>
                      <span className="text-[12px] leading-[16px] text-[#6B7280] font-[family-name:var(--font-poppins)]">at {role.name}</span>
                    </Label>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-3 mt-4">
                <Checkbox
                  id="show_owner_badge"
                  checked={formData.show_owner_badge}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, show_owner_badge: checked as boolean }))}
                  className="w-[24px] h-[24px] bg-white rounded-[6px] border-[1.5px] border-[#000000] data-[state=checked]:bg-[#6366F1] data-[state=checked]:border-[#6366F1]"
                />
                <Label htmlFor="show_owner_badge" className="text-[14px] leading-[20px] font-normal text-[#111827] font-[family-name:var(--font-poppins)] cursor-pointer">
                  Show <span className="text-[#6366F1] font-normal">"Owner at cocpit"</span> on profile
                </Label>
              </div>
            </div>

            <div className="flex justify-center gap-4 pt-4">
              <Button
                variant="outline"
                onClick={onClose}
                className="w-[142px] h-[40px] rounded-[24px] border-[#818CF8] text-[#818CF8] hover:bg-[#EEF2FF] transition-all bg-white font-semibold"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                className="w-[142px] h-[40px] rounded-[24px] bg-[#6366F1] hover:bg-[#4F46E5] text-white font-semibold transition-all shadow-sm"
              >
                Save
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
