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
    },
  },
  plugins: [],
};
