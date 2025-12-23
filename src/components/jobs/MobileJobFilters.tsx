"use client"

import { X, Check } from "lucide-react"

const JOB_TYPES = ["Full-time", "Part-time", "Contract", "Freelance", "Remote"]

interface MobileJobFiltersProps {
  showMobileFilters: boolean
  setShowMobileFilters: (show: boolean) => void
  filterJobTypes: string[]
  toggleJobType: (type: string) => void
}

export function MobileJobFilters({
  showMobileFilters,
  setShowMobileFilters,
  filterJobTypes,
  toggleJobType,
}: MobileJobFiltersProps) {
  if (!showMobileFilters) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background md:hidden">
      <div className="flex-1 p-4 overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-foreground">Filters</h2>
          <button
            onClick={() => setShowMobileFilters(false)}
            className="p-2 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4 max-h-[60vh] overflow-y-auto">

          {/* Job Type Multi-select (Matched Desktop Logic) */}
          <div>
            <label
              className="mb-2 block text-sm font-medium text-muted-foreground"
            >
              Job Type
            </label>
            <div className="grid grid-cols-2 gap-2">
               {JOB_TYPES.map((type) => {
                  const isSelected = filterJobTypes.includes(type)
                  return (
                    <label key={type} className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-all ${
                      isSelected
                       ? "border-primary bg-primary/5"
                       : "border-border bg-muted/20"
                    }`}>
                      <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors flex-shrink-0 ${
                        isSelected
                         ? "bg-primary border-primary"
                         : "border-muted-foreground bg-card"
                      }`}>
                        {isSelected && <Check className="w-3 h-3 text-primary-foreground" />}
                      </div>
                      <input
                        type="checkbox"
                        className="hidden"
                        checked={isSelected}
                        onChange={() => toggleJobType(type)}
                      />
                      <span className="text-xs text-foreground">{type}</span>
                    </label>
                  )
               })}
            </div>
          </div>

          <div>
            <label
              className="mb-2 block text-sm text-muted-foreground"
            >
              Experience Level
            </label>
            <select
              className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:border-primary bg-muted/20 border-border text-foreground"
            >
              <option>All Levels</option>
              <option>Entry Level</option>
              <option>Mid Level</option>
              <option>Senior Level</option>
              <option>Lead/Manager</option>
            </select>
          </div>

          <div>
            <label
              className="mb-2 block text-sm text-muted-foreground"
            >
              Salary Range
            </label>
            <select
              className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:border-primary bg-muted/20 border-border text-foreground"
            >
              <option>Any</option>
              <option>$80k - $100k</option>
              <option>$100k - $130k</option>
              <option>$130k - $160k</option>
              <option>$160k+</option>
            </select>
          </div>

          <div>
            <label
              className="mb-2 block text-sm text-muted-foreground"
            >
              Date Posted
            </label>
            <select
              className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:border-primary bg-muted/20 border-border text-foreground"
            >
              <option>Any Time</option>
              <option>Past 24 hours</option>
              <option>Past week</option>
              <option>Past month</option>
            </select>
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={() => setShowMobileFilters(false)}
            className="flex-1 rounded-lg border px-4 py-2 text-sm border-border text-muted-foreground hover:bg-muted"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => setShowMobileFilters(false)}
            className="flex-1 rounded-lg bg-gradient-to-r from-[#5B7CFF] to-[#7B5CFF] px-4 py-2 text-sm font-medium text-white hover:opacity-90"
          >
            Apply Filters
          </button>
        </div>
      </div>
    </div>
  )
}
