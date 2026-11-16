import { Job } from '../types/jobs.types';

export const DUMMY_JOBS: Job[] = [];

/**
 * Formats job posting timestamps or relative strings into standard compact format.
 * Examples:
 * - "16 hours ago" -> "Posted 16h ago"
 * - "2 hours ago"  -> "Posted 2h ago"
 * - "1 day ago"    -> "Posted 1d ago"
 * - "Just now"     -> "Posted just now"
 * - ISO string     -> "Posted 2h ago"
 */
export const formatPostedTime = (val?: string | Date | null): string => {
  if (!val) return 'Posted recently';

  const str = typeof val === 'string' ? val.trim() : '';

  // If already starts with "Posted "
  if (str.toLowerCase().startsWith('posted ')) {
    const withoutPrefix = str.slice(7).trim();
    if (/^\d+[smhdwy]|just now|recently/i.test(withoutPrefix)) {
      return str;
    }
  }

  // Parse relative time strings like "16 hours ago", "1 day ago", "Just now"
  const relativeMatch = str.match(/^(\d+)\s+(second|sec|minute|min|hour|hr|day|week|month|year)s?\s+ago$/i);
  if (relativeMatch) {
    const num = relativeMatch[1];
    const unit = relativeMatch[2].toLowerCase();
    if (unit.startsWith('sec')) return `Posted ${num}s ago`;
    if (unit.startsWith('min')) return `Posted ${num}m ago`;
    if (unit.startsWith('hour') || unit.startsWith('hr')) return `Posted ${num}h ago`;
    if (unit.startsWith('day')) return `Posted ${num}d ago`;
    if (unit.startsWith('week')) return `Posted ${num}w ago`;
    if (unit.startsWith('month')) return `Posted ${num}mo ago`;
    if (unit.startsWith('year')) return `Posted ${num}y ago`;
  }

  if (str.toLowerCase() === 'just now') {
    return 'Posted just now';
  }

  // If it's a parseable date (ISO string or timestamp)
  const d = new Date(val);
  if (!isNaN(d.getTime())) {
    const now = Date.now();
    const diffMs = Math.max(0, now - d.getTime());
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHr = Math.floor(diffMin / 60);
    const diffDays = Math.floor(diffHr / 24);

    if (diffMin < 1) return 'Posted just now';
    if (diffMin < 60) return `Posted ${diffMin}m ago`;
    if (diffHr < 24) return `Posted ${diffHr}h ago`;
    if (diffDays < 30) return `Posted ${diffDays}d ago`;
    const diffMonths = Math.floor(diffDays / 30);
    if (diffMonths < 12) return `Posted ${diffMonths}mo ago`;
    const diffYears = Math.floor(diffMonths / 12);
    return `Posted ${diffYears}y ago`;
  }

  return str.startsWith('Posted') ? str : `Posted ${str}`;
};
