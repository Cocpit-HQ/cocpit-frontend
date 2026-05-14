import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ['selector', '[data-theme="dark"], [data-theme="navy"]'],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        poppins: ["var(--font-poppins)", "Poppins", "sans-serif"],
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
    },
  },
  plugins: [],
};

export default config;
