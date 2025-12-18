"use client"

import { Search, MapPin, X, ArrowLeft } from "lucide-react"

interface MobileJobSearchProps {
  isDark: boolean
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
  isDark,
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
    <div className="fixed inset-0 z-50 flex flex-col bg-white md:hidden">
       {/* Mobile Header with Back Arrow */}
       <div className={`p-4 border-b flex items-center gap-3 ${
          isDark ? "bg-[#242b3d] border-[#2d3548]" : "bg-white border-gray-200"
       }`}>
         <button
           onClick={() => setShowMobileSearch(false)}
           className={`p-2 rounded-full ${
             isDark ? "text-gray-400 hover:bg-[#171c28]" : "text-gray-600 hover:bg-gray-100"
           }`}
         >
           <ArrowLeft className="w-6 h-6" />
         </button>
         <h2 className={`text-lg font-medium ${isDark ? "text-white" : "text-gray-900"}`}>Search Jobs</h2>
       </div>

      <div className={`flex-1 p-4 overflow-y-auto ${isDark ? "bg-[#171c28]" : "bg-gray-50"}`}>
        <div className="space-y-6">

          {/* Keywords Input */}
          <div>
            <label className={`block text-xs font-medium mb-1.5 ${isDark ? "text-gray-400" : "text-gray-500"}`}>
              Keywords
            </label>
            <div className={`relative ${isDark ? "bg-[#242b3d] border-[#2d3548]" : "bg-white border-gray-300"} border rounded-xl`}>
              <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${isDark ? "text-gray-400" : "text-gray-500"}`} />
              <input
                type="text"
                value={searchKeywords}
                onChange={(e) => setSearchKeywords(e.target.value)}
                placeholder="Job title, keywords, or company"
                className={`w-full bg-transparent pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-[#5B7CFF] rounded-xl ${
                  isDark ? "text-white placeholder-gray-500" : "text-gray-900 placeholder-gray-400"
                }`}
              />
            </div>
          </div>

          {/* Locations Input (Multi-select) */}
          <div>
            <label className={`block text-xs font-medium mb-1.5 ${isDark ? "text-gray-400" : "text-gray-500"}`}>
              Locations
            </label>
            <div className={`flex flex-wrap items-center gap-2 p-3 border rounded-xl min-h-[50px] ${
              isDark ? "bg-[#242b3d] border-[#2d3548]" : "bg-white border-gray-300"
            }`}>
              <MapPin className={`w-5 h-5 flex-shrink-0 ${isDark ? "text-gray-400" : "text-gray-500"}`} />

              {/* Selected Locations Tags */}
              {searchLocations.map((loc, idx) => (
                <span key={idx} className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-sm ${
                  isDark ? "bg-[#171c28] text-blue-300 border border-[#2d3548]" : "bg-blue-50 text-blue-700"
                }`}>
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
                className={`flex-1 bg-transparent min-w-[100px] focus:outline-none py-1 text-sm ${
                  isDark ? "text-white placeholder-gray-500" : "text-gray-900 placeholder-gray-400"
                }`}
              />
            </div>
            <p className={`text-[10px] mt-1.5 ${isDark ? "text-gray-500" : "text-gray-500"}`}>
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
