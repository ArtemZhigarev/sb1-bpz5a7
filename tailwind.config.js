/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      animation: {
        shimmer: 'shimmer 2s linear infinite',
        pulse: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'urgent-pulse': 'urgent-pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        pulse: {
          '0%, 100%': { borderColor: 'rgba(239, 68, 68, 0.5)' },
          '50%': { borderColor: 'rgba(239, 68, 68, 1)' },
        },
        'urgent-pulse': {
          '0%, 100%': { 
            borderColor: 'rgba(249, 115, 22, 0.2)',
            boxShadow: '0 0 0 0 rgba(249, 115, 22, 0.2)'
          },
          '50%': { 
            borderColor: 'rgb(249, 115, 22)',
            boxShadow: '0 0 10px 0 rgba(249, 115, 22, 0.5)'
          },
        },
      },
      backgroundSize: {
        'auto': 'auto',
        'cover': 'cover',
        'contain': 'contain',
        '200%': '200%',
      },
    },
  },
  plugins: [],
};