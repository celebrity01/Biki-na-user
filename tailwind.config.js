/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#705900",
        'primary-container': "#f5ce53",
        'on-primary': "#fff1d4",
        secondary: "#40589c",
        'on-secondary': "#f1f2ff",
        tertiary: "#126a10",
        surface: "#fff4f2",
        'surface-container-low': "#ffede9",
        'surface-container': "#ffe2db",
        'surface-container-highest': "#fad5cc",
        'surface-container-lowest': "#ffffff",
        'on-surface': "#3c2a26",
        'on-surface-variant': "#6c5751",
        'outline-variant': "#c2a7a1",
      },
      fontFamily: {
        display: ['"Noto Serif"', 'serif'],
        body: ['"Manrope"', 'sans-serif'],
      },
      boxShadow: {
        'ambient': '0 24px 24px -12px rgba(60, 42, 38, 0.06)',
      }
    },
  },
  plugins: [],
}
