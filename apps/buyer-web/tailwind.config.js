/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        lemon: {
          300: '#E7FFA6',
          400: '#D9F99D',
          500: '#CCFF00',
          600: '#A3E635',
          700: '#84CC16',
          800: '#65A30D',
        },
        pitch: {
          950: '#000000',
          900: '#070707',
          850: '#0E0E0E',
          800: '#141414',
          750: '#1C1C1C',
          700: '#262626',
          600: '#383838',
          500: '#525252',
        },
        mesh: {
          dark: '#000000',
          surface: '#0A0A0A',
          card: '#121212',
          border: '#222222',
          primary: '#CCFF00',
          primaryHover: '#A3E635',
          accent: '#A3E635',
          success: '#10B981',
          warning: '#F59E0B',
          danger: '#EF4444'
        }
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow-lemon': 'glowLemon 2s ease-in-out infinite alternate',
      },
      keyframes: {
        glowLemon: {
          '0%': { boxShadow: '0 0 10px rgba(204, 255, 0, 0.2)' },
          '100%': { boxShadow: '0 0 25px rgba(204, 255, 0, 0.5)' },
        }
      }
    },
  },
  plugins: [],
}
