"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { ChevronLeft, Search, Loader2 } from "lucide-react";
import styles from "./InterestsStep.module.css";

interface InterestsStepProps {
  onNext: (items: string[]) => void;
  onBack: () => void;
  currentStep: number;
  totalSteps: number;
  title: string;
  subtitle: string;
  placeholder: string;
  initialData: string[];
  actionLabel?: string;
  minSelection?: number;
  maxSelection?: number;
  selectedItems?: string[];
  onChange?: (items: string[]) => void;
  isLoading?: boolean;
  /** True while the parent is fetching the first page */
  isFetchingInitial?: boolean;
  /** True while the parent is loading the next page */
  isLoadingMore?: boolean;
  /** Whether there are more pages to load */
  hasMore?: boolean;
  /** Text to show while loading (e.g. "Loading interests...") */
  loadingText?: string;
  /** Called when the scroll sentinel enters the viewport */
  onLoadMore?: () => void;
  /** Called on every keystroke so the parent can debounce & hit the API */
  onSearchChange?: (q: string) => void;
}

export default function InterestsStep({
  onNext,
  onBack,
  currentStep,
  totalSteps,
  title,
  subtitle,
  placeholder,
  initialData,
  actionLabel = "Continue",
  minSelection = 1,
  maxSelection,
  selectedItems = [],
  onChange,
  isLoading = false,
  isFetchingInitial = false,
  isLoadingMore = false,
  hasMore = false,
  loadingText = "Loading...",
  onLoadMore,
  onSearchChange,
}: InterestsStepProps) {
  const [search, setSearch] = useState("");
  const [showError, setShowError] = useState(false);

  // Sentinel ref for IntersectionObserver (infinite scroll trigger)
  const sentinelRef = useRef<HTMLDivElement>(null);

  const toggleItem = (item: string) => {
    const isSelected = selectedItems.includes(item);
    
    if (!isSelected && maxSelection && selectedItems.length >= maxSelection) {
      setShowError(true);
      return;
    }

    const next = isSelected
      ? selectedItems.filter((i) => i !== item)
      : [...selectedItems, item];
    
    onChange?.(next);
    setShowError(next.length > 0 && next.length < minSelection);
  };

  const handleAction = () => {
    if (selectedItems.length < minSelection) {
      setShowError(true);
      return;
    }
    onNext(selectedItems);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearch(value);
    onSearchChange?.(value);
  };

  // Include selected items so custom additions remain visible
  const allKnownItems = Array.from(new Set([...initialData, ...selectedItems]));

  // Client-side filter — instant feedback while server debounce is in-flight
  const filteredItems = allKnownItems.filter((item) =>
    item.toLowerCase().includes(search.toLowerCase())
  );

  const exactMatchExists = allKnownItems.some(
    (item) => item.toLowerCase() === search.trim().toLowerCase()
  );
  const showAddCustom = search.trim().length > 0 && !exactMatchExists;

  // IntersectionObserver: fire onLoadMore when the sentinel enters view
  const handleIntersection = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      if (entries[0].isIntersecting && hasMore && !isLoadingMore && onLoadMore) {
        onLoadMore();
      }
    },
    [hasMore, isLoadingMore, onLoadMore]
  );

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !onLoadMore) return;
    const observer = new IntersectionObserver(handleIntersection, {
      root: el.closest(`.${styles.tagsScrollable}`),
      rootMargin: "80px",
      threshold: 0,
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [handleIntersection, onLoadMore]);

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        {/* Header Section */}
        <div className={styles.headerGroup}>
          <div className={styles.logoContainer}>
            <img src="/assets/logo.PNG" alt="Cocpit Logo" height={56} className={styles.logo} />
          </div>
          <div className={styles.stepContainer}>
            <div className={styles.stepHeader}>
              <span className={styles.stepText}>Step {currentStep} of {totalSteps}</span>
            </div>
            <div className={styles.progressBar}>
              <div className={styles.progressFill} style={{ width: `${(currentStep / totalSteps) * 100}%` }}></div>
            </div>
          </div>
        </div>

        {/* Title & Subtitle */}
        <div className={styles.textGroup}>
          <h1 className={styles.title}>{title}</h1>
          {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
        </div>

        {/* Search */}
        <div className={styles.searchWrapper}>
          <input
            type="text"
            className={styles.searchInput}
            placeholder={placeholder}
            value={search}
            onChange={handleSearchChange}
          />
          <Search className={styles.searchIcon} size={20} />
          {showError && (
            <p className={styles.errorText}>
              *Select {maxSelection ? `${minSelection}-${maxSelection}` : `at least ${minSelection}`} items
            </p>
          )}
          {selectedItems.length > 0 && (
            <p className={styles.selectionCountText}>
              {selectedItems.length} {maxSelection ? `/ ${maxSelection}` : ""} selected
            </p>
          )}
        </div>

        {/* Scrollable Tags Grid */}
        <div className={styles.tagsScrollable}>
          {isFetchingInitial ? (
            <div className={styles.loadingCenter}>
              <Loader2 size={24} className={styles.spinner} />
              <span className={styles.loadingText}>{loadingText}</span>
            </div>
          ) : (
            <>
              <div className={styles.tagsContainer}>
                {filteredItems.map((item) => (
                  <button
                    key={item}
                    type="button"
                    className={`${styles.tag} ${selectedItems.includes(item) ? styles.tagSelected : ""}`}
                    onClick={() => toggleItem(item)}
                  >
                    {item}
                  </button>
                ))}

                {showAddCustom && (
                  <button
                    key="custom-add"
                    type="button"
                    className={styles.tag}
                    onClick={() => {
                      toggleItem(search.trim());
                      setSearch("");
                    }}
                  >
                    + Add "{search.trim()}"
                  </button>
                )}
              </div>

              {/* Sentinel — triggers next page when scrolled into view */}
              {onLoadMore && (
                <div ref={sentinelRef} className={styles.sentinel}>
                  {isLoadingMore && (
                    <Loader2 size={18} className={styles.spinner} />
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Actions */}
        <div className={styles.actionRow}>
          <button type="button" className={styles.backButton} onClick={onBack}>
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            key="action-button"
            type="button"
            className={actionLabel === "Finish" ? styles.finishButton : styles.continueButton}
            onClick={handleAction}
            disabled={isLoading || selectedItems.length < minSelection}
          >
            {isLoading ? "Saving..." : actionLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
