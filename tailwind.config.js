/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        dark: {
          bg: '#06060b',
          surface: '#0c0c14',
          border: '#1a1a2e',
          text: '#e0e0e8'
        },
        light: {
          bg: '#fafafa',
          surface: '#f0f0f5',
          border: '#d0d0d8',
          text: '#1a1a2e'
        },
        accent: '#6366f1'
      },
      fontFamily: {
        sans: ['Geist Sans', 'sans-serif'],
        mono: ['Geist Mono', 'monospace']
      },
      borderRadius: {
        'card': '6px',
        'small': '4px',
        'pill': '2px'
      }
    }
  },
  plugins: [],
}
