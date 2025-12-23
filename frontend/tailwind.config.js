/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        // High contrast colors for accessibility
        accessible: {
          bg: '#ffffff',
          text: '#000000',
          primary: '#0055ff',
          success: '#008000',
          warning: '#cc7000',
          error: '#cc0000',
        }
      },
      fontSize: {
        // Larger font sizes for accessibility
        'accessible-sm': '1.125rem',
        'accessible-base': '1.25rem',
        'accessible-lg': '1.5rem',
        'accessible-xl': '1.875rem',
        'accessible-2xl': '2.25rem',
        'accessible-3xl': '3rem',
      },
      spacing: {
        // Larger touch targets for accessibility
        'touch': '48px',
        'touch-lg': '56px',
      }
    },
  },
  plugins: [],
}
