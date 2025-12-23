"use client"

import { Search, MapPin, X } from "lucide-react"

interface JobSearchBarProps {
  isSearchExpanded: boolean
  setIsSearchExpanded: (isExpanded: boolean) => void
  searchKeywords: string
  setSearchKeywords: (keywords: string) => void
  searchLocations: string[]
  searchLocationInput: string
  setSearchLocationInput: (input: string) => void
  handleAddSearchLocation: (e: React.KeyboardEvent<HTMLInputElement>) => void
  handleRemoveSearchLocation: (loc: string) => void
  handleSearch: () => void
  collapsedSearchText: string
}

export function JobSearchBar({
  isSearchExpanded,
  setIsSearchExpanded,
  searchKeywords,
  setSearchKeywords,
  searchLocations,
  searchLocationInput,
  setSearchLocationInput,
  handleAddSearchLocation,
  handleRemoveSearchLocation,
  handleSearch,
  collapsedSearchText,
}: JobSearchBarProps) {
  return (
    <div className="hidden md:block w-full max-w-4xl mx-auto mb-8">
      <div
        className="transition-all duration-300 ease-in-out border rounded-2xl shadow-lg overflow-hidden bg-card border-border"
      >
        {!isSearchExpanded ? (
          // Collapsed State
          <div
            onClick={() => setIsSearchExpanded(true)}
            className="cursor-pointer p-6 flex items-center gap-4 hover:opacity-95"
          >
            <Search className="w-6 h-6 text-muted-foreground" />
            <div className={`flex-1 text-lg ${!collapsedSearchText ? "text-muted-foreground" : "text-muted-foreground opacity-70"}`}>
              {collapsedSearchText || "Search by title, skill, or company..."}
            </div>
            <button className="bg-gradient-to-r from-[#5B7CFF] to-[#7B5CFF] text-white px-8 py-2 rounded-xl text-sm font-medium">
              Search
            </button>
          </div>
        ) : (
          // Expanded State
          <div className="p-6">
            <div className="flex flex-col gap-4">
               <div className="flex gap-4 items-start">
                  {/* Keyword Input */}
                  <div className="flex-1">
                    <label className="block text-xs font-medium mb-1.5 ml-1 text-muted-foreground">
                      Keywords
                    </label>
                    <div className="flex items-center gap-3 px-4 py-3 border rounded-xl bg-muted/30 border-border">
                      <Search className="w-5 h-5 text-muted-foreground" />
                      <input
                        autoFocus
                        type="text"
                        value={searchKeywords}
                        onChange={(e) => setSearchKeywords(e.target.value)}
                        placeholder="Job title, keywords, or company"
                        className="w-full bg-transparent focus:outline-none text-foreground placeholder-muted-foreground"
                      />
                    </div>
                  </div>

                  {/* Location Input (Multi-select) */}
                  <div className="flex-1">
                    <label className="block text-xs font-medium mb-1.5 ml-1 text-muted-foreground">
                      Locations
                    </label>
                    <div className="flex flex-wrap items-center gap-2 px-4 py-2 border rounded-xl min-h-[50px] bg-muted/30 border-border">
                      <MapPin className="w-5 h-5 flex-shrink-0 text-muted-foreground" />

                      {/* Selected Locations Tags */}
                      {searchLocations.map((loc, idx) => (
                        <span key={idx} className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-sm bg-primary/10 text-primary">
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
                        placeholder={searchLocations.length === 0 ? "Type city & hit Enter..." : "Add another..."}
                        className="flex-1 bg-transparent min-w-[120px] focus:outline-none py-1 text-foreground placeholder-muted-foreground"
                      />
                    </div>
                  </div>
               </div>

               <div className="flex justify-end pt-2">
                 <button
                    onClick={handleSearch}
                    className="w-full md:w-auto px-12 py-3 bg-gradient-to-r from-[#5B7CFF] to-[#7B5CFF] text-white rounded-xl font-medium hover:opacity-90 transition-all shadow-md"
                  >
                    Search Jobs
                  </button>
               </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
