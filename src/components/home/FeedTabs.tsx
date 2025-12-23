import React from 'react'

export function FeedTabs() {
  return (
    <div className="flex gap-4 mb-4 px-4 md:px-0">
      <button className="px-4 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium">
        Top
      </button>
      <button className="text-sm text-muted-foreground hover:text-foreground">
        Recent
      </button>
    </div>
  )
}
