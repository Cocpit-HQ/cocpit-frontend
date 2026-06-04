import { useEffect } from 'react';

/**
 * Forces the html element to use data-theme="light" while the component
 * is mounted (e.g. on auth pages), then restores the previous theme on unmount.
 *
 * This works because next-themes sets data-theme on <html>, which drives all
 * CSS custom property cascading. By overriding it at the html level we ensure
 * the body background and all other global styles also switch to light.
 */
export function useForceLightTheme() {
  useEffect(() => {
    const html = document.documentElement;
    const previousTheme = html.getAttribute('data-theme');

    html.setAttribute('data-theme', 'light');

    return () => {
      if (previousTheme) {
        html.setAttribute('data-theme', previousTheme);
      } else {
        html.removeAttribute('data-theme');
      }
    };
  }, []);
}
