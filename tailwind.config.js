/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
          950: '#451a03',
        },
        sidebar: {
          bg: '#0c0f17',
          card: '#161b26',
          border: '#1e2638',
          hover: '#1e2436',
          active: '#273147',
          text: '#94a3b8',
          textActive: '#f8fafc',
        }
      },
    },
  },
  plugins: [],
}
