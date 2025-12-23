"use client"

import { X, Check } from "lucide-react"

const JOB_TYPES = ["Full-time", "Part-time", "Contract", "Freelance", "Remote"]
const EXPERIENCE_LEVELS = ["Entry Level", "Mid Level", "Senior Level", "Lead / Manager"]

interface JobFiltersSidebarProps {
  filterJobTypes: string[]
  toggleJobType: (type: string) => void
  filterLocations: string[]
  filterLocationInput: string
  setFilterLocationInput: (input: string) => void
  handleAddFilterLocation: (e: React.KeyboardEvent<HTMLInputElement>) => void
  handleRemoveFilterLocation: (loc: string) => void
}

export function JobFiltersSidebar({
  filterJobTypes,
  toggleJobType,
  filterLocations,
  filterLocationInput,
  setFilterLocationInput,
  handleAddFilterLocation,
  handleRemoveFilterLocation,
}: JobFiltersSidebarProps) {
  return (
    <div className="hidden lg:block lg:col-span-1 space-y-6">
      <div className="bg-card border border-border rounded-xl p-6">
        <h3 className="font-semibold mb-4 text-foreground">Filters</h3>

        <div className="space-y-6">
          {/* Job Type */}
          <div>
            <label className="block text-sm font-medium mb-3 text-muted-foreground">
              Job Type
            </label>
            <div className="space-y-2">
               {JOB_TYPES.map((type) => {
                  const isSelected = filterJobTypes.includes(type)
                  return (
                    <label key={type} className="flex items-center gap-3 cursor-pointer group">
                     <div className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${
                       isSelected
                        ? "bg-primary border-primary"
                        : "border-muted-foreground/50 group-hover:border-primary"
                     }`}>
                       {isSelected && <Check className="w-3.5 h-3.5 text-primary-foreground" />}
                     </div>
                     <input
                       type="checkbox"
                       className="hidden"
                       checked={isSelected}
                       onChange={() => toggleJobType(type)}
                     />
                     <span className="text-sm text-foreground group-hover:text-primary transition-colors">{type}</span>
                   </label>
                 )
              })}
            </div>
          </div>

          {/* Location - Tag Input */}
          <div>
            <label className="block text-sm font-medium mb-3 text-muted-foreground">
              Location
            </label>
            <div className="flex flex-wrap gap-2 p-2 border rounded-lg min-h-[42px] bg-muted/30 border-border">
               {filterLocations.map((loc, idx) => (
                  <span key={idx} className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs bg-primary/10 text-primary">
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
                  className="flex-1 bg-transparent text-sm focus:outline-none min-w-[60px] text-foreground placeholder-muted-foreground"
               />
            </div>
            <p className="text-[10px] mt-1 text-muted-foreground">Press Enter to add location</p>
          </div>

          {/* Experience Level */}
          <div>
            <label className="block text-sm font-medium mb-2 text-muted-foreground">
              Experience Level
            </label>
            <select
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-primary transition-colors bg-muted/30 border-border text-foreground"
            >
              <option>All Levels</option>
              {EXPERIENCE_LEVELS.map(level => (
                <option key={level}>{level}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-muted-foreground">Salary Range</label>
            <select
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-primary transition-colors bg-muted/30 border-border text-foreground"
            >
              <option>Any</option>
              <option>$80k - $100k</option>
              <option>$100k - $130k</option>
              <option>$130k - $160k</option>
              <option>$160k+</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-muted-foreground">Date Posted</label>
            <select
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-primary transition-colors bg-muted/30 border-border text-foreground"
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
