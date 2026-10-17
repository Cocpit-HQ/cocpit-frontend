import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

/**
 * Format time ago with mobile-friendly abbreviations
 * Examples: "2 sec ago", "5 min ago", "3 hrs ago", "2 days ago"
 */
export function formatTimeAgo(date: string | Date): string {
    const now = dayjs();
    const then = dayjs(date);
    const diffInSeconds = now.diff(then, 'second');
    const diffInMinutes = now.diff(then, 'minute');
    const diffInHours = now.diff(then, 'hour');
    const diffInDays = now.diff(then, 'day');
    const diffInWeeks = now.diff(then, 'week');
    const diffInMonths = now.diff(then, 'month');
    const diffInYears = now.diff(then, 'year');

    if (diffInSeconds < 10) {
        return 'Just now';
    } else if (diffInSeconds < 60) {
        return `${diffInSeconds} sec ago`;
    } else if (diffInMinutes < 60) {
        return `${diffInMinutes} min ago`;
    } else if (diffInHours < 24) {
        return `${diffInHours} ${diffInHours === 1 ? 'hr' : 'hrs'} ago`;
    } else if (diffInDays < 7) {
        return `${diffInDays} ${diffInDays === 1 ? 'day' : 'days'} ago`;
    } else if (diffInWeeks < 4) {
        return `${diffInWeeks} ${diffInWeeks === 1 ? 'week' : 'weeks'} ago`;
    } else if (diffInMonths < 12) {
        return `${diffInMonths} ${diffInMonths === 1 ? 'month' : 'months'} ago`;
    } else {
        return `${diffInYears} ${diffInYears === 1 ? 'year' : 'years'} ago`;
    }
}
