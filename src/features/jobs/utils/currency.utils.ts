/**
 * Currency utilities for Cocpit
 * 
 * This uses the 'currency-codes' and 'currency-symbol-map' NPM packages 
 * to provide a complete, dynamically updated list of all world currencies.
 * Because these are pure JS, they can be used across Web, iOS, and Android.
 */
import currencyCodes from 'currency-codes';
import getSymbolFromCurrency from 'currency-symbol-map';

export interface CurrencyMeta {
  code: string;
  label: string;
  symbol: string;
  icon: string;
}

// Generate the list dynamically from the NPM packages, and deduplicate by code
export const CURRENCIES: CurrencyMeta[] = currencyCodes.data
  .map((c) => ({
    code: c.code,
    label: c.currency,
    symbol: getSymbolFromCurrency(c.code) || c.code,
    icon: 'lucide:coins', // default icon for currencies without explicit icons
  }))
  .filter((v, i, a) => a.findIndex(t => (t.code === v.code)) === i);

/**
 * Returns metadata for a given currency code.
 */
export const getCurrencyMeta = (code?: string | null): CurrencyMeta => {
  if (!code) return { code: 'USD', label: 'US Dollar', symbol: '$', icon: 'lucide:coins' };
  const found = CURRENCIES.find(c => c.code.toUpperCase() === code.toUpperCase());
  return found || { code, label: code, symbol: code, icon: 'lucide:coins' };
};

/**
 * Formats a number cleanly in compact notation (e.g. 150000 -> "150k", 2000000 -> "2M")
 * Currency symbol is omitted as currencies are not captured during job creation.
 */
export const formatCompactNumber = (value: number): string => {
  if (value >= 1000000) {
    const formatted = (value / 1000000).toFixed(1).replace(/\.0$/, '');
    return `${formatted}M`;
  }
  if (value >= 1000) {
    const formatted = (value / 1000).toFixed(1).replace(/\.0$/, '');
    return `${formatted}k`;
  }
  return `${value}`;
};

/**
 * Formats a number cleanly in compact format (e.g. 150000 -> "150k").
 * Omit dollar ($) signs as currency is not captured yet.
 */
export const formatCompact = (value: number, currency?: string): string => {
  if (!currency || currency === 'USD') {
    return formatCompactNumber(value);
  }
  try {
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      notation: 'compact',
      compactDisplay: 'short',
      maximumFractionDigits: 1,
    });
    return formatter.format(value).replace(/\$/g, '').trim();
  } catch (e) {
    const symbol = getCurrencySymbol(currency);
    const sym = symbol === '$' ? '' : symbol;
    return `${sym}${formatCompactNumber(value)}`;
  }
};

/**
 * Given a min and max salary and an optional currency, produces the standard display string.
 * Example: "150k - 200k" or "Up to 150k" or "150k+" (dollar symbol omitted)
 */
export const formatSalaryRange = (
  min: number | null | undefined, 
  max: number | null | undefined, 
  currency?: string
): string | undefined => {
  if (min && max) return `${formatCompact(min, currency)} - ${formatCompact(max, currency)}`;
  if (min)        return `${formatCompact(min, currency)}+`;
  if (max)        return `Up to ${formatCompact(max, currency)}`;

  return undefined;
};

/**
 * Cleans salary display text by removing dollar signs ($) and converting raw number ranges into 'k' notation.
 */
export const cleanSalary = (val?: string | number | null): string => {
  if (!val) return '';
  const text = String(val).replace(/\$/g, '').trim();

  // Matches "800000-900000" or "800000–900000" or "800000 - 900000"
  const rangeMatch = text.match(/^(\d+)\s*[-–]\s*(\d+)$/);
  if (rangeMatch) {
    const min = Number(rangeMatch[1]);
    const max = Number(rangeMatch[2]);
    return `${formatCompactNumber(min)} - ${formatCompactNumber(max)}`;
  }

  // Matches single large number e.g. "800000"
  if (/^\d{4,}$/.test(text)) {
    return formatCompactNumber(Number(text));
  }

  return text;
};

/** Returns the Iconify icon name for a given currency code. */
export const getCurrencyIcon = (code?: string | null): string =>
  getCurrencyMeta(code).icon;

/** Returns just the symbol for a given currency code. */
export const getCurrencySymbol = (code?: string | null): string =>
  getCurrencyMeta(code).symbol;
