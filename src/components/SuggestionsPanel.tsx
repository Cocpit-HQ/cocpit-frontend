"use client";

import React, { useState } from "react";
import { Plus, Check, X } from "lucide-react";

type Theme = "dark" | "light" | "system";

type Suggestion = {
  id: string;
  name: string;
  title: string;
  followers: string;
  avatar: string;
  verified: boolean;
};

interface SuggestionsPanelProps {
  theme?: Theme;
}

export function SuggestionsPanel({ theme = "dark" }: SuggestionsPanelProps) {
  const isDark = theme === "dark" || theme === "system";

  const suggestions: Suggestion[] = [
    {
      id: "sarah",
      name: "Sarah Williams",
      title: "UX Designer",
      followers: "2.3k followers",
      avatar:
        "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop",
      verified: true,
    },
    {
      id: "michael",
      name: "Michael Chen",
      title: "Software Engineer",
      followers: "1.8k followers",
      avatar:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop",
      verified: false,
    },
    {
      id: "emily",
      name: "Emily Rodriguez",
      title: "Marketing Manager",
      followers: "3.1k followers",
      avatar:
        "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop",
      verified: true,
    },
    {
      id: "david",
      name: "David Thompson",
      title: "Data Scientist",
      followers: "2.7k followers",
      avatar:
        "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop",
      verified: true,
    },
    {
      id: "lisa",
      name: "Lisa Anderson",
      title: "Product Designer",
      followers: "1.9k followers",
      avatar:
        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop",
      verified: false,
    },
  ];

  const [hiddenIds, setHiddenIds] = useState<string[]>([]);

  const visibleSuggestions = suggestions.filter(
    (s) => !hiddenIds.includes(s.id)
  );

  const handleDismiss = (id: string) => {
    setHiddenIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
  };

  if (visibleSuggestions.length === 0) {
    return null;
  }

  return (
    <div
      suppressHydrationWarning
      className={`${
        isDark ? "bg-[#242b3d] border-[#2d3548]" : "bg-white border-gray-200"
      } rounded-xl border overflow-hidden`}
    >
      <div
        className={`px-4 py-4 border-b flex items-center justify-between ${
          isDark ? "border-[#2d3548]" : "border-gray-200"
        }`}
      >
        <h3 className={isDark ? "text-white" : "text-gray-900"}>
          Suggested for you
        </h3>
        <button className="text-[#5B7CFF] text-sm hover:underline">
          See all
        </button>
      </div>

      {/* Mobile: horizontal sliding strip */}
      <div className="p-4 md:hidden">
        <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory">
          {visibleSuggestions.map((person) => (
            <div
              key={person.id}
              className={`relative flex min-w-[220px] flex-col gap-2 rounded-xl p-3 snap-start ${
                isDark ? "bg-[#1a1f2e] border border-[#2d3548]" : "bg-white border border-gray-200"
              }`}
            >
              <button
                type="button"
                onClick={() => handleDismiss(person.id)}
                className={`absolute right-2 top-2 rounded-full p-1 text-xs ${
                  isDark
                    ? "text-gray-400 hover:bg-[#242b3d] hover:text-white"
                    : "text-gray-500 hover:bg-gray-100 hover:text-gray-900"
                }`}
                aria-label="Dismiss suggestion"
              >
                <X className="h-3 w-3" />
              </button>

              <div className="flex items-center gap-2">
                <div className="relative flex-shrink-0">
                  <div
                    className={`h-10 w-10 overflow-hidden rounded-full ${
                      isDark ? "bg-gray-700" : "bg-gray-200"
                    }`}
                  >
                    <img
                      src={person.avatar}
                      alt={person.name}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  {person.verified && (
                    <div
                      className={`absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#5B7CFF] border-2 ${
                        isDark ? "border-[#1a1f2e]" : "border-white"
                      }`}
                    >
                      <Check className="h-2.5 w-2.5 text-white" />
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div
                    className={`truncate text-sm font-medium ${
                      isDark ? "text-white" : "text-gray-900"
                    }`}
                  >
                    {person.name}
                  </div>
                  <div
                    className={`truncate text-xs ${
                      isDark ? "text-gray-400" : "text-gray-600"
                    }`}
                  >
                    {person.title}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>{person.followers}</span>
                <button className="inline-flex items-center gap-1 rounded-lg bg-[#5B7CFF] px-3 py-1 text-xs font-medium text-white hover:bg-[#4B6DEF]">
                  <Plus className="h-3 w-3" />
                  <span>Follow</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Desktop: vertical list */}
      <div className="hidden p-4 space-y-4 md:block">
        {visibleSuggestions.map((person) => (
          <div key={person.id} className="relative flex items-start gap-3">
            <div className="relative flex-shrink-0">
              <div
                className={`h-12 w-12 overflow-hidden rounded-full ${
                  isDark ? "bg-gray-700" : "bg-gray-200"
                }`}
              >
                <img
                  src={person.avatar}
                  alt={person.name}
                  className="h-full w-full object-cover"
                />
              </div>
              {person.verified && (
                <div
                  className={`absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#5B7CFF] border-2 ${
                    isDark ? "border-[#242b3d]" : "border-white"
                  }`}
                >
                  <Check className="h-3 w-3 text-white" />
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div
                className={`truncate flex items-center gap-1 ${
                  isDark ? "text-white" : "text-gray-900"
                }`}
              >
                {person.name}
              </div>
              <div
                className={`truncate text-sm ${
                  isDark ? "text-gray-400" : "text-gray-600"
                }`}
              >
                {person.title}
              </div>
              <div className="text-xs text-gray-500">{person.followers}</div>
            </div>
            <div className="flex flex-col items-end gap-1">
              <button
                type="button"
                onClick={() => handleDismiss(person.id)}
                className={`rounded-full p-1 text-xs ${
                  isDark
                    ? "text-gray-400 hover:bg-[#242b3d] hover:text-white"
                    : "text-gray-500 hover:bg-gray-100 hover:text-gray-900"
                }`}
                aria-label="Dismiss suggestion"
              >
                <X className="h-3 w-3" />
              </button>
              <button className="bg-[#5B7CFF] text-white px-4 py-1.5 rounded-lg hover:bg-[#4B6DEF] transition-all flex items-center gap-1 flex-shrink-0 text-sm">
                <Plus className="w-4 h-4" />
                <span>Follow</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="px-4 pb-4">
        <button
          className={`text-sm transition-all ${
            isDark ? "text-gray-400 hover:text-white" : "text-gray-600 hover:text-gray-900"
          }`}
        >
          View more suggestions →
        </button>
      </div>
    </div>
  );
}

export default SuggestionsPanel;
