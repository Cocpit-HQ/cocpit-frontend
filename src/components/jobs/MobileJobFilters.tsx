"use client"

import { X, Check } from "lucide-react"

const JOB_TYPES = ["Full-time", "Part-time", "Contract", "Remote", "Internship"]

interface MobileJobFiltersProps {
  isDark: boolean
  showMobileFilters: boolean
  setShowMobileFilters: (show: boolean) => void
  filterJobTypes: string[]
  toggleJobType: (type: string) => void
}

export function MobileJobFilters({
  isDark,
  showMobileFilters,
  setShowMobileFilters,
  filterJobTypes,
  toggleJobType
}: MobileJobFiltersProps) {
  if (!showMobileFilters) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm md:hidden">
      <div
        className={`w-full max-w-md rounded-t-2xl p-4 pb-6 ${
          isDark ? "bg-[#242b3d]" : "bg-white"
        }`}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className={isDark ? "text-white" : "text-gray-900"}>Filters</h2>
          <button
            type="button"
            onClick={() => setShowMobileFilters(false)}
            className={`rounded-full p-2 ${
              isDark
                ? "text-gray-400 hover:bg-[#171c28]"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4 max-h-[60vh] overflow-y-auto">

          {/* Job Type Multi-select (Matched Desktop Logic) */}
          <div>
            <label
              className={`mb-2 block text-sm font-medium ${
                isDark ? "text-gray-400" : "text-gray-600"
              }`}
            >
              Job Type
            </label>
            <div className="grid grid-cols-2 gap-2">
               {JOB_TYPES.map((type) => {
                  const isSelected = filterJobTypes.includes(type)
                  return (
                    <label key={type} className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-all ${
                      isSelected
                       ? "border-[#5B7CFF] bg-[#5B7CFF]/5"
                       : isDark ? "border-[#2d3548] bg-[#171c28]" : "border-gray-200 bg-gray-50"
                    }`}>
                      <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors flex-shrink-0 ${
                        isSelected
                         ? "bg-[#5B7CFF] border-[#5B7CFF]"
                         : isDark ? "border-[#2d3548] bg-[#242b3d]" : "border-gray-300 bg-white"
                      }`}>
                        {isSelected && <Check className="w-3 h-3 text-white" />}
                      </div>
                      <input
                        type="checkbox"
                        className="hidden"
                        checked={isSelected}
                        onChange={() => toggleJobType(type)}
                      />
                      <span className={`text-xs ${isDark ? "text-gray-300" : "text-gray-700"}`}>{type}</span>
                    </label>
                  )
               })}
            </div>
          </div>

          <div>
            <label
              className={`mb-2 block text-sm ${
                isDark ? "text-gray-400" : "text-gray-600"
              }`}
            >
              Experience Level
            </label>
            <select
              className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:border-[#5B7CFF] ${
                isDark
                  ? "bg-[#171c28] border-[#2d3548] text-white"
                  : "bg-gray-50 border-gray-300 text-gray-900"
              }`}
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
              className={`mb-2 block text-sm ${
                isDark ? "text-gray-400" : "text-gray-600"
              }`}
            >
              Salary Range
            </label>
            <select
              className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:border-[#5B7CFF] ${
                isDark
                  ? "bg-[#171c28] border-[#2d3548] text-white"
                  : "bg-gray-50 border-gray-300 text-gray-900"
              }`}
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
              className={`mb-2 block text-sm ${
                isDark ? "text-gray-400" : "text-gray-600"
              }`}
            >
              Date Posted
            </label>
            <select
              className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:border-[#5B7CFF] ${
                isDark
                  ? "bg-[#171c28] border-[#2d3548] text-white"
                  : "bg-gray-50 border-gray-300 text-gray-900"
              }`}
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
            className={`flex-1 rounded-lg border px-4 py-2 text-sm ${
              isDark
                ? "border-[#2d3548] text-gray-300 hover:bg-[#171c28]"
                : "border-gray-300 text-gray-700 hover:bg-gray-100"
            }`}
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
