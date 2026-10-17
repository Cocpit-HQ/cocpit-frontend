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
 * Formats a number cleanly, e.g. 150000 -> "150k", 2000000 -> "2M"
 * This uses the native Intl.NumberFormat which works perfectly in React Native too.
 */
export const formatCompact = (value: number, currency: string = 'USD'): string => {
  try {
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      notation: 'compact',
      compactDisplay: 'short',
      maximumFractionDigits: 1,
    });
    return formatter.format(value);
  } catch (e) {
    // Fallback if the currency code is invalid for Intl
    const symbol = getCurrencySymbol(currency);
    if (value >= 1000000) return `${symbol}${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${symbol}${(value / 1000).toFixed(1)}k`;
    return `${symbol}${value}`;
  }
};

/**
 * Given a min and max salary and a currency, produces the standard display string.
 * Example: "$150k - $200k" or "Up to $150k" or "$150k+"
 */
export const formatSalaryRange = (
  min: number | null | undefined, 
  max: number | null | undefined, 
  currency: string = 'USD'
): string | undefined => {
  if (min && max) return `${formatCompact(min, currency)} - ${formatCompact(max, currency)}`;
  if (min)        return `${formatCompact(min, currency)}+`;
  if (max)        return `Up to ${formatCompact(max, currency)}`;

  return undefined;
};

/** Returns the Iconify icon name for a given currency code. */
export const getCurrencyIcon = (code?: string | null): string =>
  getCurrencyMeta(code).icon;

/** Returns just the symbol for a given currency code. */
export const getCurrencySymbol = (code?: string | null): string =>
  getCurrencyMeta(code).symbol;
