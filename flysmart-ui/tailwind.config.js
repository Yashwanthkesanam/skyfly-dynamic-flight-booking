/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "var(--primary)",
        accent: "var(--accent)",
        surface: "var(--surface)",
        muted: "var(--muted)",
        border: "var(--border)",
      },
      borderRadius: {
        lg: "var(--radius)",
      },
      boxShadow: {
        soft: "var(--shadow-soft)",
      },
      fontFamily: {
        sans: "var(--font-sans)",
      },
      container: {
        center: true,
        padding: "1.25rem",
      },
    },
  },
  plugins: [],
};
