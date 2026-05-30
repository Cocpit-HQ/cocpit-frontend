"use client";

import React, { useState, useEffect, useMemo } from "react";
import { X, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Icon } from '@iconify/react';
import { useQuery } from "@tanstack/react-query";
import { searchSkills } from "../services/profile.service";

interface SkillModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialSkills?: string[];
  onSave: (skills: string[]) => void;
  loading?: boolean;
}

export function SkillModal({ isOpen, onClose, initialSkills = [], onSave, loading = false }: SkillModalProps) {
  const [selectedSkills, setSelectedSkills] = useState<string[]>(initialSkills);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const skillsPerPage = 8;

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const { data: suggestedSkills = [], isLoading: isSearching } = useQuery({
    queryKey: ["skill-suggestions", debouncedSearch],
    queryFn: () => searchSkills(debouncedSearch),
    enabled: isOpen,
  });

  useEffect(() => {
    if (isOpen) {
      // Deduplicate initial skills just in case there are duplicates in the state
      setSelectedSkills([...new Set(initialSkills)]);
      setSearchQuery("");
      setCurrentPage(1);
    }
  }, [isOpen, initialSkills]);

  const filteredSkills = useMemo(() => {
    // Combine suggested skills with selected skills to ensure they are available to toggle
    const combined = Array.from(new Set([...suggestedSkills, ...selectedSkills]));

    // Filter based on current search query (frontend filter for immediate feedback)
    const filtered = combined.filter(skill =>
      typeof skill === 'string' && skill.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const query = searchQuery.trim();
    if (query && !filtered.some(s => typeof s === 'string' && s.toLowerCase() === query.toLowerCase())) {
      return [query, ...filtered];
    }

    return filtered;
  }, [suggestedSkills, selectedSkills, searchQuery]);

  const paginatedSkills = useMemo(() => {
    const start = (currentPage - 1) * skillsPerPage;
    return filteredSkills.slice(start, start + skillsPerPage);
  }, [filteredSkills, currentPage]);

  const totalPages = Math.max(1, Math.ceil(filteredSkills.length / skillsPerPage));

  const toggleSkill = (skill: string) => {
    setSelectedSkills(prev => {
      const exists = prev.some(s => typeof s === 'string' && s.toLowerCase() === skill.toLowerCase());
      if (exists) {
        return prev.filter(s => typeof s === 'string' && s.toLowerCase() !== skill.toLowerCase());
      }
      return [...prev, skill];
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in-90">
      <div className="w-full h-[100dvh] sm:h-[454px] max-w-none sm:max-w-[460px] rounded-none sm:rounded-[24px] bg-card shadow-2xl relative flex flex-col p-4 animate-in slide-in-from-right sm:slide-in-from-bottom-0">

        {/* Mobile Header */}
        <div className="sm:hidden flex items-center justify-between mb-4 mt-2">
          <button onClick={onClose} className="p-2 -ml-2 text-foreground hover:bg-secondary rounded-full transition-colors">
            <Icon icon="hugeicons:arrow-left-01" className="w-6 h-6" />
          </button>
          <span className="text-[16px] font-medium font-[family-name:var(--font-poppins)] text-foreground">
            Add skills
          </span>
          <Button
            onClick={() => onSave(selectedSkills)}
            disabled={
              loading ||
              selectedSkills.length === 0 ||
              (JSON.stringify([...selectedSkills].sort()) === JSON.stringify([...initialSkills].sort()))
            }
            className="px-4 py-1.5 rounded-full bg-primary hover:bg-primary text-primary-foreground font-medium text-[14px] disabled:opacity-50 transition-all disabled:cursor-not-allowed font-[family-name:var(--font-poppins)]"
          >
            {loading ? "..." : "Save"}
          </Button>
        </div>

        {/* Top Close Row (Desktop only) */}
        <div className="hidden sm:flex justify-end w-full">
          <button
            onClick={onClose}
            type="button"
            className=" text-[#FF6B6B] cursor-pointer"
          >
            <X className="w-6 h-6" strokeWidth={1} />
          </button>
        </div>

        <div className="flex-1 flex flex-col items-center pt-2  w-full">
          {/* Header */}
          <h2 className="hidden sm:block text-[18px] font-medium leading-[26px] text-foreground mb-1 font-[family-name:var(--font-poppins)] text-center">
            Add skills
          </h2>
          <p className="hidden sm:block text-[14px] text-muted-foreground mb-5 font-[family-name:var(--font-poppins)] text-center">
            Help us match you with better opportunities
          </p>

          {/* Search Bar */}
          <div className="w-full h-[40px] flex items-center justify-between px-[16px] py-[8px] rounded-[24px] border border-border mb-5 focus-within:border-primary transition-colors bg-card">
            <input
              type="text"
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && searchQuery.trim()) {
                  e.preventDefault();
                  const query = searchQuery.trim();
                  if (!selectedSkills.some(s => typeof s === 'string' && s.toLowerCase() === query.toLowerCase())) {
                    setSelectedSkills(prev => [...prev, query]);
                  }
                  setSearchQuery("");
                }
              }}
              className="flex-1 bg-transparent border-none p-0 focus:ring-0 outline-none text-foreground placeholder:text-muted-foreground text-[14px] font-[family-name:var(--font-poppins)]"
            />
            <Search className="w-5 h-5 text-muted-foreground ml-2 flex-shrink-0" />
          </div>

          {/* Skills Grid */}
          <div className="w-full flex-1 flex flex-wrap justify-start content-start items-start gap-3 mb-4 overflow-y-auto">
            {isSearching ? (
              <div className="w-full h-full flex items-center justify-center">
                <span className="text-sm text-muted-foreground font-[family-name:var(--font-poppins)]">Searching...</span>
              </div>
            ) : paginatedSkills.length > 0 ? (
              paginatedSkills.map((skill) => {
                const isSelected = selectedSkills.includes(skill);
                return (
                  <button
                    key={skill}
                    onClick={() => {
                      toggleSkill(skill);
                    }}
                    className={cn(
                      "h-fit px-6 py-2.5 rounded-[12px] text-sm font-medium transition-all duration-200 border font-[family-name:var(--font-poppins)]",
                      isSelected
                        ? "bg-primary border-primary text-primary-foreground shadow-sm"
                        : "skill-chip hover:opacity-80"
                    )}
                  >
                    {skill}
                  </button>
                );
              })
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="text-sm text-muted-foreground font-[family-name:var(--font-poppins)]">No skills found</span>
              </div>
            )}
          </div>

          {/* Pagination */}
          <div className="w-full flex justify-end items-center gap-4 mb-5 pr-2">
            <div className="flex items-center gap-4 text-muted-foreground">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage <= 1}
                className={cn("transition-colors", currentPage > 1 ? "text-primary" : "text-muted-foreground")}
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="text-foreground font-medium text-sm font-[family-name:var(--font-poppins)]">
                {String(currentPage).padStart(2, '0')}
              </span>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages}
                className={cn("transition-colors", currentPage < totalPages ? "text-primary" : "text-muted-foreground")}
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Desktop Footer Buttons */}
          <div className="hidden sm:flex w-full justify-center gap-4 mt-auto">
            <button
              onClick={onClose}
              className="w-[142px] h-[40px] rounded-[24px] bg-card border border-primary text-primary font-semibold transition-all flex items-center justify-center gap-[10px] px-[16px] py-[8px] font-[family-name:var(--font-poppins)]"
            >
              Cancel
            </button>
            <Button
              onClick={() => onSave(selectedSkills)}
              disabled={
                loading ||
                selectedSkills.length === 0 ||
                (JSON.stringify([...selectedSkills].sort()) === JSON.stringify([...initialSkills].sort()))
              }
              className="w-[142px] h-[40px] rounded-[24px] bg-primary hover:bg-primary text-primary-foreground font-semibold shadow-md transition-all flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed font-[family-name:var(--font-poppins)]"
            >
              {loading ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
