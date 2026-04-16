import React from 'react';
import { CategoryType } from '../../types';

interface CategorySelectorProps {
  isCompanyPost: boolean;
  currentPoster: any;
  postCategory: CategoryType;
  onCategoryChange: (category: CategoryType) => void;
  className?: string;
}

const CategorySelector = ({
  isCompanyPost,
  currentPoster,
  postCategory,
  onCategoryChange,
  className = ""
}: CategorySelectorProps) => {
  const getCategories = (): string[] => {
    if (!isCompanyPost) {
      return ['Professional', 'Personal', 'Achievement', 'Article'];
    }
    if ((currentPoster as any)?.entity_type === 'INSTITUTION') {
      return ['Announcement', 'Academic', 'Admission', 'Campus Life', 'Research', 'Club Activity', 'General'];
    }
    return ['Update', 'Hiring', 'Milestone', 'Insight', 'Article'];
  };

  return (
    <div className={`px-6 py-4 bg-muted/5 border-b border-border/30 ${className}`}>
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-bold text-muted-foreground uppercase tracking-tight mr-2">Category:</span>
        {getCategories().map((category) => (
          <button
            key={category}
            onClick={() => onCategoryChange(category as CategoryType)}
            className={`px-3 py-1 text-xs font-semibold rounded-full transition-all border ${postCategory === category
              ? 'bg-primary border-primary text-primary-foreground shadow-sm'
              : 'bg-background border-border text-muted-foreground hover:border-primary hover:text-primary'
              } `}
          >
            {category}
          </button>
        ))}
      </div>
    </div>
  );
};

export default CategorySelector;
