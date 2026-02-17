/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#065F46",
          light: "#047857",
          dark: "#064E3B",
        },
        secondary: {
          DEFAULT: "#E5E7EB",
          light: "#F3F4F6",
          dark: "#D1D5DB",
        },
        accent: {
          DEFAULT: "#D97706",
          light: "#F59E0B",
          dark: "#B45309",
        },
      },
    },
  },
  plugins: [],
};
