import React from "react"

interface FeedTabsProps {
  activeTab: string
  setActiveTab: (tab: string) => void
}

export function FeedTabs({ activeTab, setActiveTab }: FeedTabsProps) {
  return (
    <div className="flex gap-2 mb-4 px-4 md:hidden overflow-x-auto">
      {[
        { id: "top", label: "Top" },
        { id: "recent", label: "Recent" },
      ].map((tab) => {
        const isActive = activeTab === tab.id

        return (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`rounded-full px-7 py-2 text-sm font-medium whitespace-nowrap transition-colors ${
              isActive
                ? "bg-gradient-to-r from-[#5B7CFF] to-[#F472B6] text-white shadow-md"
                : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
            }`}
          >
            {tab.label}
          </button>
        )
      })}
    </div>
  )
}
