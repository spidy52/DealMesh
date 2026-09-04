/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        merchant: {
          dark: '#0A0E1A',
          surface: '#121829',
          card: '#1B243B',
          border: '#283554',
          primary: '#3B82F6',
          primaryHover: '#2563EB',
          emerald: '#10B981',
          amber: '#F59E0B',
          rose: '#F43F5E',
          purple: '#8B5CF6'
        }
      }
    },
  },
  plugins: [],
}
