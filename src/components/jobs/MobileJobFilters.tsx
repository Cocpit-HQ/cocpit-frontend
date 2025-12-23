"use client"

import { Check, ChevronDown, ChevronUp, X } from "lucide-react"
import { Drawer, DrawerContent, DrawerTrigger, DrawerClose, DrawerTitle } from "@/components/ui/drawer"
import { useJobs } from "@/context/JobsContext"
import { useState } from "react"
import { cn } from "@/lib/utils"

const JOB_TYPES = ["Full-time", "Part-time", "Contract", "Freelance", "Remote"]
const WORK_MODES = ["Remote", "Hybrid", "Onsite"]
const COMPANY_TYPES = ["Startup", "MNC", "Product-based", "Service-based"]
const INDUSTRIES = ["Technology", "Finance", "Healthcare", "Education", "Retail"]
const EXPERIENCE_LEVELS = ["All Levels", "Entry Level", "Mid Level", "Senior Level", "Lead / Manager"]
const SALARY_RANGES = ["Any", "$0 - $50k", "$50k - $100k", "$100k - $150k", "$150k+"]
const DATE_POSTED_OPTIONS = ["Any Time", "Past 24 hours", "Past week", "Past month"]

interface MobileJobFiltersProps {
  showMobileFilters: boolean
  setShowMobileFilters: (show: boolean) => void
}

interface FilterSectionProps {
  title: string
  children: React.ReactNode
  isOpen?: boolean
}

function FilterSection({ title, children, isOpen = true }: FilterSectionProps) {
  const [open, setOpen] = useState(isOpen)
  return (
    <div className="border-b border-border py-4 last:border-0">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full text-sm font-medium mb-2"
      >
        {title}
        {open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </button>
      {open && <div className="space-y-2 mt-2">{children}</div>}
    </div>
  )
}

export function MobileJobFilters({ showMobileFilters, setShowMobileFilters }: MobileJobFiltersProps) {
  const { filters, updateFilters } = useJobs()
  const [locationInput, setLocationInput] = useState("")

  const toggleArrayFilter = (key: keyof typeof filters, value: string) => {
    const current = filters[key] as string[];
    const updated = current.includes(value)
      ? current.filter(item => item !== value)
      : [...current, value];
    updateFilters({ [key]: updated });
  }

  const handleAddLocation = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && locationInput.trim()) {
      e.preventDefault()
      if (!filters.locations.includes(locationInput.trim())) {
        updateFilters({ locations: [...filters.locations, locationInput.trim()] })
      }
      setLocationInput("")
    }
  }

  const removeLocation = (loc: string) => {
    updateFilters({ locations: filters.locations.filter(l => l !== loc) })
  }

  return (
    <Drawer open={showMobileFilters} onOpenChange={setShowMobileFilters}>
      <DrawerContent className="h-[85vh] bg-background border-t border-border rounded-t-xl px-4 pb-4">
        <DrawerTitle className="sr-only">Filters</DrawerTitle>
        <div className="flex items-center justify-between py-4 border-b border-border mb-4">
           <h2 className="text-lg font-semibold">Filters</h2>
           <button
              onClick={() => updateFilters({
                jobType: [],
                workMode: [],
                companyType: [],
                industry: [],
                locations: [],
                experience: "All Levels",
                salaryRange: "Any",
                datePosted: "Any Time",
                easyApply: false,
                activelyHiring: false
              })}
              className="text-sm text-primary hover:underline"
            >
              Clear all
            </button>
        </div>

        <div className="overflow-y-auto flex-1 h-full pb-20">
          <div className="space-y-4">
            {/* Toggles */}
            <div className="space-y-3 pb-4 border-b border-border">
               <label className="flex items-center justify-between cursor-pointer">
                 <span className="text-sm">Easy Apply</span>
                 <div className={cn("w-10 h-6 rounded-full p-1 transition-colors", filters.easyApply ? "bg-primary" : "bg-muted")}>
                   <div className={cn("w-4 h-4 bg-white rounded-full transition-transform", filters.easyApply ? "translate-x-4" : "")} />
                 </div>
                 <input type="checkbox" className="hidden" checked={filters.easyApply} onChange={(e) => updateFilters({ easyApply: e.target.checked })} />
               </label>
               <label className="flex items-center justify-between cursor-pointer">
                 <span className="text-sm">Actively Hiring</span>
                 <div className={cn("w-10 h-6 rounded-full p-1 transition-colors", filters.activelyHiring ? "bg-primary" : "bg-muted")}>
                   <div className={cn("w-4 h-4 bg-white rounded-full transition-transform", filters.activelyHiring ? "translate-x-4" : "")} />
                 </div>
                 <input type="checkbox" className="hidden" checked={filters.activelyHiring} onChange={(e) => updateFilters({ activelyHiring: e.target.checked })} />
               </label>
            </div>

            <FilterSection title="Location">
               <div className="flex flex-wrap gap-2 p-2 border rounded-lg min-h-[42px] bg-muted/30 border-border mb-2">
                 {filters.locations.map((loc) => (
                    <span key={loc} className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs bg-primary/10 text-primary">
                      {loc}
                      <button onClick={() => removeLocation(loc)} className="hover:opacity-70"><X className="w-3 h-3" /></button>
                    </span>
                 ))}
                 <input
                    type="text"
                    value={locationInput}
                    onChange={(e) => setLocationInput(e.target.value)}
                    onKeyDown={handleAddLocation}
                    placeholder="Add city..."
                    className="flex-1 bg-transparent text-sm focus:outline-none min-w-[60px] text-foreground placeholder-muted-foreground"
                 />
              </div>
            </FilterSection>

            <FilterSection title="Experience Level">
              {EXPERIENCE_LEVELS.map((level) => (
                <label key={level} className="flex items-center gap-3 cursor-pointer group py-1">
                  <div className={cn(
                    "w-4 h-4 rounded-full border flex items-center justify-center transition-all",
                    filters.experience === level ? "border-primary" : "border-muted-foreground/50"
                  )}>
                    {filters.experience === level && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                  </div>
                  <input type="radio" className="hidden" checked={filters.experience === level} onChange={() => updateFilters({ experience: level })} />
                  <span className="text-sm text-foreground">{level}</span>
                </label>
              ))}
            </FilterSection>

            <FilterSection title="Salary Range">
              {SALARY_RANGES.map((range) => (
                <label key={range} className="flex items-center gap-3 cursor-pointer group py-1">
                  <div className={cn(
                    "w-4 h-4 rounded-full border flex items-center justify-center transition-all",
                    filters.salaryRange === range ? "border-primary" : "border-muted-foreground/50"
                  )}>
                    {filters.salaryRange === range && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                  </div>
                  <input type="radio" className="hidden" checked={filters.salaryRange === range} onChange={() => updateFilters({ salaryRange: range })} />
                  <span className="text-sm text-foreground">{range}</span>
                </label>
              ))}
            </FilterSection>

            <FilterSection title="Date Posted">
              {DATE_POSTED_OPTIONS.map((option) => (
                <label key={option} className="flex items-center gap-3 cursor-pointer group py-1">
                  <div className={cn(
                    "w-4 h-4 rounded-full border flex items-center justify-center transition-all",
                    filters.datePosted === option ? "border-primary" : "border-muted-foreground/50"
                  )}>
                    {filters.datePosted === option && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                  </div>
                  <input type="radio" className="hidden" checked={filters.datePosted === option} onChange={() => updateFilters({ datePosted: option })} />
                  <span className="text-sm text-foreground">{option}</span>
                </label>
              ))}
            </FilterSection>

            <FilterSection title="Job Type">
              {JOB_TYPES.map((type) => (
                <label key={type} className="flex items-center gap-3 cursor-pointer group py-1">
                  <div className={cn(
                    "w-5 h-5 rounded border flex items-center justify-center transition-all",
                    filters.jobType.includes(type) ? "bg-primary border-primary" : "border-muted-foreground/50"
                  )}>
                    {filters.jobType.includes(type) && <Check className="w-3.5 h-3.5 text-primary-foreground" />}
                  </div>
                  <input type="checkbox" className="hidden" checked={filters.jobType.includes(type)} onChange={() => toggleArrayFilter('jobType', type)} />
                  <span className="text-sm text-foreground">{type}</span>
                </label>
              ))}
            </FilterSection>

            <FilterSection title="Work Mode">
              {WORK_MODES.map((mode) => (
                <label key={mode} className="flex items-center gap-3 cursor-pointer group py-1">
                  <div className={cn(
                    "w-5 h-5 rounded border flex items-center justify-center transition-all",
                    filters.workMode.includes(mode) ? "bg-primary border-primary" : "border-muted-foreground/50"
                  )}>
                    {filters.workMode.includes(mode) && <Check className="w-3.5 h-3.5 text-primary-foreground" />}
                  </div>
                  <input type="checkbox" className="hidden" checked={filters.workMode.includes(mode)} onChange={() => toggleArrayFilter('workMode', mode)} />
                  <span className="text-sm text-foreground">{mode}</span>
                </label>
              ))}
            </FilterSection>

             <FilterSection title="Company Type">
              {COMPANY_TYPES.map((type) => (
                <label key={type} className="flex items-center gap-3 cursor-pointer group py-1">
                  <div className={cn(
                    "w-5 h-5 rounded border flex items-center justify-center transition-all",
                    filters.companyType.includes(type) ? "bg-primary border-primary" : "border-muted-foreground/50"
                  )}>
                    {filters.companyType.includes(type) && <Check className="w-3.5 h-3.5 text-primary-foreground" />}
                  </div>
                  <input type="checkbox" className="hidden" checked={filters.companyType.includes(type)} onChange={() => toggleArrayFilter('companyType', type)} />
                  <span className="text-sm text-foreground">{type}</span>
                </label>
              ))}
            </FilterSection>

            <FilterSection title="Industry">
              {INDUSTRIES.map((ind) => (
                <label key={ind} className="flex items-center gap-3 cursor-pointer group py-1">
                  <div className={cn(
                    "w-5 h-5 rounded border flex items-center justify-center transition-all",
                    filters.industry.includes(ind) ? "bg-primary border-primary" : "border-muted-foreground/50"
                  )}>
                    {filters.industry.includes(ind) && <Check className="w-3.5 h-3.5 text-primary-foreground" />}
                  </div>
                  <input type="checkbox" className="hidden" checked={filters.industry.includes(ind)} onChange={() => toggleArrayFilter('industry', ind)} />
                  <span className="text-sm text-foreground">{ind}</span>
                </label>
              ))}
            </FilterSection>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-4 bg-background border-t border-border">
           <button
             onClick={() => setShowMobileFilters(false)}
             className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold"
           >
             Show Results
           </button>
        </div>
      </DrawerContent>
    </Drawer>
  )
}
