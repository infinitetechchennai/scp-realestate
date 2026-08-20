/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        scp: {
          50: '#f0f7ff',
          100: '#e0effe',
          200: '#bae0fd',
          300: '#7cc7fb',
          400: '#38a9f8',
          500: '#0e8ce9',
          600: '#026fc7',
          700: '#0358a1',
          800: '#074b84',
          900: '#0c3f6e',
          950: '#082849',
        },
        sidebar: {
          bg: '#080e1a',
          card: '#0f172a',
          border: '#1e293b',
          hover: '#131f37',
          active: '#1e3a8a',
          text: '#94a3b8',
          textActive: '#ffffff',
        }
      },
    },
  },
  plugins: [],
}
