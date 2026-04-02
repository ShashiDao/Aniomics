/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Our Sacred Colors
        'obsidian': '#050505',
        'gold-pale': '#F3E5AB',   // Champagne Gold
        'gold-deep': '#E6C35C',   // Radiant Gold
        'sepia-dark': '#402615',  // For Day Mode text
        'glass-white': 'rgba(243, 229, 171, 0.05)',
        'glass-black': 'rgba(0, 0, 0, 0.05)',
      },
      fontFamily: {
        // Sacred & Modern Fonts
        'serif': ['Cinzel', 'serif'],
        'sans': ['Inter', 'sans-serif'],
      },
      letterSpacing: {
        'ritual': '0.3em',
        'scroll': '0.5em',
      },
      animation: {
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow': 'spin 12s linear infinite',
      },
      backgroundImage: {
        'candlelight': 'radial-gradient(circle at center, var(--tw-gradient-stops))',
      },
      dropShadow: {
        'gold': '0 0 15px rgba(230, 195, 92, 0.3)',
        'lunar': '0 0 20px rgba(243, 229, 171, 0.1)',
      }
    },
  },
  plugins: [],
}
