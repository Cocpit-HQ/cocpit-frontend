import React from 'react'

interface FeedTabsProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export function FeedTabs({ activeTab, setActiveTab }: FeedTabsProps) {
  const commonButtonStyles = "text-sm font-medium px-4 py-1.5 rounded-lg transition-colors";
  const activeButtonStyles = "bg-primary text-primary-foreground";
  const inactiveButtonStyles = "text-muted-foreground hover:text-foreground";

  return (
    <div className="flex gap-4 mb-4 px-4 md:px-0">
      <button
        className={`${commonButtonStyles} ${activeTab === 'top' ? activeButtonStyles : inactiveButtonStyles}`}
        onClick={() => setActiveTab('top')}
      >
        Top
      </button>
      <button
        className={`${commonButtonStyles} ${activeTab === 'recent' ? activeButtonStyles : inactiveButtonStyles}`}
        onClick={() => setActiveTab('recent')}
      >
        Recent
      </button>
    </div>
  )
}
