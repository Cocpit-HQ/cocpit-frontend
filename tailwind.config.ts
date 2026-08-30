// Invalidate cache for Tailwind CSS v4 custom variants
import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ['selector', '[data-theme="dark"], [data-theme="navy"]'],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/shared/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/features/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-dm-sans)", "DM Sans", "sans-serif"],
        "dm-sans": ["var(--font-dm-sans)", "DM Sans", "sans-serif"],
        poppins: ["Twemoji Country Flags", "var(--font-poppins)", "Poppins", "sans-serif"],
      },
      boxShadow: {
        "indigo-xs": "var(--feed-card-shadow)",
        "indigo-sm": "var(--feed-card-shadow-sm)",
      },
      borderRadius: {
        card: "24px",
        "feed-card": "24px",
        "3xl": "24px",
      },
      colors: {
        company: {
          bg: "var(--company-bg)",
          card: "var(--company-card)",
          text: "var(--company-text)",
          secondary: "var(--company-secondary)",
          border: "var(--company-border)",
          primary: "var(--company-primary)",
          "primary-dark": "var(--company-primary-dark)",
          "ultra-light": "var(--company-ultra-light)",
          "light-primary": "var(--company-light-primary)",
          success: "var(--company-success)",
          warning: "var(--company-warning)",
          error: "var(--company-error)",
          "light-green": "var(--company-light-green)",
          "light-yellow": "var(--company-light-yellow)",
          "light-red": "var(--company-light-red)",
          light: "var(--company-light)",
        }
      }
    },
  },
  plugins: [],
};

export default config;
