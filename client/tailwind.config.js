/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Albert Sans"', 'system-ui', 'sans-serif'],
        display: ['"Bricolage Grotesque"', 'system-ui', 'sans-serif'],
      },
      colors: {
        ph: {
          bg: '#080d10',
          card: '#12171c',
          surface: '#1b2229',
          border: 'rgba(255, 255, 255, 0.08)',
          'border-orange': 'rgba(255, 122, 0, 0.25)',
          orange: '#ff7a00',
          'orange-hover': '#ff9124',
          crimson: '#ff3d2e',
          muted: '#9aa6af',
          light: '#f8f8f8',
        }
      },
      boxShadow: {
        'glow-orange': '0 0 35px -5px rgba(255, 122, 0, 0.35)',
        'glow-orange-lg': '0 0 60px -10px rgba(255, 122, 0, 0.45)',
      }
    },
  },
  plugins: [],
}
