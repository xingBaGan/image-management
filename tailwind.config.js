/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      backgroundColor: {
        'dark': 'rgb(24, 25, 28)',
      },
      colors: {
        dark: {
          DEFAULT: 'rgb(24, 25, 28)',
          100: 'rgb(35, 36, 40)',
          200: 'rgb(45, 46, 50)',
          300: 'rgb(55, 56, 60)',
          400: 'rgb(65, 66, 70)',
        },
      },
      keyframes: {
        'slide-in': {
          '0%': { transform: 'translateX(100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        'slide-out': {
          '0%': { transform: 'translateX(0)', opacity: '1' },
          '100%': { transform: 'translateX(100%)', opacity: '0' },
        },
      },
      animation: {
        'slide-in': 'slide-in 0.3s ease-out',
        'slide-out': 'slide-out 0.3s ease-in',
      },
    },
  },
  plugins: [],
};
