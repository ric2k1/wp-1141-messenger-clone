import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        'notion-gray': 'var(--notion-gray)',
        'notion-gray-light': 'var(--notion-gray-light)',
        'notion-gray-border': 'var(--notion-gray-border)',
        'notion-gray-hover': 'var(--notion-gray-hover)',
        'notion-text': 'var(--notion-text)',
        'notion-text-secondary': 'var(--notion-text-secondary)',
        'notion-text-tertiary': 'var(--notion-text-tertiary)',
        'notion-blue': 'var(--notion-blue)',
        'notion-blue-hover': 'var(--notion-blue-hover)',
      },
      borderRadius: {
        'notion': '12px',
        'notion-lg': '16px',
      },
      boxShadow: {
        'notion': '0 2px 8px var(--notion-shadow)',
        'notion-lg': '0 4px 16px var(--notion-shadow)',
      },
    },
  },
  plugins: [],
};
export default config;

