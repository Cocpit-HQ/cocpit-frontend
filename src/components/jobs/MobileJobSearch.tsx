"use client"

import { Search, MapPin, X, ArrowLeft } from "lucide-react"

interface MobileJobSearchProps {
  showMobileSearch: boolean
  setShowMobileSearch: (show: boolean) => void
  searchKeywords: string
  setSearchKeywords: (keywords: string) => void
  searchLocations: string[]
  searchLocationInput: string
  setSearchLocationInput: (input: string) => void
  handleAddSearchLocation: (e: React.KeyboardEvent<HTMLInputElement>) => void
  handleRemoveSearchLocation: (loc: string) => void
  handleSearch: () => void
}

export function MobileJobSearch({
  showMobileSearch,
  setShowMobileSearch,
  searchKeywords,
  setSearchKeywords,
  searchLocations,
  searchLocationInput,
  setSearchLocationInput,
  handleAddSearchLocation,
  handleRemoveSearchLocation,
  handleSearch,
}: MobileJobSearchProps) {
  if (!showMobileSearch) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background md:hidden">
       {/* Mobile Header with Back Arrow */}
       <div className="p-4 border-b flex items-center gap-3 bg-card border-border">
         <button
           onClick={() => setShowMobileSearch(false)}
           className="p-2 rounded-full text-muted-foreground hover:bg-muted"
         >
           <ArrowLeft className="w-6 h-6" />
         </button>
         <h2 className="text-lg font-medium text-foreground">Search Jobs</h2>
       </div>

      <div className="flex-1 p-4 overflow-y-auto bg-background">
        <div className="space-y-6">

          {/* Keywords Input */}
          <div>
            <label className="block text-xs font-medium mb-1.5 text-muted-foreground">
              Keywords
            </label>
            <div className="relative bg-card border border-border rounded-xl">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                value={searchKeywords}
                onChange={(e) => setSearchKeywords(e.target.value)}
                placeholder="Job title, keywords, or company"
                className="w-full bg-transparent pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-primary rounded-xl text-foreground placeholder-muted-foreground"
              />
            </div>
          </div>

          {/* Locations Input (Multi-select) */}
          <div>
            <label className="block text-xs font-medium mb-1.5 text-muted-foreground">
              Locations
            </label>
            <div className="flex flex-wrap items-center gap-2 p-3 border rounded-xl min-h-[50px] bg-card border-border">
              <MapPin className="w-5 h-5 flex-shrink-0 text-muted-foreground" />

              {/* Selected Locations Tags */}
              {searchLocations.map((loc, idx) => (
                <span key={idx} className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-sm bg-muted text-primary border border-border">
                  {loc}
                  <button onClick={() => handleRemoveSearchLocation(loc)} className="hover:opacity-70">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}

              <input
                type="text"
                value={searchLocationInput}
                onChange={(e) => setSearchLocationInput(e.target.value)}
                onKeyDown={handleAddSearchLocation}
                placeholder={searchLocations.length === 0 ? "Type city & hit Enter..." : "Add..."}
                className="flex-1 bg-transparent min-w-[100px] focus:outline-none py-1 text-sm text-foreground placeholder-muted-foreground"
              />
            </div>
            <p className="text-[10px] mt-1.5 text-muted-foreground">
              Type a city name and press Enter to add it
            </p>
          </div>

          <button
            type="button"
            onClick={handleSearch}
            className="w-full mt-4 rounded-xl bg-gradient-to-r from-[#5B7CFF] to-[#7B5CFF] px-4 py-3.5 text-base font-medium text-white hover:opacity-90 shadow-md"
          >
            Search Results
          </button>
        </div>
      </div>
    </div>
  )
}
