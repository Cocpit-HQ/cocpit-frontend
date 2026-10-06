import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";


export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const formatCompactNumber = (number: number) => {
  if (number >= 1000000) {
    return (number / 1000000).toFixed(1).replace(/\.0$/, '') + 'm';
  }
  if (number >= 1000) {
    return (number / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
  }
  return number.toString();
};

export function formatTimeAgo(dateString?: string, fallback?: string): string {
  if (!dateString) return fallback || "";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return fallback || "";

  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);

  if (seconds < 60) return `Just now`;
  
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `Just now`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;

  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks}w ago`;

  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;

  const years = Math.floor(days / 365);
  return `${years}y ago`;
}

export function maskEmail(email: string): string {
  if (!email || !email.includes('@')) return email;
  const [localPart, domain] = email.split('@');
  
  if (localPart.length <= 4) {
    if (localPart.length <= 2) {
      return `***@${domain}`;
    }
    return `${localPart[0]}***${localPart[localPart.length - 1]}@${domain}`;
  }

  const firstTwo = localPart.slice(0, 2);
  const lastTwo = localPart.slice(-2);
  return `${firstTwo}****${lastTwo}@${domain}`;
}

export function formatImgSrc(src: string | undefined | null): string {
  if (!src) return '';
  let formatted = src.replace(/\\/g, '/');
  if (!formatted.startsWith('http') && !formatted.startsWith('/')) {
    formatted = `/${formatted}`;
  }
  return formatted;
}

