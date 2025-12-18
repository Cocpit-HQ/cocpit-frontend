"use client"

import { Filter, X, Check } from "lucide-react"

const JOB_TYPES = ["Full-time", "Part-time", "Contract", "Remote", "Internship"]
const EXPERIENCE_LEVELS = ["Entry Level", "Mid Level", "Senior Level", "Lead/Manager"]

interface JobFiltersSidebarProps {
  isDark: boolean
  filterJobTypes: string[]
  toggleJobType: (type: string) => void
  filterLocations: string[]
  filterLocationInput: string
  setFilterLocationInput: (value: string) => void
  handleAddFilterLocation: (e: React.KeyboardEvent<HTMLInputElement>) => void
  handleRemoveFilterLocation: (loc: string) => void
}

export function JobFiltersSidebar({
  isDark,
  filterJobTypes,
  toggleJobType,
  filterLocations,
  filterLocationInput,
  setFilterLocationInput,
  handleAddFilterLocation,
  handleRemoveFilterLocation,
}: JobFiltersSidebarProps) {
  return (
    <div className="hidden md:block lg:col-span-1">
      <div
        className={`${isDark ? "bg-[#242b3d] border-[#2d3548]" : "bg-white border-gray-200"} border rounded-xl p-6 sticky top-32`}
      >
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5 text-[#5B7CFF]" />
          <h3 className={isDark ? "text-white" : "text-gray-900"}>Filters</h3>
        </div>

        <div className="space-y-6">
          {/* Job Type - Multi Select */}
          <div>
            <label className={`block text-sm font-medium mb-3 ${isDark ? "text-gray-400" : "text-gray-600"}`}>Job Type</label>
            <div className="space-y-2">
              {JOB_TYPES.map((type) => {
                 const isSelected = filterJobTypes.includes(type)
                 return (
                   <label key={type} className="flex items-center gap-3 cursor-pointer group">
                     <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                       isSelected
                        ? "bg-[#5B7CFF] border-[#5B7CFF]"
                        : isDark ? "border-[#2d3548] bg-[#171c28]" : "border-gray-300 bg-white"
                     }`}>
                       {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                     </div>
                     <input
                       type="checkbox"
                       className="hidden"
                       checked={isSelected}
                       onChange={() => toggleJobType(type)}
                     />
                     <span className={`text-sm ${isDark ? "text-gray-300" : "text-gray-700"}`}>{type}</span>
                   </label>
                 )
              })}
            </div>
          </div>

          {/* Location - Tag Input */}
          <div>
            <label className={`block text-sm font-medium mb-3 ${isDark ? "text-gray-400" : "text-gray-600"}`}>
              Location
            </label>
            <div className={`flex flex-wrap gap-2 p-2 border rounded-lg min-h-[42px] ${
              isDark ? "bg-[#171c28] border-[#2d3548]" : "bg-gray-50 border-gray-300"
            }`}>
               {filterLocations.map((loc, idx) => (
                  <span key={idx} className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs ${
                    isDark ? "bg-[#2d3548] text-blue-300" : "bg-blue-50 text-blue-700"
                  }`}>
                    {loc}
                    <button onClick={() => handleRemoveFilterLocation(loc)} className="hover:opacity-70">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
               ))}
               <input
                  type="text"
                  value={filterLocationInput}
                  onChange={(e) => setFilterLocationInput(e.target.value)}
                  onKeyDown={handleAddFilterLocation}
                  placeholder={filterLocations.length === 0 ? "Type city..." : "Add..."}
                  className={`flex-1 bg-transparent text-sm focus:outline-none min-w-[60px] ${
                    isDark ? "text-white placeholder-gray-500" : "text-gray-900 placeholder-gray-400"
                  }`}
               />
            </div>
            <p className="text-[10px] mt-1 text-gray-500">Press Enter to add location</p>
          </div>

          {/* Experience Level (Kept as select for now, but matched style) */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${isDark ? "text-gray-400" : "text-gray-600"}`}>
              Experience Level
            </label>
            <select
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-[#5B7CFF] transition-colors ${
                isDark ? "bg-[#171c28] border-[#2d3548] text-white" : "bg-gray-50 border-gray-300 text-gray-900"
              }`}
            >
              <option>All Levels</option>
              {EXPERIENCE_LEVELS.map(level => (
                <option key={level}>{level}</option>
              ))}
            </select>
          </div>

          <div>
            <label className={`block text-sm font-medium mb-2 ${isDark ? "text-gray-400" : "text-gray-600"}`}>Salary Range</label>
            <select
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-[#5B7CFF] transition-colors ${
                isDark ? "bg-[#171c28] border-[#2d3548] text-white" : "bg-gray-50 border-gray-300 text-gray-900"
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
            <label className={`block text-sm font-medium mb-2 ${isDark ? "text-gray-400" : "text-gray-600"}`}>Date Posted</label>
            <select
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-[#5B7CFF] transition-colors ${
                isDark ? "bg-[#171c28] border-[#2d3548] text-white" : "bg-gray-50 border-gray-300 text-gray-900"
              }`}
            >
              <option>Any Time</option>
              <option>Past 24 hours</option>
              <option>Past week</option>
              <option>Past month</option>
            </select>
          </div>

          <button className="w-full px-4 py-2 bg-gradient-to-r from-[#5B7CFF] to-[#7B5CFF] text-white rounded-lg hover:opacity-90 transition-all">
            Apply Filters
          </button>
        </div>
      </div>
    </div>
  )
}
